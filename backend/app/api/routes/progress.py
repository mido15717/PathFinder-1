from typing import Any

from fastapi import APIRouter, Depends

from app.schemas.progress_schema import CourseProgressUpdate, RoadmapPhaseProgressUpdate
from app.schemas.roadmap_schema import StudyPlanGenerateRequest, StudyPlanTaskUpdate
from app.services.auth_service import get_current_user
from app.services.progress_service import get_course_progress, get_progress_logs, get_progress_summary
from app.services.progress_service import get_roadmap_progress, recalculate_progress, update_course_progress
from app.services.progress_service import update_phase_progress
from app.services.roadmap_service import generate_study_plan, get_my_study_plans, update_study_plan_task

router = APIRouter(prefix="/progress", tags=["Progress"])
study_plans_router = APIRouter(prefix="/study-plans", tags=["Study Planner"])


@router.get("/summary", response_model=dict[str, Any])
async def progress_summary(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    return await get_progress_summary(current_user)


@router.get("/courses", response_model=dict[str, Any])
async def progress_courses(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    return await get_course_progress(current_user)


@router.patch("/courses/{course_id}", response_model=dict[str, Any])
async def patch_course_progress(
    course_id: str,
    payload: CourseProgressUpdate,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    return await update_course_progress(current_user, course_id, payload.model_dump(exclude_unset=True, mode="json"))


@router.get("/roadmap", response_model=dict[str, Any])
async def progress_roadmap(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    return await get_roadmap_progress(current_user)


@router.patch("/roadmap/phase/{phase_id}", response_model=dict[str, Any])
async def patch_roadmap_phase_progress(
    phase_id: str,
    payload: RoadmapPhaseProgressUpdate,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    return await update_phase_progress(current_user, phase_id, payload.model_dump(exclude_unset=True, mode="json"))


@router.get("/logs", response_model=list[dict[str, Any]])
async def progress_logs(current_user: dict[str, Any] = Depends(get_current_user)) -> list[dict[str, Any]]:
    return await get_progress_logs(current_user)


@router.post("/recalculate", response_model=dict[str, Any])
async def recalculate(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    return await recalculate_progress(current_user)


@study_plans_router.post("/generate", response_model=dict[str, Any], status_code=201)
async def create_study_plan(
    payload: StudyPlanGenerateRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    return await generate_study_plan(current_user, payload.model_dump(exclude_unset=True, mode="json"))


@study_plans_router.get("/me", response_model=list[dict[str, Any]])
async def my_study_plans(current_user: dict[str, Any] = Depends(get_current_user)) -> list[dict[str, Any]]:
    return await get_my_study_plans(current_user)


@study_plans_router.patch("/task", response_model=dict[str, Any])
async def patch_study_plan_task(
    payload: StudyPlanTaskUpdate,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    return await update_study_plan_task(current_user, payload.model_dump(exclude_unset=True, mode="json"))
