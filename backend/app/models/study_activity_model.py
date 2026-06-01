from typing import Any

from bson import ObjectId

from app.models.base_model import base_timestamps, safe_list, safe_string


def create_study_activity_document(user_id: ObjectId, payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "user_id": user_id,
        "date": payload["date"],
        "minutes_spent": int(payload.get("minutes_spent") or 0),
        "courses_studied": safe_list(payload.get("courses_studied")),
        "skills_practiced": safe_list(payload.get("skills_practiced")),
        "tasks_completed": int(payload.get("tasks_completed") or 0),
        "notes": safe_string(payload.get("notes", "")),
        **base_timestamps(),
    }
