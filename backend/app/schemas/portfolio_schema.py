from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PortfolioChecklist(BaseModel):
    github_profile_added: bool = False
    linkedin_profile_added: bool = False
    portfolio_url_added: bool = False
    completed_project_exists: bool = False
    github_links_added: bool = False
    live_demo_links_added: bool = False
    project_notes_added: bool = False
    readme_quality_checked: bool = False
    pinned_projects_ready: bool = False
    screenshots_added: bool = False


class PortfolioChecklistUpdate(BaseModel):
    readme_quality_checked: bool | None = None
    pinned_projects_ready: bool | None = None
    screenshots_added: bool | None = None


class PortfolioReadinessResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    career_path_id: str
    score_percentage: int = Field(ge=0, le=100)
    score_level: str = "weak"
    checklist: PortfolioChecklist
    strengths: list[str]
    weaknesses: list[str]
    recommendations: list[str]
    calculated_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)
