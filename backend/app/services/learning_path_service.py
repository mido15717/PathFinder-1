from datetime import timedelta
from math import ceil
from typing import Any

from bson import ObjectId
from fastapi import HTTPException, status

from app.db.mongodb import get_database
from app.models.learning_path_model import create_learning_path_document, create_learning_path_update_document
from app.models.base_model import utc_now
from app.utils.object_id import serialize_document, serialize_documents, to_object_id

PHASE_DEFINITIONS = [
    {
        "phase_id": "phase-1-foundations",
        "title": "Foundations",
        "description": "Build programming basics, Git/GitHub habits, and practical problem solving.",
        "difficulty": "beginner",
        "required_skills": ["Programming", "Python", "Git/GitHub", "Basic Problem Solving"],
        "optional_skills": ["JavaScript", "Linux", "HTML/CSS"],
        "prerequisites": [],
        "suggested_projects": ["Create a GitHub profile", "Build a small command-line project", "Publish one beginner project repository"],
    },
    {
        "phase_id": "phase-2-core-cs",
        "title": "Core Computer Science",
        "description": "Strengthen data structures, algorithms, databases, APIs, and system basics.",
        "difficulty": "intermediate",
        "required_skills": ["Data Structures", "Algorithms", "Databases", "SQL", "APIs"],
        "optional_skills": ["MongoDB", "Networks", "Testing"],
        "prerequisites": ["Complete Foundations"],
        "suggested_projects": ["Build a CRUD API", "Solve 20 coding practice problems", "Design a simple database schema"],
    },
    {
        "phase_id": "phase-3-specialization",
        "title": "Career Specialization",
        "description": "Focus on the technical skills required for the selected career path.",
        "difficulty": "advanced",
        "required_skills": [],
        "optional_skills": [],
        "prerequisites": ["Complete Core Computer Science"],
        "suggested_projects": [],
    },
    {
        "phase_id": "phase-4-projects-portfolio",
        "title": "Projects and Portfolio",
        "description": "Turn learning into portfolio projects that demonstrate job-ready skills.",
        "difficulty": "advanced",
        "required_skills": ["Projects", "Git/GitHub", "Portfolio"],
        "optional_skills": ["Deployment", "Documentation", "Testing"],
        "prerequisites": ["Complete Career Specialization"],
        "suggested_projects": ["Build a capstone project", "Write project documentation", "Improve GitHub repository presentation"],
    },
    {
        "phase_id": "phase-5-job-preparation",
        "title": "Interview and Job Preparation",
        "description": "Prepare for interviews, coding practice, resume updates, and LinkedIn presentation.",
        "difficulty": "advanced",
        "required_skills": ["Interview Practice", "Coding Practice", "Resume", "LinkedIn"],
        "optional_skills": ["Communication", "Portfolio Review"],
        "prerequisites": ["Complete Projects and Portfolio"],
        "suggested_projects": ["Prepare a resume draft", "Practice mock interviews", "Write project case studies"],
    },
]

SPECIALIZATION_SKILLS = {
    "ai": ["Machine Learning", "Statistics", "Mathematics", "Model Deployment"],
    "machine learning": ["Machine Learning", "Data Analysis", "MLOps", "Model Deployment"],
    "data scientist": ["Data Analysis", "Statistics", "SQL", "Data Visualization"],
    "backend": ["FastAPI", "Databases", "Authentication", "REST APIs", "Docker"],
    "frontend": ["React", "TypeScript", "API Integration", "Responsive UI"],
    "mobile": ["React Native", "Expo", "Mobile Navigation", "Mobile APIs"],
    "cybersecurity": ["Networks", "Linux", "OWASP", "Security Tools"],
    "cloud": ["Linux", "Docker", "Cloud Basics", "Infrastructure"],
    "devops": ["Linux", "Docker", "CI/CD", "Kubernetes"],
    "ui/ux": ["Figma", "Wireframing", "Design Systems", "Usability Testing"],
}


def _normalize(value: Any) -> str:
    return " ".join(str(value).lower().replace("/", " ").replace("-", " ").split())


def _target_date(latest_assessment: dict[str, Any] | None, total_weeks: int) -> Any:
    months = (latest_assessment or {}).get("target_deadline_months")
    days = int(months * 30) if months else total_weeks * 7
    return utc_now() + timedelta(days=max(days, 30))


