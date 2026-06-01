from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class ProfileResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    university: str = ""
    college: str = ""
    academic_year: str = ""
    major: str = ""
    country: str = ""
    city: str = ""
    bio: str = ""
    avatar_url: str = ""
    github_url: str = ""
    linkedin_url: str = ""
    portfolio_url: str = ""
    preferred_language: str = "English"
    weekly_available_hours: int = 8
    preferred_learning_style: str = "mixed"
    career_goal: str = ""
    current_skills: list[str] = Field(default_factory=list)
    selected_career_path_id: str | None = None
    selected_career_title: str = ""
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True)


class ProfileUpdate(BaseModel):
    university: str | None = Field(default=None, max_length=120)
    college: str | None = Field(default=None, max_length=120)
    academic_year: str | None = Field(default=None, max_length=60)
    major: str | None = Field(default=None, max_length=120)
    country: str | None = Field(default=None, max_length=80)
    city: str | None = Field(default=None, max_length=80)
    bio: str | None = Field(default=None, max_length=500)
    avatar_url: str | None = Field(default=None, max_length=500)
    github_url: HttpUrl | str | None = None
    linkedin_url: HttpUrl | str | None = None
    portfolio_url: HttpUrl | str | None = None
    preferred_language: str | None = Field(default=None, max_length=40)
    weekly_available_hours: int | None = Field(default=None, ge=1, le=80)
    preferred_learning_style: str | None = Field(default=None, max_length=40)
    career_goal: str | None = Field(default=None, max_length=160)
    current_skills: list[str] | None = None
    selected_career_path_id: str | None = Field(default=None, max_length=80)
    selected_career_title: str | None = Field(default=None, max_length=120)
