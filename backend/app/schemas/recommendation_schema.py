from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class RecommendationFilters(BaseModel):
    difficulty: str | None = None
    provider: str | None = None
    course_type: str | None = None
    skill: str | None = None
    max_results: int | None = Field(default=12, ge=1, le=50)


class GenerateRecommendationRequest(BaseModel):
    query: str | None = Field(default=None, max_length=300)
    filters: RecommendationFilters | None = None


class RecommendedCourseItem(BaseModel):
    course_id: str
    title: str
    provider: str
    url: str
    difficulty: str
    course_type: str
    related_skills: list[str]
    relevance_score: int = Field(ge=0, le=100)
    recommendation_reason: str
    matched_skills: list[str]
    missing_skills_covered: list[str]
    priority_level: Literal["low", "medium", "high"] | str


class GenerateRecommendationResponse(BaseModel):
    recommendation_id: str
    selected_career: str
    query_used: str
    recommended_courses: list[RecommendedCourseItem]
    explanation_summary: str


class RecommendationHistoryResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    career_path_id: str
    assessment_id: str | None = None
    selected_career_title: str
    query: str
    recommended_courses: list[RecommendedCourseItem]
    filters_used: dict[str, Any]
    generated_at: datetime
    created_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class SaveCourseRequest(BaseModel):
    course_id: str


class SavedCourseResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    course_id: str
    career_path_id: str | None = None
    title: str
    provider: str
    url: str
    status: str
    saved_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)
