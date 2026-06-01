from typing import Any

from fastapi import APIRouter, Depends, Query

from app.schemas.certification_schema import CertificationResponse, GroupedUserCertificationResponse, UserCertificationResponse, UserCertificationUpdate
from app.services.auth_service import get_current_user_data
from app.services.certification_service import get_certifications, get_certifications_by_career, get_user_certifications, update_user_certification

router = APIRouter(prefix="/certifications", tags=["Certifications Tracker"])


@router.get("", response_model=list[CertificationResponse])
async def read_certifications(
    career_path_id: str | None = Query(default=None),
    difficulty: str | None = Query(default=None),
    provider: str | None = Query(default=None),
    current_user: dict[str, Any] = Depends(get_current_user_data),
) -> list[dict[str, Any]]:
    return await get_certifications(current_user["_id"], {"career_path_id": career_path_id, "difficulty": difficulty, "provider": provider})


@router.get("/career/{career_path_id}", response_model=list[CertificationResponse])
async def read_certifications_by_career(career_path_id: str, current_user: dict[str, Any] = Depends(get_current_user_data)) -> list[dict[str, Any]]:
    return await get_certifications_by_career(current_user["_id"], career_path_id)


@router.patch("/me/{certification_id}", response_model=UserCertificationResponse)
async def patch_my_certification(
    certification_id: str,
    payload: UserCertificationUpdate,
    current_user: dict[str, Any] = Depends(get_current_user_data),
) -> dict[str, Any]:
    return await update_user_certification(current_user["_id"], certification_id, payload.model_dump(exclude_none=True))


@router.get("/me", response_model=GroupedUserCertificationResponse)
async def read_my_certifications(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return await get_user_certifications(current_user["_id"])
