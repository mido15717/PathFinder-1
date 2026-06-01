from typing import Any

from fastapi import APIRouter, Depends

from app.schemas.resume_schema import ResumeFeedbackResponse, ResumePayload, ResumeResponse
from app.services.auth_service import get_current_user_data
from app.services.resume_service import create_resume, generate_resume_feedback, generate_resume_from_profile, get_user_resume, update_resume

router = APIRouter(prefix="/resumes", tags=["Resume Builder"])


@router.get("/me", response_model=ResumeResponse)
async def read_my_resume(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await get_user_resume(current_user["_id"])


@router.post("", response_model=ResumeResponse, status_code=201)
async def create_my_resume(payload: ResumePayload, current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await create_resume(current_user["_id"], payload.model_dump())


@router.put("/me", response_model=ResumeResponse)
async def update_my_resume(payload: ResumePayload, current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await update_resume(current_user["_id"], payload.model_dump())


@router.post("/generate-from-profile", response_model=ResumeResponse, status_code=201)
async def generate_my_resume(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await generate_resume_from_profile(current_user["_id"])


@router.post("/feedback", response_model=ResumeFeedbackResponse, status_code=201)
async def create_resume_feedback(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await generate_resume_feedback(current_user["_id"])
