from typing import Any

from fastapi import APIRouter, Depends, status

from app.schemas.ml_prediction_schema import MLPredictionResponse
from app.services.auth_service import get_current_user_data
from app.services.ml_career_prediction_service import get_latest_prediction_for_user, get_predictions_for_user, run_prediction_for_user

router = APIRouter(prefix="/ml", tags=["ML Career Predictions"])


@router.post("/predict-career", response_model=MLPredictionResponse, status_code=status.HTTP_201_CREATED)
async def predict_career(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await run_prediction_for_user(current_user["_id"])


@router.post("/predict-from-assessment/{assessment_id}", response_model=MLPredictionResponse, status_code=status.HTTP_201_CREATED)
async def predict_from_assessment(assessment_id: str, current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await run_prediction_for_user(current_user["_id"], assessment_id)


@router.get("/predictions/me", response_model=list[MLPredictionResponse])
async def read_my_predictions(current_user: dict[str, Any] = Depends(get_current_user_data)) -> list[dict[str, Any]]:
    return await get_predictions_for_user(current_user["_id"])


@router.get("/predictions/latest", response_model=MLPredictionResponse)
async def read_latest_prediction(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await get_latest_prediction_for_user(current_user["_id"])
