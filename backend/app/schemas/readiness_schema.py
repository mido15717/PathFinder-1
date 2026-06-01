from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ReadinessScoreResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    career_path_id: str
    selected_career_title: str
    total_score: int = Field(ge=0, le=100)
    score_level: str
    roadmap_score: int = Field(ge=0, le=100)
    skills_score: int = Field(ge=0, le=100)
    projects_score: int = Field(ge=0, le=100)
    interview_score: int = Field(ge=0, le=100)
    certification_score: int = Field(ge=0, le=100)
    portfolio_score: int = Field(ge=0, le=100)
    score_breakdown: dict[str, Any]
    strengths: list[str]
    weaknesses: list[str]
    recommendations: list[str]
    next_actions: list[str]
    calculated_at: datetime
    created_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)
