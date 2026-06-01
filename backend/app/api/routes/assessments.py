from typing import Any

from fastapi import APIRouter, Depends

from app.schemas.assessment_schema import AssessmentResponse, AssessmentSubmitRequest, AssessmentSubmitResponse
from app.services.assessment_service import get_assessment_history, get_latest_assessment, submit_assessment
from app.services.auth_service import get_current_user_data

router = APIRouter(prefix="/assessments", tags=["Assessments"])


@router.post("/submit", response_model=AssessmentSubmitResponse, status_code=201)
async def submit_career_assessment(
    payload: AssessmentSubmitRequest,
    current_user: dict[str, Any] = Depends(get_current_user_data),
) -> dict[str, Any]:
    return await submit_assessment(current_user["_id"], payload.model_dump())


@router.get("/me", response_model=AssessmentResponse)
async def read_latest_assessment(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await get_latest_assessment(current_user["_id"])


@router.get("/history", response_model=list[AssessmentResponse])
async def read_assessment_history(current_user: dict[str, Any] = Depends(get_current_user_data)) -> list[dict[str, Any]]:
    return await get_assessment_history(current_user["_id"])
