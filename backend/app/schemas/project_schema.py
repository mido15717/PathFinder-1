from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProjectProgressResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    project_id: str
    career_path_id: str
    title: str
    status: str
    progress_percentage: int = Field(ge=0, le=100)
    github_link: str = ""
    live_demo_link: str = ""
    notes: str = ""
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class ProjectResponse(BaseModel):
    id: str = Field(alias="_id")
    title: str
    slug: str
    description: str
    career_path_id: str
    related_careers: list[str]
    difficulty: str
    required_skills: list[str]
    tools: list[str]
    estimated_duration_weeks: int = Field(ge=0)
    instructions: list[str]
    expected_output: str
    evaluation_criteria: list[str]
    suggested_features: list[str]
    learning_outcomes: list[str]
    tags: list[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    user_progress: ProjectProgressResponse | None = None

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class ProjectProgressUpdate(BaseModel):
    status: str | None = None
    progress_percentage: int | None = Field(default=None, ge=0, le=100)
    github_link: str | None = Field(default=None, max_length=500)
    live_demo_link: str | None = Field(default=None, max_length=500)
    notes: str | None = Field(default=None, max_length=1200)


class GroupedProjectProgressResponse(BaseModel):
    total: int
    grouped_by_status: dict[str, list[ProjectProgressResponse]]
    projects: list[ProjectProgressResponse]
