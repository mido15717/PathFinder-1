from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING


async def create_indexes(db: AsyncIOMotorDatabase) -> None:
    await db.users.create_index([("email", ASCENDING)], unique=True)

    await db.user_profiles.create_index([("user_id", ASCENDING)])

    await db.career_paths.create_index([("slug", ASCENDING)], unique=True)
    await db.career_paths.create_index([("title", ASCENDING)])

    await db.career_assessments.create_index([("user_id", ASCENDING)])

    await db.career_matches.create_index([("user_id", ASCENDING)])
    await db.career_matches.create_index([("assessment_id", ASCENDING)])

    await db.roadmaps.create_index([("career_path_id", ASCENDING)])

    await db.user_roadmaps.create_index([("user_id", ASCENDING)])
    await db.user_roadmaps.create_index([("roadmap_id", ASCENDING)])
    await db.user_roadmaps.create_index([("user_id", ASCENDING), ("career_path_id", ASCENDING)])

    await db.skills.create_index([("name", ASCENDING)], unique=True)
    await db.skills.create_index([("category", ASCENDING)])

    await db.user_skills.create_index([("user_id", ASCENDING)])
    await db.user_skills.create_index([("skill_id", ASCENDING)])
    await db.user_skills.create_index([("user_id", ASCENDING), ("skill_id", ASCENDING)], unique=True)

    await db.learning_resources.create_index([("related_skills", ASCENDING)])
    await db.learning_resources.create_index([("related_careers", ASCENDING)])

    await db.projects.create_index([("career_path_id", ASCENDING)])

    await db.user_projects.create_index([("user_id", ASCENDING)])
    await db.user_projects.create_index([("project_id", ASCENDING)])
    await db.user_projects.create_index([("user_id", ASCENDING), ("project_id", ASCENDING)], unique=True)

    await db.study_plans.create_index([("user_id", ASCENDING)])
    await db.study_plans.create_index([("roadmap_id", ASCENDING)])

    await db.user_learning_paths.create_index([("user_id", ASCENDING)])
    await db.user_learning_paths.create_index([("career_path_id", ASCENDING)])
    await db.user_learning_paths.create_index([("roadmap_id", ASCENDING)])
    await db.user_learning_paths.create_index([("user_id", ASCENDING), ("roadmap_id", ASCENDING)], unique=True)

    await db.user_course_progress.create_index([("user_id", ASCENDING)])
    await db.user_course_progress.create_index([("course_id", ASCENDING)])
    await db.user_course_progress.create_index([("career_path_id", ASCENDING)])
    await db.user_course_progress.create_index([("roadmap_phase_id", ASCENDING)])
    await db.user_course_progress.create_index([("status", ASCENDING)])
    await db.user_course_progress.create_index([("user_id", ASCENDING), ("course_id", ASCENDING)], unique=True)

    await db.user_skill_progress.create_index([("user_id", ASCENDING)])
    await db.user_skill_progress.create_index([("skill_id", ASCENDING)])
    await db.user_skill_progress.create_index([("source_course_id", ASCENDING)])
    await db.user_skill_progress.create_index([("status", ASCENDING)])
    await db.user_skill_progress.create_index([("user_id", ASCENDING), ("skill_name", ASCENDING)], unique=True)

    await db.progress_logs.create_index([("user_id", ASCENDING)])
    await db.progress_logs.create_index([("created_at", DESCENDING)])

    await db.career_readiness_scores.create_index([("user_id", ASCENDING)])
    await db.career_readiness_scores.create_index([("user_id", ASCENDING), ("career_path_id", ASCENDING)])

    await db.resumes.create_index([("user_id", ASCENDING)])

    await db.interview_questions.create_index([("career_path_id", ASCENDING)])

    await db.user_interview_progress.create_index([("user_id", ASCENDING)])
    await db.user_interview_progress.create_index([("question_id", ASCENDING)])
    await db.user_interview_progress.create_index(
        [("user_id", ASCENDING), ("question_id", ASCENDING)], unique=True
    )

    await db.certifications.create_index([("career_path_id", ASCENDING)])

    await db.user_certifications.create_index([("user_id", ASCENDING)])
    await db.user_certifications.create_index(
        [("user_id", ASCENDING), ("certification_id", ASCENDING)], unique=True
    )

    await db.notifications.create_index([("user_id", ASCENDING)])
    await db.notifications.create_index([("is_read", ASCENDING)])

    await db.user_settings.create_index([("user_id", ASCENDING)], unique=True)

    await db.activity_logs.create_index([("user_id", ASCENDING)])
    await db.activity_logs.create_index([("created_at", DESCENDING)])
