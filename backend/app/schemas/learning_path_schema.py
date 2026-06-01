from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class LearningPathCourse(BaseModel):
    course_id: str
    title: str
    provider: str
    difficulty: str
    estimated_hours: int = Field(default=0, ge=0)
    status: Literal["not_started", "in_progress", "completed"] = "not_started"
    priority_level: Literal["low", "medium", "high"] = "medium"
    reason: str = ""


class AlternativeCourse(BaseModel):
    course_id: str
    title: str
    provider: str
    difficulty: str


class LearningPathPhase(BaseModel):
    phase_id: str
    title: str
    description: str
    order: int
    difficulty: str
    estimated_weeks: int = Field(ge=0)
    status: Literal["locked", "unlocked", "in_progress", "completed"]
    prerequisites: list[str]
    required_skills: list[str]
    optional_skills: list[str]
    recommended_courses: list[LearningPathCourse]
    alternative_courses: list[AlternativeCourse]
    suggested_projects: list[str]
    progress_percentage: int = Field(ge=0, le=100)
    started_at: datetime | None = None
    completed_at: datetime | None = None


class NextBestCourse(BaseModel):
    course_id: str
    title: str
    provider: str
    difficulty: str
    reason: str


class LearningPathResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    career_path_id: str
    assessment_id: str | None = None
    selected_career_title: str
    title: str
    description: str
    status: str
    overall_progress_percentage: int = Field(ge=0, le=100)
    current_phase_id: str | None = None
    current_course_id: str | None = None
    weekly_available_hours: int = Field(ge=0)
    target_completion_date: datetime | None = None
    generated_from: str
    phases: list[LearningPathPhase]
    next_best_course: NextBestCourse | None = None
    ml_prediction_id: str | None = None
    ml_alternative_career: str | None = None
    ml_missing_skills: list[str] = Field(default_factory=list)
    ml_informed_note: str | None = None
    adaptation_rules: dict[str, Any]
    last_adapted_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class GenerateLearningPathResponse(BaseModel):
    learning_path_id: str
    learning_path: LearningPathResponse
    next_best_course: NextBestCourse | None = None
    explanation_summary: str


class LearningPathUpdateResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    learning_path_id: str
    update_type: str
    reason: str
    previous_state_summary: str
    new_state_summary: str
    created_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)
