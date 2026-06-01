from math import ceil
from typing import Any

from fastapi import HTTPException, status

from app.db.mongodb import get_database
from app.utils.object_id import serialize_document, serialize_documents, to_object_id


def _regex_filter(value: str) -> dict[str, Any]:
    return {"$regex": value, "$options": "i"}


async def list_courses(
    search: str | None = None,
    difficulty: str | None = None,
    provider: str | None = None,
    course_type: str | None = None,
    skill: str | None = None,
    career_path_id: str | None = None,
    limit: int = 20,
    page: int = 1,
) -> dict[str, Any]:
    db = get_database()
    query: dict[str, Any] = {"is_active": True}
    if search:
        query["$or"] = [{"title": _regex_filter(search)}, {"description": _regex_filter(search)}, {"tags": _regex_filter(search)}]
    if difficulty:
        query["difficulty"] = difficulty
    if provider:
        query["provider"] = provider
    if course_type:
        query["course_type"] = course_type
    if skill:
        query["related_skills"] = _regex_filter(skill)
    if career_path_id:
        career = await db.career_paths.find_one({"_id": to_object_id(career_path_id, "career_path_id")})
        if career:
            query["related_careers"] = career["title"]

    safe_limit = max(1, min(limit, 100))
    safe_page = max(1, page)
    total = await db.courses.count_documents(query)
    courses = await db.courses.find(query).sort("title", 1).skip((safe_page - 1) * safe_limit).limit(safe_limit).to_list(length=safe_limit)
    return {"items": serialize_documents(courses), "total": total, "page": safe_page, "limit": safe_limit, "pages": ceil(total / safe_limit) if total else 0}


async def get_course_by_id(course_id: str) -> dict[str, Any]:
    db = get_database()
    course = await db.courses.find_one({"_id": to_object_id(course_id, "course_id"), "is_active": True})
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return serialize_document(course)


async def get_courses_by_career(career_path_id: str) -> list[dict[str, Any]]:
    db = get_database()
    career = await db.career_paths.find_one({"_id": to_object_id(career_path_id, "career_path_id"), "is_active": True})
    if not career:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Career path not found")
    courses = await db.courses.find({"is_active": True, "related_careers": career["title"]}).sort("title", 1).to_list(length=None)
    return serialize_documents(courses)


async def get_courses_by_skill(skill_name: str) -> list[dict[str, Any]]:
    db = get_database()
    courses = await db.courses.find({"is_active": True, "related_skills": _regex_filter(skill_name)}).sort("title", 1).to_list(length=None)
    return serialize_documents(courses)
