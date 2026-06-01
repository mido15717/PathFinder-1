from bson import ObjectId

from app.models.base_model import base_timestamps


def create_profile_document(user_id: ObjectId) -> dict:
    return {
        "user_id": user_id,
        "university": "",
        "college": "",
        "academic_year": "",
        "major": "",
        "country": "",
        "city": "",
        "bio": "",
        "avatar_url": "",
        "github_url": "",
        "linkedin_url": "",
        "portfolio_url": "",
        "preferred_language": "English",
        "weekly_available_hours": 8,
        "preferred_learning_style": "mixed",
        "career_goal": "",
        "current_skills": [],
        "selected_career_path_id": None,
        "selected_career_title": "",
        **base_timestamps(),
    }
