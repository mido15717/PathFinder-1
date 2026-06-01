from typing import Any

from bson import ObjectId

from app.models.base_model import safe_list, utc_now


def create_ml_prediction_document(
    user_id: ObjectId,
    assessment_id: ObjectId | None,
    selected_career_path_id: ObjectId | None,
    input_summary: dict[str, Any],
    rule_based_result: dict[str, Any],
    personality_model_result: dict[str, Any],
    skills_model_result: dict[str, Any],
    ensemble_result: dict[str, Any],
    final_recommended_career: str,
    final_confidence_score: int,
    top_3_careers: list[dict[str, Any]],
    explanation: str,
    strengths: list[str],
    missing_skills: list[str],
    recommended_improvements: list[str],
) -> dict[str, Any]:
    return {
        "user_id": user_id,
        "assessment_id": assessment_id,
        "selected_career_path_id": selected_career_path_id,
        "input_summary": input_summary,
        "rule_based_result": rule_based_result,
        "personality_model_result": personality_model_result,
        "skills_model_result": skills_model_result,
        "ensemble_result": ensemble_result,
        "final_recommended_career": final_recommended_career,
        "final_confidence_score": max(0, min(100, int(final_confidence_score or 0))),
        "top_3_careers": safe_list(top_3_careers),
        "explanation": explanation,
        "strengths": safe_list(strengths),
        "missing_skills": safe_list(missing_skills),
        "recommended_improvements": safe_list(recommended_improvements),
        "created_at": utc_now(),
    }
