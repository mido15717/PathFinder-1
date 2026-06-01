from __future__ import annotations

import re
from typing import Any


BIG_FIVE_TRAITS = [
    "Openness",
    "Conscientousness",
    "Extraversion",
    "Agreeableness",
    "Emotional_Range",
    "Conversation",
    "Openness to Change",
    "Hedonism",
    "Self-enhancement",
    "Self-transcendence",
]

MODEL1_TECH_FEATURES = ["Computer Architecture", "Programming Skills", "Project Management", "Communication skills"]
MODEL1_COLUMNS = [*MODEL1_TECH_FEATURES, *BIG_FIVE_TRAITS]

CANONICAL_TO_PATHFINDER = {
    "Artificial Intelligence": "AI Engineer",
    "Data Science": "Data Scientist",
    "Data Science & Analytics": "Data Scientist",
    "Security": "Cybersecurity Analyst",
    "Software Development and Engineering": "Backend Developer",
    "Web and Application Development": "Frontend Developer",
    "User Experience (UX) and User Interface (UI) Design": "UI/UX Designer",
}

PATHFINDER_TO_CANONICAL = {
    "AI Engineer": "Artificial Intelligence",
    "Machine Learning Engineer": "Artificial Intelligence",
    "Data Scientist": "Data Science & Analytics",
    "Backend Developer": "Software Development and Engineering",
    "Frontend Developer": "Web and Application Development",
    "Mobile App Developer": "Web and Application Development",
    "Cybersecurity Analyst": "Security",
    "Cloud Engineer": "Software Development and Engineering",
    "DevOps Engineer": "Software Development and Engineering",
    "UI/UX Designer": "User Experience (UX) and User Interface (UI) Design",
}

MODEL1_LABEL_TO_CANONICAL = {
    "Artificial Intelligence": "Artificial Intelligence",
    "Data Science": "Data Science & Analytics",
    "Data Science & Analytics": "Data Science & Analytics",
    "Security": "Security",
    "Software Development and Engineering": "Software Development and Engineering",
    "User Experience (UX) and User Interface (UI) Design": "User Experience (UX) and User Interface (UI) Design",
    "Web and Application Development": "Web and Application Development",
}

MODEL2_LABEL_TO_CANONICAL = {
    "Artificial Intelligence": "Artificial Intelligence",
    "Data Science": "Data Science & Analytics",
    "Data Science & Analytics": "Data Science & Analytics",
    "Security": "Security",
    "Software Development and Engineering": "Software Development and Engineering",
    "User Experience (UX) and User Interface (UI) Design": "User Experience (UX) and User Interface (UI) Design",
    "Web and Application Development": "Web and Application Development",
}

PROGRAMMING_RATINGS = {"beginner": 4, "intermediate": 7, "advanced": 9}

TEXT_SKILL_HINTS = {
    "ai": ["Artificial Intelligence and Machine Learning", "Machine Learning", "Deep Learning", "Python"],
    "artificial intelligence": ["Artificial Intelligence and Machine Learning", "Machine Learning", "Deep Learning", "Python"],
    "machine learning": ["Machine Learning", "Artificial Intelligence and Machine Learning", "Python", "Statistics"],
    "data": ["Data Analysis", "Data Analysis and Visualization", "Statistics", "SQL", "Python"],
    "analytics": ["Data Analysis", "Data Analysis and Visualization", "Statistics", "SQL"],
    "security": ["Cybersecurity", "Cyber Security", "Network Security", "Linux"],
    "cyber": ["Cybersecurity", "Cyber Security", "Network Security", "Linux"],
    "web": ["Web Development", "JavaScript", "React", "HTML/CSS"],
    "frontend": ["Web Development", "JavaScript", "React", "HTML/CSS", "UI/UX Design"],
    "backend": ["Backend Development", "FastAPI", "SQL", "MongoDB", "Python"],
    "mobile": ["Mobile Development", "React Native", "JavaScript", "TypeScript"],
    "design": ["UI/UX Design", "Figma", "Human Computer Interaction", "User Experience"],
    "ux": ["UI/UX Design", "Figma", "Human Computer Interaction", "User Experience"],
    "cloud": ["Cloud Basics", "Cloud Computing", "Linux", "Docker"],
    "devops": ["Cloud Computing", "Docker", "Linux", "Automation"],
}


