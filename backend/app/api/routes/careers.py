from app.schemas.career_schema import CareerResponse
from app.services.career_service import get_career_by_id, get_career_by_slug, list_active_careers
from fastapi import APIRouter

router = APIRouter(prefix="/careers", tags=["Careers"])


@router.get("", response_model=list[CareerResponse])
async def read_careers() -> list[dict]:
    return await list_active_careers()


@router.get("/slug/{slug}", response_model=CareerResponse)
async def read_career_by_slug(slug: str) -> dict:
    return await get_career_by_slug(slug)


@router.get("/{career_id}", response_model=CareerResponse)
async def read_career(career_id: str) -> dict:
    return await get_career_by_id(career_id)
