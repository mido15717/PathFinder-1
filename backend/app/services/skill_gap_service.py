from typing import Any

from bson import ObjectId
from fastapi import HTTPException, status

from app.db.mongodb import get_database
from app.models.skill_gap_model import create_skill_gap_document
from app.utils.object_id import serialize_document, serialize_documents, to_object_id


def _normalize(value: Any) -> str:
    return " ".join(str(value).lower().replace("/", " ").replace("-", " ").split())


def _display_level(progress_percentage: int) -> str:
    if progress_percentage >= 80:
        return "advanced"
    if progress_percentage >= 50:
        return "intermediate"
    return "beginner"


def _skill_priority(skill_name: str, career: dict[str, Any], active_path: dict[str, Any] | None, latest_recommendation: dict[str, Any] | None) -> tuple[str, int, str]:
    normalized = _normalize(skill_name)
    current_phase = None
    if active_path:
        current_phase_id = active_path.get("current_phase_id")
        current_phase = next((phase for phase in active_path.get("phases", []) if phase.get("phase_id") == current_phase_id), None)
        if current_phase and any(_normalize(item) == normalized for item in [*current_phase.get("required_skills", []), *current_phase.get("prerequisites", [])]):
            return "high", 95, "Required for the current learning path phase."

    frequency = 0
    for course in (latest_recommendation or {}).get("recommended_courses", []):
        if any(_normalize(item) == normalized for item in course.get("related_skills", [])):
            frequency += 1
    if frequency >= 2:
        return "high", 88, "Appears often in recommended courses for this career."
    if any(_normalize(item) == normalized for item in career.get("required_skills", [])):
        return "medium", 70, "Required by the selected career path."
    return "low", 40, "Useful later, but not blocking the current roadmap phase."


def calculate_skill_coverage(required_skills: list[str], user_skill_progress: list[dict[str, Any]]) -> int:
    if not required_skills:
        return 0
    progress_by_skill = {_normalize(item.get("skill_name")): int(item.get("progress_percentage", 0)) for item in user_skill_progress}
    mastered_count = 0
    weak_count = 0
    for skill in required_skills:
        progress = progress_by_skill.get(_normalize(skill), 0)
        if progress >= 80:
            mastered_count += 1
        elif progress >= 30:
            weak_count += 1
    return round(((mastered_count + weak_count * 0.5) / len(required_skills)) * 100)


