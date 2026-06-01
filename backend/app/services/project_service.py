from typing import Any

from bson import ObjectId
from fastapi import HTTPException, status

from app.db.mongodb import get_database
from app.models.project_model import PROJECT_STATUSES, clamp_progress, create_user_project_progress_document
from app.models.base_model import utc_now
from app.services.portfolio_service import calculate_portfolio_readiness
from app.utils.object_id import serialize_document, serialize_documents, to_object_id


def _status_group(items: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    grouped = {"not_started": [], "in_progress": [], "completed": []}
    for item in items:
        grouped.setdefault(item.get("status", "not_started"), []).append(item)
    return grouped


async def _selected_career_id(user_id: ObjectId) -> ObjectId:
    db = get_database()
    profile = await db.user_profiles.find_one({"user_id": user_id})
    if not profile or not profile.get("selected_career_path_id"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please complete the Career Assessment and select a career path first.")
    return to_object_id(profile["selected_career_path_id"], "career_path_id")


async def _load_project(project_id: str) -> dict[str, Any]:
    db = get_database()
    project = await db.projects.find_one({"_id": to_object_id(project_id, "project_id"), "is_active": True})
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


async def _progress_for_project(user_id: ObjectId, project_id: ObjectId) -> dict[str, Any] | None:
    db = get_database()
    return await db.user_project_progress.find_one({"user_id": user_id, "project_id": project_id})


async def _initialize_project_progress(user_id: ObjectId, career_path_id: ObjectId) -> None:
    db = get_database()
    projects = await db.projects.find({"career_path_id": career_path_id, "is_active": True}).to_list(length=None)
    for project in projects:
        existing = await _progress_for_project(user_id, project["_id"])
        if not existing:
            await db.user_project_progress.insert_one(create_user_project_progress_document(user_id, project, "not_started"))


def _with_progress(project: dict[str, Any], progress: dict[str, Any] | None) -> dict[str, Any]:
    serialized = serialize_document(project)
    serialized["user_progress"] = serialize_document(progress) if progress else None
    return serialized


async def create_project_progress_log(user_id: ObjectId, action_type: str, title: str, message: str, project_id: str) -> None:
    try:
        from app.services.progress_monitoring_service import create_progress_log

        await create_progress_log(user_id, action_type, title, message, entity_type="project", entity_id=project_id)
    except Exception:
        return


async def get_projects(user_id: ObjectId | str, filters: dict[str, Any]) -> list[dict[str, Any]]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    query: dict[str, Any] = {"is_active": True}
    career_path_id = filters.get("career_path_id")
    if career_path_id:
        query["career_path_id"] = to_object_id(career_path_id, "career_path_id")
    else:
        query["career_path_id"] = await _selected_career_id(user_object_id)
    if filters.get("difficulty"):
        query["difficulty"] = filters["difficulty"]
    projects = await db.projects.find(query).sort("title", 1).to_list(length=None)
    progress_docs = await db.user_project_progress.find({"user_id": user_object_id, "project_id": {"$in": [project["_id"] for project in projects]}}).to_list(length=None)
    progress_map = {progress["project_id"]: progress for progress in progress_docs}
    status_filter = filters.get("status")
    results = []
    for project in projects:
        progress = progress_map.get(project["_id"])
        if status_filter:
            effective_status = progress.get("status") if progress else "not_started"
            if effective_status != status_filter:
                continue
        results.append(_with_progress(project, progress))
    return results


async def get_projects_by_career(user_id: ObjectId | str, career_path_id: str) -> list[dict[str, Any]]:
    return await get_projects(user_id, {"career_path_id": career_path_id})


async def get_project_details(user_id: ObjectId | str, project_id: str) -> dict[str, Any]:
    user_object_id = to_object_id(user_id, "user_id")
    project = await _load_project(project_id)
    progress = await _progress_for_project(user_object_id, project["_id"])
    return _with_progress(project, progress)


async def start_project(user_id: ObjectId | str, project_id: str) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    project = await _load_project(project_id)
    existing = await _progress_for_project(user_object_id, project["_id"])
    now = utc_now()
    if existing:
        update_fields = {"status": "in_progress", "updated_at": now}
        if not existing.get("started_at"):
            update_fields["started_at"] = now
        if int(existing.get("progress_percentage", 0)) < 10:
            update_fields["progress_percentage"] = 10
        await db.user_project_progress.update_one({"_id": existing["_id"]}, {"$set": update_fields})
        progress = await db.user_project_progress.find_one({"_id": existing["_id"]})
    else:
        result = await db.user_project_progress.insert_one(create_user_project_progress_document(user_object_id, project, "in_progress"))
        progress = await db.user_project_progress.find_one({"_id": result.inserted_id})
    await create_project_progress_log(user_object_id, "project_started", project["title"], "Project marked in progress.", str(project["_id"]))
    await calculate_portfolio_readiness(user_object_id)
    return serialize_document(progress)


async def update_project_progress(user_id: ObjectId | str, project_id: str, data: dict[str, Any]) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    project = await _load_project(project_id)
    progress = await _progress_for_project(user_object_id, project["_id"])
    if not progress:
        result = await db.user_project_progress.insert_one(create_user_project_progress_document(user_object_id, project, "in_progress"))
        progress = await db.user_project_progress.find_one({"_id": result.inserted_id})

    requested_status = data.get("status")
    if requested_status and requested_status not in PROJECT_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status must be not_started, in_progress, or completed")
    next_status = requested_status or progress.get("status", "not_started")
    next_progress = clamp_progress(data.get("progress_percentage") if data.get("progress_percentage") is not None else progress.get("progress_percentage", 0))
    if next_status == "completed":
        next_progress = 100
    elif next_progress > 0 and next_status == "not_started":
        next_status = "in_progress"

    now = utc_now()
    update_fields: dict[str, Any] = {
        "status": next_status,
        "progress_percentage": next_progress,
        "updated_at": now,
    }
    if next_status in {"in_progress", "completed"} and not progress.get("started_at"):
        update_fields["started_at"] = now
    if next_status == "completed":
        update_fields["completed_at"] = progress.get("completed_at") or now
    elif progress.get("completed_at"):
        update_fields["completed_at"] = None
    for field in ["github_link", "live_demo_link", "notes"]:
        if data.get(field) is not None:
            update_fields[field] = data[field]

    await db.user_project_progress.update_one({"_id": progress["_id"]}, {"$set": update_fields})
    updated = await db.user_project_progress.find_one({"_id": progress["_id"]})
    action_type = "project_completed" if updated.get("status") == "completed" else "project_progress_updated"
    await create_project_progress_log(
        user_object_id,
        action_type,
        project["title"],
        f"Project updated to {updated['progress_percentage']}% and marked {updated['status'].replace('_', ' ')}.",
        str(project["_id"]),
    )
    await calculate_portfolio_readiness(user_object_id)
    return serialize_document(updated)


async def get_user_projects(user_id: ObjectId | str) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    career_path_id = await _selected_career_id(user_object_id)
    await _initialize_project_progress(user_object_id, career_path_id)
    documents = await db.user_project_progress.find({"user_id": user_object_id}).sort([("status", 1), ("updated_at", -1)]).to_list(length=None)
    projects = serialize_documents(documents)
    return {"total": len(projects), "grouped_by_status": _status_group(projects), "projects": projects}
