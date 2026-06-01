from datetime import date, timedelta
from typing import Any

from bson import ObjectId
from fastapi import HTTPException, status

from app.db.mongodb import get_database
from app.models.progress_model import (
    COURSE_STATUSES,
    clamp_percentage,
    create_course_progress_document,
    create_progress_log_document,
    create_skill_progress_document,
    status_from_progress,
)
from app.models.study_activity_model import create_study_activity_document
from app.models.base_model import utc_now
from app.services.learning_path_service import _load_active_path, _refresh_path_progress, _update_payload
from app.utils.object_id import object_id_or_none, serialize_document, serialize_documents, to_object_id


def _today_key() -> str:
    return utc_now().date().isoformat()


def _date_label(value: str) -> str:
    parsed = date.fromisoformat(value)
    return parsed.strftime("%a")


def _normalize_activity_date(value: str | None) -> str:
    if not value:
        return _today_key()
    try:
        return date.fromisoformat(str(value)[:10]).isoformat()
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Activity date must use YYYY-MM-DD format") from exc


def _unique_strings(values: list[Any]) -> list[str]:
    return list(dict.fromkeys(str(item).strip() for item in values if str(item).strip()))


def _validate_status(value: str | None, fallback: str = "not_started") -> str:
    if value is None:
        return fallback
    if value not in COURSE_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status must be not_started, in_progress, or completed")
    return value


async def _maybe_active_path(user_id: ObjectId) -> dict[str, Any] | None:
    try:
        return await _load_active_path(user_id)
    except HTTPException as exc:
        if exc.status_code == status.HTTP_404_NOT_FOUND:
            return None
        raise


async def _load_catalog_course(db: Any, course_id: str) -> dict[str, Any] | None:
    if ObjectId.is_valid(course_id):
        course = await db.courses.find_one({"_id": ObjectId(course_id)})
        if course:
            course["course_id"] = str(course["_id"])
            return course
    return await db.courses.find_one({"course_id": course_id})


def _course_from_learning_path(path: dict[str, Any] | None, course_id: str) -> tuple[dict[str, Any], dict[str, Any]] | tuple[None, None]:
    if not path:
        return None, None
    for phase in path.get("phases", []):
        for course in phase.get("recommended_courses", []):
            if str(course.get("course_id")) == str(course_id):
                return course, phase
    return None, None


async def _merged_course_payload(db: Any, course_id: str, path: dict[str, Any] | None = None) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    path_course, phase = _course_from_learning_path(path, course_id)
    catalog_course = await _load_catalog_course(db, course_id)
    if not path_course and not catalog_course:
        return None, phase
    merged = dict(catalog_course or {})
    merged.update(path_course or {})
    merged["course_id"] = str(merged.get("course_id") or merged.get("_id") or course_id)
    if "course_title" not in merged and "title" in merged:
        merged["course_title"] = merged["title"]
    return merged, phase