async def _load_context(user_id: ObjectId) -> dict[str, Any]:
    db = get_database()
    profile = await db.user_profiles.find_one({"user_id": user_id})
    if not profile or not profile.get("selected_career_path_id"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please complete the Career Assessment and select a career path first.")
    career_path_id = to_object_id(profile["selected_career_path_id"], "career_path_id")
    career = await db.career_paths.find_one({"_id": career_path_id, "is_active": True})
    if not career:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Selected career path not found")
    latest_assessment = await db.career_assessments.find_one({"user_id": user_id}, sort=[("created_at", -1)])
    latest_recommendation = await db.course_recommendations.find_one({"user_id": user_id, "career_path_id": career_path_id}, sort=[("created_at", -1)])
    if not latest_recommendation:
        latest_recommendation = await db.course_recommendations.find_one({"user_id": user_id}, sort=[("created_at", -1)])
    active_path = await db.adaptive_learning_paths.find_one({"user_id": user_id, "career_path_id": career_path_id, "status": "active"}, sort=[("created_at", -1)])
    user_skills = await db.user_skill_progress.find({"user_id": user_id}).to_list(length=None)
    completed_courses = await db.user_course_progress.find({"user_id": user_id, "status": "completed"}).to_list(length=None)
    return {
        "profile": profile,
        "career": career,
        "career_path_id": career_path_id,
        "latest_assessment": latest_assessment,
        "latest_recommendation": latest_recommendation,
        "active_path": active_path,
        "user_skills": user_skills,
        "completed_courses": completed_courses,
    }


async def get_recommended_courses_for_missing_skill(skill_name: str, career_path_id: ObjectId, user_level: str | None = None) -> list[dict[str, Any]]:
    db = get_database()
    career = await db.career_paths.find_one({"_id": career_path_id})
    if not career:
        return []
    difficulty_order = {
        "beginner": ["beginner"],
        "basic": ["beginner"],
        "intermediate": ["beginner", "intermediate"],
        "advanced": ["beginner", "intermediate", "advanced"],
    }
    allowed_difficulties = difficulty_order.get(_normalize(user_level or ""), ["beginner", "intermediate", "advanced"])
    skill_query = {"$regex": f"^{skill_name}$", "$options": "i"}
    base_query = {"is_active": True, "related_skills": skill_query, "difficulty": {"$in": allowed_difficulties}}
    career_query = {**base_query, "related_careers": career.get("title")}
    courses = await db.courses.find(career_query).sort([("rating", -1), ("title", 1)]).limit(3).to_list(length=3)
    if len(courses) < 3:
        fallback = await db.courses.find(base_query).sort([("rating", -1), ("title", 1)]).limit(6).to_list(length=6)
        seen = {str(course["_id"]) for course in courses}
        courses.extend([course for course in fallback if str(course["_id"]) not in seen][: 3 - len(courses)])
    return [
        {
            "course_id": str(course["_id"]),
            "title": course.get("title", ""),
            "provider": course.get("provider", ""),
            "url": course.get("url", ""),
            "difficulty": course.get("difficulty", ""),
            "relevance_score": 90 if career.get("title") in course.get("related_careers", []) else 75,
            "recommendation_reason": f"Builds {skill_name} for {career.get('title', 'your selected career')}.",
        }
        for course in courses[:3]
    ]


async def classify_skills(
    required_skills: list[str],
    user_skill_progress: list[dict[str, Any]],
    assessment_skills: list[str],
    completed_courses: list[dict[str, Any]],
    career: dict[str, Any],
    active_path: dict[str, Any] | None,
    latest_recommendation: dict[str, Any] | None,
    user_level: str | None = None,
) -> dict[str, list[dict[str, Any]]]:
    progress_by_skill = {_normalize(item.get("skill_name")): item for item in user_skill_progress}
    assessment_set = {_normalize(skill) for skill in assessment_skills}
    completed_evidence: dict[str, list[str]] = {}
    for course in completed_courses:
        course_title = course.get("course_title") or course.get("title") or "Completed course"
        for skill in course.get("related_skills", []):
            completed_evidence.setdefault(_normalize(skill), []).append(course_title)

    mastered: list[dict[str, Any]] = []
    weak: list[dict[str, Any]] = []
    missing: list[dict[str, Any]] = []
    priority_skills: list[dict[str, Any]] = []
    for skill in required_skills:
        normalized = _normalize(skill)
        skill_doc = progress_by_skill.get(normalized)
        progress = int((skill_doc or {}).get("progress_percentage", 0))
        assessment_has_skill = normalized in assessment_set
        evidence = list(dict.fromkeys(completed_evidence.get(normalized, [])))
        priority, priority_score, priority_reason = _skill_priority(skill, career, active_path, latest_recommendation)

        if progress >= 80 or evidence:
            mastered.append(
                {
                    "skill_name": skill,
                    "level": _display_level(max(progress, 80 if evidence else progress)),
                    "progress_percentage": max(progress, 80 if evidence else progress),
                    "evidence": evidence or [f"{skill} is tracked as {progress}% complete."],
                }
            )
            continue

        recommended_courses = await get_recommended_courses_for_missing_skill(skill, career["_id"], user_level)
        if 30 <= progress <= 79 or assessment_has_skill:
            reason = "You listed this skill, but no completed course evidence was found." if assessment_has_skill and not evidence else "Progress is underway but below mastery level."
            weak.append(
                {
                    "skill_name": skill,
                    "current_progress_percentage": max(progress, 30 if assessment_has_skill else progress),
                    "required_level": "career-ready",
                    "priority": priority,
                    "reason": reason,
                    "source": "rule_based",
                    "recommended_courses": recommended_courses,
                }
            )
        else:
            missing.append(
                {
                    "skill_name": skill,
                    "required_level": "career-ready",
                    "priority": priority,
                    "reason": "This required career skill is not yet present in your profile, assessment, completed courses, or progress records.",
                    "source": "rule_based",
                    "recommended_courses": recommended_courses,
                }
            )
        priority_skills.append(
            {
                "skill_name": skill,
                "priority_score": priority_score,
                "reason": priority_reason,
                "recommended_action": f"Complete one recommended {skill} course and update skill progress.",
            }
        )

    priority_skills.sort(key=lambda item: item["priority_score"], reverse=True)
    return {"mastered_skills": mastered, "weak_skills": weak, "missing_skills": missing, "priority_skills": priority_skills[:8]}


async def _merge_ml_missing_skills(
    user_id: ObjectId,
    career: dict[str, Any],
    career_path_id: ObjectId,
    classified: dict[str, list[dict[str, Any]]],
    user_level: str | None,
) -> None:
    db = get_database()
    prediction = await db.ml_career_predictions.find_one({"user_id": user_id}, sort=[("created_at", -1)])
    if not prediction:
        return

    ml_skills = prediction.get("skills_model_result", {}).get("missing_skills") or prediction.get("missing_skills", [])
    existing = {
        _normalize(item.get("skill_name"))
        for item in [*classified["mastered_skills"], *classified["weak_skills"], *classified["missing_skills"]]
    }
    for skill in ml_skills:
        normalized = _normalize(skill)
        if not normalized or normalized in existing:
            continue
        recommended_courses = await get_recommended_courses_for_missing_skill(skill, career_path_id, user_level)
        classified["missing_skills"].append(
            {
                "skill_name": skill,
                "required_level": "career-ready",
                "priority": "high",
                "reason": "The ML skills model identified this as a gap for the predicted career direction.",
                "source": "ML skills model",
                "recommended_courses": recommended_courses,
            }
        )
        classified["priority_skills"].append(
            {
                "skill_name": skill,
                "priority_score": 92,
                "reason": "Prioritized because the ML skills model identified this skill gap.",
                "recommended_action": f"Complete one recommended {skill} course and update skill progress.",
            }
        )
        existing.add(normalized)

    classified["priority_skills"].sort(key=lambda item: item["priority_score"], reverse=True)
    classified["priority_skills"] = classified["priority_skills"][:8]


def _analysis_recommendations(weak_skills: list[dict[str, Any]], missing_skills: list[dict[str, Any]], coverage: int) -> list[str]:
    recommendations: list[str] = []
    if missing_skills:
        recommendations.append("Start with high-priority missing skills and complete one recommended course for each.")
    if weak_skills:
        recommendations.append("Turn weak skills into mastered skills by finishing related courses and updating progress.")
    if coverage < 50:
        recommendations.append("Focus on foundational skills before moving deeper into advanced roadmap phases.")
    elif coverage < 80:
        recommendations.append("You have useful momentum; close the remaining gaps to become career-ready.")
    else:
        recommendations.append("Your skill coverage is strong. Keep building portfolio evidence for these skills.")
    return recommendations


async def create_skill_gap_record(
    user_id: ObjectId,
    career_path_id: ObjectId,
    selected_career_title: str,
    classified: dict[str, list[dict[str, Any]]],
    skill_coverage_percentage: int,
    total_required_skills: int,
    recommendations: list[str],
) -> dict[str, Any]:
    db = get_database()
    document = create_skill_gap_document(
        user_id=user_id,
        career_path_id=career_path_id,
        selected_career_title=selected_career_title,
        mastered_skills=classified["mastered_skills"],
        weak_skills=classified["weak_skills"],
        missing_skills=classified["missing_skills"],
        priority_skills=classified["priority_skills"],
        skill_coverage_percentage=skill_coverage_percentage,
        total_required_skills=total_required_skills,
        recommendations=recommendations,
    )
    result = await db.skill_gap_analysis.insert_one(document)
    stored = await db.skill_gap_analysis.find_one({"_id": result.inserted_id})
    return serialize_document(stored)


async def analyze_skill_gap(user_id: ObjectId | str) -> dict[str, Any]:
    user_object_id = to_object_id(user_id, "user_id")
    context = await _load_context(user_object_id)
    career = context["career"]
    latest_assessment = context["latest_assessment"] or {}
    required_skills = career.get("required_skills", [])
    classified = await classify_skills(
        required_skills=required_skills,
        user_skill_progress=context["user_skills"],
        assessment_skills=list(dict.fromkeys([*latest_assessment.get("current_skills", []), *context["profile"].get("current_skills", [])])),
        completed_courses=context["completed_courses"],
        career=career,
        active_path=context["active_path"],
        latest_recommendation=context["latest_recommendation"],
        user_level=latest_assessment.get("programming_level"),
    )
    await _merge_ml_missing_skills(
        user_id=user_object_id,
        career=career,
        career_path_id=context["career_path_id"],
        classified=classified,
        user_level=latest_assessment.get("programming_level"),
    )
    total_required = len(required_skills)
    coverage = round(((len(classified["mastered_skills"]) + len(classified["weak_skills"]) * 0.5) / total_required) * 100) if total_required else 0
    recommendations = _analysis_recommendations(classified["weak_skills"], classified["missing_skills"], coverage)
    if any(item.get("source") == "ML skills model" for item in classified["missing_skills"]):
        recommendations.insert(0, "Review ML-detected skill gaps first because they come from the uploaded skills model.")
    return await create_skill_gap_record(
        user_id=user_object_id,
        career_path_id=context["career_path_id"],
        selected_career_title=career["title"],
        classified=classified,
        skill_coverage_percentage=coverage,
        total_required_skills=total_required,
        recommendations=recommendations,
    )


async def get_latest_skill_gap(user_id: ObjectId | str) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    document = await db.skill_gap_analysis.find_one({"user_id": user_object_id}, sort=[("analysis_date", -1)])
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No skill gap analysis found")
    return serialize_document(document)


async def get_skill_gap_history(user_id: ObjectId | str) -> list[dict[str, Any]]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    documents = await db.skill_gap_analysis.find({"user_id": user_object_id}).sort("analysis_date", -1).to_list(length=None)
    return serialize_documents(documents)


async def get_missing_skills(user_id: ObjectId | str) -> dict[str, Any]:
    try:
        latest = await get_latest_skill_gap(user_id)
    except HTTPException as exc:
        if exc.status_code != status.HTTP_404_NOT_FOUND:
            raise
        latest = await analyze_skill_gap(user_id)
    return {
        "selected_career_title": latest["selected_career_title"],
        "weak_skills": latest.get("weak_skills", []),
        "missing_skills": latest.get("missing_skills", []),
        "priority_skills": latest.get("priority_skills", []),
        "recommendations": latest.get("recommendations", []),
    }
