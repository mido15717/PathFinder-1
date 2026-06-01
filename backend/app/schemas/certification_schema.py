from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class UserCertificationResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    certification_id: str
    career_path_id: str
    status: Literal["planned", "in_progress", "completed"]
    certificate_url: HttpUrl | str = ""
    notes: str = ""
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class CertificationResponse(BaseModel):
    id: str = Field(alias="_id")
    title: str
    provider: str
    career_path_id: str
    career_title: str
    description: str
    difficulty: Literal["beginner", "intermediate", "advanced"] | str
    url: HttpUrl | str
    estimated_duration: str
    cost_type: str
    related_skills: list[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    user_certification: UserCertificationResponse | None = None

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class UserCertificationUpdate(BaseModel):
    status: Literal["planned", "in_progress", "completed"] | None = None
    certificate_url: HttpUrl | str | None = Field(default=None, max_length=500)
    notes: str | None = Field(default=None, max_length=1200)


class GroupedUserCertificationResponse(BaseModel):
    total: int
    grouped_by_status: dict[str, list[CertificationResponse]]
    certifications: list[CertificationResponse]
