from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class CareerScore(BaseModel):
    career_title: str
    confidence_score: int = Field(ge=0, le=100)
    weighted_score: float = 0
    source_scores: dict[str, int] = Field(default_factory=dict)


class MLPredictionResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    assessment_id: str | None = None
    selected_career_path_id: str | None = None
    input_summary: dict[str, Any]
    rule_based_result: dict[str, Any]
    personality_model_result: dict[str, Any]
    skills_model_result: dict[str, Any]
    ensemble_result: dict[str, Any]
    final_recommended_career: str
    final_confidence_score: int = Field(ge=0, le=100)
    top_3_careers: list[CareerScore]
    explanation: str
    strengths: list[str]
    missing_skills: list[str]
    recommended_improvements: list[str]
    created_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)
