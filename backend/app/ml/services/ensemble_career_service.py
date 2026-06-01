from __future__ import annotations

from typing import Any

from app.ml.utils.preprocessing import canonical_to_pathfinder, dedupe_strings


ENSEMBLE_WEIGHTS = {
    "rule_based": 0.40,
    "skills_model": 0.35,
    "personality_model": 0.25,
}


def _score_from_percentage(value: Any) -> float:
    try:
        return max(0.0, min(1.0, float(value or 0) / 100))
    except (TypeError, ValueError):
        return 0.0


def _rule_based_scores(matches: list[dict[str, Any]]) -> dict[str, float]:
    return {str(match.get("career_title", "")): _score_from_percentage(match.get("match_percentage")) for match in matches if match.get("career_title")}


def _model_scores(result: dict[str, Any]) -> dict[str, float]:
    if not result.get("available"):
        return {}
    scores: dict[str, float] = {}
    for item in result.get("probabilities", []):
        career_title = item.get("career_title") or canonical_to_pathfinder(item.get("canonical_label"))
        if career_title:
            scores[career_title] = max(scores.get(career_title, 0.0), _score_from_percentage(item.get("confidence_score")))
    if result.get("predicted_career"):
        scores[result["predicted_career"]] = max(scores.get(result["predicted_career"], 0.0), _score_from_percentage(result.get("confidence_score")))
    return scores


def _top_rule_match(matches: list[dict[str, Any]]) -> dict[str, Any]:
    return matches[0] if matches else {}


def build_ensemble_prediction(
    rule_based_matches: list[dict[str, Any]],
    personality_result: dict[str, Any],
    skills_result: dict[str, Any],
) -> dict[str, Any]:
    source_scores = {
        "rule_based": _rule_based_scores(rule_based_matches),
        "skills_model": _model_scores(skills_result),
        "personality_model": _model_scores(personality_result),
    }

    active_sources = {
        source: scores
        for source, scores in source_scores.items()
        if scores and (source == "rule_based" or (skills_result if source == "skills_model" else personality_result).get("available"))
    }
    active_weight_total = sum(ENSEMBLE_WEIGHTS[source] for source in active_sources) or 1.0
    careers = sorted({career for scores in active_sources.values() for career in scores})
    combined: list[dict[str, Any]] = []
    for career in careers:
        weighted_score = sum((ENSEMBLE_WEIGHTS[source] / active_weight_total) * scores.get(career, 0.0) for source, scores in active_sources.items())
        combined.append(
            {
                "career_title": career,
                "confidence_score": round(weighted_score * 100),
                "weighted_score": round(weighted_score, 4),
                "source_scores": {source: round(scores.get(career, 0.0) * 100) for source, scores in source_scores.items()},
            }
        )
    combined.sort(key=lambda item: item["weighted_score"], reverse=True)

    best = combined[0] if combined else {}
    rule_best = _top_rule_match(rule_based_matches)
    skipped = [
        result["model_type"]
        for result in [skills_result, personality_result]
        if not result.get("available")
    ]

    strengths = dedupe_strings([*rule_best.get("strengths", []), *skills_result.get("matched_skills", [])])[:8]
    missing_skills = dedupe_strings([*rule_best.get("missing_skills", []), *skills_result.get("missing_skills", [])])[:12]
    improvements = dedupe_strings([*rule_best.get("recommended_improvements", []), *[f"Build depth in {skill}." for skill in missing_skills[:4]]])[:8]

    explanation = "Final score blends rule-based matching, the skills model, and the personality model."
    if skipped:
        explanation += f" Skipped unavailable model(s): {', '.join(skipped)}."
    if len(active_sources) == 1 and "rule_based" in active_sources:
        explanation += " The rule-based matcher stayed active as the fallback signal."

    return {
        "final_recommended_career": best.get("career_title", rule_best.get("career_title", "")),
        "final_confidence_score": int(best.get("confidence_score", rule_best.get("match_percentage", 0) or 0)),
        "top_3_careers": combined[:3],
        "ensemble_result": {
            "weights": ENSEMBLE_WEIGHTS,
            "active_sources": list(active_sources.keys()),
            "skipped_models": skipped,
            "top_3_careers": combined[:3],
        },
        "explanation": explanation,
        "strengths": strengths,
        "missing_skills": missing_skills,
        "recommended_improvements": improvements,
    }
