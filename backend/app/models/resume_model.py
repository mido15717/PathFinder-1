from typing import Any

from bson import ObjectId

from app.models.base_model import base_timestamps, clamp_percentage, safe_list, safe_string, utc_now


def create_resume_document(user_id: ObjectId, payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "user_id": user_id,
        "full_name": safe_string(payload.get("full_name", "")),
        "email": safe_string(payload.get("email", "")),
        "phone": safe_string(payload.get("phone", "")),
        "location": safe_string(payload.get("location", "")),
        "linkedin": safe_string(payload.get("linkedin", "")),
        "github": safe_string(payload.get("github", "")),
        "portfolio": safe_string(payload.get("portfolio", "")),
        "summary": safe_string(payload.get("summary", "")),
        "education": safe_list(payload.get("education")),
        "skills": safe_list(payload.get("skills")),
        "projects": safe_list(payload.get("projects")),
        "certifications": safe_list(payload.get("certifications")),
        "experience": safe_list(payload.get("experience")),
        "languages": safe_list(payload.get("languages")),
        **base_timestamps(),
    }


def create_resume_feedback_document(
    user_id: ObjectId,
    resume_id: ObjectId,
    score_percentage: int,
    strengths: list[str],
    weaknesses: list[str],
    suggestions: list[str],
    missing_sections: list[str],
) -> dict[str, Any]:
    return {
        "user_id": user_id,
        "resume_id": resume_id,
        "score_percentage": clamp_percentage(score_percentage),
        "strengths": strengths,
        "weaknesses": weaknesses,
        "suggestions": suggestions,
        "missing_sections": missing_sections,
        "generated_at": utc_now(),
        "created_at": utc_now(),
    }
