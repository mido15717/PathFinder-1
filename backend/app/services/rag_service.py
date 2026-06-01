import re
from typing import Any

WEIGHTS = {
    "career": 25,
    "skill": 25,
    "missing": 20,
    "subjects": 10,
    "goal": 10,
    "difficulty": 5,
    "quality": 5,
}

DIFFICULTY_SCORE = {
    "beginner": {"beginner": 1.0, "intermediate": 0.65, "advanced": 0.25},
    "intermediate": {"beginner": 0.8, "intermediate": 1.0, "advanced": 0.7},
    "advanced": {"beginner": 0.6, "intermediate": 0.9, "advanced": 1.0},
}


def normalize(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(value).lower()).strip()


def terms(values: list[str] | str | None) -> set[str]:
    if values is None:
        return set()
    if isinstance(values, str):
        values = [values]
    return {normalize(value) for value in values if normalize(value)}


def priority_level(score: int) -> str:
    if score >= 80:
        return "high"
    if score >= 60:
        return "medium"
    return "low"


def build_semantic_query(
    user_profile: dict[str, Any],
    selected_career: dict[str, Any],
    latest_assessment: dict[str, Any] | None,
    query: str | None = None,
) -> str:
    parts = [
        query or "",
        selected_career.get("title", ""),
        user_profile.get("career_goal", ""),
        " ".join(user_profile.get("current_skills", [])),
    ]
    if latest_assessment:
        parts.extend(
            [
                latest_assessment.get("programming_level", ""),
                " ".join(latest_assessment.get("favorite_subjects", [])),
                " ".join(latest_assessment.get("current_skills", [])),
                latest_assessment.get("career_goal", ""),
                latest_assessment.get("preferred_area", ""),
            ]
        )
    missing_skills = selected_career.get("required_skills", [])
    current_terms = terms(user_profile.get("current_skills", []))
    parts.append(" ".join(skill for skill in missing_skills if normalize(skill) not in current_terms))
    return " ".join(part for part in parts if part).strip()


def _overlap(selected: list[str], course_values: list[str]) -> tuple[float, list[str]]:
    selected_terms = terms(selected)
    course_terms = terms(course_values)
    if not selected_terms or not course_terms:
        return 0.0, []
    matched = [value for value in selected if normalize(value) in course_terms]
    return len(matched) / max(len(selected_terms), 1), matched


def _contains_any(values: list[str], text: str) -> bool:
    normalized_text = normalize(text)
    return any(normalize(value) and normalize(value) in normalized_text for value in values)


def _career_score(selected_career: dict[str, Any], course: dict[str, Any]) -> float:
    career_title = selected_career.get("title", "")
    career_slug = selected_career.get("slug", "")
    career_values = [career_title, career_slug, *selected_career.get("tags", [])]
    course_text = " ".join(
        [
            course.get("title", ""),
            course.get("description", ""),
            " ".join(course.get("related_careers", [])),
            " ".join(course.get("tags", [])),
            course.get("embedding_text", ""),
        ]
    )
    if _contains_any([career_title, career_slug], course_text):
        return 1.0
    return 0.7 if _contains_any(career_values, course_text) else 0.0


def _difficulty_score(programming_level: str, course_difficulty: str) -> float:
    level = normalize(programming_level or "beginner")
    difficulty = normalize(course_difficulty or "beginner")
    return DIFFICULTY_SCORE.get(level, {}).get(difficulty, 0.65)


def _quality_score(rating: float | int | None) -> float:
    if rating is None:
        return 0.7
    return max(0.0, min(float(rating) / 5.0, 1.0))


def _passes_filters(course: dict[str, Any], filters: dict[str, Any]) -> bool:
    if filters.get("difficulty") and normalize(course.get("difficulty")) != normalize(filters["difficulty"]):
        return False
    if filters.get("provider") and normalize(course.get("provider")) != normalize(filters["provider"]):
        return False
    if filters.get("course_type") and normalize(course.get("course_type")) != normalize(filters["course_type"]):
        return False
    if filters.get("skill") and normalize(filters["skill"]) not in terms(course.get("related_skills", [])):
        return False
    return True


