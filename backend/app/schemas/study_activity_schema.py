from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class StudyActivityRequest(BaseModel):
    date: str | None = None
    minutes_spent: int = Field(default=0, ge=0)
    courses_studied: list[str] = Field(default_factory=list)
    skills_practiced: list[str] = Field(default_factory=list)
    tasks_completed: int = Field(default=0, ge=0)
    notes: str | None = None


class StudyActivityResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    date: str
    minutes_spent: int
    courses_studied: list[str] = Field(default_factory=list)
    skills_practiced: list[str] = Field(default_factory=list)
    tasks_completed: int = 0
    notes: str = ""
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class WeeklyActivityDay(BaseModel):
    date: str
    label: str
    minutes_spent: int
    tasks_completed: int


class WeeklyActivityResponse(BaseModel):
    days: list[WeeklyActivityDay]
    total_minutes: int
    total_hours: float
    average_minutes_per_day: int


class StreakResponse(BaseModel):
    current_streak_days: int
    longest_streak_days: int
    last_activity_date: str | None = None
