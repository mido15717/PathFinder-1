from typing import Any

from bson import ObjectId
from fastapi import HTTPException, status

from app.db.mongodb import get_database
from app.models.readiness_model import create_readiness_document
from app.services.skill_gap_service import analyze_skill_gap, get_latest_skill_gap
from app.utils.object_id import serialize_document, serialize_documents, to_object_id


def _clamp_score(value: int | float | None) -> int:
    return max(0, min(100, int(round(value or 0))))


async def _load_profile_and_career(user_id: ObjectId) -> tuple[dict[str, Any], dict[str, Any], ObjectId]:
    db = get_database()
    profile = await db.user_profiles.find_one({"user_id": user_id})
    if not profile or not profile.get("selected_career_path_id"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please complete the Career Assessment and select a career path first.")
    career_path_id = to_object_id(profile["selected_career_path_id"], "career_path_id")
    career = await db.career_paths.find_one({"_id": career_path_id, "is_active": True})
    if not career:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Selected career path not found")
    return profile, career, career_path_id


async def calculate_roadmap_score(user_id: ObjectId | str) -> int:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    path = await db.adaptive_learning_paths.find_one({"user_id": user_object_id, "status": "active"}, sort=[("created_at", -1)])
    return _clamp_score((path or {}).get("overall_progress_percentage", 0))


async def calculate_skills_score(user_id: ObjectId | str) -> int:
    try:
        latest = await get_latest_skill_gap(user_id)
    except HTTPException as exc:
        if exc.status_code != status.HTTP_404_NOT_FOUND:
            raise
        latest = await analyze_skill_gap(user_id)
    return _clamp_score(latest.get("skill_coverage_percentage", 0))


async def calculate_projects_score(user_id: ObjectId | str) -> int:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    completed_projects = await db.user_project_progress.count_documents({"user_id": user_object_id, "status": "completed"})
    if completed_projects:
        return _clamp_score(min(completed_projects * 35, 100))
    completed_project_courses = await db.user_course_progress.count_documents(
        {
            "user_id": user_object_id,
            "status": "completed",
            "$or": [{"course_title": {"$regex": "project", "$options": "i"}}, {"related_skills": {"$regex": "Projects", "$options": "i"}}],
        }
    )
    return _clamp_score(min(completed_project_courses * 25, 100))


async def calculate_interview_score(user_id: ObjectId | str) -> int:
    from app.services.interview_service import get_interview_readiness_context

    context = await get_interview_readiness_context(user_id)
    return _clamp_score(context.get("interview_readiness_percentage", 0))


async def calculate_certification_score(user_id: ObjectId | str) -> int:
    from app.services.certification_service import get_certification_score_context

    context = await get_certification_score_context(user_id)
    return _clamp_score(context.get("certification_score_percentage", 0))


async def calculate_portfolio_score(user_id: ObjectId | str) -> int:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    latest_portfolio = await db.portfolio_readiness.find_one({"user_id": user_object_id}, sort=[("calculated_at", -1)])
    if latest_portfolio:
        return _clamp_score(latest_portfolio.get("score_percentage", 0))
    profile, _, _ = await _load_profile_and_career(user_object_id)
    score = 0
    if profile.get("github_url"):
        score += 40
    if profile.get("linkedin_url"):
        score += 30
    if profile.get("portfolio_url"):
        score += 30
    return _clamp_score(score)


def determine_score_level(total_score: int) -> str:
    if total_score >= 85:
        return "job_ready"
    if total_score >= 65:
        return "almost_ready"
    if total_score >= 40:
        return "developing"
    return "beginner"


def generate_readiness_recommendations(
    total_score: int,
    roadmap_score: int,
    skills_score: int,
    projects_score: int,
    interview_score: int,
    certification_score: int,
    portfolio_score: int,
) -> tuple[list[str], list[str], list[str], list[str]]:
    strengths: list[str] = []
    weaknesses: list[str] = []
    recommendations: list[str] = []
    next_actions: list[str] = []
    if roadmap_score >= 70:
        strengths.append("Your adaptive learning path progress is strong.")
    else:
        weaknesses.append("Roadmap completion needs more consistent progress.")
        recommendations.append("Continue your adaptive learning path and complete the current phase.")
        next_actions.append("Open your learning path and complete the next best course.")
    if skills_score >= 70:
        strengths.append("Your required skill coverage is moving toward career readiness.")
    else:
        weaknesses.append("Required career skills still have visible gaps.")
        recommendations.append("Focus on completing high-priority missing skills first.")
        next_actions.append("Open Missing Skills and save one recommended course.")
    if projects_score < 50:
        weaknesses.append("Project evidence is limited.")
        recommendations.append("Complete project-based courses and add portfolio-ready work.")
    else:
        strengths.append("You have completed project-oriented learning evidence.")
    if portfolio_score < 70:
        weaknesses.append("Portfolio profile links are incomplete.")
        recommendations.append("Add your GitHub, LinkedIn, and portfolio links to improve portfolio readiness.")
        next_actions.append("Update your profile links.")
    else:
        strengths.append("Your profile includes strong portfolio signals.")
    if interview_score < 50:
        recommendations.append("Practice more interview questions and mark strong answers as mastered.")
    if certification_score < 50:
        recommendations.append("Plan, start, or complete certifications aligned with your selected career.")
    if total_score >= 80:
        recommendations.append("You are close to being ready for internships or entry-level roles.")
    if not strengths:
        strengths.append("You have a clear roadmap and measurable gaps to work from.")
    return strengths, weaknesses, recommendations, next_actions


async def create_readiness_record(
    user_id: ObjectId,
    career_path_id: ObjectId,
    selected_career_title: str,
    total_score: int,
    score_level: str,
    roadmap_score: int,
    skills_score: int,
    projects_score: int,
    interview_score: int,
    certification_score: int,
    portfolio_score: int,
    score_breakdown: dict[str, Any],
    strengths: list[str],
    weaknesses: list[str],
    recommendations: list[str],
    next_actions: list[str],
) -> dict[str, Any]:
    db = get_database()
    document = create_readiness_document(
        user_id=user_id,
        career_path_id=career_path_id,
        selected_career_title=selected_career_title,
        total_score=total_score,
        score_level=score_level,
        roadmap_score=roadmap_score,
        skills_score=skills_score,
        projects_score=projects_score,
        interview_score=interview_score,
        certification_score=certification_score,
        portfolio_score=portfolio_score,
        score_breakdown=score_breakdown,
        strengths=strengths,
        weaknesses=weaknesses,
        recommendations=recommendations,
        next_actions=next_actions,
    )
    result = await db.career_readiness_scores.insert_one(document)
    stored = await db.career_readiness_scores.find_one({"_id": result.inserted_id})
    return serialize_document(stored)


async def calculate_readiness_score(user_id: ObjectId | str) -> dict[str, Any]:
    user_object_id = to_object_id(user_id, "user_id")
    _, career, career_path_id = await _load_profile_and_career(user_object_id)
    roadmap_score = await calculate_roadmap_score(user_object_id)
    skills_score = await calculate_skills_score(user_object_id)
    projects_score = await calculate_projects_score(user_object_id)
    interview_score = await calculate_interview_score(user_object_id)
    certification_score = await calculate_certification_score(user_object_id)
    portfolio_score = await calculate_portfolio_score(user_object_id)
    weights = {
        "roadmap": 0.30,
        "skills": 0.25,
        "projects": 0.20,
        "interview": 0.10,
        "certifications": 0.10,
        "portfolio": 0.05,
    }
    weighted_scores = {
        "roadmap": round(roadmap_score * weights["roadmap"], 2),
        "skills": round(skills_score * weights["skills"], 2),
        "projects": round(projects_score * weights["projects"], 2),
        "interview": round(interview_score * weights["interview"], 2),
        "certifications": round(certification_score * weights["certifications"], 2),
        "portfolio": round(portfolio_score * weights["portfolio"], 2),
    }
    total_score = _clamp_score(sum(weighted_scores.values()))
    score_level = determine_score_level(total_score)
    strengths, weaknesses, recommendations, next_actions = generate_readiness_recommendations(
        total_score,
        roadmap_score,
        skills_score,
        projects_score,
        interview_score,
        certification_score,
        portfolio_score,
    )
    score_breakdown = {
        "weights": weights,
        "weighted_scores": weighted_scores,
        "formula": "roadmap*30% + skills*25% + projects*20% + interview*10% + certifications*10% + portfolio*5%",
    }
    return await create_readiness_record(
        user_id=user_object_id,
        career_path_id=career_path_id,
        selected_career_title=career["title"],
        total_score=total_score,
        score_level=score_level,
        roadmap_score=roadmap_score,
        skills_score=skills_score,
        projects_score=projects_score,
        interview_score=interview_score,
        certification_score=certification_score,
        portfolio_score=portfolio_score,
        score_breakdown=score_breakdown,
        strengths=strengths,
        weaknesses=weaknesses,
        recommendations=recommendations,
        next_actions=next_actions,
    )


async def get_latest_readiness_score(user_id: ObjectId | str) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    document = await db.career_readiness_scores.find_one({"user_id": user_object_id}, sort=[("calculated_at", -1)])
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No career readiness score found")
    return serialize_document(document)


async def get_readiness_history(user_id: ObjectId | str) -> list[dict[str, Any]]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    documents = await db.career_readiness_scores.find({"user_id": user_object_id}).sort("calculated_at", -1).to_list(length=None)
    return serialize_documents(documents)
