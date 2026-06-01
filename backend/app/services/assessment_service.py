from typing import Any

from bson import ObjectId
from fastapi import HTTPException, status

from app.db.mongodb import get_database
from app.models.assessment_model import create_assessment_document
from app.models.match_model import create_match_document
from app.models.user_model import utc_now
from app.services.matching_service import calculate_top_matches
from app.utils.object_id import serialize_document, serialize_documents, serialize_value, to_object_id


async def submit_assessment(user_id: ObjectId | str, payload: dict[str, Any]) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    career_paths = await db.career_paths.find({"is_active": True}).to_list(length=None)
    if not career_paths:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active career paths found. Run seed_data.py first.")

    assessment_document = create_assessment_document(user_object_id, payload)
    assessment_result = await db.career_assessments.insert_one(assessment_document)
    assessment_document["_id"] = assessment_result.inserted_id

    matches = calculate_top_matches(assessment_document, career_paths)
    match_document = create_match_document(user_object_id, assessment_result.inserted_id, matches)
    match_result = await db.career_matches.insert_one(match_document)

    await db.user_profiles.update_one(
        {"user_id": user_object_id},
        {
            "$set": {
                "career_goal": payload["career_goal"],
                "current_skills": payload.get("current_skills", []),
                "weekly_available_hours": payload["weekly_available_hours"],
                "preferred_learning_style": payload["learning_style"],
                "updated_at": utc_now(),
            }
        },
        upsert=False,
    )

    return {
        "assessment_id": str(assessment_result.inserted_id),
        "match_id": str(match_result.inserted_id),
        "matches": serialize_value(matches),
    }


async def get_latest_assessment(user_id: ObjectId | str) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    assessment = await db.career_assessments.find_one({"user_id": user_object_id}, sort=[("created_at", -1)])
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No assessment found")
    return serialize_document(assessment)


async def get_assessment_history(user_id: ObjectId | str) -> list[dict[str, Any]]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    assessments = await db.career_assessments.find({"user_id": user_object_id}).sort("created_at", -1).to_list(length=None)
    return serialize_documents(assessments)
