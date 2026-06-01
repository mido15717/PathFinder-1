from fastapi import APIRouter, Query

from app.schemas.course_schema import CourseListResponse, CourseResponse
from app.services.course_service import get_course_by_id, get_courses_by_career, get_courses_by_skill, list_courses

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.get("", response_model=CourseListResponse)
async def read_courses(
    search: str | None = None,
    difficulty: str | None = None,
    provider: str | None = None,
    course_type: str | None = None,
    skill: str | None = None,
    career_path_id: str | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    page: int = Query(default=1, ge=1),
) -> dict:
    return await list_courses(search, difficulty, provider, course_type, skill, career_path_id, limit, page)


@router.get("/career/{career_path_id}", response_model=list[CourseResponse])
async def read_courses_by_career(career_path_id: str) -> list[dict]:
    return await get_courses_by_career(career_path_id)


@router.get("/skills/{skill_name}", response_model=list[CourseResponse])
async def read_courses_by_skill(skill_name: str) -> list[dict]:
    return await get_courses_by_skill(skill_name)


@router.get("/{course_id}", response_model=CourseResponse)
async def read_course(course_id: str) -> dict:
    return await get_course_by_id(course_id)
