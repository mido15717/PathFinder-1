from typing import Any

from bson import ObjectId

from app.models.base_model import clamp_percentage, safe_list, safe_string, utc_now


def create_readiness_document(
    user_id: ObjectId,
    career_path_id: ObjectId,
    selected_career_title: str,
    total_score: int,
    score_level: str,
    roadmap_score: int,
    skills_score: int,
    projects_score: int,
    interview_score: int,
    certification_score: int,
    portfolio_score: int,
    score_breakdown: dict[str, Any],
    strengths: list[str],
    weaknesses: list[str],
    recommendations: list[str],
    next_actions: list[str],
) -> dict[str, Any]:
    now = utc_now()
    return {
        "user_id": user_id,
        "career_path_id": career_path_id,
        "selected_career_title": safe_string(selected_career_title),
        "total_score": clamp_percentage(total_score),
        "score_level": safe_string(score_level),
        "roadmap_score": clamp_percentage(roadmap_score),
        "skills_score": clamp_percentage(skills_score),
        "projects_score": clamp_percentage(projects_score),
        "interview_score": clamp_percentage(interview_score),
        "certification_score": clamp_percentage(certification_score),
        "portfolio_score": clamp_percentage(portfolio_score),
        "score_breakdown": score_breakdown,
        "strengths": safe_list(strengths),
        "weaknesses": safe_list(weaknesses),
        "recommendations": safe_list(recommendations),
        "next_actions": safe_list(next_actions),
        "calculated_at": now,
        "created_at": now,
    }
