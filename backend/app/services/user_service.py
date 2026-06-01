from typing import Any

from bson import ObjectId
from fastapi import HTTPException, status

from app.db.mongodb import get_database
from app.models.user_model import utc_now
from app.utils.object_id import serialize_document, to_object_id


async def get_user_by_id(user_id: str | ObjectId) -> dict[str, Any]:
    db = get_database()
    object_id = to_object_id(user_id, "user_id")
    user = await db.users.find_one({"_id": object_id})
    if not user or not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return serialize_document(user)


async def update_user(user_id: str | ObjectId, payload: dict[str, Any]) -> dict[str, Any]:
    db = get_database()
    object_id = to_object_id(user_id, "user_id")
    clean_payload = {key: value for key, value in payload.items() if value is not None}
    if not clean_payload:
        return await get_user_by_id(object_id)
    clean_payload["updated_at"] = utc_now()
    await db.users.update_one({"_id": object_id}, {"$set": clean_payload})
    return await get_user_by_id(object_id)