def normalize_text(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(value or "").lower()).strip()


def dedupe_strings(values: list[Any] | tuple[Any, ...] | set[Any] | None) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for value in values or []:
        text = str(value or "").strip()
        key = normalize_text(text)
        if text and key and key not in seen:
            result.append(text)
            seen.add(key)
    return result


def rating_to_proficiency(rating: int | float | None) -> dict[str, int | str]:
    value = float(rating or 0)
    if value <= 1:
        return {"label": "none", "level": 0}
    if value <= 5:
        return {"label": "beginner", "level": 1}
    if value <= 7:
        return {"label": "intermediate", "level": 2}
    if value <= 9:
        return {"label": "advanced", "level": 3}
    return {"label": "mastered", "level": 4}


def canonical_to_pathfinder(label: str | None) -> str:
    if not label:
        return ""
    return CANONICAL_TO_PATHFINDER.get(label, label)


def pathfinder_to_canonical(label: str | None) -> str:
    if not label:
        return ""
    return PATHFINDER_TO_CANONICAL.get(label, label)


def map_model_label(label: Any, model_type: str) -> tuple[str, str]:
    raw = str(label)
    mapping = MODEL2_LABEL_TO_CANONICAL if model_type == "skills_model" else MODEL1_LABEL_TO_CANONICAL
    canonical = mapping.get(raw, raw)
    return canonical, canonical_to_pathfinder(canonical)


def _set_rating(ratings: dict[str, int], skill: str | None, value: int) -> None:
    if not skill:
        return
    ratings[skill] = max(ratings.get(skill, 0), max(0, min(10, value)))


def _rating_from_progress(progress: Any) -> int:
    try:
        return max(1, min(10, round(float(progress or 0) / 10)))
    except (TypeError, ValueError):
        return 0


def _add_text_hints(ratings: dict[str, int], *values: Any) -> None:
    haystack = " ".join(normalize_text(value) for value in values if value)
    for keyword, skills in TEXT_SKILL_HINTS.items():
        if keyword in haystack:
            for skill in skills:
                _set_rating(ratings, skill, 6)


def build_ratings_from_context(
    assessment: dict[str, Any] | None,
    profile: dict[str, Any] | None,
    skill_progress: list[dict[str, Any]] | None = None,
    completed_courses: list[dict[str, Any]] | None = None,
) -> dict[str, int]:
    assessment = assessment or {}
    profile = profile or {}
    ratings: dict[str, int] = {}

    programming_level = normalize_text(assessment.get("programming_level") or profile.get("programming_level"))
    programming_rating = PROGRAMMING_RATINGS.get(programming_level, 5)
    _set_rating(ratings, "Programming Skills", programming_rating)
    _set_rating(ratings, "Programming", programming_rating)

    for skill in [*(assessment.get("current_skills") or []), *(profile.get("current_skills") or [])]:
        _set_rating(ratings, skill, 7)

    for item in skill_progress or []:
        _set_rating(ratings, item.get("skill_name"), _rating_from_progress(item.get("progress_percentage")))

    for course in completed_courses or []:
        for skill in course.get("related_skills", []):
            _set_rating(ratings, skill, 8)

    _add_text_hints(
        ratings,
        assessment.get("preferred_area"),
        assessment.get("career_goal"),
        assessment.get("preferred_work_type"),
        " ".join(assessment.get("favorite_subjects") or []),
        profile.get("career_goal"),
        profile.get("selected_career_title"),
    )

    if "project" in normalize_text(assessment.get("learning_style")):
        _set_rating(ratings, "Project Management", 5)
    if any("communication" in normalize_text(trait) for trait in (assessment.get("personality_traits") or [])):
        _set_rating(ratings, "Communication skills", 6)

    _set_rating(ratings, "Project Management", ratings.get("Project Management", 3))
    _set_rating(ratings, "Communication skills", ratings.get("Communication skills", 4))
    _set_rating(ratings, "Computer Architecture", ratings.get("Computer Architecture", 3))
    return ratings


