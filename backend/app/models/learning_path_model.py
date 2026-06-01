from typing import Any

from bson import ObjectId

from app.models.base_model import base_timestamps, clamp_percentage, safe_list, safe_string, utc_now


def create_learning_path_document(
    user_id: ObjectId,
    career_path_id: ObjectId,
    assessment_id: ObjectId | None,
    selected_career_title: str,
    title: str,
    description: str,
    weekly_available_hours: int,
    target_completion_date: Any,
    generated_from: str,
    phases: list[dict[str, Any]],
    next_best_course: dict[str, Any] | None,
) -> dict[str, Any]:
    now = utc_now()
    current_phase = next((phase for phase in phases if phase["status"] in {"unlocked", "in_progress"}), phases[0] if phases else None)
    return {
        "user_id": user_id,
        "career_path_id": career_path_id,
        "assessment_id": assessment_id,
        "selected_career_title": safe_string(selected_career_title),
        "title": safe_string(title),
        "description": safe_string(description),
        "status": "active",
        "overall_progress_percentage": clamp_percentage(0),
        "current_phase_id": current_phase["phase_id"] if current_phase else None,
        "current_course_id": next_best_course.get("course_id") if next_best_course else None,
        "weekly_available_hours": weekly_available_hours,
        "target_completion_date": target_completion_date,
        "generated_from": generated_from,
        "phases": safe_list(phases),
        "next_best_course": next_best_course,
        "adaptation_rules": {
            "unlock_next_phase_when_current_completed": True,
            "recalculate_next_best_course_after_course_completion": True,
            "prefer_recommended_and_saved_courses": True,
        },
        "last_adapted_at": now,
        **base_timestamps(),
    }


def create_learning_path_update_document(
    user_id: ObjectId,
    learning_path_id: ObjectId,
    update_type: str,
    reason: str,
    previous_state_summary: str,
    new_state_summary: str,
) -> dict[str, Any]:
    return {
        "user_id": user_id,
        "learning_path_id": learning_path_id,
        "update_type": safe_string(update_type),
        "reason": safe_string(reason),
        "previous_state_summary": safe_string(previous_state_summary),
        "new_state_summary": safe_string(new_state_summary),
        "created_at": utc_now(),
    }
