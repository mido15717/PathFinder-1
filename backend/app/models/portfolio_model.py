from typing import Any

from bson import ObjectId

from app.models.base_model import base_timestamps, clamp_percentage, safe_list, utc_now


DEFAULT_PORTFOLIO_CHECKLIST = {
    "github_profile_added": False,
    "linkedin_profile_added": False,
    "portfolio_url_added": False,
    "completed_project_exists": False,
    "github_links_added": False,
    "live_demo_links_added": False,
    "project_notes_added": False,
    "readme_quality_checked": False,
    "pinned_projects_ready": False,
    "screenshots_added": False,
}


def create_portfolio_readiness_document(
    user_id: ObjectId,
    career_path_id: ObjectId,
    score_percentage: int,
    checklist: dict[str, bool],
    strengths: list[str],
    weaknesses: list[str],
    recommendations: list[str],
) -> dict[str, Any]:
    now = utc_now()
    return {
        "user_id": user_id,
        "career_path_id": career_path_id,
        "score_percentage": clamp_percentage(score_percentage),
        "checklist": {**DEFAULT_PORTFOLIO_CHECKLIST, **checklist},
        "strengths": safe_list(strengths),
        "weaknesses": safe_list(weaknesses),
        "recommendations": safe_list(recommendations),
        "calculated_at": now,
        **base_timestamps(),
    }
