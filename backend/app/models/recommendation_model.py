from typing import Any

from bson import ObjectId

from app.models.base_model import safe_list, safe_string, utc_now


def create_recommendation_document(
    user_id: ObjectId,
    career_path_id: ObjectId,
    assessment_id: ObjectId | None,
    selected_career_title: str,
    query: str,
    recommended_courses: list[dict[str, Any]],
    filters_used: dict[str, Any],
) -> dict[str, Any]:
    now = utc_now()
    return {
        "user_id": user_id,
        "career_path_id": career_path_id,
        "assessment_id": assessment_id,
        "selected_career_title": safe_string(selected_career_title),
        "query": safe_string(query),
        "recommended_courses": safe_list(recommended_courses),
        "filters_used": filters_used,
        "generated_at": now,
        "created_at": now,
    }


def create_saved_course_document(user_id: ObjectId, course: dict[str, Any], career_path_id: ObjectId | None) -> dict[str, Any]:
    return {
        "user_id": user_id,
        "course_id": course["_id"],
        "career_path_id": career_path_id,
        "title": safe_string(course["title"]),
        "provider": safe_string(course["provider"]),
        "url": safe_string(course["url"]),
        "status": "saved",
        "saved_at": utc_now(),
    }