def active_skills_from_ratings(ratings: dict[str, int]) -> list[str]:
    return sorted(skill for skill, rating in ratings.items() if rating_to_proficiency(rating)["level"] >= 1)


def _skill_matches(user_skill: str, profile_skill: str) -> bool:
    user = normalize_text(user_skill)
    profile = normalize_text(profile_skill)
    return bool(user and profile and (user == profile or user in profile or profile in user))


def score_row_from_active_skills(active_skills: list[str], feature_schema: dict[str, list[str]], feature_names: list[str]) -> dict[str, int]:
    row = {name: 0 for name in feature_names}
    for feature, skills in feature_schema.items():
        row[feature] = sum(1 for skill in skills if any(_skill_matches(active, skill) for active in active_skills))
    if "f_sparse_row" in row:
        row["f_sparse_row"] = 1 if len(active_skills) < 2 else 0
    return row


def build_skills_model_features(ratings: dict[str, int], feature_schema: dict[str, list[str]], feature_names: list[str]) -> Any:
    active_skills = active_skills_from_ratings(ratings)
    row = score_row_from_active_skills(active_skills, feature_schema, feature_names)
    try:
        import pandas as pd  # type: ignore

        return pd.DataFrame([[row[name] for name in feature_names]], columns=feature_names)
    except ImportError:
        return [[row[name] for name in feature_names]]


def build_personality_model_features(assessment: dict[str, Any] | None, ratings: dict[str, int]) -> Any:
    assessment = assessment or {}
    personality_values = {trait: 0.5 for trait in BIG_FIVE_TRAITS}
    answers = assessment.get("answers") or {}
    normalized_answers = {normalize_text(key): value for key, value in answers.items()}

    for trait in BIG_FIVE_TRAITS:
        answer_value = normalized_answers.get(normalize_text(trait))
        if isinstance(answer_value, (int, float)):
            personality_values[trait] = max(0.0, min(1.0, float(answer_value)))

    for trait in assessment.get("personality_traits") or []:
        normalized_trait = normalize_text(trait)
        for feature in BIG_FIVE_TRAITS:
            if normalize_text(feature) in normalized_trait or normalized_trait in normalize_text(feature):
                personality_values[feature] = 0.75

    row: dict[str, float | int] = {}
    for feature in MODEL1_TECH_FEATURES:
        row[feature] = rating_to_proficiency(ratings.get(feature))["level"]
    row.update(personality_values)

    try:
        import pandas as pd  # type: ignore

        return pd.DataFrame([[row[name] for name in MODEL1_COLUMNS]], columns=MODEL1_COLUMNS)
    except ImportError:
        return [[row[name] for name in MODEL1_COLUMNS]]


def probability_items(classes: list[Any], probabilities: list[float], model_type: str) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for label, probability in zip(classes, probabilities, strict=False):
        canonical, career_title = map_model_label(label, model_type)
        items.append(
            {
                "label": str(label),
                "canonical_label": canonical,
                "career_title": career_title,
                "confidence_score": round(float(probability) * 100),
            }
        )
    return sorted(items, key=lambda item: item["confidence_score"], reverse=True)


def input_summary(assessment: dict[str, Any] | None, profile: dict[str, Any] | None, ratings: dict[str, int]) -> dict[str, Any]:
    assessment = assessment or {}
    profile = profile or {}
    return {
        "preferred_area": assessment.get("preferred_area", ""),
        "programming_level": assessment.get("programming_level", ""),
        "favorite_subjects": dedupe_strings(assessment.get("favorite_subjects") or []),
        "current_skills": dedupe_strings([*(assessment.get("current_skills") or []), *(profile.get("current_skills") or [])]),
        "career_goal": assessment.get("career_goal") or profile.get("career_goal", ""),
        "selected_career_title": profile.get("selected_career_title", ""),
        "active_skills": active_skills_from_ratings(ratings),
    }
