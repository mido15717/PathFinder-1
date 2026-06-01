from typing import Any

from bson import ObjectId

from app.models.base_model import clamp_percentage, safe_list, safe_string, utc_now


def create_skill_gap_document(
    user_id: ObjectId,
    career_path_id: ObjectId,
    selected_career_title: str,
    mastered_skills: list[dict[str, Any]],
    weak_skills: list[dict[str, Any]],
    missing_skills: list[dict[str, Any]],
    priority_skills: list[dict[str, Any]],
    skill_coverage_percentage: int,
    total_required_skills: int,
    recommendations: list[str],
) -> dict[str, Any]:
    now = utc_now()
    return {
        "user_id": user_id,
        "career_path_id": career_path_id,
        "selected_career_title": safe_string(selected_career_title),
        "analysis_date": now,
        "mastered_skills": safe_list(mastered_skills),
        "weak_skills": safe_list(weak_skills),
        "missing_skills": safe_list(missing_skills),
        "priority_skills": safe_list(priority_skills),
        "skill_coverage_percentage": clamp_percentage(skill_coverage_percentage),
        "total_required_skills": total_required_skills,
        "mastered_count": len(mastered_skills),
        "weak_count": len(weak_skills),
        "missing_count": len(missing_skills),
        "recommendations": safe_list(recommendations),
        "created_at": now,
    }
