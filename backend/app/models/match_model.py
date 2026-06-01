from typing import Any

from bson import ObjectId

from app.models.base_model import base_timestamps


def create_match_document(user_id: ObjectId, assessment_id: ObjectId, matches: list[dict[str, Any]]) -> dict[str, Any]:
    best_match = matches[0]["career_path_id"] if matches else None
    return {
        "user_id": user_id,
        "assessment_id": assessment_id,
        "matches": matches,
        "best_match_career_id": best_match,
        "selected_career_id": None,
        **base_timestamps(),
    }
