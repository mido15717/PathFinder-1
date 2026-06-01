from typing import Any

from app.core.enums import DIFFICULTY_LEVELS
from app.models.base_model import base_timestamps, normalize_status, safe_list, safe_string


def create_career_document(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "title": payload["title"],
        "slug": payload["slug"],
        "description": payload["description"],
        "overview": safe_string(payload.get("overview", payload["description"])),
        "difficulty_level": normalize_status(payload.get("difficulty_level"), DIFFICULTY_LEVELS, "beginner"),
        "average_duration_months": payload.get("average_duration_months", 6),
        "required_skills": safe_list(payload.get("required_skills")),
        "recommended_tools": safe_list(payload.get("recommended_tools")),
        "responsibilities": safe_list(payload.get("responsibilities")),
        "suggested_projects": safe_list(payload.get("suggested_projects")),
        "recommended_certifications": safe_list(payload.get("recommended_certifications")),
        "market_demand": payload.get("market_demand", "medium"),
        "salary_level": payload.get("salary_level", "medium"),
        "tags": safe_list(payload.get("tags")),
        "related_subjects": safe_list(payload.get("related_subjects")),
        "preferred_personality_traits": safe_list(payload.get("preferred_personality_traits")),
        "preferred_learning_styles": safe_list(payload.get("preferred_learning_styles")),
        "icon": payload.get("icon", "briefcase"),
        "color": payload.get("color", "#2563EB"),
        "is_active": payload.get("is_active", True),
        **base_timestamps(),
    }
