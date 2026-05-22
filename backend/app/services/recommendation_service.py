from typing import Any

from app.utils.object_id import serialize_documents


def _normalize(values: list[str] | None) -> set[str]:
    return {value.strip().lower() for value in values or [] if value and value.strip()}


def _difficulty_rank(value: str | None) -> int:
    return {"beginner": 1, "intermediate": 2, "advanced": 3}.get(str(value or "").lower(), 1)


def _next_level_score(course_difficulty: str | None, completed_skills: set[str]) -> int:
    rank = _difficulty_rank(course_difficulty)
    if completed_skills and rank == 2:
        return 18
    if len(completed_skills) >= 4 and rank == 3:
        return 14
    if not completed_skills and rank == 1:
        return 10
    return 4


def get_recommendations(
    user_goal: str,
    current_skills: list[str],
    completed_courses: list[str],
    in_progress_courses: list[str],
    completed_skills: list[str],
    course_candidates: list[dict[str, Any]] | None = None,
    limit: int = 5,
) -> list[dict[str, Any]]:
    completed_course_set = _normalize(completed_courses)
    in_progress_course_set = _normalize(in_progress_courses)
    current_skill_set = _normalize(current_skills)
    completed_skill_set = _normalize(completed_skills)
    goal_tokens = _normalize(user_goal.replace("/", " ").split())
    missing_skills = current_skill_set - completed_skill_set

    scored: list[dict[str, Any]] = []
    for course in course_candidates or []:
        title = str(course.get("title") or course.get("course_title") or "")
        if title.lower() in completed_course_set:
            continue
        related_skills = _normalize(course.get("related_skills", []))
        related_careers = _normalize([str(item) for item in course.get("related_careers", [])])
        course_text = _normalize(
            " ".join(
                [
                    title,
                    str(course.get("description") or ""),
                    str(course.get("provider") or ""),
                    str(course.get("difficulty") or ""),
                ]
            ).split()
        )
        score = 0
        score += len(related_skills & missing_skills) * 20
        score += len(related_skills & completed_skill_set) * 7
        score += len(goal_tokens & (course_text | related_skills | related_careers)) * 8
        score += _next_level_score(course.get("difficulty"), completed_skill_set)
        if title.lower() in in_progress_course_set:
            score -= 25
        scored.append(
            {
                **course,
                "recommendation_score": score,
                "recommendation_reason": _recommendation_reason(
                    title,
                    related_skills,
                    missing_skills,
                    completed_skill_set,
                    title.lower() in in_progress_course_set,
                ),
            }
        )

    return sorted(scored, key=lambda item: item["recommendation_score"], reverse=True)[:limit]


def _recommendation_reason(
    title: str,
    related_skills: set[str],
    missing_skills: set[str],
    completed_skills: set[str],
    is_in_progress: bool,
) -> str:
    if related_skills & missing_skills:
        return f"{title} targets missing skills: {', '.join(sorted(related_skills & missing_skills)[:3])}"
    if related_skills & completed_skills:
        return f"{title} builds on completed skills: {', '.join(sorted(related_skills & completed_skills)[:3])}"
    if is_in_progress:
        return f"{title} is already in progress, so it is deprioritized"
    return f"{title} matches the learner's next roadmap step"


async def get_recommendations_for_user(db, user_id, user_goal: str, current_skills: list[str]) -> list[dict[str, Any]]:
    progress_courses = await db.user_course_progress.find({"user_id": user_id}).to_list(length=None)
    progress_skills = await db.user_skill_progress.find({"user_id": user_id}).to_list(length=None)
    completed_courses = [course["course_title"] for course in progress_courses if course.get("status") == "completed"]
    in_progress_courses = [course["course_title"] for course in progress_courses if course.get("status") == "in_progress"]
    completed_skills = [skill["skill_name"] for skill in progress_skills if skill.get("status") == "completed"]
    candidate_courses = await db.learning_resources.find({}).to_list(length=None)
    return get_recommendations(
        user_goal=user_goal,
        current_skills=current_skills,
        completed_courses=completed_courses,
        in_progress_courses=in_progress_courses,
        completed_skills=completed_skills,
        course_candidates=serialize_documents(candidate_courses),
    )
