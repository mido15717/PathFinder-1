from typing import Any

from fastapi import APIRouter, Depends

from app.schemas.skill_gap_schema import MissingSkillsResponse, SkillGapAnalysisResponse
from app.services.auth_service import get_current_user_data
from app.services.skill_gap_service import analyze_skill_gap, get_latest_skill_gap, get_missing_skills, get_skill_gap_history

router = APIRouter(prefix="/skill-gap", tags=["Skill Gap Analysis"])


@router.post("/analyze", response_model=SkillGapAnalysisResponse, status_code=201)
async def analyze_my_skill_gap(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await analyze_skill_gap(current_user["_id"])


@router.get("/me", response_model=SkillGapAnalysisResponse)
async def read_my_skill_gap(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await get_latest_skill_gap(current_user["_id"])


@router.get("/history", response_model=list[SkillGapAnalysisResponse])
async def read_skill_gap_history(current_user: dict[str, Any] = Depends(get_current_user_data)) -> list[dict[str, Any]]:
    return await get_skill_gap_history(current_user["_id"])


@router.get("/missing-skills", response_model=MissingSkillsResponse)
async def read_missing_skills(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await get_missing_skills(current_user["_id"])
