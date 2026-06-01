from typing import Any

from fastapi import APIRouter, Depends, Query

from app.schemas.interview_schema import InterviewProgressResponse, InterviewProgressSummary, InterviewProgressUpdate, InterviewQuestionResponse
from app.services.auth_service import get_current_user_data
from app.services.interview_service import get_interview_progress_summary, get_interview_questions, get_question_details, update_interview_progress

router = APIRouter(prefix="/interviews", tags=["Interview Preparation"])


@router.get("/questions", response_model=list[InterviewQuestionResponse])
async def read_interview_questions(
    career_path_id: str | None = Query(default=None),
    type: str | None = Query(default=None),
    difficulty: str | None = Query(default=None),
    current_user: dict[str, Any] = Depends(get_current_user_data),
) -> list[dict[str, Any]]:
    return await get_interview_questions(current_user["_id"], {"career_path_id": career_path_id, "type": type, "difficulty": difficulty})


@router.get("/questions/{question_id}", response_model=InterviewQuestionResponse)
async def read_interview_question(question_id: str, current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await get_question_details(current_user["_id"], question_id)


@router.patch("/progress/{question_id}", response_model=InterviewProgressResponse)
async def patch_interview_progress(
    question_id: str,
    payload: InterviewProgressUpdate,
    current_user: dict[str, Any] = Depends(get_current_user_data),
) -> dict[str, Any]:
    return await update_interview_progress(current_user["_id"], question_id, payload.model_dump(exclude_none=True))


@router.get("/progress/me", response_model=InterviewProgressSummary)
async def read_my_interview_progress(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, int]:
    return await get_interview_progress_summary(current_user["_id"])
