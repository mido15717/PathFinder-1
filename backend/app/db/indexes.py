from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING


async def create_indexes(db: AsyncIOMotorDatabase) -> None:
    await db.users.create_index([("email", ASCENDING)], unique=True)
    await db.user_profiles.create_index([("user_id", ASCENDING)])
    await db.career_paths.create_index([("slug", ASCENDING)], unique=True)
    await db.career_paths.create_index([("title", ASCENDING)])
    await db.career_paths.create_index([("is_active", ASCENDING)])
    await db.career_assessments.create_index([("user_id", ASCENDING)])
    await db.career_assessments.create_index([("created_at", ASCENDING)])
    await db.career_matches.create_index([("user_id", ASCENDING)])
    await db.career_matches.create_index([("assessment_id", ASCENDING)])
    await db.career_matches.create_index([("best_match_career_id", ASCENDING)])
