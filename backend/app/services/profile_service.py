from typing import Any

from bson import ObjectId
from fastapi import HTTPException, status

from app.db.mongodb import get_database
from app.models.profile_model import create_profile_document
from app.models.base_model import utc_now
from app.utils.object_id import serialize_document, to_object_id


async def create_default_profile(user_id: ObjectId | str) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    existing = await db.user_profiles.find_one({"user_id": user_object_id})
    if existing:
        return serialize_document(existing)

    result = await db.user_profiles.insert_one(create_profile_document(user_object_id))
    profile = await db.user_profiles.find_one({"_id": result.inserted_id})
    return serialize_document(profile)


async def get_profile_by_user_id(user_id: ObjectId | str) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    profile = await db.user_profiles.find_one({"user_id": user_object_id})
    if not profile:
        return await create_default_profile(user_object_id)
    return serialize_document(profile)


async def update_profile(user_id: ObjectId | str, payload: dict[str, Any]) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    clean_payload = {key: str(value) if hasattr(value, "__str__") and key.endswith("_url") else value for key, value in payload.items() if value is not None}
    clean_payload["updated_at"] = utc_now()
    await db.user_profiles.update_one({"user_id": user_object_id}, {"$set": clean_payload}, upsert=True)
    profile = await db.user_profiles.find_one({"user_id": user_object_id})
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return serialize_document(profile)
