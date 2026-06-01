from __future__ import annotations

from typing import Any

from app.ml.utils.model_loader import ML_UNAVAILABLE_MESSAGE, load_many_artifacts
from app.ml.utils.preprocessing import build_personality_model_features, build_ratings_from_context, probability_items


PERSONALITY_ARTIFACTS = {
    "model": "personality/calibrated_lgbm_model.pkl",
    "label_encoder": "personality/label_encoder.pkl",
    "scaler": "personality/scaler.pkl",
}


def _unavailable(reason: str | None = None) -> dict[str, Any]:
    return {
        "available": False,
        "model_type": "personality_model",
        "predicted_career": "",
        "canonical_label": "",
        "confidence_score": 0,
        "probabilities": [],
        "explanation": ML_UNAVAILABLE_MESSAGE,
        "skipped_reason": reason or ML_UNAVAILABLE_MESSAGE,
    }


def run_personality_model(
    assessment: dict[str, Any] | None,
    profile: dict[str, Any] | None,
    skill_progress: list[dict[str, Any]] | None = None,
    completed_courses: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    artifacts = load_many_artifacts(PERSONALITY_ARTIFACTS)
    unavailable = [result for result in artifacts.values() if not result.available]
    if unavailable:
        return _unavailable(unavailable[0].error)

    model = artifacts["model"].artifact
    label_encoder = artifacts["label_encoder"].artifact
    scaler = artifacts["scaler"].artifact

    try:
        ratings = build_ratings_from_context(assessment, profile, skill_progress, completed_courses)
        features = build_personality_model_features(assessment, ratings)
        scaled_features = scaler.transform(features) if hasattr(scaler, "transform") else features
        probabilities = model.predict_proba(scaled_features)[0]
        classes = list(getattr(label_encoder, "classes_", [])) or list(range(len(probabilities)))
        items = probability_items(classes, [float(value) for value in probabilities], "personality_model")
        best = items[0] if items else {}
        return {
            "available": True,
            "model_type": "personality_model",
            "predicted_career": best.get("career_title", ""),
            "canonical_label": best.get("canonical_label", ""),
            "confidence_score": int(best.get("confidence_score", 0)),
            "probabilities": items,
            "explanation": "Personality and value traits were combined with broad technical indicators from the assessment.",
            "skipped_reason": None,
        }
    except Exception as exc:  # noqa: BLE001 - ML service must degrade cleanly.
        return _unavailable(str(exc))
