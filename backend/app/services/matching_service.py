import re
from typing import Any

from bson import ObjectId
from fastapi import HTTPException, status

from app.db.mongodb import get_database
from app.models.user_model import utc_now
from app.utils.object_id import serialize_document, to_object_id

AREA_KEYWORDS = {
    "artificial intelligence": {"artificial intelligence", "ai", "machine learning", "deep learning", "models"},
    "data science": {"data science", "data analysis", "statistics", "machine learning", "analytics"},
    "software engineering": {"software engineering", "backend", "frontend", "applications", "architecture"},
    "web development": {"web development", "frontend", "backend", "react", "html css", "javascript"},
    "mobile development": {"mobile development", "mobile", "react native", "ios", "android"},
    "cybersecurity": {"cybersecurity", "security", "networks", "threats", "defense"},
    "cloud computing": {"cloud computing", "cloud", "infrastructure", "aws", "deployment"},
    "ui ux design": {"ui ux design", "ui", "ux", "design", "human computer interaction", "interfaces"},
}

PROGRAMMING_LEVEL_SCORE = {
    "beginner": {"beginner": 1.0, "intermediate": 0.65, "advanced": 0.35},
    "intermediate": {"beginner": 0.8, "intermediate": 1.0, "advanced": 0.75},
    "advanced": {"beginner": 0.65, "intermediate": 0.9, "advanced": 1.0},
}

WEIGHTS = {
    "area": 25,
    "skills": 25,
    "subjects": 15,
    "goal": 15,
    "programming_level": 10,
    "learning_style": 5,
    "weekly_hours": 5,
}


def _normalize(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(value).lower()).strip()


def _terms(values: list[str] | tuple[str, ...] | set[str] | str | None) -> set[str]:
    if values is None:
        return set()
    if isinstance(values, str):
        values = [values]
    normalized: set[str] = set()
    for value in values:
        text = _normalize(value)
        if text:
            normalized.add(text)
    return normalized


def _career_haystack(career: dict[str, Any]) -> str:
    values: list[str] = [
        career.get("title", ""),
        career.get("description", ""),
        career.get("overview", ""),
        career.get("difficulty_level", ""),
        career.get("market_demand", ""),
        career.get("salary_level", ""),
    ]
    for key in ("required_skills", "recommended_tools", "responsibilities", "tags", "related_subjects", "preferred_learning_styles"):
        values.extend(str(item) for item in career.get(key, []))
    return " ".join(_normalize(value) for value in values)


def _overlap_score(selected: list[str], career_values: list[str]) -> tuple[float, list[str]]:
    selected_terms = _terms(selected)
    career_terms = _terms(career_values)
    if not selected_terms or not career_terms:
        return 0.0, []
    matched = [value for value in selected if _normalize(value) in career_terms]
    return len(matched) / max(len(selected_terms), 1), matched


def _skill_score(current_skills: list[str], required_skills: list[str]) -> tuple[float, list[str], list[str]]:
    current_terms = _terms(current_skills)
    matched = [skill for skill in required_skills if _normalize(skill) in current_terms]
    missing = [skill for skill in required_skills if _normalize(skill) not in current_terms]
    if not required_skills:
        return 0.0, matched, missing
    return min(len(matched) / len(required_skills), 1.0), matched, missing


def _area_score(preferred_area: str, career: dict[str, Any]) -> float:
    normalized_area = _normalize(preferred_area)
    if normalized_area == "not sure yet":
        return 0.5
    keywords = AREA_KEYWORDS.get(normalized_area, {normalized_area})
    direct_haystack = " ".join(
        _normalize(value)
        for value in [career.get("title", ""), career.get("description", ""), *career.get("tags", [])]
    )
    if any(keyword in direct_haystack for keyword in keywords):
        return 1.0
    related_haystack = " ".join(_normalize(value) for value in [*career.get("related_subjects", []), *career.get("required_skills", [])])
    return 0.65 if any(keyword in related_haystack for keyword in keywords) else 0.0


def _goal_score(assessment: dict[str, Any], career: dict[str, Any]) -> float:
    haystack = _career_haystack(career)
    goal_terms = _terms([assessment.get("career_goal", ""), assessment.get("preferred_work_type", "")])
    if not goal_terms:
        return 0.0
    direct_matches = sum(1 for term in goal_terms if term in haystack)
    direct_score = min(direct_matches / len(goal_terms), 1.0) if direct_matches else 0.0
    work_type = _normalize(assessment.get("preferred_work_type", ""))
    soft_map = {
        "building applications": {"backend", "frontend", "mobile", "software", "applications"},
        "analyzing data": {"data", "statistics", "analytics", "machine learning"},
        "solving security problems": {"security", "cybersecurity", "networks"},
        "designing interfaces": {"design", "ux", "ui", "interfaces"},
        "working with infrastructure": {"cloud", "devops", "infrastructure"},
        "research and experimentation": {"ai", "machine learning", "research", "models"},
    }
    keywords = soft_map.get(work_type, set())
    mapped_score = 1.0 if any(keyword in haystack for keyword in keywords) else 0.4
    return max(direct_score, mapped_score)


def _programming_score(programming_level: str, career: dict[str, Any]) -> float:
    student_level = _normalize(programming_level)
    career_level = _normalize(career.get("difficulty_level", "beginner"))
    return PROGRAMMING_LEVEL_SCORE.get(student_level, {}).get(career_level, 0.5)


def _learning_style_score(learning_style: str, career: dict[str, Any]) -> float:
    preferred_styles = _terms(career.get("preferred_learning_styles", []))
    if not preferred_styles:
        return 0.5
    style = _normalize(learning_style)
    if style in preferred_styles or "mixed learning" in preferred_styles or style == "mixed learning":
        return 1.0
    return 0.4


