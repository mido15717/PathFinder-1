from typing import Any

from app.core.enums import DIFFICULTY_LEVELS, RESOURCE_TYPES
from app.models.base_model import base_timestamps, normalize_status, safe_list, safe_string


def create_course_document(payload: dict[str, Any]) -> dict[str, Any]:
    embedding_parts = [
        payload["title"],
        payload["description"],
        payload.get("provider", ""),
        payload.get("difficulty", ""),
        payload.get("course_type", ""),
        " ".join(payload.get("related_careers", [])),
        " ".join(payload.get("related_skills", [])),
        " ".join(payload.get("related_subjects", [])),
        " ".join(payload.get("tags", [])),
        " ".join(payload.get("learning_outcomes", [])),
    ]
    return {
        "title": payload["title"],
        "description": payload["description"],
        "provider": payload["provider"],
        "url": safe_string(payload["url"]),
        "course_type": normalize_status(payload.get("course_type"), RESOURCE_TYPES, "course"),
        "difficulty": normalize_status(payload.get("difficulty"), DIFFICULTY_LEVELS, "beginner"),
        "estimated_hours": max(0, int(payload.get("estimated_hours") or 8)),
        "is_free": payload.get("is_free", True),
        "rating": max(0, min(5, float(payload.get("rating", 4.5)))),
        "language": safe_string(payload.get("language", "English")),
        "related_careers": safe_list(payload.get("related_careers")),
        "related_skills": safe_list(payload.get("related_skills")),
        "related_subjects": safe_list(payload.get("related_subjects")),
        "tags": safe_list(payload.get("tags")),
        "prerequisites": safe_list(payload.get("prerequisites")),
        "learning_outcomes": safe_list(payload.get("learning_outcomes")),
        "source_dataset": payload.get("source_dataset", "PathFinder seed courses"),
        "embedding_text": safe_string(payload.get("embedding_text") or " ".join(embedding_parts)),
        **base_timestamps(),
        "is_active": payload.get("is_active", True),
    }
