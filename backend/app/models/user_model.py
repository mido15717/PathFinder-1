from datetime import datetime, timezone
from typing import Literal


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def create_user_document(
    full_name: str,
    email: str,
    password_hash: str,
    role: Literal["student", "admin"] = "student",
) -> dict:
    now = utc_now()
    return {
        "full_name": full_name,
        "email": email,
        "password_hash": password_hash,
        "role": role,
        "is_active": True,
        "is_verified": False,
        "created_at": now,
        "updated_at": now,
        "last_login": None,
    }

