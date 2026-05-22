import re
from typing import Any

from bson import ObjectId
from fastapi import HTTPException, status

from app.db.mongodb import get_database
from app.models.progress_model import create_progress_log_document, create_user_course_progress_document
from app.models.progress_model import create_user_learning_path_document, create_user_skill_progress_document
from app.utils.helpers import percentage, utc_now
from app.utils.object_id import serialize_document, serialize_documents, to_object_id

COURSE_WEIGHT = 0.5
ROADMAP_WEIGHT = 0.3
SKILL_WEIGHT = 0.2


async def create_progress_log(
    user_id: ObjectId,
    action_type: str,
    entity_type: str,
    entity_id: ObjectId | None,
    description: str,
    progress_value: float | None = None,
    old_status: str | None = None,
    new_status: str | None = None,
) -> None:
    db = get_database()
    await db.progress_logs.insert_one(
        create_progress_log_document(
            user_id,
            action_type,
            entity_type,
            entity_id,
            description,
            progress_value,
            old_status,
            new_status,
        )
    )


async def _find_skill_by_name(db, skill_name: str) -> dict[str, Any] | None:
    return await db.skills.find_one({"name": {"$regex": f"^{re.escape(skill_name)}$", "$options": "i"}})


async def _get_latest_user_roadmap(db, user_id: ObjectId) -> dict[str, Any] | None:
    return await db.user_roadmaps.find_one({"user_id": user_id}, sort=[("created_at", -1)])


async def _resolve_course_query(course_id: str) -> dict[str, Any]:
    if ObjectId.is_valid(course_id):
        return {"course_id": ObjectId(course_id)}
    return {"course_title": course_id}


async def _ensure_learning_path(current_user: dict[str, Any]) -> dict[str, Any] | None:
    db = get_database()
    user_id = current_user["_id"]
    learning_path = await db.user_learning_paths.find_one({"user_id": user_id}, sort=[("created_at", -1)])
    user_roadmap = await _get_latest_user_roadmap(db, user_id)

    if not user_roadmap:
        return learning_path

    roadmap = await db.roadmaps.find_one({"_id": user_roadmap["roadmap_id"]})
    if not roadmap:
        return learning_path

    selected_courses = await _ensure_course_progress_records(
        db,
        user_id,
        user_roadmap["career_path_id"],
        roadmap,
    )

    if learning_path and learning_path.get("roadmap_id") == user_roadmap["roadmap_id"]:
        await db.user_learning_paths.update_one(
            {"_id": learning_path["_id"]},
            {
                "$set": {
                    "selected_courses": selected_courses,
                    "current_phase_id": learning_path.get("current_phase_id") or _first_phase_id(roadmap),
                    "updated_at": utc_now(),
                }
            },
        )
        return await db.user_learning_paths.find_one({"_id": learning_path["_id"]})

    document = create_user_learning_path_document(
        user_id=user_id,
        career_path_id=user_roadmap["career_path_id"],
        roadmap_id=user_roadmap["roadmap_id"],
        selected_courses=selected_courses,
        current_phase_id=user_roadmap.get("current_phase_id") or _first_phase_id(roadmap),
    )
    await db.user_learning_paths.update_one(
        {"user_id": user_id, "roadmap_id": user_roadmap["roadmap_id"]},
        {"$setOnInsert": document},
        upsert=True,
    )
    return await db.user_learning_paths.find_one({"user_id": user_id, "roadmap_id": user_roadmap["roadmap_id"]})


