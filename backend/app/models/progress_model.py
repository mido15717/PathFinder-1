from typing import Any

from bson import ObjectId

from app.core.enums import COURSE_STATUS
from app.models.base_model import base_timestamps, clamp_percentage, normalize_status, safe_list, safe_string, utc_now


COURSE_STATUSES = set(COURSE_STATUS)


def status_from_progress(progress_percentage: int, fallback: str = "not_started") -> str:
    if progress_percentage >= 100:
        return "completed"
    if progress_percentage > 0:
        return "in_progress"
    return normalize_status(fallback, COURSE_STATUSES, "not_started")


def create_course_progress_document(
    user_id: ObjectId,
    course: dict[str, Any],
    career_path_id: ObjectId | None = None,
    learning_path_id: ObjectId | None = None,
    phase_id: str | None = None,
    phase_title: str | None = None,
    status: str = "not_started",
    progress_percentage: int | None = None,
    source: str = "manual",
) -> dict[str, Any]:
    progress = clamp_percentage(progress_percentage if progress_percentage is not None else (100 if status == "completed" else 0))
    normalized_status = status_from_progress(progress, status)
    now = utc_now()
    return {
        "user_id": user_id,
        "course_id": safe_string(course.get("course_id") or course.get("_id") or course.get("id")),
        "course_title": safe_string(course.get("course_title") or course.get("title", "Untitled course")),
        "provider": safe_string(course.get("provider", "")),
        "difficulty": safe_string(course.get("difficulty", "beginner")),
        "estimated_hours": int(course.get("estimated_hours") or 0),
        "status": normalized_status,
        "progress_percentage": progress,
        "started_at": now if normalized_status in {"in_progress", "completed"} else None,
        "completed_at": now if normalized_status == "completed" else None,
        "career_path_id": career_path_id,
        "learning_path_id": learning_path_id,
        "phase_id": phase_id,
        "phase_title": phase_title,
        "related_skills": safe_list(course.get("related_skills")),
        "source": source,
        "notes": course.get("notes"),
        **base_timestamps(),
    }


def create_skill_progress_document(
    user_id: ObjectId,
    skill_name: str,
    category: str = "general",
    level: str = "beginner",
    related_career_path_id: ObjectId | None = None,
    progress_percentage: int = 0,
    completed_courses: list[str] | None = None,
    related_course_ids: list[str] | None = None,
) -> dict[str, Any]:
    progress = clamp_percentage(progress_percentage)
    return {
        "user_id": user_id,
        "skill_name": safe_string(skill_name).strip(),
        "category": safe_string(category or "general"),
        "level": safe_string(level or "beginner"),
        "status": status_from_progress(progress),
        "progress_percentage": progress,
        "completed_courses": safe_list(completed_courses),
        "related_course_ids": safe_list(related_course_ids),
        "related_career_path_id": related_career_path_id,
        "last_updated_reason": "",
        **base_timestamps(),
    }


def create_progress_log_document(
    user_id: ObjectId,
    action_type: str,
    title: str,
    message: str,
    entity_type: str | None = None,
    entity_id: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "user_id": user_id,
        "action_type": action_type,
        "title": title,
        "message": message,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "metadata": metadata or {},
        "created_at": utc_now(),
    }
