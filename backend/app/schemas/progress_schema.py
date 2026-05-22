from typing import Literal

from pydantic import BaseModel, Field


class ProgressSummary(BaseModel):
    roadmap_progress: float
    skills_progress: float
    projects_progress: float
    certifications_progress: float
    interview_progress: float


class ReadinessCalculateRequest(BaseModel):
    career_path_id: str | None = None


class CourseProgressUpdate(BaseModel):
    status: Literal["not_started", "in_progress", "completed"] | None = None
    progress_percentage: float | None = Field(default=None, ge=0, le=100)


class RoadmapPhaseProgressUpdate(BaseModel):
    status: Literal["not_started", "in_progress", "completed"] | None = None
    progress_percentage: float | None = Field(default=None, ge=0, le=100)
    completed_courses: list[str] | None = None
    completed_skills: list[str] | None = None
