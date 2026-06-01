from typing import Any

from bson import ObjectId
from fastapi import HTTPException, status

from app.db.mongodb import get_database
from app.models.certification_model import CERTIFICATION_STATUSES, create_user_certification_document
from app.models.base_model import utc_now
from app.utils.object_id import serialize_document, to_object_id


async def _selected_career(user_id: ObjectId) -> tuple[ObjectId, dict[str, Any]]:
    db = get_database()
    profile = await db.user_profiles.find_one({"user_id": user_id})
    if not profile or not profile.get("selected_career_path_id"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please complete the Career Assessment and select a career path first.")
    career_path_id = to_object_id(profile["selected_career_path_id"], "career_path_id")
    career = await db.career_paths.find_one({"_id": career_path_id, "is_active": True})
    if not career:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Selected career path not found")
    return career_path_id, career


async def _load_certification(certification_id: str) -> dict[str, Any]:
    db = get_database()
    certification = await db.certifications.find_one({"_id": to_object_id(certification_id, "certification_id"), "is_active": True})
    if not certification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certification not found")
    return certification


def _with_user_certification(certification: dict[str, Any], user_certification: dict[str, Any] | None) -> dict[str, Any]:
    result = serialize_document(certification)
    result["user_certification"] = serialize_document(user_certification) if user_certification else None
    return result


async def get_certifications(user_id: ObjectId | str, filters: dict[str, Any]) -> list[dict[str, Any]]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    career_path_id = to_object_id(filters["career_path_id"], "career_path_id") if filters.get("career_path_id") else (await _selected_career(user_object_id))[0]
    query: dict[str, Any] = {"career_path_id": career_path_id, "is_active": True}
    if filters.get("difficulty"):
        query["difficulty"] = filters["difficulty"]
    if filters.get("provider"):
        query["provider"] = filters["provider"]
    certifications = await db.certifications.find(query).sort([("difficulty", 1), ("provider", 1), ("title", 1)]).to_list(length=None)
    user_docs = await db.user_certifications.find({"user_id": user_object_id, "certification_id": {"$in": [cert["_id"] for cert in certifications]}}).to_list(length=None)
    user_map = {item["certification_id"]: item for item in user_docs}
    return [_with_user_certification(cert, user_map.get(cert["_id"])) for cert in certifications]


async def get_certifications_by_career(user_id: ObjectId | str, career_path_id: str) -> list[dict[str, Any]]:
    return await get_certifications(user_id, {"career_path_id": career_path_id})


async def update_user_certification(user_id: ObjectId | str, certification_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    certification = await _load_certification(certification_id)
    if payload.get("status") and payload["status"] not in CERTIFICATION_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status must be planned, in_progress, or completed")

    existing = await db.user_certifications.find_one({"user_id": user_object_id, "certification_id": certification["_id"]})
    if existing:
        update_fields = {"updated_at": utc_now()}
        for field in ["status", "certificate_url", "notes"]:
            if payload.get(field) is not None:
                update_fields[field] = payload[field]
        next_status = update_fields.get("status", existing.get("status", "planned"))
        if next_status in {"in_progress", "completed"} and not existing.get("started_at"):
            update_fields["started_at"] = utc_now()
        if next_status == "completed":
            update_fields["completed_at"] = existing.get("completed_at") or utc_now()
        elif next_status != "completed":
            update_fields["completed_at"] = None
        await db.user_certifications.update_one({"_id": existing["_id"]}, {"$set": update_fields})
        updated = await db.user_certifications.find_one({"_id": existing["_id"]})
    else:
        result = await db.user_certifications.insert_one(create_user_certification_document(user_object_id, certification, payload))
        updated = await db.user_certifications.find_one({"_id": result.inserted_id})
    return serialize_document(updated)


async def get_user_certifications(user_id: ObjectId | str) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    user_docs = await db.user_certifications.find({"user_id": user_object_id}).sort("updated_at", -1).to_list(length=None)
    if not user_docs:
        return {"total": 0, "grouped_by_status": {"planned": [], "in_progress": [], "completed": []}, "certifications": []}
    cert_ids = [item["certification_id"] for item in user_docs]
    certifications = await db.certifications.find({"_id": {"$in": cert_ids}}).to_list(length=None)
    cert_map = {cert["_id"]: cert for cert in certifications}
    items = [_with_user_certification(cert_map[item["certification_id"]], item) for item in user_docs if item["certification_id"] in cert_map]
    grouped = {"planned": [], "in_progress": [], "completed": []}
    for item in items:
        status_value = (item.get("user_certification") or {}).get("status", "planned")
        grouped.setdefault(status_value, []).append(item)
    return {"total": len(items), "grouped_by_status": grouped, "certifications": items}


async def get_certification_score_context(user_id: ObjectId | str) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    career_path_id, _ = await _selected_career(user_object_id)
    total = await db.certifications.count_documents({"career_path_id": career_path_id, "is_active": True})
    progress_docs = await db.user_certifications.find({"user_id": user_object_id, "career_path_id": career_path_id}).to_list(length=None)
    planned = sum(1 for item in progress_docs if item.get("status") == "planned")
    in_progress = sum(1 for item in progress_docs if item.get("status") == "in_progress")
    completed = sum(1 for item in progress_docs if item.get("status") == "completed")
    percentage = round(((completed + in_progress * 0.5 + planned * 0.2) / total) * 100) if total else 0
    return {
        "total_certifications": total,
        "planned_count": planned,
        "in_progress_count": in_progress,
        "completed_count": completed,
        "certification_score_percentage": min(percentage, 100),
    }


async def get_certification_progress_context(user_id: ObjectId | str) -> dict[str, Any]:
    return await get_certification_score_context(user_id)