async def _ensure_course_progress_records(
    db,
    user_id: ObjectId,
    career_path_id: ObjectId,
    roadmap: dict[str, Any],
) -> list[dict[str, Any]]:
    selected_courses: list[dict[str, Any]] = []
    seen_course_ids: set[ObjectId] = set()

    for phase in roadmap.get("phases", []):
        phase_id = phase.get("phase_id")
        course_titles = list(dict.fromkeys([*phase.get("resources", []), *phase.get("courses", [])]))
        for title in course_titles:
            resource = await db.learning_resources.find_one({"title": title})
            if not resource:
                continue
            course_id = resource["_id"]
            if course_id in seen_course_ids:
                continue
            seen_course_ids.add(course_id)
            related_skills = resource.get("related_skills") or phase.get("skills", [])
            selected_courses.append(
                {
                    "course_id": course_id,
                    "course_title": resource["title"],
                    "roadmap_phase_id": phase_id,
                    "related_skills": related_skills,
                }
            )
            document = create_user_course_progress_document(
                user_id=user_id,
                course_id=course_id,
                course_title=resource["title"],
                related_skills=related_skills,
                career_path_id=career_path_id,
                roadmap_phase_id=phase_id,
            )
            await db.user_course_progress.update_one(
                {"user_id": user_id, "course_id": course_id},
                {"$setOnInsert": document},
                upsert=True,
            )

    if not selected_courses:
        resources = await db.learning_resources.find({"related_careers": career_path_id}).to_list(length=None)
        for resource in resources:
            course_id = resource["_id"]
            selected_courses.append(
                {
                    "course_id": course_id,
                    "course_title": resource["title"],
                    "roadmap_phase_id": _first_phase_id(roadmap),
                    "related_skills": resource.get("related_skills", []),
                }
            )
            await db.user_course_progress.update_one(
                {"user_id": user_id, "course_id": course_id},
                {
                    "$setOnInsert": create_user_course_progress_document(
                        user_id,
                        course_id,
                        resource["title"],
                        resource.get("related_skills", []),
                        career_path_id,
                        _first_phase_id(roadmap),
                    )
                },
                upsert=True,
            )

    return selected_courses


def _first_phase_id(roadmap: dict[str, Any]) -> str | None:
    phases = sorted(roadmap.get("phases", []), key=lambda phase: phase.get("order", 0))
    return phases[0].get("phase_id") if phases else None


async def _sync_skills_from_completed_course(
    db,
    user_id: ObjectId,
    course: dict[str, Any],
) -> list[dict[str, Any]]:
    updated_skills: list[dict[str, Any]] = []
    for skill_name in course.get("related_skills", []):
        skill = await _find_skill_by_name(db, skill_name)
        skill_id = skill["_id"] if skill else None
        existing = await db.user_skill_progress.find_one({"user_id": user_id, "skill_name": skill_name})
        level = existing.get("level", "beginner") if existing else "beginner"
        if level == "beginner":
            level = "intermediate"
        document = create_user_skill_progress_document(
            user_id=user_id,
            skill_id=skill_id,
            skill_name=skill_name,
            level=level,
            status="completed",
            progress_percentage=100,
            source_course_id=course["course_id"],
        )
        await db.user_skill_progress.update_one(
            {"user_id": user_id, "skill_name": skill_name},
            {"$set": document},
            upsert=True,
        )
        if skill_id:
            await db.user_skills.update_one(
                {"user_id": user_id, "skill_id": skill_id},
                {
                    "$set": {
                        "skill_name": skill_name,
                        "level": level,
                        "status": "completed",
                        "progress_percentage": 100,
                        "completed_at": utc_now(),
                        "updated_at": utc_now(),
                    },
                    "$setOnInsert": {"started_at": utc_now(), "notes": "Updated from completed course"},
                },
                upsert=True,
            )
        updated_skills.append(document)
    return updated_skills


