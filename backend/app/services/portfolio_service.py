from typing import Any

from bson import ObjectId
from fastapi import HTTPException, status

from app.db.mongodb import get_database
from app.models.portfolio_model import DEFAULT_PORTFOLIO_CHECKLIST, create_portfolio_readiness_document
from app.models.base_model import utc_now
from app.utils.object_id import serialize_document, to_object_id

MANUAL_CHECKLIST_KEYS = {"readme_quality_checked", "pinned_projects_ready", "screenshots_added"}
CHECKLIST_WEIGHTS = {
    "github_profile_added": 15,
    "linkedin_profile_added": 10,
    "portfolio_url_added": 10,
    "completed_project_exists": 20,
    "github_links_added": 15,
    "live_demo_links_added": 10,
    "project_notes_added": 5,
    "readme_quality_checked": 5,
    "pinned_projects_ready": 5,
    "screenshots_added": 5,
}


async def _load_profile(user_id: ObjectId) -> dict[str, Any]:
    db = get_database()
    profile = await db.user_profiles.find_one({"user_id": user_id})
    if not profile or not profile.get("selected_career_path_id"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please complete the Career Assessment and select a career path first.")
    return profile


def _score_level(score: int) -> str:
    if score >= 85:
        return "excellent"
    if score >= 70:
        return "strong"
    if score >= 40:
        return "improving"
    return "weak"


def generate_portfolio_strengths_weaknesses(checklist: dict[str, bool]) -> tuple[list[str], list[str]]:
    strengths: list[str] = []
    weaknesses: list[str] = []
    labels = {
        "github_profile_added": "GitHub profile URL is added.",
        "linkedin_profile_added": "LinkedIn profile URL is added.",
        "portfolio_url_added": "Portfolio URL is added.",
        "completed_project_exists": "At least one portfolio project is complete.",
        "github_links_added": "Completed projects include GitHub repository links.",
        "live_demo_links_added": "Completed projects include live demo links.",
        "project_notes_added": "Project notes/descriptions are present.",
        "readme_quality_checked": "README quality has been checked.",
        "pinned_projects_ready": "Pinned projects are ready for review.",
        "screenshots_added": "Project screenshots are ready.",
    }
    for key, label in labels.items():
        if checklist.get(key):
            strengths.append(label)
        else:
            weaknesses.append(label.replace(" is ", " is not ").replace(" are ", " are not "))
    return strengths, weaknesses


def generate_portfolio_recommendations(checklist: dict[str, bool]) -> list[str]:
    recommendations: list[str] = []
    if not checklist.get("github_profile_added"):
        recommendations.append("Add your GitHub profile URL to your profile.")
    if not checklist.get("completed_project_exists"):
        recommendations.append("Complete at least one project for your selected career path.")
    if not checklist.get("github_links_added"):
        recommendations.append("Add GitHub repository links to completed projects.")
    if not checklist.get("live_demo_links_added"):
        recommendations.append("Add a live demo link for your best project.")
    if not checklist.get("readme_quality_checked") or not checklist.get("screenshots_added"):
        recommendations.append("Add screenshots and README files to improve presentation quality.")
    if not checklist.get("pinned_projects_ready"):
        recommendations.append("Pin your best completed projects on GitHub.")
    if not recommendations:
        recommendations.append("Your portfolio signals are strong. Keep polishing project writeups and demos.")
    return recommendations


async def calculate_portfolio_readiness(user_id: ObjectId | str, manual_updates: dict[str, bool] | None = None) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    profile = await _load_profile(user_object_id)
    career_path_id = to_object_id(profile["selected_career_path_id"], "career_path_id")
    latest = await db.portfolio_readiness.find_one({"user_id": user_object_id, "career_path_id": career_path_id}, sort=[("calculated_at", -1)])
    previous_checklist = {**DEFAULT_PORTFOLIO_CHECKLIST, **((latest or {}).get("checklist") or {})}
    manual = {key: previous_checklist.get(key, False) for key in MANUAL_CHECKLIST_KEYS}
    if manual_updates:
        manual.update({key: bool(value) for key, value in manual_updates.items() if key in MANUAL_CHECKLIST_KEYS})

    completed_projects = await db.user_project_progress.find({"user_id": user_object_id, "career_path_id": career_path_id, "status": "completed"}).to_list(length=None)
    checklist = {
        **DEFAULT_PORTFOLIO_CHECKLIST,
        "github_profile_added": bool(profile.get("github_url")),
        "linkedin_profile_added": bool(profile.get("linkedin_url")),
        "portfolio_url_added": bool(profile.get("portfolio_url")),
        "completed_project_exists": bool(completed_projects),
        "github_links_added": any(project.get("github_link") for project in completed_projects),
        "live_demo_links_added": any(project.get("live_demo_link") for project in completed_projects),
        "project_notes_added": any(project.get("notes") for project in completed_projects),
        **manual,
    }
    score = sum(weight for key, weight in CHECKLIST_WEIGHTS.items() if checklist.get(key))
    strengths, weaknesses = generate_portfolio_strengths_weaknesses(checklist)
    recommendations = generate_portfolio_recommendations(checklist)
    document = create_portfolio_readiness_document(user_object_id, career_path_id, score, checklist, strengths, weaknesses, recommendations)
    if latest:
        document["created_at"] = latest.get("created_at", document["created_at"])
        await db.portfolio_readiness.update_one({"_id": latest["_id"]}, {"$set": {key: value for key, value in document.items() if key != "_id"}})
        stored = await db.portfolio_readiness.find_one({"_id": latest["_id"]})
    else:
        result = await db.portfolio_readiness.insert_one(document)
        stored = await db.portfolio_readiness.find_one({"_id": result.inserted_id})
    serialized = serialize_document(stored)
    serialized["score_level"] = _score_level(serialized.get("score_percentage", 0))
    return serialized


async def get_latest_portfolio_readiness(user_id: ObjectId | str) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    document = await db.portfolio_readiness.find_one({"user_id": user_object_id}, sort=[("calculated_at", -1)])
    if not document:
        return await calculate_portfolio_readiness(user_object_id)
    serialized = serialize_document(document)
    serialized["score_level"] = _score_level(serialized.get("score_percentage", 0))
    return serialized


async def update_portfolio_checklist(user_id: ObjectId | str, checklist_updates: dict[str, bool]) -> dict[str, Any]:
    safe_updates = {key: bool(value) for key, value in checklist_updates.items() if key in MANUAL_CHECKLIST_KEYS}
    return await calculate_portfolio_readiness(user_id, safe_updates)


async def get_portfolio_score_context(user_id: ObjectId | str) -> int:
    readiness = await get_latest_portfolio_readiness(user_id)
    return int(readiness.get("score_percentage", 0))
