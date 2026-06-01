# ML Integration

This merge keeps the existing PathFinder application structure and extracts only the useful ML assets from the uploaded archive.

## Merged Assets

- Production model artifacts live in `backend/app/ml/models`.
- Production datasets live in `backend/app/ml/data`.
- Research notebooks live in `research/notebooks`.
- Research/report documents live in `docs/research`.

No uploaded app folders were copied into production. The existing FastAPI services, MongoDB collections, and React Native screens remain the source of truth.

## Backend ML Modules

- `backend/app/ml/utils/model_loader.py` loads `.pkl` artifacts with `joblib` or `pickle`, caches them, and returns safe fallback errors.
- `backend/app/ml/utils/preprocessing.py` converts assessment, profile, completed courses, and skill progress into model-ready feature inputs.
- `backend/app/ml/services/personality_model_service.py` wraps the calibrated LightGBM personality model.
- `backend/app/ml/services/skills_model_service.py` wraps the uploaded skills career model and skill-gap profile files.
- `backend/app/ml/services/ensemble_career_service.py` combines rule-based, skills-model, and personality-model scores.

## Ensemble Weights

- Existing rule-based career matching: 40%
- Skills model: 35%
- Personality model: 25%

If one or both ML models are unavailable, the ensemble reuses available sources and explains which model was skipped. The rule-based matcher remains active as a fallback.

## MongoDB Collection

`ml_career_predictions` stores:

- `user_id`
- `assessment_id`
- `selected_career_path_id`
- `input_summary`
- `rule_based_result`
- `personality_model_result`
- `skills_model_result`
- `ensemble_result`
- `final_recommended_career`
- `final_confidence_score`
- `top_3_careers`
- `explanation`
- `strengths`
- `missing_skills`
- `recommended_improvements`
- `created_at`

Indexes are created for `user_id`, `assessment_id`, `created_at`, and `final_recommended_career`.

## API

- `POST /ml/predict-career`
- `POST /ml/predict-from-assessment/{assessment_id}`
- `GET /ml/predictions/me`
- `GET /ml/predictions/latest`

All endpoints require `Authorization: Bearer <token>`.

## Product Integration

- Assessment Results can run and compare AI prediction with the top rule-based result.
- Home shows the latest AI career prediction and confidence score.
- Skill Gap Analysis merges ML missing skills and marks them as `ML skills model`.
- Course Recommendations prioritize courses covering ML-detected gaps.
- Adaptive Learning Path adds ML missing skills to early phases and shows an alternative career suggestion when the ensemble differs from the selected career.

## Fallback Behavior

If model dependencies or artifacts are missing, the API does not crash. The affected model returns:

```text
ML model is unavailable or input features are incomplete.
```

Install backend dependencies from `backend/requirements.txt` to enable the uploaded `.pkl` models locally.

## Manual Test Checklist

1. Start MongoDB.
2. Start FastAPI on port 8000.
3. Register or log in.
4. Complete Career Assessment.
5. Run AI Career Prediction.
6. Confirm `ml_career_predictions` contains the saved result.
7. Open Home and confirm the latest AI prediction card.
8. Open Skill Gap Analysis and confirm ML-sourced missing skills appear when available.
9. Generate Course Recommendations and confirm ML-prioritized reasons.
10. Generate Adaptive Learning Path and confirm the ML-informed note.