def _reason(
    course: dict[str, Any],
    selected_career: dict[str, Any],
    current_skills: list[str],
    missing_skills_covered: list[str],
    programming_level: str,
) -> str:
    matched = ", ".join(current_skills[:3]) if current_skills else "your current foundation"
    missing = ", ".join(missing_skills_covered[:3]) if missing_skills_covered else "important next skills"
    return (
        f"This course is recommended because it supports your selected career path {selected_career['title']}, "
        f"matches {matched}, and helps you improve {missing}. Its {course['difficulty']} difficulty fits your current "
        f"programming level {programming_level or 'beginner'}."
    )


def generate_course_recommendations(
    user_profile: dict[str, Any],
    selected_career: dict[str, Any],
    latest_assessment: dict[str, Any] | None,
    courses: list[dict[str, Any]],
    query: str | None = None,
    filters: dict[str, Any] | None = None,
) -> dict[str, Any]:
    filters = filters or {}
    current_skills = list(dict.fromkeys([*user_profile.get("current_skills", []), *(latest_assessment or {}).get("current_skills", [])]))
    favorite_subjects = (latest_assessment or {}).get("favorite_subjects", [])
    career_goal = (latest_assessment or {}).get("career_goal") or user_profile.get("career_goal", "")
    programming_level = (latest_assessment or {}).get("programming_level", "beginner")
    career_required_skills = selected_career.get("required_skills", [])
    current_terms = terms(current_skills)
    missing_skills = [skill for skill in career_required_skills if normalize(skill) not in current_terms]
    query_used = build_semantic_query(user_profile, selected_career, latest_assessment, query)

    scored: list[dict[str, Any]] = []
    seen_courses: set[str] = set()
    for course in courses:
        if not course.get("is_active", True) or str(course.get("_id")) in seen_courses or not _passes_filters(course, filters):
            continue
        seen_courses.add(str(course.get("_id")))
        career_score = _career_score(selected_career, course)
        skill_score, matched_skills = _overlap(current_skills, course.get("related_skills", []))
        missing_score, missing_covered = _overlap(missing_skills, course.get("related_skills", []))
        subject_score, _ = _overlap(favorite_subjects, course.get("related_subjects", []))
        goal_score = 1.0 if _contains_any([career_goal, query_used], course.get("embedding_text", "")) else 0.4
        difficulty_score = _difficulty_score(programming_level, course.get("difficulty", "beginner"))
        quality_score = _quality_score(course.get("rating"))
        weighted = (
            career_score * WEIGHTS["career"]
            + skill_score * WEIGHTS["skill"]
            + missing_score * WEIGHTS["missing"]
            + subject_score * WEIGHTS["subjects"]
            + goal_score * WEIGHTS["goal"]
            + difficulty_score * WEIGHTS["difficulty"]
            + quality_score * WEIGHTS["quality"]
        )
        score = max(0, min(100, round(weighted)))
        scored.append(
            {
                "course_id": course["_id"],
                "title": course["title"],
                "provider": course["provider"],
                "url": course["url"],
                "difficulty": course["difficulty"],
                "course_type": course["course_type"],
                "related_skills": course.get("related_skills", []),
                "relevance_score": score,
                "recommendation_reason": _reason(course, selected_career, matched_skills, missing_covered, programming_level),
                "matched_skills": matched_skills,
                "missing_skills_covered": missing_covered,
                "priority_level": priority_level(score),
            }
        )

    scored.sort(key=lambda item: item["relevance_score"], reverse=True)
    max_results = int(filters.get("max_results") or 12)
    strong = [item for item in scored if item["relevance_score"] >= 35]
    recommended = (strong if len(strong) >= min(max_results, 6) else scored)[:max_results]
    return {
        "query_used": query_used,
        "recommended_courses": recommended,
        "explanation_summary": (
            f"Recommendations are ranked for {selected_career['title']} using your assessment, selected career, "
            f"current skills, missing skills, favorite subjects, goal, programming level, and course quality."
        ),
    }
