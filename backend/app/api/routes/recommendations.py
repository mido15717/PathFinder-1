from typing import Any

from fastapi import APIRouter, Depends

from app.schemas.recommendation_schema import (
    GenerateRecommendationRequest,
    GenerateRecommendationResponse,
    RecommendationHistoryResponse,
    SaveCourseRequest,
    SavedCourseResponse,
)
from app.services.auth_service import get_current_user_data
from app.services.recommendation_service import (
    generate_recommendations_for_user,
    get_latest_recommendation,
    get_recommendation_history,
    get_saved_courses,
    remove_saved_course,
    save_course_for_user,
)

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.post("/generate", response_model=GenerateRecommendationResponse, status_code=201)
async def generate_recommendations(
    payload: GenerateRecommendationRequest,
    current_user: dict[str, Any] = Depends(get_current_user_data),
) -> dict[str, Any]:
    return await generate_recommendations_for_user(current_user["_id"], payload.model_dump(exclude_none=True))


@router.get("/me", response_model=RecommendationHistoryResponse)
async def read_latest_recommendation(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await get_latest_recommendation(current_user["_id"])


@router.get("/history", response_model=list[RecommendationHistoryResponse])
async def read_recommendation_history(current_user: dict[str, Any] = Depends(get_current_user_data)) -> list[dict[str, Any]]:
    return await get_recommendation_history(current_user["_id"])


@router.post("/save-course", response_model=SavedCourseResponse, status_code=201)
async def save_course(
    payload: SaveCourseRequest,
    current_user: dict[str, Any] = Depends(get_current_user_data),
) -> dict[str, Any]:
    return await save_course_for_user(current_user["_id"], payload.course_id)


@router.get("/saved-courses", response_model=list[SavedCourseResponse])
async def read_saved_courses(current_user: dict[str, Any] = Depends(get_current_user_data)) -> list[dict[str, Any]]:
    return await get_saved_courses(current_user["_id"])


@router.delete("/saved-courses/{course_id}")
async def delete_saved_course(course_id: str, current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, str]:
    return await remove_saved_course(current_user["_id"], course_id)