def _specialization_skills(career: dict[str, Any]) -> list[str]:
    text = _normalize(f"{career.get('title', '')} {' '.join(career.get('tags', []))}")
    for keyword, skills in SPECIALIZATION_SKILLS.items():
        if keyword in text:
            return list(dict.fromkeys([*skills, *career.get("required_skills", [])[:3]]))
    return career.get("required_skills", [])[:5]


def _course_key(course: dict[str, Any]) -> str:
    return str(course.get("course_id") or course.get("_id"))


def _course_text(course: dict[str, Any]) -> str:
    values = [
        course.get("title", ""),
        course.get("description", ""),
        course.get("difficulty", ""),
        course.get("course_type", ""),
        " ".join(course.get("related_skills", [])),
        " ".join(course.get("related_subjects", [])),
        " ".join(course.get("tags", [])),
    ]
    return _normalize(" ".join(values))


def _phase_match_score(course: dict[str, Any], phase: dict[str, Any]) -> int:
    text = _course_text(course)
    skills = [*phase["required_skills"], *phase["optional_skills"]]
    skill_score = sum(1 for skill in skills if _normalize(skill) and _normalize(skill) in text)
    difficulty_score = 2 if course.get("difficulty") == phase["difficulty"] else 1 if phase["difficulty"] in {"intermediate", "advanced"} else 0
    project_score = 2 if phase["phase_id"] == "phase-4-projects-portfolio" and course.get("course_type") == "project" else 0
    priority_score = {"high": 3, "medium": 2, "low": 1}.get(course.get("priority_level", "medium"), 1)
    return skill_score * 3 + difficulty_score + project_score + priority_score


def _course_item(course: dict[str, Any], reason: str | None = None, priority: str | None = None) -> dict[str, Any]:
    return {
        "course_id": _course_key(course),
        "title": course.get("title", ""),
        "provider": course.get("provider", ""),
        "difficulty": course.get("difficulty", "beginner"),
        "estimated_hours": int(course.get("estimated_hours") or 8),
        "status": "not_started",
        "priority_level": priority or course.get("priority_level", "medium"),
        "reason": reason or course.get("recommendation_reason") or f"Supports {', '.join(course.get('related_skills', [])[:3])}.",
    }


def _alternative_item(course: dict[str, Any]) -> dict[str, Any]:
    return {
        "course_id": _course_key(course),
        "title": course.get("title", ""),
        "provider": course.get("provider", ""),
        "difficulty": course.get("difficulty", "beginner"),
    }


