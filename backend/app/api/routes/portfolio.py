from typing import Any

from fastapi import APIRouter, Depends

from app.schemas.portfolio_schema import PortfolioChecklistUpdate, PortfolioReadinessResponse
from app.services.auth_service import get_current_user_data
from app.services.portfolio_service import calculate_portfolio_readiness, get_latest_portfolio_readiness, update_portfolio_checklist

router = APIRouter(prefix="/portfolio", tags=["Portfolio Readiness"])


@router.get("/readiness", response_model=PortfolioReadinessResponse)
async def read_portfolio_readiness(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await get_latest_portfolio_readiness(current_user["_id"])


@router.post("/readiness/calculate", response_model=PortfolioReadinessResponse)
async def calculate_my_portfolio_readiness(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await calculate_portfolio_readiness(current_user["_id"])


@router.patch("/checklist", response_model=PortfolioReadinessResponse)
async def patch_portfolio_checklist(payload: PortfolioChecklistUpdate, current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await update_portfolio_checklist(current_user["_id"], payload.model_dump(exclude_none=True))
