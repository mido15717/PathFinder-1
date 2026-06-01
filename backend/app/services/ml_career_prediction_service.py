from __future__ import annotations

from typing import Any

from bson import ObjectId
from fastapi import HTTPException, status

from app.db.mongodb import get_database
from app.ml.services.ensemble_career_service import build_ensemble_prediction
from app.ml.services.personality_model_service import run_personality_model
from app.ml.services.skills_model_service import run_skills_model
from app.ml.utils.preprocessing import build_ratings_from_context, input_summary
from app.models.ml_prediction_model import create_ml_prediction_document
from app.services.matching_service import calculate_top_matches
from app.utils.object_id import serialize_document, serialize_documents, serialize_value, to_object_id


def _latest_selected_career_id(profile: dict[str, Any] | None, match: dict[str, Any] | None) -> ObjectId | None:
    value = (profile or {}).get("selected_career_path_id") or (match or {}).get("selected_career_id") or (match or {}).get("best_match_career_id")
    if isinstance(value, ObjectId):
        return value
    if value and ObjectId.is_valid(str(value)):
        return ObjectId(str(value))
    return None


async def _load_assessment(db: Any, user_id: ObjectId, assessment_id: str | None = None) -> dict[str, Any]:
    query: dict[str, Any] = {"user_id": user_id}
    if assessment_id:
        query["_id"] = to_object_id(assessment_id, "assessment_id")
        assessment = await db.career_assessments.find_one(query)
    else:
        assessment = await db.career_assessments.find_one(query, sort=[("created_at", -1)])
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No assessment found for ML prediction")
    return assessment


async def _load_rule_based_matches(db: Any, user_id: ObjectId, assessment: dict[str, Any]) -> tuple[dict[str, Any] | None, list[dict[str, Any]]]:
    match = await db.career_matches.find_one({"user_id": user_id, "assessment_id": assessment["_id"]}, sort=[("created_at", -1)])
    if not match:
        match = await db.career_matches.find_one({"user_id": user_id}, sort=[("created_at", -1)])
    if match and match.get("matches"):
        return match, serialize_value(match["matches"])

    career_paths = await db.career_paths.find({"is_active": True}).to_list(length=None)
    if not career_paths:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active career paths found. Run seed_data.py first.")
    return match, serialize_value(calculate_top_matches(assessment, career_paths))


async def run_prediction_for_user(user_id: ObjectId | str, assessment_id: str | None = None) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    assessment = await _load_assessment(db, user_object_id, assessment_id)
    profile = await db.user_profiles.find_one({"user_id": user_object_id}) or {}
    skill_progress = await db.user_skill_progress.find({"user_id": user_object_id}).to_list(length=None)
    completed_courses = await db.user_course_progress.find({"user_id": user_object_id, "status": "completed"}).to_list(length=None)
    match, rule_matches = await _load_rule_based_matches(db, user_object_id, assessment)

    personality_result = run_personality_model(assessment, profile, skill_progress, completed_courses)
    skills_result = run_skills_model(assessment, profile, skill_progress, completed_courses)
    ensemble = build_ensemble_prediction(rule_matches, personality_result, skills_result)
    ratings = build_ratings_from_context(assessment, profile, skill_progress, completed_courses)

    rule_based_result = {
        "model_type": "rule_based_matching",
        "available": bool(rule_matches),
        "matches": rule_matches,
        "best_match": rule_matches[0] if rule_matches else None,
    }
    document = create_ml_prediction_document(
        user_id=user_object_id,
        assessment_id=assessment["_id"],
        selected_career_path_id=_latest_selected_career_id(profile, match),
        input_summary=input_summary(assessment, profile, ratings),
        rule_based_result=rule_based_result,
        personality_model_result=personality_result,
        skills_model_result=skills_result,
        ensemble_result=ensemble["ensemble_result"],
        final_recommended_career=ensemble["final_recommended_career"],
        final_confidence_score=ensemble["final_confidence_score"],
        top_3_careers=ensemble["top_3_careers"],
        explanation=ensemble["explanation"],
        strengths=ensemble["strengths"],
        missing_skills=ensemble["missing_skills"],
        recommended_improvements=ensemble["recommended_improvements"],
    )
    result = await db.ml_career_predictions.insert_one(document)
    document["_id"] = result.inserted_id
    return serialize_document(document)


async def get_predictions_for_user(user_id: ObjectId | str) -> list[dict[str, Any]]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    predictions = await db.ml_career_predictions.find({"user_id": user_object_id}).sort("created_at", -1).to_list(length=None)
    return serialize_documents(predictions)


async def get_latest_prediction_for_user(user_id: ObjectId | str) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    prediction = await db.ml_career_predictions.find_one({"user_id": user_object_id}, sort=[("created_at", -1)])
    if not prediction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No ML career prediction found")
    return serialize_document(prediction)
