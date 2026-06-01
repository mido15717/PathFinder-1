from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class CourseResponse(BaseModel):
    id: str = Field(alias="_id")
    title: str
    description: str
    provider: str
    url: HttpUrl | str
    course_type: str
    difficulty: str
    estimated_hours: int = Field(ge=0)
    is_free: bool
    rating: float = Field(ge=0, le=5)
    language: str
    related_careers: list[str]
    related_skills: list[str]
    related_subjects: list[str]
    tags: list[str]
    prerequisites: list[str]
    learning_outcomes: list[str]
    source_dataset: str
    embedding_text: str
    created_at: datetime
    updated_at: datetime
    is_active: bool

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class CourseListResponse(BaseModel):
    items: list[CourseResponse]
    total: int
    page: int
    limit: int
    pages: int
