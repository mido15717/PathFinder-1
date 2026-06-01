from typing import Any

from bson import ObjectId

from app.core.enums import INTERVIEW_STATUS, PRIORITY_LEVELS
from app.models.base_model import base_timestamps, normalize_status, safe_list, safe_string, utc_now


INTERVIEW_STATUSES = set(INTERVIEW_STATUS)
CONFIDENCE_LEVELS = set(PRIORITY_LEVELS)


def create_interview_question_document(payload: dict[str, Any], career_path_id: ObjectId, career_title: str) -> dict[str, Any]:
    return {
        "career_path_id": career_path_id,
        "career_title": career_title,
        "question": payload["question"],
        "sample_answer": safe_string(payload.get("sample_answer", "")),
        "type": safe_string(payload.get("type", "technical")),
        "difficulty": safe_string(payload.get("difficulty", "beginner")),
        "related_skill": safe_string(payload.get("related_skill", "")),
        "tags": safe_list(payload.get("tags")),
        **base_timestamps(),
    }


def create_interview_progress_document(user_id: ObjectId, question: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    now = utc_now()
    status = normalize_status(payload.get("status"), INTERVIEW_STATUSES, "not_started")
    return {
        "user_id": user_id,
        "question_id": question["_id"],
        "career_path_id": question["career_path_id"],
        "status": status,
        "user_answer": safe_string(payload.get("user_answer", "")),
        "notes": safe_string(payload.get("notes", "")),
        "confidence_level": normalize_status(payload.get("confidence_level"), CONFIDENCE_LEVELS, "low"),
        "last_practiced_at": now if status in {"practiced", "mastered"} else None,
        "created_at": now,
        "updated_at": now,
    }
