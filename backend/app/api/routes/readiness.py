from typing import Any

from fastapi import APIRouter, Depends

from app.schemas.readiness_schema import ReadinessScoreResponse
from app.services.auth_service import get_current_user_data
from app.services.readiness_service import calculate_readiness_score, get_latest_readiness_score, get_readiness_history

router = APIRouter(prefix="/readiness", tags=["Career Readiness"])


@router.post("/calculate", response_model=ReadinessScoreResponse, status_code=201)
async def calculate_my_readiness(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await calculate_readiness_score(current_user["_id"])


@router.get("/me", response_model=ReadinessScoreResponse)
async def read_my_readiness(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await get_latest_readiness_score(current_user["_id"])


@router.get("/history", response_model=list[ReadinessScoreResponse])
async def read_readiness_history(current_user: dict[str, Any] = Depends(get_current_user_data)) -> list[dict[str, Any]]:
    return await get_readiness_history(current_user["_id"])
