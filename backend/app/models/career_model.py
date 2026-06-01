from typing import Any

from app.models.user_model import utc_now


def create_career_document(payload: dict[str, Any]) -> dict[str, Any]:
    now = utc_now()
    return {
        "title": payload["title"],
        "slug": payload["slug"],
        "description": payload["description"],
        "overview": payload.get("overview", payload["description"]),
        "difficulty_level": payload.get("difficulty_level", "beginner"),
        "average_duration_months": payload.get("average_duration_months", 6),
        "required_skills": payload.get("required_skills", []),
        "recommended_tools": payload.get("recommended_tools", []),
        "responsibilities": payload.get("responsibilities", []),
        "suggested_projects": payload.get("suggested_projects", []),
        "recommended_certifications": payload.get("recommended_certifications", []),
        "market_demand": payload.get("market_demand", "medium"),
        "salary_level": payload.get("salary_level", "medium"),
        "tags": payload.get("tags", []),
        "related_subjects": payload.get("related_subjects", []),
        "preferred_personality_traits": payload.get("preferred_personality_traits", []),
        "preferred_learning_styles": payload.get("preferred_learning_styles", []),
        "icon": payload.get("icon", "briefcase"),
        "color": payload.get("color", "#2563EB"),
        "is_active": payload.get("is_active", True),
        "created_at": now,
        "updated_at": now,
    }
