from __future__ import annotations

from typing import Any

from app.ml.utils.model_loader import ML_UNAVAILABLE_MESSAGE, load_many_artifacts
from app.ml.utils.preprocessing import (
    active_skills_from_ratings,
    build_ratings_from_context,
    build_skills_model_features,
    probability_items,
)


SKILLS_ARTIFACTS = {
    "model": "skills/career_model.pkl",
    "career_profiles": "skills/career_profiles.pkl",
    "feature_names": "skills/feature_names.pkl",
    "feature_schema": "skills/feature_schema.pkl",
    "skill_gap_map": "skills/skill_gap_map.pkl",
    "label_encoder": "skills/skills_label_encoder.pkl",
}


def _normalize(value: Any) -> str:
    return " ".join(str(value or "").lower().replace("/", " ").replace("-", " ").split())


def _unavailable(reason: str | None = None) -> dict[str, Any]:
    return {
        "available": False,
        "model_type": "skills_model",
        "predicted_career": "",
        "canonical_label": "",
        "confidence_score": 0,
        "probabilities": [],
        "matched_skills": [],
        "missing_skills": [],
        "skill_gap": {"missing_skills": [], "beginner_skills": [], "intermediate_skills": [], "advanced_skills": []},
        "explanation": ML_UNAVAILABLE_MESSAGE,
        "skipped_reason": reason or ML_UNAVAILABLE_MESSAGE,
    }


def _skill_profile_gap(ratings: dict[str, int], active_skills: list[str], career_profiles: dict[str, Any], canonical_label: str) -> dict[str, list[str]]:
    profile_skills = career_profiles.get(canonical_label) or career_profiles.get(canonical_label.replace(" & Analytics", "")) or set()
    active_terms = {_normalize(skill) for skill in active_skills}
    gap = {"missing_skills": [], "beginner_skills": [], "intermediate_skills": [], "advanced_skills": []}

    for skill in sorted(profile_skills):
        normalized = _normalize(skill)
        rating = max(
            [value for key, value in ratings.items() if _normalize(key) == normalized or normalized in _normalize(key) or _normalize(key) in normalized]
            or [0]
        )
        if not any(normalized == term or normalized in term or term in normalized for term in active_terms):
            gap["missing_skills"].append(skill)
        elif rating <= 5:
            gap["beginner_skills"].append(skill)
        elif rating <= 7:
            gap["intermediate_skills"].append(skill)
        else:
            gap["advanced_skills"].append(skill)
    return gap


def run_skills_model(
    assessment: dict[str, Any] | None,
    profile: dict[str, Any] | None,
    skill_progress: list[dict[str, Any]] | None = None,
    completed_courses: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    artifacts = load_many_artifacts(SKILLS_ARTIFACTS)
    unavailable = [result for result in artifacts.values() if not result.available]
    if unavailable:
        return _unavailable(unavailable[0].error)

    model = artifacts["model"].artifact
    label_encoder = artifacts["label_encoder"].artifact
    feature_names = list(artifacts["feature_names"].artifact)
    feature_schema = dict(artifacts["feature_schema"].artifact)
    career_profiles = dict(artifacts["career_profiles"].artifact)

    try:
        ratings = build_ratings_from_context(assessment, profile, skill_progress, completed_courses)
        active_skills = active_skills_from_ratings(ratings)
        features = build_skills_model_features(ratings, feature_schema, feature_names)
        probabilities = model.predict_proba(features)[0]
        classes = list(getattr(label_encoder, "classes_", [])) or list(range(len(probabilities)))
        items = probability_items(classes, [float(value) for value in probabilities], "skills_model")
        best = items[0] if items else {}
        gap = _skill_profile_gap(ratings, active_skills, career_profiles, best.get("canonical_label", ""))
        return {
            "available": True,
            "model_type": "skills_model",
            "predicted_career": best.get("career_title", ""),
            "canonical_label": best.get("canonical_label", ""),
            "confidence_score": int(best.get("confidence_score", 0)),
            "probabilities": items,
            "matched_skills": [skill for skill in active_skills if skill not in gap["missing_skills"]][:12],
            "missing_skills": gap["missing_skills"][:12],
            "skill_gap": gap,
            "explanation": "Technical skills were transformed into the uploaded feature schema and compared against career profiles.",
            "skipped_reason": None,
        }
    except Exception as exc:  # noqa: BLE001 - ML service must degrade cleanly.
        return _unavailable(str(exc))
