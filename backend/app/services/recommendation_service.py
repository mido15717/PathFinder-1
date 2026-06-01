from typing import Any

from bson import ObjectId
from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.db.mongodb import get_database
from app.models.recommendation_model import create_recommendation_document, create_saved_course_document
from app.services.rag_service import generate_course_recommendations
from app.utils.object_id import serialize_document, serialize_documents, serialize_value, to_object_id


def _normalize(value: Any) -> str:
    return " ".join(str(value or "").lower().replace("/", " ").replace("-", " ").split())


def _ml_missing_skills(prediction: dict[str, Any] | None) -> list[str]:
    if not prediction:
        return []
    values = prediction.get("skills_model_result", {}).get("missing_skills") or prediction.get("missing_skills", [])
    result: list[str] = []
    seen: set[str] = set()
    for skill in values:
        key = _normalize(skill)
        if key and key not in seen:
            result.append(str(skill))
            seen.add(key)
    return result


def _prioritize_ml_skill_gap_courses(recommended_courses: list[dict[str, Any]], ml_skills: list[str], completed_course_ids: set[str]) -> list[dict[str, Any]]:
    if not ml_skills:
        return [course for course in recommended_courses if str(course.get("course_id")) not in completed_course_ids]

    ml_terms = {_normalize(skill) for skill in ml_skills}
    prioritized: list[dict[str, Any]] = []
    for course in recommended_courses:
        if str(course.get("course_id")) in completed_course_ids:
            continue
        related_terms = {_normalize(skill) for skill in course.get("related_skills", [])}
        covered = [skill for skill in ml_skills if _normalize(skill) in related_terms]
        if covered:
            course["priority_level"] = "high"
            course["relevance_score"] = min(100, int(course.get("relevance_score", 0)) + 8)
            course["missing_skills_covered"] = list(dict.fromkeys([*course.get("missing_skills_covered", []), *covered]))
            course["recommendation_reason"] = (
                "Prioritized because the ML skills model identified this skill gap. "
                + course.get("recommendation_reason", "")
            ).strip()
        elif related_terms and not related_terms.intersection(ml_terms):
            course["relevance_score"] = max(0, int(course.get("relevance_score", 0)) - 2)
        prioritized.append(course)

    priority_rank = {"high": 3, "medium": 2, "low": 1}
    return sorted(prioritized, key=lambda item: (priority_rank.get(item.get("priority_level", "low"), 1), item.get("relevance_score", 0)), reverse=True)


async def generate_recommendations_for_user(user_id: ObjectId | str, payload: dict[str, Any]) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    profile = await db.user_profiles.find_one({"user_id": user_object_id})
    if not profile or not profile.get("selected_career_path_id"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please complete the Career Assessment and select a career path first.")

    career_object_id = to_object_id(profile["selected_career_path_id"], "career_path_id")
    selected_career = await db.career_paths.find_one({"_id": career_object_id, "is_active": True})
    if not selected_career:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Selected career path not found")

    latest_assessment = await db.career_assessments.find_one({"user_id": user_object_id}, sort=[("created_at", -1)])
    latest_ml_prediction = await db.ml_career_predictions.find_one({"user_id": user_object_id}, sort=[("created_at", -1)])
    completed_progress = await db.user_course_progress.find({"user_id": user_object_id, "status": "completed"}).to_list(length=None)
    completed_course_ids = {str(item.get("course_id")) for item in completed_progress}
    ml_skills = _ml_missing_skills(latest_ml_prediction)
    courses = await db.courses.find({"is_active": True}).to_list(length=None)
    if not courses:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active courses found. Run seed_courses.py first.")

    filters = (payload.get("filters") or {}) if payload else {}
    query = payload.get("query") if payload else None
    if ml_skills:
        suffix = f"Focus on ML skills model gaps: {', '.join(ml_skills[:5])}."
        query = f"{query}. {suffix}" if query else suffix
    recommendation_result = generate_course_recommendations(
        user_profile=profile,
        selected_career=selected_career,
        latest_assessment=latest_assessment,
        courses=courses,
        query=query,
        filters=filters,
    )
    recommendation_result["recommended_courses"] = _prioritize_ml_skill_gap_courses(
        recommendation_result["recommended_courses"],
        ml_skills,
        completed_course_ids,
    )
    if ml_skills:
        recommendation_result["explanation_summary"] = (
            f"{recommendation_result['explanation_summary']} ML skill gaps were used to prioritize courses: {', '.join(ml_skills[:5])}."
        )
    document = create_recommendation_document(
        user_id=user_object_id,
        career_path_id=career_object_id,
        assessment_id=latest_assessment["_id"] if latest_assessment else None,
        selected_career_title=selected_career["title"],
        query=recommendation_result["query_used"],
        recommended_courses=recommendation_result["recommended_courses"],
        filters_used=filters,
    )
    result = await db.course_recommendations.insert_one(document)
    return {
        "recommendation_id": str(result.inserted_id),
        "selected_career": selected_career["title"],
        "query_used": recommendation_result["query_used"],
        "recommended_courses": serialize_value(recommendation_result["recommended_courses"]),
        "explanation_summary": recommendation_result["explanation_summary"],
    }


async def get_latest_recommendation(user_id: ObjectId | str) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    recommendation = await db.course_recommendations.find_one({"user_id": user_object_id}, sort=[("created_at", -1)])
    if not recommendation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No recommendation result found")
    return serialize_document(recommendation)


async def get_recommendation_history(user_id: ObjectId | str) -> list[dict[str, Any]]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    recommendations = await db.course_recommendations.find({"user_id": user_object_id}).sort("created_at", -1).to_list(length=None)
    return serialize_documents(recommendations)


async def save_course_for_user(user_id: ObjectId | str, course_id: str) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    course_object_id = to_object_id(course_id, "course_id")
    course = await db.courses.find_one({"_id": course_object_id, "is_active": True})
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    profile = await db.user_profiles.find_one({"user_id": user_object_id})
    career_path_id = to_object_id(profile["selected_career_path_id"], "career_path_id") if profile and profile.get("selected_career_path_id") else None
    document = create_saved_course_document(user_object_id, course, career_path_id)
    try:
        result = await db.saved_courses.insert_one(document)
        document["_id"] = result.inserted_id
    except DuplicateKeyError:
        existing = await db.saved_courses.find_one({"user_id": user_object_id, "course_id": course_object_id})
        return serialize_document(existing)
    return serialize_document(document)


async def get_saved_courses(user_id: ObjectId | str) -> list[dict[str, Any]]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    saved = await db.saved_courses.find({"user_id": user_object_id}).sort("saved_at", -1).to_list(length=None)
    return serialize_documents(saved)


async def remove_saved_course(user_id: ObjectId | str, course_id: str) -> dict[str, str]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    course_object_id = to_object_id(course_id, "course_id")
    result = await db.saved_courses.delete_one({"user_id": user_object_id, "course_id": course_object_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved course not found")
    return {"message": "Saved course removed"}
