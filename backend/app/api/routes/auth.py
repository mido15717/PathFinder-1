from typing import Any

from fastapi import APIRouter, Depends

from app.schemas.auth_schema import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user_schema import UserResponse
from app.services.auth_service import get_current_user_data, login_user, register_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(payload: RegisterRequest) -> dict[str, Any]:
    return await register_user(payload.model_dump())


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest) -> dict[str, Any]:
    return await login_user(payload.model_dump())


@router.get("/me", response_model=UserResponse)
async def me(current_user: dict[str, Any] = Depends(get_current_user_data)) -> dict[str, Any]:
    return current_user


@router.post("/logout")
async def logout() -> dict[str, str]:
    return {"message": "Logged out successfully"}

