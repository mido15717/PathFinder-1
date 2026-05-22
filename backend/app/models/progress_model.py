from typing import Any

from bson import ObjectId

from app.utils.helpers import utc_now

USER_LEARNING_PATHS_COLLECTION = "user_learning_paths"
USER_COURSE_PROGRESS_COLLECTION = "user_course_progress"
USER_SKILL_PROGRESS_COLLECTION = "user_skill_progress"
PROGRESS_LOGS_COLLECTION = "progress_logs"
CAREER_READINESS_SCORES_COLLECTION = "career_readiness_scores"


def create_user_learning_path_document(
    user_id: ObjectId,
    career_path_id: ObjectId,
    roadmap_id: ObjectId,
    selected_courses: list[dict[str, Any]],
    current_phase_id: str | None = None,
) -> dict[str, Any]:
    now = utc_now()
    return {
        "user_id": user_id,
        "career_path_id": career_path_id,
        "roadmap_id": roadmap_id,
        "selected_courses": selected_courses,
        "current_phase_id": current_phase_id,
        "status": "not_started",
        "overall_progress_percentage": 0,
        "created_at": now,
        "updated_at": now,
    }


def create_user_course_progress_document(
    user_id: ObjectId,
    course_id: ObjectId,
    course_title: str,
    related_skills: list[str],
    career_path_id: ObjectId,
    roadmap_phase_id: str | None,
) -> dict[str, Any]:
    now = utc_now()
    return {
        "user_id": user_id,
        "course_id": course_id,
        "course_title": course_title,
        "related_skills": related_skills,
        "career_path_id": career_path_id,
        "roadmap_phase_id": roadmap_phase_id,
        "status": "not_started",
        "progress_percentage": 0,
        "started_at": None,
        "completed_at": None,
        "last_updated_at": now,
    }


def create_user_skill_progress_document(
    user_id: ObjectId,
    skill_id: ObjectId | None,
    skill_name: str,
    level: str,
    status: str,
    progress_percentage: float,
    source_course_id: ObjectId | None,
) -> dict[str, Any]:
    return {
        "user_id": user_id,
        "skill_id": skill_id,
        "skill_name": skill_name,
        "level": level,
        "status": status,
        "progress_percentage": progress_percentage,
        "source_course_id": source_course_id,
        "updated_at": utc_now(),
    }


def create_progress_log_document(
    user_id: ObjectId,
    action_type: str,
    entity_type: str,
    entity_id: ObjectId | None,
    description: str,
    progress_value: float | None = None,
    old_status: str | None = None,
    new_status: str | None = None,
) -> dict[str, Any]:
    return {
        "user_id": user_id,
        "action_type": action_type,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "description": description,
        "old_status": old_status,
        "new_status": new_status,
        "progress_value": progress_value,
        "created_at": utc_now(),
    }


def create_readiness_score_document(
    user_id: ObjectId,
    career_path_id: ObjectId,
    breakdown: dict[str, float],
    strengths: list[str],
    weaknesses: list[str],
    recommendations: list[str],
) -> dict[str, Any]:
    return {
        "user_id": user_id,
        "career_path_id": career_path_id,
        "total_score": breakdown["total_score"],
        "roadmap_score": breakdown["roadmap_score"],
        "skills_score": breakdown["skills_score"],
        "projects_score": breakdown["projects_score"],
        "interview_score": breakdown["interview_score"],
        "portfolio_score": breakdown["portfolio_score"],
        "certification_score": breakdown["certification_score"],
        "strengths": strengths,
        "weaknesses": weaknesses,
        "recommendations": recommendations,
        "calculated_at": utc_now(),
    }
