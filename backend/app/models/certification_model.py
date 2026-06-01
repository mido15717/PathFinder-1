from typing import Any

from bson import ObjectId

from app.core.enums import CERTIFICATION_STATUS
from app.models.base_model import base_timestamps, normalize_status, safe_list, safe_string, utc_now


CERTIFICATION_STATUSES = set(CERTIFICATION_STATUS)


def create_certification_document(payload: dict[str, Any], career_path_id: ObjectId, career_title: str) -> dict[str, Any]:
    return {
        "title": payload["title"],
        "provider": payload["provider"],
        "career_path_id": career_path_id,
        "career_title": career_title,
        "description": safe_string(payload.get("description", "")),
        "difficulty": safe_string(payload.get("difficulty", "beginner")),
        "url": safe_string(payload.get("url", "")),
        "estimated_duration": safe_string(payload.get("estimated_duration", "")),
        "cost_type": safe_string(payload.get("cost_type", "mixed")),
        "related_skills": safe_list(payload.get("related_skills")),
        "is_active": payload.get("is_active", True),
        **base_timestamps(),
    }


def create_user_certification_document(user_id: ObjectId, certification: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    now = utc_now()
    status = normalize_status(payload.get("status"), CERTIFICATION_STATUSES, "planned")
    return {
        "user_id": user_id,
        "certification_id": certification["_id"],
        "career_path_id": certification["career_path_id"],
        "status": status,
        "certificate_url": payload.get("certificate_url", ""),
        "notes": payload.get("notes", ""),
        "started_at": now if status in {"in_progress", "completed"} else None,
        "completed_at": now if status == "completed" else None,
        "created_at": now,
        "updated_at": now,
    }
