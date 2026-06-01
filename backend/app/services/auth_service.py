from typing import Any

from fastapi import Depends, HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.core.security import create_access_token, get_current_user_id, hash_password, verify_password
from app.db.mongodb import get_database
from app.models.user_model import create_user_document, utc_now
from app.services.profile_service import create_default_profile
from app.services.user_service import get_user_by_id
from app.utils.object_id import serialize_document


async def register_user(payload: dict[str, Any]) -> dict[str, Any]:
    db = get_database()
    email = payload["email"].lower()
    user_document = create_user_document(payload["full_name"].strip(), email, hash_password(payload["password"]))
    try:
        result = await db.users.insert_one(user_document)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered") from exc

    user = await db.users.find_one({"_id": result.inserted_id})
    await create_default_profile(result.inserted_id)
    access_token = create_access_token(str(result.inserted_id))
    return {"access_token": access_token, "token_type": "bearer", "user": serialize_document(user)}


async def login_user(payload: dict[str, Any]) -> dict[str, Any]:
    db = get_database()
    user = await db.users.find_one({"email": payload["email"].lower()})
    if not user or not verify_password(payload["password"], user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is disabled")

    now = utc_now()
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"last_login": now, "updated_at": now}})
    user["last_login"] = now
    user["updated_at"] = now
    access_token = create_access_token(str(user["_id"]))
    return {"access_token": access_token, "token_type": "bearer", "user": serialize_document(user)}


async def get_current_user_data(user_id: str = Depends(get_current_user_id)) -> dict[str, Any]:
    return await get_user_by_id(user_id)