def _build_course_pool(
    latest_recommendation: dict[str, Any] | None,
    saved_courses: list[dict[str, Any]],
    available_courses: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    course_map = {str(course["_id"]): course for course in available_courses}
    pool: list[dict[str, Any]] = []
    seen: set[str] = set()
    for recommended in (latest_recommendation or {}).get("recommended_courses", []):
        course_id = str(recommended.get("course_id"))
        base = dict(course_map.get(course_id, {}))
        base.update(recommended)
        base["course_id"] = course_id
        base["priority_level"] = recommended.get("priority_level", "high")
        if course_id not in seen:
            pool.append(base)
            seen.add(course_id)
    for saved in saved_courses:
        course_id = str(saved.get("course_id"))
        base = dict(course_map.get(course_id, {}))
        base.update(saved)
        base["course_id"] = course_id
        base["priority_level"] = "high"
        base["recommendation_reason"] = "You saved this course, so it is prioritized in your adaptive path."
        if course_id not in seen:
            pool.append(base)
            seen.add(course_id)
    for course in available_courses:
        course_id = str(course["_id"])
        if course_id not in seen:
            item = dict(course)
            item["course_id"] = course_id
            item["priority_level"] = "medium"
            pool.append(item)
            seen.add(course_id)
    return pool


def calculate_phase_progress(phase: dict[str, Any]) -> int:
    courses = phase.get("recommended_courses", [])
    if not courses:
        return 0
    completed = sum(1 for course in courses if course.get("status") == "completed")
    return round((completed / len(courses)) * 100)


def calculate_overall_progress(path: dict[str, Any]) -> int:
    phases = path.get("phases", [])
    if not phases:
        return 0
    return round(sum(phase.get("progress_percentage", 0) for phase in phases) / len(phases))


def unlock_next_phase(path: dict[str, Any]) -> dict[str, Any]:
    phases = path.get("phases", [])
    for index, phase in enumerate(phases):
        if phase.get("status") == "completed" and index + 1 < len(phases) and phases[index + 1].get("status") == "locked":
            phases[index + 1]["status"] = "unlocked"
            break
    return path


def _next_best_course(path: dict[str, Any]) -> dict[str, Any] | None:
    for phase in path.get("phases", []):
        if phase.get("status") in {"unlocked", "in_progress"}:
            for course in phase.get("recommended_courses", []):
                if course.get("status") != "completed":
                    return {
                        "course_id": course["course_id"],
                        "title": course["title"],
                        "provider": course["provider"],
                        "difficulty": course["difficulty"],
                        "reason": course.get("reason", "This is the next best course for your current phase."),
                    }
    return None


def _refresh_path_progress(path: dict[str, Any]) -> dict[str, Any]:
    for phase in path.get("phases", []):
        phase["progress_percentage"] = calculate_phase_progress(phase)
        if phase["progress_percentage"] == 100 and phase.get("status") != "completed":
            phase["status"] = "completed"
            phase["completed_at"] = utc_now()
    unlock_next_phase(path)
    path["overall_progress_percentage"] = calculate_overall_progress(path)
    path["next_best_course"] = _next_best_course(path)
    path["current_course_id"] = path["next_best_course"]["course_id"] if path.get("next_best_course") else None
    active_phase = next((phase for phase in path.get("phases", []) if phase.get("status") in {"in_progress", "unlocked"}), None)
    path["current_phase_id"] = active_phase["phase_id"] if active_phase else None
    path["updated_at"] = utc_now()
    path["last_adapted_at"] = utc_now()
    if path["overall_progress_percentage"] == 100:
        path["status"] = "completed"
    return path


def _update_payload(path: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in path.items() if key != "_id"}


def _build_phases(career: dict[str, Any], course_pool: list[dict[str, Any]], weekly_hours: int, ml_missing_skills: list[str] | None = None) -> list[dict[str, Any]]:
    phases: list[dict[str, Any]] = []
    used_courses: set[str] = set()
    ml_missing_skills = list(dict.fromkeys(ml_missing_skills or []))
    for order, template in enumerate(PHASE_DEFINITIONS, start=1):
        phase = dict(template)
        if phase["phase_id"] == "phase-2-core-cs" and ml_missing_skills:
            phase["optional_skills"] = list(dict.fromkeys([*ml_missing_skills[:3], *phase["optional_skills"]]))
        if phase["phase_id"] == "phase-3-specialization":
            phase["required_skills"] = list(dict.fromkeys([*ml_missing_skills[:4], *_specialization_skills(career)]))
            phase["optional_skills"] = career.get("recommended_tools", [])[:4]
            phase["suggested_projects"] = career.get("suggested_projects", [])[:3]
        scored = sorted(
            [(item, _phase_match_score(item, phase)) for item in course_pool if _course_key(item) not in used_courses],
            key=lambda pair: pair[1],
            reverse=True,
        )
        selected = [item for item, score in scored if score > 2][:3]
        if len(selected) < 2:
            selected.extend([item for item, _ in scored if item not in selected][: 2 - len(selected)])
        for item in selected:
            used_courses.add(_course_key(item))
        alternatives = [item for item, score in scored if item not in selected and score > 1][:2]
        total_hours = sum(int(item.get("estimated_hours") or 8) for item in selected) or 8
        phase["order"] = order
        phase["estimated_weeks"] = max(1, ceil(total_hours / max(weekly_hours, 1)))
        phase["status"] = "unlocked" if order == 1 else "locked"
        phase["recommended_courses"] = [_course_item(item) for item in selected]
        phase["alternative_courses"] = [_alternative_item(item) for item in alternatives]
        phase["progress_percentage"] = 0
        phase["started_at"] = None
        phase["completed_at"] = None
        phases.append(phase)
    return phases


async def create_learning_path_update_log(
    user_id: ObjectId,
    learning_path_id: ObjectId,
    update_type: str,
    reason: str,
    previous_state_summary: str,
    new_state_summary: str,
) -> None:
    db = get_database()
    await db.learning_path_updates.insert_one(
        create_learning_path_update_document(user_id, learning_path_id, update_type, reason, previous_state_summary, new_state_summary)
    )


async def generate_adaptive_learning_path(user_id: ObjectId | str) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    profile = await db.user_profiles.find_one({"user_id": user_object_id})
    if not profile or not profile.get("selected_career_path_id"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please complete the Career Assessment and select a career path first.")
    career_object_id = to_object_id(profile["selected_career_path_id"], "career_path_id")
    career = await db.career_paths.find_one({"_id": career_object_id, "is_active": True})
    if not career:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Selected career path not found")
    latest_assessment = await db.career_assessments.find_one({"user_id": user_object_id}, sort=[("created_at", -1)])
    latest_recommendation = await db.course_recommendations.find_one({"user_id": user_object_id}, sort=[("created_at", -1)])
    latest_ml_prediction = await db.ml_career_predictions.find_one({"user_id": user_object_id}, sort=[("created_at", -1)])
    latest_ml_missing = (latest_ml_prediction or {}).get("missing_skills") or []
    ml_missing_skills = list(dict.fromkeys(latest_ml_missing[:6]))
    ml_alternative_career = None
    if latest_ml_prediction and latest_ml_prediction.get("final_recommended_career") != career["title"]:
        ml_alternative_career = latest_ml_prediction.get("final_recommended_career")
    saved_courses = await db.saved_courses.find({"user_id": user_object_id}).to_list(length=None)
    available_courses = await db.courses.find({"is_active": True, "$or": [{"related_careers": career["title"]}, {"related_skills": {"$in": [*career.get("required_skills", []), *ml_missing_skills]}}]}).to_list(length=None)
    if not available_courses:
        available_courses = await db.courses.find({"is_active": True}).to_list(length=25)
    weekly_hours = int(profile.get("weekly_available_hours") or (latest_assessment or {}).get("weekly_available_hours") or 6)
    course_pool = _build_course_pool(latest_recommendation, saved_courses, available_courses)
    phases = _build_phases(career, course_pool, weekly_hours, ml_missing_skills)
    next_course = _next_best_course({"phases": phases})
    total_weeks = sum(phase["estimated_weeks"] for phase in phases)
    document = create_learning_path_document(
        user_id=user_object_id,
        career_path_id=career_object_id,
        assessment_id=latest_assessment["_id"] if latest_assessment else None,
        selected_career_title=career["title"],
        title=f"{career['title']} Adaptive Learning Path",
        description=f"A personalized roadmap for becoming a {career['title']} using assessment, recommendations, saved courses, and weekly availability.",
        weekly_available_hours=weekly_hours,
        target_completion_date=_target_date(latest_assessment, total_weeks),
        generated_from="recommendations" if latest_recommendation else "assessment",
        phases=phases,
        next_best_course=next_course,
    )
    document["ml_prediction_id"] = latest_ml_prediction["_id"] if latest_ml_prediction else None
    document["ml_alternative_career"] = ml_alternative_career
    document["ml_missing_skills"] = ml_missing_skills
    document["ml_informed_note"] = (
        f"ML skills model gaps were added to early phases: {', '.join(ml_missing_skills[:5])}."
        if ml_missing_skills
        else None
    )
    await db.adaptive_learning_paths.update_many({"user_id": user_object_id, "status": "active"}, {"$set": {"status": "paused", "updated_at": utc_now()}})
    result = await db.adaptive_learning_paths.insert_one(document)
    document["_id"] = result.inserted_id
    await create_learning_path_update_log(user_object_id, result.inserted_id, "generated", "Generated adaptive learning path.", "", f"{len(phases)} phases created.")
    serialized = serialize_document(document)
    return {
        "learning_path_id": str(result.inserted_id),
        "learning_path": serialized,
        "next_best_course": serialized.get("next_best_course"),
        "explanation_summary": "The path organizes recommendations, saved courses, and career skills into five adaptive phases.",
    }


async def get_active_learning_path(user_id: ObjectId | str) -> dict[str, Any]:
    db = get_database()
    path = await db.adaptive_learning_paths.find_one({"user_id": to_object_id(user_id, "user_id"), "status": "active"}, sort=[("created_at", -1)])
    if not path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active learning path found")
    return serialize_document(path)


async def get_learning_path_by_id(user_id: ObjectId | str, learning_path_id: str) -> dict[str, Any]:
    db = get_database()
    path = await db.adaptive_learning_paths.find_one({"_id": to_object_id(learning_path_id, "learning_path_id"), "user_id": to_object_id(user_id, "user_id")})
    if not path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning path not found")
    return serialize_document(path)


async def _load_active_path(user_id: ObjectId | str) -> dict[str, Any]:
    db = get_database()
    path = await db.adaptive_learning_paths.find_one({"user_id": to_object_id(user_id, "user_id"), "status": "active"}, sort=[("created_at", -1)])
    if not path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active learning path found")
    return path


async def start_course(user_id: ObjectId | str, course_id: str) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    path = await _load_active_path(user_object_id)
    previous = f"{path.get('overall_progress_percentage', 0)}% complete"
    found = False
    for phase in path["phases"]:
        for course in phase.get("recommended_courses", []):
            if course["course_id"] == course_id:
                course["status"] = "in_progress"
                phase["status"] = "in_progress"
                phase["started_at"] = phase.get("started_at") or utc_now()
                found = True
                break
        if found:
            break
    if not found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found in active learning path")
    _refresh_path_progress(path)
    await db.adaptive_learning_paths.update_one({"_id": path["_id"]}, {"$set": _update_payload(path)})
    await create_learning_path_update_log(user_object_id, path["_id"], "course_started", f"Started course {course_id}.", previous, "Course marked in progress.")
    return serialize_document(path)


async def complete_course(user_id: ObjectId | str, course_id: str) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    path = await _load_active_path(user_object_id)
    previous = f"{path.get('overall_progress_percentage', 0)}% complete"
    found = False
    for phase in path["phases"]:
        for course in phase.get("recommended_courses", []):
            if course["course_id"] == course_id:
                course["status"] = "completed"
                found = True
                break
        if found:
            phase["progress_percentage"] = calculate_phase_progress(phase)
            if phase["progress_percentage"] == 100:
                phase["status"] = "completed"
                phase["completed_at"] = utc_now()
            elif phase.get("status") == "unlocked":
                phase["status"] = "in_progress"
            break
    if not found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found in active learning path")
    _refresh_path_progress(path)
    await db.adaptive_learning_paths.update_one({"_id": path["_id"]}, {"$set": _update_payload(path)})
    await create_learning_path_update_log(user_object_id, path["_id"], "course_completed", f"Completed course {course_id}.", previous, f"{path['overall_progress_percentage']}% complete")
    return serialize_document(path)


async def complete_phase(user_id: ObjectId | str, phase_id: str) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    path = await _load_active_path(user_object_id)
    previous = f"{path.get('overall_progress_percentage', 0)}% complete"
    phase = next((item for item in path["phases"] if item["phase_id"] == phase_id), None)
    if not phase:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Phase not found in active learning path")
    if calculate_phase_progress(phase) < 100 and phase.get("recommended_courses"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Complete all recommended courses in this phase first")
    phase["status"] = "completed"
    phase["progress_percentage"] = 100
    phase["completed_at"] = utc_now()
    _refresh_path_progress(path)
    await db.adaptive_learning_paths.update_one({"_id": path["_id"]}, {"$set": _update_payload(path)})
    await create_learning_path_update_log(user_object_id, path["_id"], "phase_completed", f"Completed phase {phase_id}.", previous, f"{path['overall_progress_percentage']}% complete")
    return serialize_document(path)


async def recalculate_learning_path(user_id: ObjectId | str) -> dict[str, Any]:
    user_object_id = to_object_id(user_id, "user_id")
    current = None
    try:
        current = await _load_active_path(user_object_id)
    except HTTPException:
        pass
    generated = await generate_adaptive_learning_path(user_object_id)
    db = get_database()
    if current:
        await create_learning_path_update_log(user_object_id, to_object_id(generated["learning_path_id"], "learning_path_id"), "recalculated", "Recalculated learning path from current user context.", f"Previous path {current['_id']}", "New active path generated.")
    return generated


async def get_next_best_course(user_id: ObjectId | str) -> dict[str, Any]:
    path = await get_active_learning_path(user_id)
    next_course = path.get("next_best_course")
    if not next_course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No next course found")
    return next_course


async def get_learning_path_updates(user_id: ObjectId | str) -> list[dict[str, Any]]:
    db = get_database()
    updates = await db.learning_path_updates.find({"user_id": to_object_id(user_id, "user_id")}).sort("created_at", -1).to_list(length=None)
    return serialize_documents(updates)
