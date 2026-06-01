USER_ROLES = ("student", "admin")

COURSE_STATUS = ("not_started", "in_progress", "completed")
PHASE_STATUS = ("locked", "unlocked", "in_progress", "completed")
PROJECT_STATUS = ("not_started", "in_progress", "completed")
CERTIFICATION_STATUS = ("planned", "in_progress", "completed")
INTERVIEW_STATUS = ("not_started", "practiced", "mastered")

DIFFICULTY_LEVELS = ("beginner", "intermediate", "advanced")
PRIORITY_LEVELS = ("low", "medium", "high")
SCORE_LEVELS = ("beginner", "developing", "almost_ready", "job_ready")

RESOURCE_TYPES = ("course", "article", "video", "book", "documentation", "project", "certification")
ACTIVITY_TYPES = (
    "course_started",
    "course_completed",
    "course_progress_updated",
    "skill_progress_updated",
    "study_activity_logged",
    "progress_recalculated",
    "project_started",
    "project_completed",
    "project_progress_updated",
)
