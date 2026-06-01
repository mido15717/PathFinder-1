from typing import Any

from bson import ObjectId
from fastapi import HTTPException, status

from app.db.mongodb import get_database
from app.models.resume_model import create_resume_document, create_resume_feedback_document
from app.models.base_model import utc_now
from app.utils.object_id import serialize_document, to_object_id


async def _latest_resume(user_id: ObjectId) -> dict[str, Any] | None:
    db = get_database()
    return await db.resumes.find_one({"user_id": user_id}, sort=[("updated_at", -1)])


async def get_user_resume(user_id: ObjectId | str) -> dict[str, Any]:
    user_object_id = to_object_id(user_id, "user_id")
    resume = await _latest_resume(user_object_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No resume found for this user")
    return serialize_document(resume)


async def create_resume(user_id: ObjectId | str, payload: dict[str, Any]) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    existing = await _latest_resume(user_object_id)
    if existing:
        return await update_resume(user_object_id, payload)
    document = create_resume_document(user_object_id, payload)
    result = await db.resumes.insert_one(document)
    stored = await db.resumes.find_one({"_id": result.inserted_id})
    return serialize_document(stored)


async def update_resume(user_id: ObjectId | str, payload: dict[str, Any]) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    existing = await _latest_resume(user_object_id)
    document = create_resume_document(user_object_id, payload)
    document["updated_at"] = utc_now()
    if existing:
        document["created_at"] = existing.get("created_at", document["created_at"])
        await db.resumes.update_one({"_id": existing["_id"]}, {"$set": document})
        stored = await db.resumes.find_one({"_id": existing["_id"]})
    else:
        result = await db.resumes.insert_one(document)
        stored = await db.resumes.find_one({"_id": result.inserted_id})
    return serialize_document(stored)


def _profile_location(profile: dict[str, Any] | None) -> str:
    if not profile:
        return ""
    return ", ".join(part for part in [profile.get("city"), profile.get("country")] if part)


def _summary(profile: dict[str, Any] | None) -> str:
    if not profile:
        return ""
    if profile.get("bio"):
        return profile["bio"]
    career = profile.get("selected_career_title") or "technology"
    goal = profile.get("career_goal")
    if goal:
        return f"Aspiring {career} focused on {goal}."
    return f"Aspiring {career} building practical skills, projects, and career-ready experience."


async def _resume_skills(user_id: ObjectId, profile: dict[str, Any] | None) -> list[dict[str, str]]:
    db = get_database()
    progress = await db.user_skill_progress.find({"user_id": user_id}).sort("updated_at", -1).to_list(length=40)
    skills = [
        {
            "name": item.get("skill_name", ""),
            "category": item.get("category", "technical"),
            "level": item.get("level", "beginner"),
        }
        for item in progress
        if item.get("skill_name")
    ]
    if skills:
        return skills
    return [{"name": skill, "category": "technical", "level": "beginner"} for skill in (profile or {}).get("current_skills", [])]


async def _resume_projects(user_id: ObjectId) -> list[dict[str, Any]]:
    db = get_database()
    projects = await db.user_project_progress.find({"user_id": user_id, "status": "completed"}).sort("completed_at", -1).to_list(length=8)
    return [
        {
            "title": project.get("title", "Completed project"),
            "description": project.get("notes") or "Completed career portfolio project.",
            "technologies": project.get("related_skills", []),
            "github_link": project.get("github_link", ""),
            "live_demo_link": project.get("live_demo_link", ""),
        }
        for project in projects
    ]


async def _resume_certifications(user_id: ObjectId) -> list[dict[str, str]]:
    db = get_database()
    user_certs = await db.user_certifications.find({"user_id": user_id, "status": "completed"}).sort("completed_at", -1).to_list(length=8)
    if not user_certs:
        return []
    cert_ids = [item["certification_id"] for item in user_certs]
    certifications = await db.certifications.find({"_id": {"$in": cert_ids}}).to_list(length=None)
    cert_map = {cert["_id"]: cert for cert in certifications}
    results = []
    for item in user_certs:
        cert = cert_map.get(item["certification_id"])
        if not cert:
            continue
        completed_at = item.get("completed_at")
        results.append(
            {
                "title": cert.get("title", ""),
                "provider": cert.get("provider", ""),
                "issue_date": completed_at.date().isoformat() if hasattr(completed_at, "date") else "",
                "certificate_url": item.get("certificate_url", ""),
            }
        )
    return results


async def generate_resume_from_profile(user_id: ObjectId | str) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    user = await db.users.find_one({"_id": user_object_id}) or {}
    profile = await db.user_profiles.find_one({"user_id": user_object_id}) or {}
    education = []
    if profile.get("university") or profile.get("college") or profile.get("major"):
        education.append(
            {
                "institution": profile.get("university") or profile.get("college", ""),
                "degree": profile.get("college", ""),
                "major": profile.get("major", ""),
                "start_year": "",
                "end_year": profile.get("academic_year", ""),
                "gpa": "",
            }
        )
    payload = {
        "full_name": user.get("full_name", ""),
        "email": user.get("email", ""),
        "phone": "",
        "location": _profile_location(profile),
        "linkedin": profile.get("linkedin_url", ""),
        "github": profile.get("github_url", ""),
        "portfolio": profile.get("portfolio_url", ""),
        "summary": _summary(profile),
        "education": education,
        "skills": await _resume_skills(user_object_id, profile),
        "projects": await _resume_projects(user_object_id),
        "certifications": await _resume_certifications(user_object_id),
        "experience": [],
        "languages": [{"language": profile.get("preferred_language", "English"), "level": ""}],
    }
    return await update_resume(user_object_id, payload)


def _score_resume(resume: dict[str, Any]) -> tuple[int, list[str], list[str], list[str], list[str]]:
    score = 0
    strengths: list[str] = []
    weaknesses: list[str] = []
    suggestions: list[str] = []
    missing: list[str] = []

    link_score = sum(5 for key in ["linkedin", "github", "portfolio"] if resume.get(key))
    score += link_score
    if link_score == 15:
        strengths.append("Profile links include LinkedIn, GitHub, and portfolio.")
    else:
        missing.append("LinkedIn, GitHub, or portfolio link")
        suggestions.append("Add LinkedIn, GitHub, and portfolio links so recruiters can verify your work.")

    if resume.get("education"):
        score += 15
        strengths.append("Education is present.")
    else:
        missing.append("Education")
        weaknesses.append("Education details are missing.")

    skill_count = len(resume.get("skills") or [])
    if skill_count >= 6:
        score += 20
        strengths.append("Skills section is strong and specific.")
    elif skill_count >= 3:
        score += 12
        suggestions.append("Add more role-specific technical skills.")
    elif skill_count:
        score += 6
        weaknesses.append("Skills section is too light for a career-ready resume.")
    else:
        missing.append("Skills")

    project_count = len(resume.get("projects") or [])
    if project_count >= 2:
        score += 25
        strengths.append("Projects provide useful portfolio evidence.")
    elif project_count == 1:
        score += 15
        suggestions.append("Add one more polished project with GitHub or demo links.")
    else:
        missing.append("Projects")
        weaknesses.append("No completed projects are listed.")

    if resume.get("certifications"):
        score += 10
        strengths.append("Certifications support your target role.")
    else:
        suggestions.append("Plan or complete at least one certification aligned with your selected career.")

    if resume.get("experience"):
        score += 10
        strengths.append("Experience section is included.")
    else:
        suggestions.append("Add internships, volunteering, freelance work, labs, or campus roles if available.")

    if len((resume.get("summary") or "").strip()) >= 40:
        score += 5
        strengths.append("Summary gives context for your target career.")
    else:
        missing.append("Professional summary")
        suggestions.append("Write a 2-3 sentence summary focused on your target role, strengths, and projects.")

    if not weaknesses:
        weaknesses.append("Keep refining bullets with measurable outcomes and role-specific keywords.")
    if not strengths:
        strengths.append("You have a resume draft that can now be improved section by section.")
    return min(score, 100), strengths, weaknesses, suggestions, missing


async def generate_resume_feedback(user_id: ObjectId | str) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    resume = await _latest_resume(user_object_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Create or generate a resume first")
    score, strengths, weaknesses, suggestions, missing = _score_resume(resume)
    document = create_resume_feedback_document(user_object_id, resume["_id"], score, strengths, weaknesses, suggestions, missing)
    result = await db.resume_feedback.insert_one(document)
    stored = await db.resume_feedback.find_one({"_id": result.inserted_id})
    return serialize_document(stored)
