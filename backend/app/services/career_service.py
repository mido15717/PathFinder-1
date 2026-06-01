from typing import Any

from fastapi import HTTPException, status

from app.db.mongodb import get_database
from app.utils.object_id import serialize_document, serialize_documents, to_object_id


async def list_active_careers() -> list[dict[str, Any]]:
    db = get_database()
    careers = await db.career_paths.find({"is_active": True}).sort("title", 1).to_list(length=None)
    return serialize_documents(careers)


async def get_career_by_id(career_id: str) -> dict[str, Any]:
    db = get_database()
    career = await db.career_paths.find_one({"_id": to_object_id(career_id, "career_id"), "is_active": True})
    if not career:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Career path not found")
    return serialize_document(career)


async def get_career_by_slug(slug: str) -> dict[str, Any]:
    db = get_database()
    career = await db.career_paths.find_one({"slug": slug, "is_active": True})
    if not career:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Career path not found")
    return serialize_document(career)
