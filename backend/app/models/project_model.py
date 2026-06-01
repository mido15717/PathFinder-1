from typing import Any

from bson import ObjectId

from app.core.enums import PROJECT_STATUS
from app.models.base_model import base_timestamps, clamp_percentage, safe_list, safe_string, utc_now


PROJECT_STATUSES = set(PROJECT_STATUS)
clamp_progress = clamp_percentage


def create_project_document(payload: dict[str, Any], career_path_id: ObjectId) -> dict[str, Any]:
    return {
        "title": payload["title"],
        "slug": payload["slug"],
        "description": payload["description"],
        "career_path_id": career_path_id,
        "related_careers": safe_list(payload.get("related_careers")),
        "difficulty": safe_string(payload.get("difficulty", "beginner")),
        "required_skills": safe_list(payload.get("required_skills")),
        "tools": safe_list(payload.get("tools")),
        "estimated_duration_weeks": int(payload.get("estimated_duration_weeks") or 2),
        "instructions": safe_list(payload.get("instructions")),
        "expected_output": safe_string(payload.get("expected_output", "")),
        "evaluation_criteria": safe_list(payload.get("evaluation_criteria")),
        "suggested_features": safe_list(payload.get("suggested_features")),
        "learning_outcomes": safe_list(payload.get("learning_outcomes")),
        "tags": safe_list(payload.get("tags")),
        "is_active": payload.get("is_active", True),
        **base_timestamps(),
    }


def create_user_project_progress_document(user_id: ObjectId, project: dict[str, Any], status: str = "not_started") -> dict[str, Any]:
    now = utc_now()
    progress = 100 if status == "completed" else 10 if status == "in_progress" else 0
    return {
        "user_id": user_id,
        "project_id": project["_id"],
        "career_path_id": project["career_path_id"],
        "title": project["title"],
        "status": status,
        "progress_percentage": progress,
        "github_link": "",
        "live_demo_link": "",
        "notes": "",
        "started_at": now if status in {"in_progress", "completed"} else None,
        "completed_at": now if status == "completed" else None,
        "created_at": now,
        "updated_at": now,
    }