def _weekly_hours_score(hours: int, career: dict[str, Any]) -> float:
    difficulty = _normalize(career.get("difficulty_level", "beginner"))
    if difficulty == "advanced":
        return 1.0 if hours >= 10 else 0.75 if hours >= 7 else 0.45
    if difficulty == "intermediate":
        return 1.0 if hours >= 7 else 0.8 if hours >= 4 else 0.5
    return 1.0 if hours >= 4 else 0.75


def _match_level(score: int) -> str:
    if score >= 85:
        return "excellent"
    if score >= 70:
        return "high"
    if score >= 50:
        return "medium"
    return "low"


def _build_reasons(
    assessment: dict[str, Any],
    career: dict[str, Any],
    area_score: float,
    matched_skills: list[str],
    matched_subjects: list[str],
    goal_score: float,
) -> list[str]:
    reasons: list[str] = []
    if area_score >= 0.8:
        reasons.append(f"Your interest in {assessment['preferred_area']} aligns strongly with {career['title']}.")
    if matched_skills:
        reasons.append(f"Your current skills match key requirements: {', '.join(matched_skills[:4])}.")
    if matched_subjects:
        reasons.append(f"Your favorite subjects overlap with this path: {', '.join(matched_subjects[:4])}.")
    if goal_score >= 0.8:
        reasons.append("Your career goal and preferred work style fit the responsibilities of this path.")
    if not reasons:
        reasons.append("This career shares some foundations with your assessment answers, but it needs focused preparation.")
    return reasons


def _improvements(missing_skills: list[str], career: dict[str, Any], hours: int) -> list[str]:
    improvements = [f"Build fundamentals in {skill}." for skill in missing_skills[:3]]
    if hours < 7 and career.get("difficulty_level") in {"intermediate", "advanced"}:
        improvements.append("Increase weekly study time to keep pace with this path.")
    project = next(iter(career.get("suggested_projects", [])), None)
    if project:
        improvements.append(f"Complete a portfolio project such as: {project}.")
    return improvements[:5]


def calculate_top_matches(assessment: dict[str, Any], careers: list[dict[str, Any]]) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    for career in careers:
        area_score = _area_score(assessment["preferred_area"], career)
        skills_score, matched_skills, missing_skills = _skill_score(assessment.get("current_skills", []), career.get("required_skills", []))
        subjects_score, matched_subjects = _overlap_score(assessment.get("favorite_subjects", []), career.get("related_subjects", []))
        goal_score = _goal_score(assessment, career)
        programming_score = _programming_score(assessment["programming_level"], career)
        learning_style_score = _learning_style_score(assessment["learning_style"], career)
        weekly_hours_score = _weekly_hours_score(assessment["weekly_available_hours"], career)
        weighted_score = (
            area_score * WEIGHTS["area"]
            + skills_score * WEIGHTS["skills"]
            + subjects_score * WEIGHTS["subjects"]
            + goal_score * WEIGHTS["goal"]
            + programming_score * WEIGHTS["programming_level"]
            + learning_style_score * WEIGHTS["learning_style"]
            + weekly_hours_score * WEIGHTS["weekly_hours"]
        )
        percentage = max(0, min(100, round(weighted_score)))
        strengths = list(dict.fromkeys(matched_skills + matched_subjects + [assessment["programming_level"], assessment["learning_style"]]))[:6]
        weaknesses = [f"Needs stronger {skill}." for skill in missing_skills[:4]]
        if not weaknesses:
            weaknesses = ["Keep building depth through applied projects."]
        results.append(
            {
                "career_path_id": career["_id"],
                "career_title": career["title"],
                "career_slug": career["slug"],
                "match_percentage": percentage,
                "match_level": _match_level(percentage),
                "reasons": _build_reasons(assessment, career, area_score, matched_skills, matched_subjects, goal_score),
                "strengths": strengths,
                "weaknesses": weaknesses,
                "recommended_improvements": _improvements(missing_skills, career, assessment["weekly_available_hours"]),
                "matched_skills": matched_skills,
                "missing_skills": missing_skills[:6],
            }
        )
    return sorted(results, key=lambda item: item["match_percentage"], reverse=True)[:3]


async def get_latest_match_for_user(user_id: ObjectId | str) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    match = await db.career_matches.find_one({"user_id": user_object_id}, sort=[("created_at", -1)])
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No career match result found")
    return serialize_document(match)


async def select_career_for_user(user_id: ObjectId | str, career_path_id: str) -> dict[str, Any]:
    db = get_database()
    user_object_id = to_object_id(user_id, "user_id")
    career_object_id = to_object_id(career_path_id, "career_path_id")
    career = await db.career_paths.find_one({"_id": career_object_id, "is_active": True})
    if not career:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Career path not found")

    now = utc_now()
    latest_match = await db.career_matches.find_one({"user_id": user_object_id}, sort=[("created_at", -1)])
    match_id = None
    if latest_match:
        match_id = latest_match["_id"]
        await db.career_matches.update_one(
            {"_id": latest_match["_id"]},
            {"$set": {"selected_career_id": career_object_id, "updated_at": now}},
        )

    await db.user_profiles.update_one(
        {"user_id": user_object_id},
        {
            "$set": {
                "selected_career_path_id": career_object_id,
                "selected_career_title": career["title"],
                "career_goal": career["title"],
                "updated_at": now,
            }
        },
        upsert=False,
    )

    return {
        "selected_career_id": str(career_object_id),
        "selected_career_title": career["title"],
        "match_id": str(match_id) if match_id else None,
    }
