from typing import Any

from fastapi import APIRouter, Depends

from app.schemas.profile_schema import ProfileResponse, ProfileUpdate
from app.services.auth_service import get_current_user_data
from app.services.profile_service import get_profile_by_user_id, update_profile

router = APIRouter(prefix="/profiles", tags=["Profiles"])


@router.get("/me", response_model=ProfileResponse)
async def read_current_profile(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await get_profile_by_user_id(current_user["_id"])


@router.put("/me", response_model=ProfileResponse)
async def update_current_profile(
    payload: ProfileUpdate,
    current_user: dict[str, Any] = Depends(get_current_user_data),
) -> dict[str, Any]:
    return await update_profile(current_user["_id"], payload.model_dump(exclude_unset=True))

