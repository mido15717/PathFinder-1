from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class SkillGapCourse(BaseModel):
    course_id: str
    title: str
    provider: str = ""
    url: str = ""
    difficulty: str = ""
    relevance_score: int = Field(default=0, ge=0, le=100)
    recommendation_reason: str = ""


class MasteredSkill(BaseModel):
    skill_name: str
    level: str
    progress_percentage: int = Field(ge=0, le=100)
    evidence: list[str] = Field(default_factory=list)


class WeakSkill(BaseModel):
    skill_name: str
    current_progress_percentage: int = Field(ge=0, le=100)
    required_level: str
    priority: str
    reason: str
    source: str = "rule_based"
    recommended_courses: list[SkillGapCourse] = Field(default_factory=list)


class MissingSkill(BaseModel):
    skill_name: str
    required_level: str
    priority: str
    reason: str
    source: str = "rule_based"
    recommended_courses: list[SkillGapCourse] = Field(default_factory=list)


class PrioritySkill(BaseModel):
    skill_name: str
    priority_score: int = Field(ge=0, le=100)
    reason: str
    recommended_action: str


class SkillGapAnalysisResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    career_path_id: str
    selected_career_title: str
    analysis_date: datetime
    mastered_skills: list[MasteredSkill]
    weak_skills: list[WeakSkill]
    missing_skills: list[MissingSkill]
    priority_skills: list[PrioritySkill]
    skill_coverage_percentage: int = Field(ge=0, le=100)
    total_required_skills: int = Field(ge=0)
    mastered_count: int
    weak_count: int
    missing_count: int
    recommendations: list[str]
    created_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class MissingSkillsResponse(BaseModel):
    selected_career_title: str
    weak_skills: list[WeakSkill]
    missing_skills: list[MissingSkill]
    priority_skills: list[PrioritySkill]
    recommendations: list[str]