async def create_progress_log(
    user_id: ObjectId | str,
    action_type: str,
    title: str,
    message: str,
    entity_type: str | None = None,
    entity_id: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    result = await db.progress_logs.insert_one(create_progress_log_document(user_object_id, action_type, title, message, entity_type, entity_id, metadata))
    document = await db.progress_logs.find_one({"_id": result.inserted_id})
    return serialize_document(document)


async def initialize_course_progress_from_learning_path(user_id: ObjectId | str, learning_path: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    path = learning_path if learning_path is not None else await _maybe_active_path(user_object_id)
    if not path:
        return []

    synced: list[dict[str, Any]] = []
    career_path_id = path.get("career_path_id")
    learning_path_id = path.get("_id")
    for phase in path.get("phases", []):
        for path_course in phase.get("recommended_courses", []):
            course_id = str(path_course.get("course_id"))
            course_payload, _ = await _merged_course_payload(db, course_id, path)
            if not course_payload:
                continue
            existing = await db.user_course_progress.find_one({"user_id": user_object_id, "course_id": course_id})
            path_status = _validate_status(path_course.get("status"), "not_started")
            path_progress = 100 if path_status == "completed" else 1 if path_status == "in_progress" else 0
            if existing:
                update_fields = {
                    "course_title": course_payload.get("course_title") or course_payload.get("title", existing.get("course_title", "Untitled course")),
                    "provider": course_payload.get("provider", existing.get("provider", "")),
                    "difficulty": course_payload.get("difficulty", existing.get("difficulty", "beginner")),
                    "estimated_hours": int(course_payload.get("estimated_hours") or existing.get("estimated_hours") or 0),
                    "career_path_id": career_path_id,
                    "learning_path_id": learning_path_id,
                    "phase_id": phase.get("phase_id"),
                    "phase_title": phase.get("title"),
                    "related_skills": _unique_strings([*existing.get("related_skills", []), *course_payload.get("related_skills", [])]),
                    "source": "learning_path",
                    "updated_at": utc_now(),
                }
                if path_status != "not_started" and existing.get("status") != "completed":
                    update_fields["status"] = path_status
                    update_fields["progress_percentage"] = max(int(existing.get("progress_percentage", 0)), path_progress)
                    if path_status == "in_progress" and not existing.get("started_at"):
                        update_fields["started_at"] = utc_now()
                    if path_status == "completed" and not existing.get("completed_at"):
                        update_fields["completed_at"] = utc_now()
                await db.user_course_progress.update_one({"_id": existing["_id"]}, {"$set": update_fields})
            else:
                document = create_course_progress_document(
                    user_id=user_object_id,
                    course=course_payload,
                    career_path_id=career_path_id,
                    learning_path_id=learning_path_id,
                    phase_id=phase.get("phase_id"),
                    phase_title=phase.get("title"),
                    status=path_status,
                    progress_percentage=path_progress,
                    source="learning_path",
                )
                await db.user_course_progress.insert_one(document)
            updated = await db.user_course_progress.find_one({"user_id": user_object_id, "course_id": course_id})
            if updated:
                synced.append(serialize_document(updated))
    return synced


async def _initialize_skills_from_learning_path(user_id: ObjectId | str, learning_path: dict[str, Any] | None = None) -> None:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    path = learning_path if learning_path is not None else await _maybe_active_path(user_object_id)
    if not path:
        return

    for phase in path.get("phases", []):
        skill_names = _unique_strings([*phase.get("required_skills", []), *phase.get("optional_skills", [])])
        for skill_name in skill_names:
            existing = await db.user_skill_progress.find_one({"user_id": user_object_id, "skill_name": skill_name})
            if existing:
                continue
            await db.user_skill_progress.insert_one(
                create_skill_progress_document(
                    user_id=user_object_id,
                    skill_name=skill_name,
                    category=phase.get("title", "learning path"),
                    related_career_path_id=path.get("career_path_id"),
                )
            )


def _group_by_status(items: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    grouped: dict[str, list[dict[str, Any]]] = {"not_started": [], "in_progress": [], "completed": []}
    for item in items:
        grouped.setdefault(item.get("status", "not_started"), []).append(item)
    return grouped


async def get_user_course_progress(user_id: ObjectId | str) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    await initialize_course_progress_from_learning_path(user_object_id)
    documents = await db.user_course_progress.find({"user_id": user_object_id}).sort([("phase_id", 1), ("course_title", 1)]).to_list(length=None)
    courses = serialize_documents(documents)
    return {"total": len(courses), "courses": courses, "grouped_by_status": _group_by_status(courses)}


async def _sync_learning_path_course(user_id: ObjectId, course_id: str, status_value: str) -> dict[str, Any] | None:
    db = get_database()
    path = await _maybe_active_path(user_id)
    if not path:
        return None

    found = False
    for phase in path.get("phases", []):
        for course in phase.get("recommended_courses", []):
            if str(course.get("course_id")) == str(course_id):
                course["status"] = status_value
                if status_value in {"in_progress", "completed"} and phase.get("status") == "unlocked":
                    phase["status"] = "in_progress"
                    phase["started_at"] = phase.get("started_at") or utc_now()
                found = True
                break
        if found:
            phase_courses = phase.get("recommended_courses", [])
            completed_count = sum(1 for item in phase_courses if item.get("status") == "completed")
            active_count = sum(1 for item in phase_courses if item.get("status") == "in_progress")
            if phase_courses and completed_count == len(phase_courses):
                phase["status"] = "completed"
                phase["completed_at"] = phase.get("completed_at") or utc_now()
            elif completed_count or active_count:
                phase["status"] = "in_progress"
                phase["completed_at"] = None
            elif phase.get("status") == "completed":
                phase["status"] = "unlocked"
                phase["completed_at"] = None
            break
    if not found:
        return None

    _refresh_path_progress(path)
    await db.adaptive_learning_paths.update_one({"_id": path["_id"]}, {"$set": _update_payload(path)})
    return serialize_document(path)


async def update_course_progress(user_id: ObjectId | str, course_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    path = await _maybe_active_path(user_object_id)
    if path:
        await initialize_course_progress_from_learning_path(user_object_id, path)

    existing = await db.user_course_progress.find_one({"user_id": user_object_id, "course_id": course_id})
    if not existing:
        course_payload, phase = await _merged_course_payload(db, course_id, path)
        if not course_payload:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
        document = create_course_progress_document(
            user_id=user_object_id,
            course=course_payload,
            career_path_id=path.get("career_path_id") if path else None,
            learning_path_id=path.get("_id") if path else None,
            phase_id=phase.get("phase_id") if phase else None,
            phase_title=phase.get("title") if phase else None,
            source="learning_path" if phase else "course_catalog",
        )
        insert_result = await db.user_course_progress.insert_one(document)
        existing = await db.user_course_progress.find_one({"_id": insert_result.inserted_id})

    progress = payload.get("progress_percentage")
    requested_status = payload.get("status")
    if progress is None:
        if requested_status == "completed":
            progress = 100
        elif requested_status == "not_started":
            progress = 0
        elif requested_status == "in_progress":
            progress = max(int(existing.get("progress_percentage", 0)), 1)
        else:
            progress = int(existing.get("progress_percentage", 0))
    progress = clamp_percentage(progress)
    normalized_status = _validate_status(requested_status, status_from_progress(progress, existing.get("status", "not_started")))

    update_fields: dict[str, Any] = {
        "status": normalized_status,
        "progress_percentage": 100 if normalized_status == "completed" else progress,
        "updated_at": utc_now(),
    }
    if payload.get("notes") is not None:
        update_fields["notes"] = payload.get("notes")
    if normalized_status in {"in_progress", "completed"} and not existing.get("started_at"):
        update_fields["started_at"] = utc_now()
    if normalized_status == "completed":
        update_fields["completed_at"] = existing.get("completed_at") or utc_now()
    elif existing.get("completed_at"):
        update_fields["completed_at"] = None

    await db.user_course_progress.update_one({"_id": existing["_id"]}, {"$set": update_fields})
    updated = await db.user_course_progress.find_one({"_id": existing["_id"]})
    await _sync_learning_path_course(user_object_id, course_id, updated["status"])

    if updated["status"] == "completed":
        await update_skill_progress_after_course_completion(user_object_id, updated)

    action_type = "course_completed" if updated["status"] == "completed" else "course_progress_updated"
    await create_progress_log(
        user_object_id,
        action_type,
        updated["course_title"],
        f"Course marked {updated['status'].replace('_', ' ')} at {updated['progress_percentage']}%.",
        entity_type="course",
        entity_id=course_id,
        metadata={"minutes_spent": payload.get("minutes_spent", 0)},
    )
    return serialize_document(updated)


async def update_skill_progress_after_course_completion(user_id: ObjectId | str, course_progress: dict[str, Any]) -> list[dict[str, Any]]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    course_id = str(course_progress.get("course_id"))
    related_skills = _unique_strings(course_progress.get("related_skills", []))
    updated_skills: list[dict[str, Any]] = []
    for skill_name in related_skills:
        existing = await db.user_skill_progress.find_one({"user_id": user_object_id, "skill_name": skill_name})
        if not existing:
            await db.user_skill_progress.insert_one(
                create_skill_progress_document(
                    user_id=user_object_id,
                    skill_name=skill_name,
                    category="course skill",
                    related_career_path_id=course_progress.get("career_path_id"),
                    related_course_ids=[course_id],
                )
            )
            existing = await db.user_skill_progress.find_one({"user_id": user_object_id, "skill_name": skill_name})

        already_counted = course_id in existing.get("completed_courses", [])
        next_progress = int(existing.get("progress_percentage", 0)) if already_counted else clamp_percentage(int(existing.get("progress_percentage", 0)) + 25)
        update_fields = {
            "progress_percentage": next_progress,
            "status": status_from_progress(next_progress),
            "last_updated_reason": f"Completed {course_progress.get('course_title', 'a course')}.",
            "updated_at": utc_now(),
        }
        await db.user_skill_progress.update_one(
            {"_id": existing["_id"]},
            {
                "$set": update_fields,
                "$addToSet": {"completed_courses": course_id, "related_course_ids": course_id},
            },
        )
        updated = await db.user_skill_progress.find_one({"_id": existing["_id"]})
        if updated:
            updated_skills.append(serialize_document(updated))
            if not already_counted:
                await create_progress_log(
                    user_object_id,
                    "skill_progress_updated",
                    updated["skill_name"],
                    f"Skill progress increased to {updated['progress_percentage']}% after completing a related course.",
                    entity_type="skill",
                    entity_id=updated["skill_name"],
                    metadata={"course_id": course_id},
                )
    return updated_skills


async def get_user_skill_progress(user_id: ObjectId | str) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    await _initialize_skills_from_learning_path(user_object_id)
    documents = await db.user_skill_progress.find({"user_id": user_object_id}).sort([("category", 1), ("skill_name", 1)]).to_list(length=None)
    skills = serialize_documents(documents)
    grouped_by_category: dict[str, list[dict[str, Any]]] = {}
    for skill in skills:
        grouped_by_category.setdefault(skill.get("category", "general"), []).append(skill)
    return {"total": len(skills), "skills": skills, "grouped_by_status": _group_by_status(skills), "grouped_by_category": grouped_by_category}


async def update_skill_progress(user_id: ObjectId | str, skill_name: str, payload: dict[str, Any]) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    clean_skill_name = skill_name.strip()
    if not clean_skill_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Skill name is required")
    existing = await db.user_skill_progress.find_one({"user_id": user_object_id, "skill_name": clean_skill_name})
    related_career_path_id = object_id_or_none(payload.get("related_career_path_id"), "related_career_path_id")
    if not existing:
        document = create_skill_progress_document(
            user_id=user_object_id,
            skill_name=clean_skill_name,
            category=payload.get("category") or "manual",
            level=payload.get("level") or "beginner",
            related_career_path_id=related_career_path_id,
        )
        insert_result = await db.user_skill_progress.insert_one(document)
        existing = await db.user_skill_progress.find_one({"_id": insert_result.inserted_id})

    progress = payload.get("progress_percentage")
    if progress is None:
        if payload.get("status") == "completed":
            progress = 100
        elif payload.get("status") == "not_started":
            progress = 0
        else:
            progress = int(existing.get("progress_percentage", 0))
    progress = clamp_percentage(progress)
    normalized_status = _validate_status(payload.get("status"), status_from_progress(progress, existing.get("status", "not_started")))
    update_fields = {
        "progress_percentage": 100 if normalized_status == "completed" else progress,
        "status": normalized_status,
        "updated_at": utc_now(),
        "last_updated_reason": payload.get("reason") or "Manual progress update.",
    }
    if payload.get("category"):
        update_fields["category"] = payload["category"]
    if payload.get("level"):
        update_fields["level"] = payload["level"]
    if related_career_path_id:
        update_fields["related_career_path_id"] = related_career_path_id
    await db.user_skill_progress.update_one({"_id": existing["_id"]}, {"$set": update_fields})
    updated = await db.user_skill_progress.find_one({"_id": existing["_id"]})
    await create_progress_log(
        user_object_id,
        "skill_progress_updated",
        updated["skill_name"],
        f"Skill marked {updated['status'].replace('_', ' ')} at {updated['progress_percentage']}%.",
        entity_type="skill",
        entity_id=updated["skill_name"],
    )
    return serialize_document(updated)


async def get_learning_path_progress(user_id: ObjectId | str) -> dict[str, Any]:
    user_object_id = to_object_id(user_id, "user_id")
    path = await _maybe_active_path(user_object_id)
    if not path:
        return {"active": False, "overall_progress_percentage": 0, "phases": []}
    await initialize_course_progress_from_learning_path(user_object_id, path)
    phases: list[dict[str, Any]] = []
    for phase in path.get("phases", []):
        courses = phase.get("recommended_courses", [])
        completed_courses = sum(1 for course in courses if course.get("status") == "completed")
        phases.append(
            {
                "phase_id": phase.get("phase_id"),
                "title": phase.get("title"),
                "status": phase.get("status"),
                "progress_percentage": phase.get("progress_percentage", 0),
                "total_courses": len(courses),
                "completed_courses": completed_courses,
                "started_at": phase.get("started_at"),
                "completed_at": phase.get("completed_at"),
            }
        )
    current_phase = next((phase for phase in phases if phase.get("phase_id") == path.get("current_phase_id")), None)
    return serialize_document(
        {
            "active": True,
            "learning_path_id": path["_id"],
            "title": path.get("title"),
            "selected_career_title": path.get("selected_career_title"),
            "overall_progress_percentage": path.get("overall_progress_percentage", 0),
            "current_phase_id": path.get("current_phase_id"),
            "current_phase": current_phase,
            "next_best_course": path.get("next_best_course"),
            "phases": phases,
        }
    )


async def recalculate_all_progress(user_id: ObjectId | str) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    path = await _maybe_active_path(user_object_id)
    course_count = 0
    if path:
        await initialize_course_progress_from_learning_path(user_object_id, path)
        course_progress = await db.user_course_progress.find({"user_id": user_object_id, "learning_path_id": path["_id"]}).to_list(length=None)
        progress_map = {item["course_id"]: item for item in course_progress}
        for phase in path.get("phases", []):
            for course in phase.get("recommended_courses", []):
                progress = progress_map.get(str(course.get("course_id")))
                if progress:
                    course["status"] = progress.get("status", "not_started")
                    course_count += 1
        _refresh_path_progress(path)
        await db.adaptive_learning_paths.update_one({"_id": path["_id"]}, {"$set": _update_payload(path)})
        await _initialize_skills_from_learning_path(user_object_id, path)
    await create_progress_log(user_object_id, "progress_recalculated", "Progress recalculated", "Course, skill, and learning path progress were recalculated.")
    summary = await get_progress_summary(user_object_id)
    summary["recalculated_courses"] = course_count
    return summary


async def add_study_activity(user_id: ObjectId | str, payload: dict[str, Any]) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    activity_payload = {
        **payload,
        "date": _normalize_activity_date(payload.get("date")),
        "courses_studied": _unique_strings(payload.get("courses_studied", [])),
        "skills_practiced": _unique_strings(payload.get("skills_practiced", [])),
    }
    existing = await db.study_activity_logs.find_one({"user_id": user_object_id, "date": activity_payload["date"]})
    if existing:
        notes = activity_payload.get("notes") or ""
        update = {
            "$inc": {
                "minutes_spent": int(activity_payload.get("minutes_spent") or 0),
                "tasks_completed": int(activity_payload.get("tasks_completed") or 0),
            },
            "$addToSet": {
                "courses_studied": {"$each": activity_payload["courses_studied"]},
                "skills_practiced": {"$each": activity_payload["skills_practiced"]},
            },
            "$set": {"updated_at": utc_now()},
        }
        if notes:
            update["$set"]["notes"] = f"{existing.get('notes', '')}\n{notes}".strip()
        await db.study_activity_logs.update_one({"_id": existing["_id"]}, update)
        document = await db.study_activity_logs.find_one({"_id": existing["_id"]})
    else:
        result = await db.study_activity_logs.insert_one(create_study_activity_document(user_object_id, activity_payload))
        document = await db.study_activity_logs.find_one({"_id": result.inserted_id})

    await create_progress_log(
        user_object_id,
        "study_activity_logged",
        "Study activity logged",
        f"Logged {activity_payload.get('minutes_spent', 0)} minutes of study activity.",
        entity_type="study_activity",
        entity_id=document["date"],
    )
    return serialize_document(document)


async def get_weekly_study_activity(user_id: ObjectId | str) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    today = utc_now().date()
    days = [(today - timedelta(days=offset)).isoformat() for offset in range(6, -1, -1)]
    documents = await db.study_activity_logs.find({"user_id": user_object_id, "date": {"$in": days}}).to_list(length=None)
    by_date = {document["date"]: document for document in documents}
    breakdown = [
        {
            "date": day,
            "label": _date_label(day),
            "minutes_spent": int(by_date.get(day, {}).get("minutes_spent", 0)),
            "tasks_completed": int(by_date.get(day, {}).get("tasks_completed", 0)),
        }
        for day in days
    ]
    total_minutes = sum(item["minutes_spent"] for item in breakdown)
    return {
        "days": breakdown,
        "total_minutes": total_minutes,
        "total_hours": round(total_minutes / 60, 1),
        "average_minutes_per_day": round(total_minutes / 7),
    }


async def calculate_learning_streak(user_id: ObjectId | str) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    documents = await db.study_activity_logs.find({"user_id": user_object_id}).sort("date", -1).to_list(length=None)
    active_dates = {
        date.fromisoformat(document["date"])
        for document in documents
        if int(document.get("minutes_spent", 0)) > 0 or int(document.get("tasks_completed", 0)) > 0
    }
    if not active_dates:
        return {"current_streak_days": 0, "longest_streak_days": 0, "last_activity_date": None}

    today = utc_now().date()
    latest = max(active_dates)
    current = 0
    cursor = today if today in active_dates else today - timedelta(days=1)
    if latest < cursor:
        cursor = latest
        if latest < today - timedelta(days=1):
            current = 0
        else:
            while cursor in active_dates:
                current += 1
                cursor -= timedelta(days=1)
    else:
        while cursor in active_dates:
            current += 1
            cursor -= timedelta(days=1)

    longest = 0
    running = 0
    previous: date | None = None
    for activity_date in sorted(active_dates):
        if previous and activity_date == previous + timedelta(days=1):
            running += 1
        else:
            running = 1
        longest = max(longest, running)
        previous = activity_date
    return {"current_streak_days": current, "longest_streak_days": longest, "last_activity_date": latest.isoformat()}


async def get_recent_progress_logs(user_id: ObjectId | str, limit: int = 20) -> list[dict[str, Any]]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    documents = await db.progress_logs.find({"user_id": user_object_id}).sort("created_at", -1).to_list(length=max(1, min(limit, 100)))
    return serialize_documents(documents)


async def get_progress_summary(user_id: ObjectId | str) -> dict[str, Any]:
    user_object_id = to_object_id(user_id, "user_id")
    course_response = await get_user_course_progress(user_object_id)
    skill_response = await get_user_skill_progress(user_object_id)
    learning_path_progress = await get_learning_path_progress(user_object_id)
    weekly = await get_weekly_study_activity(user_object_id)
    streak = await calculate_learning_streak(user_object_id)
    logs = await get_recent_progress_logs(user_object_id, limit=8)
    courses = course_response["courses"]
    skills = skill_response["skills"]
    completed_courses = sum(1 for course in courses if course.get("status") == "completed")
    in_progress_courses = sum(1 for course in courses if course.get("status") == "in_progress")
    completed_skills = sum(1 for skill in skills if skill.get("status") == "completed")
    in_progress_skills = sum(1 for skill in skills if skill.get("status") == "in_progress")
    average_course_progress = round(sum(int(course.get("progress_percentage", 0)) for course in courses) / len(courses)) if courses else 0
    overall_progress = learning_path_progress.get("overall_progress_percentage") or average_course_progress
    return {
        "overall_progress_percentage": overall_progress,
        "total_courses": len(courses),
        "completed_courses": completed_courses,
        "in_progress_courses": in_progress_courses,
        "not_started_courses": len(courses) - completed_courses - in_progress_courses,
        "total_skills": len(skills),
        "completed_skills": completed_skills,
        "in_progress_skills": in_progress_skills,
        "weekly_minutes": weekly["total_minutes"],
        "weekly_hours": weekly["total_hours"],
        "current_streak_days": streak["current_streak_days"],
        "longest_streak_days": streak["longest_streak_days"],
        "active_learning_path": learning_path_progress,
        "progress_by_phase": learning_path_progress.get("phases", []),
        "next_recommended_task": learning_path_progress.get("next_best_course"),
        "recent_logs": logs,
    }


async def get_progress_context_for_recommendations(user_id: ObjectId | str) -> dict[str, Any]:
    user_object_id = to_object_id(user_id, "user_id")
    return {
        "course_progress": (await get_user_course_progress(user_object_id))["courses"],
        "skill_progress": (await get_user_skill_progress(user_object_id))["skills"],
        "learning_path_progress": await get_learning_path_progress(user_object_id),
        "weekly_activity": await get_weekly_study_activity(user_object_id),
        "recent_logs": await get_recent_progress_logs(user_object_id, limit=10),
    }
