from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class CourseProgressUpdate(BaseModel):
    status: Literal["not_started", "in_progress", "completed"] | None = None
    progress_percentage: int | None = Field(default=None, ge=0, le=100)
    minutes_spent: int | None = Field(default=None, ge=0)
    notes: str | None = None


class CourseProgressResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    course_id: str
    course_title: str
    provider: str = ""
    difficulty: str = "beginner"
    estimated_hours: int = Field(default=0, ge=0)
    status: Literal["not_started", "in_progress", "completed"]
    progress_percentage: int = Field(ge=0, le=100)
    started_at: datetime | None = None
    completed_at: datetime | None = None
    career_path_id: str | None = None
    learning_path_id: str | None = None
    phase_id: str | None = None
    phase_title: str | None = None
    related_skills: list[str] = Field(default_factory=list)
    source: str = "manual"
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class GroupedCourseProgressResponse(BaseModel):
    total: int
    courses: list[CourseProgressResponse]
    grouped_by_status: dict[str, list[CourseProgressResponse]]


class SkillProgressUpdate(BaseModel):
    progress_percentage: int | None = Field(default=None, ge=0, le=100)
    status: Literal["not_started", "in_progress", "completed"] | None = None
    category: str | None = None
    level: str | None = None
    related_career_path_id: str | None = None
    reason: str | None = None


class SkillProgressResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    skill_name: str
    category: str = "general"
    level: str = "beginner"
    status: Literal["not_started", "in_progress", "completed"]
    progress_percentage: int = Field(ge=0, le=100)
    completed_courses: list[str] = Field(default_factory=list)
    related_course_ids: list[str] = Field(default_factory=list)
    related_career_path_id: str | None = None
    last_updated_reason: str = ""
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class GroupedSkillProgressResponse(BaseModel):
    total: int
    skills: list[SkillProgressResponse]
    grouped_by_status: dict[str, list[SkillProgressResponse]]
    grouped_by_category: dict[str, list[SkillProgressResponse]]


class ProgressLogResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    action_type: str
    title: str
    message: str
    entity_type: str | None = None
    entity_id: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class LearningPathProgressResponse(BaseModel):
    active: bool
    learning_path_id: str | None = None
    title: str | None = None
    selected_career_title: str | None = None
    overall_progress_percentage: int = Field(default=0, ge=0, le=100)
    current_phase_id: str | None = None
    current_phase: dict[str, Any] | None = None
    next_best_course: dict[str, Any] | None = None
    phases: list[dict[str, Any]] = Field(default_factory=list)


class ProgressSummaryResponse(BaseModel):
    overall_progress_percentage: int
    total_courses: int
    completed_courses: int
    in_progress_courses: int
    not_started_courses: int
    total_skills: int
    completed_skills: int
    in_progress_skills: int
    weekly_minutes: int
    weekly_hours: float
    current_streak_days: int
    longest_streak_days: int
    active_learning_path: LearningPathProgressResponse
    progress_by_phase: list[dict[str, Any]]
    next_recommended_task: dict[str, Any] | None = None
    recent_logs: list[ProgressLogResponse] = Field(default_factory=list)


class ProgressContextResponse(BaseModel):
    course_progress: list[CourseProgressResponse]
    skill_progress: list[SkillProgressResponse]
    learning_path_progress: LearningPathProgressResponse
    weekly_activity: dict[str, Any]
    recent_logs: list[ProgressLogResponse]
