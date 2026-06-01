from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CareerMatchItem(BaseModel):
    career_path_id: str
    career_title: str
    career_slug: str
    match_percentage: int
    match_level: str
    reasons: list[str]
    strengths: list[str]
    weaknesses: list[str]
    recommended_improvements: list[str]
    matched_skills: list[str]
    missing_skills: list[str]


class CareerMatchResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    assessment_id: str
    matches: list[CareerMatchItem]
    best_match_career_id: str | None = None
    selected_career_id: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class SelectCareerRequest(BaseModel):
    career_path_id: str


class SelectedCareerResponse(BaseModel):
    selected_career_id: str
    selected_career_title: str
    match_id: str | None = None