async def _calculate_phase_progress(db, user_id: ObjectId, roadmap: dict[str, Any]) -> list[dict[str, Any]]:
    courses = await db.user_course_progress.find({"user_id": user_id}).to_list(length=None)
    skills = await db.user_skill_progress.find({"user_id": user_id}).to_list(length=None)
    user_roadmap = await _get_latest_user_roadmap(db, user_id)
    phase_overrides = {
        phase.get("phase_id"): phase for phase in (user_roadmap or {}).get("phases_progress", [])
    }
    result: list[dict[str, Any]] = []

    for phase in sorted(roadmap.get("phases", []), key=lambda item: item.get("order", 0)):
        phase_id = phase.get("phase_id")
        phase_courses = [course for course in courses if course.get("roadmap_phase_id") == phase_id]
        completed_courses = [course for course in phase_courses if course.get("status") == "completed"]
        phase_skill_names = set(phase.get("skills", []))
        completed_skills = [
            skill
            for skill in skills
            if skill.get("status") == "completed" and skill.get("skill_name") in phase_skill_names
        ]
        course_score = percentage(len(completed_courses), len(phase_courses))
        skill_score = percentage(len(completed_skills), len(phase_skill_names))
        computed_progress = round((course_score * 0.65) + (skill_score * 0.35), 2)
        override = phase_overrides.get(phase_id) or {}
        progress_value = max(computed_progress, override.get("progress_percentage", 0))
        phase_status = override.get("status")
        if progress_value >= 100:
            phase_status = "completed"
        elif progress_value > 0:
            phase_status = phase_status or "in_progress"
        else:
            phase_status = phase_status or "not_started"

        result.append(
            {
                "phase_id": phase_id,
                "title": phase.get("title"),
                "description": phase.get("description"),
                "order": phase.get("order"),
                "status": phase_status,
                "progress_percentage": progress_value,
                "completed_courses": serialize_documents(completed_courses),
                "completed_skills": serialize_documents(completed_skills),
                "courses": serialize_documents(phase_courses),
                "skills": phase.get("skills", []),
            }
        )
    return result


async def _recalculate_learning_path(current_user: dict[str, Any]) -> dict[str, Any]:
    db = get_database()
    user_id = current_user["_id"]
    learning_path = await _ensure_learning_path(current_user)
    if not learning_path:
        return {
            "overall_progress_percentage": 0,
            "course_progress_percentage": 0,
            "skill_progress_percentage": 0,
            "roadmap_phase_progress_percentage": 0,
            "status": "not_started",
        }

    roadmap = await db.roadmaps.find_one({"_id": learning_path["roadmap_id"]})
    courses = await db.user_course_progress.find({"user_id": user_id}).to_list(length=None)
    skills = await db.user_skill_progress.find({"user_id": user_id}).to_list(length=None)
    phases = await _calculate_phase_progress(db, user_id, roadmap) if roadmap else []

    course_progress = round(sum(course.get("progress_percentage", 0) for course in courses) / len(courses), 2) if courses else 0
    skill_progress = round(sum(skill.get("progress_percentage", 0) for skill in skills) / len(skills), 2) if skills else 0
    phase_progress = round(sum(phase.get("progress_percentage", 0) for phase in phases) / len(phases), 2) if phases else 0
    overall = round((course_progress * COURSE_WEIGHT) + (phase_progress * ROADMAP_WEIGHT) + (skill_progress * SKILL_WEIGHT), 2)
    status_value = "completed" if overall >= 100 else "in_progress" if overall > 0 else "not_started"
    current_phase = next((phase for phase in phases if phase["status"] != "completed"), phases[-1] if phases else None)

    await db.user_learning_paths.update_one(
        {"_id": learning_path["_id"]},
        {
            "$set": {
                "overall_progress_percentage": overall,
                "status": status_value,
                "current_phase_id": current_phase.get("phase_id") if current_phase else learning_path.get("current_phase_id"),
                "updated_at": utc_now(),
            }
        },
    )

    user_roadmap = await _get_latest_user_roadmap(db, user_id)
    if user_roadmap:
        await db.user_roadmaps.update_one(
            {"_id": user_roadmap["_id"]},
            {
                "$set": {
                    "overall_progress": phase_progress,
                    "status": "completed" if phase_progress >= 100 else "in_progress" if phase_progress > 0 else "not_started",
                    "current_phase_id": current_phase.get("phase_id") if current_phase else user_roadmap.get("current_phase_id"),
                    "updated_at": utc_now(),
                }
            },
        )

    recalculated = await db.user_learning_paths.find_one({"_id": learning_path["_id"]})
    return {
        **(serialize_document(recalculated) or {}),
        "course_progress_percentage": course_progress,
        "skill_progress_percentage": skill_progress,
        "roadmap_phase_progress_percentage": phase_progress,
    }


