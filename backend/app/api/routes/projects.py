from typing import Any

from fastapi import APIRouter, Depends, Query

from app.schemas.project_schema import GroupedProjectProgressResponse, ProjectProgressResponse, ProjectProgressUpdate, ProjectResponse
from app.services.auth_service import get_current_user_data
from app.services.project_service import get_project_details, get_projects, get_projects_by_career, get_user_projects, start_project, update_project_progress

router = APIRouter(prefix="/projects", tags=["Projects Portfolio"])


@router.get("", response_model=list[ProjectResponse])
async def read_projects(
    career_path_id: str | None = Query(default=None),
    difficulty: str | None = Query(default=None),
    status: str | None = Query(default=None),
    current_user: dict[str, Any] = Depends(get_current_user_data),
) -> list[dict[str, Any]]:
    return await get_projects(current_user["_id"], {"career_path_id": career_path_id, "difficulty": difficulty, "status": status})


@router.get("/career/{career_path_id}", response_model=list[ProjectResponse])
async def read_projects_by_career(career_path_id: str, current_user: dict[str, Any] = Depends(get_current_user_data)) -> list[dict[str, Any]]:
    return await get_projects_by_career(current_user["_id"], career_path_id)


@router.get("/me", response_model=GroupedProjectProgressResponse)
async def read_my_projects(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await get_user_projects(current_user["_id"])


@router.get("/{project_id}", response_model=ProjectResponse)
async def read_project_details(project_id: str, current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await get_project_details(current_user["_id"], project_id)


@router.post("/{project_id}/start", response_model=ProjectProgressResponse, status_code=201)
async def start_my_project(project_id: str, current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await start_project(current_user["_id"], project_id)


@router.patch("/{project_id}/progress", response_model=ProjectProgressResponse)
async def patch_project_progress(
    project_id: str,
    payload: ProjectProgressUpdate,
    current_user: dict[str, Any] = Depends(get_current_user_data),
) -> dict[str, Any]:
    return await update_project_progress(current_user["_id"], project_id, payload.model_dump(exclude_none=True))
