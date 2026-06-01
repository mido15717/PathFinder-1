from typing import Any

from bson import ObjectId

from app.models.user_model import utc_now


def create_assessment_document(user_id: ObjectId, payload: dict[str, Any]) -> dict[str, Any]:
    now = utc_now()
    return {
        "user_id": user_id,
        "preferred_area": payload["preferred_area"],
        "programming_level": payload["programming_level"],
        "favorite_subjects": payload.get("favorite_subjects", []),
        "current_skills": payload.get("current_skills", []),
        "career_goal": payload["career_goal"],
        "learning_style": payload["learning_style"],
        "weekly_available_hours": payload["weekly_available_hours"],
        "preferred_work_type": payload["preferred_work_type"],
        "target_deadline_months": payload.get("target_deadline_months"),
        "personality_traits": payload.get("personality_traits", []),
        "answers": payload.get("answers", {}),
        "completed_at": now,
        "created_at": now,
    }