async def get_progress_summary(current_user: dict[str, Any]) -> dict[str, Any]:
    db = get_database()
    user_id = current_user["_id"]
    learning_path = await _ensure_learning_path(current_user)
    recalculated = await _recalculate_learning_path(current_user)
    courses = await db.user_course_progress.find({"user_id": user_id}).to_list(length=None)
    skills = await db.user_skill_progress.find({"user_id": user_id}).to_list(length=None)
    roadmap = await db.roadmaps.find_one({"_id": learning_path["roadmap_id"]}) if learning_path else None
    phases = await _calculate_phase_progress(db, user_id, roadmap) if roadmap else []

    current_phase_id = recalculated.get("current_phase_id")
    current_phase = next((phase for phase in phases if phase["phase_id"] == current_phase_id), None)
    recent_logs = await db.progress_logs.find({"user_id": user_id}).sort("created_at", -1).to_list(length=5)
    next_task = _next_recommended_task(courses, phases)

    completed_courses_count = sum(1 for course in courses if course.get("status") == "completed")
    in_progress_courses_count = sum(1 for course in courses if course.get("status") == "in_progress")
    completed_skills_count = sum(1 for skill in skills if skill.get("status") == "completed")

    return {
        "overall_roadmap_progress": recalculated.get("roadmap_phase_progress_percentage", 0),
        "roadmap_progress": recalculated.get("roadmap_phase_progress_percentage", 0),
        "overall_progress_percentage": recalculated.get("overall_progress_percentage", 0),
        "completed_courses_count": completed_courses_count,
        "in_progress_courses_count": in_progress_courses_count,
        "not_started_courses_count": sum(1 for course in courses if course.get("status") == "not_started"),
        "completed_skills_count": completed_skills_count,
        "current_phase": current_phase,
        "next_recommended_task": next_task,
        "recent_activity": serialize_documents(recent_logs),
        "skills_progress": recalculated.get("skill_progress_percentage", 0),
        "courses_progress": recalculated.get("course_progress_percentage", 0),
    }


def _next_recommended_task(courses: list[dict[str, Any]], phases: list[dict[str, Any]]) -> str:
    in_progress = next((course for course in courses if course.get("status") == "in_progress"), None)
    if in_progress:
        return f"Continue {in_progress['course_title']}"
    not_started = next((course for course in courses if course.get("status") == "not_started"), None)
    if not_started:
        return f"Start {not_started['course_title']}"
    next_phase = next((phase for phase in phases if phase.get("status") != "completed"), None)
    if next_phase:
        return f"Work on {next_phase['title']}"
    return "Review portfolio evidence and prepare your next interview practice session"


async def get_course_progress(current_user: dict[str, Any]) -> dict[str, Any]:
    db = get_database()
    await _ensure_learning_path(current_user)
    courses = await db.user_course_progress.find({"user_id": current_user["_id"]}).sort("last_updated_at", -1).to_list(length=None)
    grouped = {
        "not_started": [],
        "in_progress": [],
        "completed": [],
        "all": serialize_documents(courses),
    }
    for course in courses:
        grouped[course.get("status", "not_started")].append(serialize_document(course))
    return grouped


