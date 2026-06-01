from typing import Literal

from app.models.base_model import base_timestamps, utc_now


def create_user_document(
    full_name: str,
    email: str,
    password_hash: str,
    role: Literal["student", "admin"] = "student",
) -> dict:
    return {
        "full_name": full_name,
        "email": email,
        "password_hash": password_hash,
        "role": role,
        "is_active": True,
        "is_verified": False,
        **base_timestamps(),
        "last_login": None,
    }
