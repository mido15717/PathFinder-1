from typing import Any

from bson import ObjectId
from fastapi import HTTPException, status

from app.db.mongodb import get_database
from app.models.interview_model import CONFIDENCE_LEVELS, INTERVIEW_STATUSES, create_interview_progress_document
from app.models.base_model import utc_now
from app.utils.object_id import serialize_document, serialize_documents, to_object_id


async def _selected_career(user_id: ObjectId) -> tuple[ObjectId, dict[str, Any]]:
    db = get_database()
    profile = await db.user_profiles.find_one({"user_id": user_id})
    if not profile or not profile.get("selected_career_path_id"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please complete the Career Assessment and select a career path first.")
    career_path_id = to_object_id(profile["selected_career_path_id"], "career_path_id")
    career = await db.career_paths.find_one({"_id": career_path_id, "is_active": True})
    if not career:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Selected career path not found")
    return career_path_id, career


def _with_progress(question: dict[str, Any], progress: dict[str, Any] | None) -> dict[str, Any]:
    result = serialize_document(question)
    result["user_progress"] = serialize_document(progress) if progress else None
    return result


async def get_interview_questions(user_id: ObjectId | str, filters: dict[str, Any]) -> list[dict[str, Any]]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    career_path_id = to_object_id(filters["career_path_id"], "career_path_id") if filters.get("career_path_id") else (await _selected_career(user_object_id))[0]
    query: dict[str, Any] = {"career_path_id": career_path_id}
    if filters.get("type"):
        query["type"] = filters["type"]
    if filters.get("difficulty"):
        query["difficulty"] = filters["difficulty"]
    questions = await db.interview_questions.find(query).sort([("difficulty", 1), ("type", 1), ("question", 1)]).to_list(length=None)
    progress_docs = await db.user_interview_progress.find({"user_id": user_object_id, "question_id": {"$in": [question["_id"] for question in questions]}}).to_list(length=None)
    progress_map = {progress["question_id"]: progress for progress in progress_docs}
    return [_with_progress(question, progress_map.get(question["_id"])) for question in questions]


async def get_question_details(user_id: ObjectId | str, question_id: str) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    question = await db.interview_questions.find_one({"_id": to_object_id(question_id, "question_id")})
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview question not found")
    progress = await db.user_interview_progress.find_one({"user_id": user_object_id, "question_id": question["_id"]})
    return _with_progress(question, progress)


async def update_interview_progress(user_id: ObjectId | str, question_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    question = await db.interview_questions.find_one({"_id": to_object_id(question_id, "question_id")})
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview question not found")
    if payload.get("status") and payload["status"] not in INTERVIEW_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status must be not_started, practiced, or mastered")
    if payload.get("confidence_level") and payload["confidence_level"] not in CONFIDENCE_LEVELS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Confidence level must be low, medium, or high")

    existing = await db.user_interview_progress.find_one({"user_id": user_object_id, "question_id": question["_id"]})
    if existing:
        update_fields = {"updated_at": utc_now()}
        for field in ["status", "user_answer", "notes", "confidence_level"]:
            if payload.get(field) is not None:
                update_fields[field] = payload[field]
        next_status = update_fields.get("status", existing.get("status", "not_started"))
        if next_status in {"practiced", "mastered"}:
            update_fields["last_practiced_at"] = utc_now()
        elif next_status == "not_started":
            update_fields["last_practiced_at"] = None
        await db.user_interview_progress.update_one({"_id": existing["_id"]}, {"$set": update_fields})
        updated = await db.user_interview_progress.find_one({"_id": existing["_id"]})
    else:
        result = await db.user_interview_progress.insert_one(create_interview_progress_document(user_object_id, question, payload))
        updated = await db.user_interview_progress.find_one({"_id": result.inserted_id})
    return serialize_document(updated)


async def get_interview_progress_summary(user_id: ObjectId | str) -> dict[str, int]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    career_path_id, _ = await _selected_career(user_object_id)
    total_questions = await db.interview_questions.count_documents({"career_path_id": career_path_id})
    progress_docs = await db.user_interview_progress.find({"user_id": user_object_id, "career_path_id": career_path_id}).to_list(length=None)
    practiced = sum(1 for item in progress_docs if item.get("status") == "practiced")
    mastered = sum(1 for item in progress_docs if item.get("status") == "mastered")
    not_started = max(total_questions - practiced - mastered, 0)
    readiness = round(((mastered + practiced * 0.5) / total_questions) * 100) if total_questions else 0
    return {
        "total_questions": total_questions,
        "practiced_count": practiced,
        "mastered_count": mastered,
        "not_started_count": not_started,
        "interview_readiness_percentage": readiness,
    }


async def get_interview_readiness_context(user_id: ObjectId | str) -> dict[str, Any]:
    return await get_interview_progress_summary(user_id)


async def get_all_user_interview_progress(user_id: ObjectId | str) -> list[dict[str, Any]]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    documents = await db.user_interview_progress.find({"user_id": user_object_id}).sort("updated_at", -1).to_list(length=None)
    return serialize_documents(documents)
