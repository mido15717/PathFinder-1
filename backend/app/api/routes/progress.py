from typing import Any

from fastapi import APIRouter, Depends, Query

from app.schemas.progress_schema import (
    CourseProgressResponse,
    CourseProgressUpdate,
    GroupedCourseProgressResponse,
    GroupedSkillProgressResponse,
    LearningPathProgressResponse,
    ProgressLogResponse,
    ProgressSummaryResponse,
    SkillProgressResponse,
    SkillProgressUpdate,
)
from app.schemas.study_activity_schema import StudyActivityRequest, StudyActivityResponse, StreakResponse, WeeklyActivityResponse
from app.services.auth_service import get_current_user_data
from app.services.progress_monitoring_service import (
    add_study_activity,
    calculate_learning_streak,
    get_learning_path_progress,
    get_progress_summary,
    get_recent_progress_logs,
    get_user_course_progress,
    get_user_skill_progress,
    get_weekly_study_activity,
    recalculate_all_progress,
    update_course_progress,
    update_skill_progress,
)

router = APIRouter(prefix="/progress", tags=["Progress Monitoring"])


@router.get("/summary", response_model=ProgressSummaryResponse)
async def read_progress_summary(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await get_progress_summary(current_user["_id"])


@router.get("/courses", response_model=GroupedCourseProgressResponse)
async def read_course_progress(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await get_user_course_progress(current_user["_id"])


@router.patch("/courses/{course_id}", response_model=CourseProgressResponse)
async def patch_course_progress(
    course_id: str,
    payload: CourseProgressUpdate,
    current_user: dict[str, Any] = Depends(get_current_user_data),
) -> dict[str, Any]:
    return await update_course_progress(current_user["_id"], course_id, payload.model_dump(exclude_none=True))


@router.get("/skills", response_model=GroupedSkillProgressResponse)
async def read_skill_progress(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await get_user_skill_progress(current_user["_id"])


@router.patch("/skills/{skill_name:path}", response_model=SkillProgressResponse)
async def patch_skill_progress(
    skill_name: str,
    payload: SkillProgressUpdate,
    current_user: dict[str, Any] = Depends(get_current_user_data),
) -> dict[str, Any]:
    return await update_skill_progress(current_user["_id"], skill_name, payload.model_dump(exclude_none=True))


@router.get("/learning-path", response_model=LearningPathProgressResponse)
async def read_learning_path_progress(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await get_learning_path_progress(current_user["_id"])


@router.post("/recalculate", response_model=ProgressSummaryResponse)
async def recalculate_progress(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await recalculate_all_progress(current_user["_id"])


@router.post("/activity", response_model=StudyActivityResponse, status_code=201)
async def create_study_activity(payload: StudyActivityRequest, current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await add_study_activity(current_user["_id"], payload.model_dump(exclude_none=True))


@router.get("/activity/weekly", response_model=WeeklyActivityResponse)
async def read_weekly_activity(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await get_weekly_study_activity(current_user["_id"])


@router.get("/activity/streak", response_model=StreakResponse)
async def read_learning_streak(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await calculate_learning_streak(current_user["_id"])


@router.get("/logs", response_model=list[ProgressLogResponse])
async def read_progress_logs(
    limit: int = Query(default=20, ge=1, le=100),
    current_user: dict[str, Any] = Depends(get_current_user_data),
) -> list[dict[str, Any]]:
    return await get_recent_progress_logs(current_user["_id"], limit=limit)
