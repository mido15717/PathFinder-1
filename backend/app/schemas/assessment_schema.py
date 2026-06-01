from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.match_schema import CareerMatchItem


class AssessmentSubmitRequest(BaseModel):
    preferred_area: str = Field(min_length=2, max_length=80)
    programming_level: str = Field(min_length=2, max_length=40)
    favorite_subjects: list[str] = Field(default_factory=list)
    current_skills: list[str] = Field(default_factory=list)
    career_goal: str = Field(min_length=2, max_length=120)
    learning_style: str = Field(min_length=2, max_length=80)
    weekly_available_hours: int = Field(ge=1, le=80)
    preferred_work_type: str = Field(min_length=2, max_length=120)
    target_deadline_months: int | None = Field(default=None, ge=0, le=60)
    personality_traits: list[str] = Field(default_factory=list)
    answers: dict[str, Any] = Field(default_factory=dict)


class AssessmentResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    preferred_area: str
    programming_level: str
    favorite_subjects: list[str]
    current_skills: list[str]
    career_goal: str
    learning_style: str
    weekly_available_hours: int
    preferred_work_type: str
    target_deadline_months: int | None = None
    personality_traits: list[str]
    answers: dict[str, Any]
    completed_at: datetime
    created_at: datetime

    model_config = ConfigDict(populate_by_name=True)


class AssessmentSubmitResponse(BaseModel):
    assessment_id: str
    match_id: str
    matches: list[CareerMatchItem]
