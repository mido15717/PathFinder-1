from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CareerResponse(BaseModel):
    id: str = Field(alias="_id")
    title: str
    slug: str
    description: str
    overview: str
    difficulty_level: str
    average_duration_months: int
    required_skills: list[str]
    recommended_tools: list[str]
    responsibilities: list[str]
    suggested_projects: list[str]
    recommended_certifications: list[str]
    market_demand: str
    salary_level: str
    tags: list[str]
    related_subjects: list[str]
    preferred_personality_traits: list[str]
    preferred_learning_styles: list[str]
    icon: str
    color: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)
