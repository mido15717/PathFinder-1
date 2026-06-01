from datetime import date, datetime
from typing import Any

from bson import ObjectId
from fastapi import HTTPException, status


def maybe_object_id(value: Any) -> ObjectId | Any:
    if isinstance(value, ObjectId):
        return value
    if value in {None, ""}:
        return value
    return ObjectId(str(value)) if ObjectId.is_valid(str(value)) else value


def object_id_or_none(value: Any, field_name: str = "id") -> ObjectId | None:
    if value in {None, ""}:
        return None
    return to_object_id(value, field_name)


def to_object_id(value: Any, field_name: str = "id") -> ObjectId:
    if isinstance(value, ObjectId):
        return value
    if value in {None, ""}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Missing {field_name}")
    if not ObjectId.is_valid(str(value)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid {field_name}")
    return ObjectId(str(value))


def serialize_value(value: Any) -> Any:
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, list):
        return [serialize_value(item) for item in value]
    if isinstance(value, tuple):
        return [serialize_value(item) for item in value]
    if isinstance(value, set):
        return [serialize_value(item) for item in value]
    if isinstance(value, dict):
        return {key: serialize_value(item) for key, item in value.items()}
    return value


def serialize_document(document: dict[str, Any] | None) -> dict[str, Any] | None:
    if document is None:
        return None
    return serialize_value(document)


def serialize_documents(documents: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [serialize_value(document) for document in documents]
