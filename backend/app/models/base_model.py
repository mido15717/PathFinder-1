from datetime import datetime, timezone
from typing import Any

from bson import ObjectId


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def base_timestamps() -> dict[str, datetime]:
    now = utc_now()
    return {"created_at": now, "updated_at": now}


def update_timestamp(payload: dict[str, Any] | None = None) -> dict[str, Any]:
    data = dict(payload or {})
    data["updated_at"] = utc_now()
    return data


def clean_none_values(payload: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in payload.items() if value is not None}


def clamp_percentage(value: int | float | str | None) -> int:
    if value in {None, ""}:
        return 0
    try:
        number = float(value)
    except (TypeError, ValueError):
        return 0
    return max(0, min(100, int(round(number))))


def normalize_status(value: str | None, allowed: set[str] | tuple[str, ...], default: str) -> str:
    if not value:
        return default
    return value if value in set(allowed) else default


def default_object_id_string(value: Any = None) -> str:
    if isinstance(value, ObjectId):
        return str(value)
    if value in {None, ""}:
        return ""
    return str(value)


def safe_list(value: Any) -> list[Any]:
    if isinstance(value, list):
        return value
    if value in {None, ""}:
        return []
    return [value]


def safe_string(value: Any) -> str:
    if value is None:
        return ""
    return str(value)
