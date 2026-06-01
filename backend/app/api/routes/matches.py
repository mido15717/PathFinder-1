from typing import Any

from fastapi import APIRouter, Depends

from app.schemas.match_schema import CareerMatchResponse, SelectCareerRequest, SelectedCareerResponse
from app.services.auth_service import get_current_user_data
from app.services.matching_service import get_latest_match_for_user, select_career_for_user

router = APIRouter(prefix="/matches", tags=["Matches"])


@router.get("/me", response_model=CareerMatchResponse)
async def read_latest_match(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await get_latest_match_for_user(current_user["_id"])


@router.post("/select-career", response_model=SelectedCareerResponse)
async def select_career(
    payload: SelectCareerRequest,
    current_user: dict[str, Any] = Depends(get_current_user_data),
) -> dict[str, Any]:
    return await select_career_for_user(current_user["_id"], payload.career_path_id)
