from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _empty_or_http(value: str) -> str:
    if value and not value.startswith(("http://", "https://")):
        raise ValueError("URL must start with http:// or https://")
    return value


class ResumeEducation(BaseModel):
    institution: str = ""
    degree: str = ""
    major: str = ""
    start_year: str = ""
    end_year: str = ""
    gpa: str = ""


class ResumeSkill(BaseModel):
    name: str = ""
    category: str = "technical"
    level: str = "beginner"


class ResumeProject(BaseModel):
    title: str = ""
    description: str = ""
    technologies: list[str] = Field(default_factory=list)
    github_link: str = ""
    live_demo_link: str = ""

    @field_validator("github_link", "live_demo_link")
    @classmethod
    def validate_urls(cls, value: str) -> str:
        return _empty_or_http(value)


class ResumeCertification(BaseModel):
    title: str = ""
    provider: str = ""
    issue_date: str = ""
    certificate_url: str = ""

    @field_validator("certificate_url")
    @classmethod
    def validate_url(cls, value: str) -> str:
        return _empty_or_http(value)


class ResumeExperience(BaseModel):
    title: str = ""
    company: str = ""
    start_date: str = ""
    end_date: str = ""
    description: str = ""


class ResumeLanguage(BaseModel):
    language: str = ""
    level: str = ""


class ResumePayload(BaseModel):
    full_name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    github: str = ""
    portfolio: str = ""
    summary: str = ""
    education: list[ResumeEducation] = Field(default_factory=list)
    skills: list[ResumeSkill] = Field(default_factory=list)
    projects: list[ResumeProject] = Field(default_factory=list)
    certifications: list[ResumeCertification] = Field(default_factory=list)
    experience: list[ResumeExperience] = Field(default_factory=list)
    languages: list[ResumeLanguage] = Field(default_factory=list)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        if value and ("@" not in value or "." not in value.rsplit("@", 1)[-1]):
            raise ValueError("Email must be a valid email address")
        return value

    @field_validator("linkedin", "github", "portfolio")
    @classmethod
    def validate_links(cls, value: str) -> str:
        return _empty_or_http(value)


class ResumeResponse(ResumePayload):
    id: str = Field(alias="_id")
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class ResumeFeedbackResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    resume_id: str
    score_percentage: int = Field(ge=0, le=100)
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)
    missing_sections: list[str] = Field(default_factory=list)
    generated_at: datetime
    created_at: datetime | None = None

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)