async def update_course_progress(current_user: dict[str, Any], course_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    db = get_database()
    await _ensure_learning_path(current_user)
    query = {"user_id": current_user["_id"], **await _resolve_course_query(course_id)}
    course = await db.user_course_progress.find_one(query)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course progress not found")

    old_status = course.get("status", "not_started")
    new_status = payload.get("status") or old_status
    progress_value = payload.get("progress_percentage")
    if progress_value is None:
        progress_value = 100 if new_status == "completed" else 50 if new_status == "in_progress" else 0

    now = utc_now()
    update_doc: dict[str, Any] = {
        "status": new_status,
        "progress_percentage": progress_value,
        "last_updated_at": now,
    }
    if new_status in {"in_progress", "completed"} and not course.get("started_at"):
        update_doc["started_at"] = now
    if new_status == "completed":
        update_doc["completed_at"] = now
        update_doc["progress_percentage"] = 100

    await db.user_course_progress.update_one({"_id": course["_id"]}, {"$set": update_doc})
    updated = await db.user_course_progress.find_one({"_id": course["_id"]})
    updated_skills = await _sync_skills_from_completed_course(db, current_user["_id"], updated) if new_status == "completed" else []
    recalculated = await _recalculate_learning_path(current_user)
    await create_progress_log(
        current_user["_id"],
        "course.progress_updated",
        "course",
        updated["course_id"],
        f"Updated course progress for {updated['course_title']}",
        updated["progress_percentage"],
        old_status,
        new_status,
    )
    return {
        "course": serialize_document(updated),
        "updated_skills": serialize_documents(updated_skills),
        "learning_path": recalculated,
    }


async def get_roadmap_progress(current_user: dict[str, Any]) -> dict[str, Any]:
    db = get_database()
    learning_path = await _ensure_learning_path(current_user)
    if not learning_path:
        return {"overall_progress_percentage": 0, "phases": []}
    roadmap = await db.roadmaps.find_one({"_id": learning_path["roadmap_id"]})
    phases = await _calculate_phase_progress(db, current_user["_id"], roadmap) if roadmap else []
    return {
        "learning_path": serialize_document(learning_path),
        "overall_progress_percentage": learning_path.get("overall_progress_percentage", 0),
        "phases": phases,
    }


async def update_phase_progress(current_user: dict[str, Any], phase_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    db = get_database()
    user_id = current_user["_id"]
    learning_path = await _ensure_learning_path(current_user)
    user_roadmap = await _get_latest_user_roadmap(db, user_id)
    if not learning_path or not user_roadmap:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning path not found")

    phases_progress = user_roadmap.get("phases_progress", [])
    target = next((phase for phase in phases_progress if phase.get("phase_id") == phase_id), None)
    if not target:
        target = {
            "phase_id": phase_id,
            "status": "not_started",
            "progress_percentage": 0,
            "completed_skills": [],
            "started_at": None,
            "completed_at": None,
        }
        phases_progress.append(target)

    old_status = target.get("status", "not_started")
    new_status = payload.get("status") or old_status
    progress_value = payload.get("progress_percentage")
    if progress_value is None:
        progress_value = 100 if new_status == "completed" else target.get("progress_percentage", 0)

    target["status"] = new_status
    target["progress_percentage"] = progress_value
    if payload.get("completed_skills") is not None:
        target["completed_skills"] = payload["completed_skills"]
    if new_status in {"in_progress", "completed"} and not target.get("started_at"):
        target["started_at"] = utc_now()
    if new_status == "completed":
        target["completed_at"] = utc_now()
        target["progress_percentage"] = 100

    phase_average = round(sum(phase.get("progress_percentage", 0) for phase in phases_progress) / len(phases_progress), 2)
    await db.user_roadmaps.update_one(
        {"_id": user_roadmap["_id"]},
        {
            "$set": {
                "phases_progress": phases_progress,
                "overall_progress": phase_average,
                "status": "completed" if phase_average >= 100 else "in_progress" if phase_average > 0 else "not_started",
                "current_phase_id": phase_id if new_status != "completed" else user_roadmap.get("current_phase_id"),
                "updated_at": utc_now(),
            }
        },
    )
    recalculated = await _recalculate_learning_path(current_user)
    await create_progress_log(
        user_id,
        "roadmap.phase_updated",
        "roadmap_phase",
        None,
        f"Updated roadmap phase {phase_id}",
        target["progress_percentage"],
        old_status,
        new_status,
    )
    return {"phase": target, "learning_path": recalculated}


async def recalculate_progress(current_user: dict[str, Any]) -> dict[str, Any]:
    recalculated = await _recalculate_learning_path(current_user)
    await create_progress_log(
        current_user["_id"],
        "progress.recalculated",
        "learning_path",
        to_object_id(recalculated["_id"], "learning_path_id") if recalculated.get("_id") else None,
        "Recalculated overall progress from courses, skills, and roadmap phases",
        recalculated.get("overall_progress_percentage", 0),
    )
    return recalculated


async def get_progress_logs(current_user: dict[str, Any]) -> list[dict[str, Any]]:
    db = get_database()
    logs = await db.progress_logs.find({"user_id": current_user["_id"]}).sort("created_at", -1).to_list(length=100)
    return serialize_documents(logs)
