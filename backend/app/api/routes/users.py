from typing import Any

from fastapi import APIRouter, Depends

from app.schemas.user_schema import UserResponse, UserUpdate
from app.services.auth_service import get_current_user_data
from app.services.user_service import update_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def read_current_user(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    payload: UserUpdate,
    current_user: dict[str, Any] = Depends(get_current_user_data),
) -> dict[str, Any]:
    return await update_user(current_user["_id"], payload.model_dump(exclude_unset=True))

