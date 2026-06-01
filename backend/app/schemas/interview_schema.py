from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class InterviewProgressResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    question_id: str
    career_path_id: str
    status: Literal["not_started", "practiced", "mastered"]
    user_answer: str = ""
    notes: str = ""
    confidence_level: Literal["low", "medium", "high"] = "low"
    last_practiced_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class InterviewQuestionResponse(BaseModel):
    id: str = Field(alias="_id")
    career_path_id: str
    career_title: str
    question: str
    sample_answer: str
    type: Literal["technical", "behavioral", "coding"] | str
    difficulty: Literal["beginner", "intermediate", "advanced"] | str
    related_skill: str
    tags: list[str]
    created_at: datetime
    updated_at: datetime
    user_progress: InterviewProgressResponse | None = None

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class InterviewProgressUpdate(BaseModel):
    status: Literal["not_started", "practiced", "mastered"] | None = None
    user_answer: str | None = Field(default=None, max_length=2500)
    notes: str | None = Field(default=None, max_length=1500)
    confidence_level: Literal["low", "medium", "high"] | None = None


class InterviewProgressSummary(BaseModel):
    total_questions: int
    practiced_count: int
    mastered_count: int
    not_started_count: int
    interview_readiness_percentage: int = Field(ge=0, le=100)
