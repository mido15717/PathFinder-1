from typing import Any

from fastapi import APIRouter, Depends

from app.schemas.learning_path_schema import GenerateLearningPathResponse, LearningPathResponse, LearningPathUpdateResponse, NextBestCourse
from app.services.auth_service import get_current_user_data
from app.services.learning_path_service import (
    complete_course,
    complete_phase,
    generate_adaptive_learning_path,
    get_active_learning_path,
    get_learning_path_by_id,
    get_learning_path_updates,
    get_next_best_course,
    recalculate_learning_path,
    start_course,
)

router = APIRouter(prefix="/learning-paths", tags=["Learning Paths"])


@router.post("/generate", response_model=GenerateLearningPathResponse, status_code=201)
async def generate_learning_path(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await generate_adaptive_learning_path(current_user["_id"])


@router.get("/me", response_model=LearningPathResponse)
async def read_my_learning_path(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await get_active_learning_path(current_user["_id"])


@router.get("/next-course", response_model=NextBestCourse)
async def read_next_best_course(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await get_next_best_course(current_user["_id"])


@router.post("/recalculate", response_model=GenerateLearningPathResponse)
async def recalculate_path(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await recalculate_learning_path(current_user["_id"])


@router.get("/updates", response_model=list[LearningPathUpdateResponse])
async def read_learning_path_updates(current_user: dict[str, Any] = Depends(get_current_user_data)) -> list[dict[str, Any]]:
    return await get_learning_path_updates(current_user["_id"])


@router.get("/{learning_path_id}", response_model=LearningPathResponse)
async def read_learning_path(learning_path_id: str, current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await get_learning_path_by_id(current_user["_id"], learning_path_id)


@router.patch("/course/{course_id}/start", response_model=LearningPathResponse)
async def start_learning_path_course(course_id: str, current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await start_course(current_user["_id"], course_id)


@router.patch("/course/{course_id}/complete", response_model=LearningPathResponse)
async def complete_learning_path_course(course_id: str, current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await complete_course(current_user["_id"], course_id)


@router.patch("/phase/{phase_id}/complete", response_model=LearningPathResponse)
async def complete_learning_path_phase(phase_id: str, current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await complete_phase(current_user["_id"], phase_id)
