from functools import lru_cache

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = Field(default="PathFinder API", validation_alias=AliasChoices("APP_NAME", "PROJECT_NAME"))
    environment: str = "development"
    debug: bool = True

    mongo_uri: str = Field(default="mongodb://localhost:27017", validation_alias=AliasChoices("MONGO_URI", "MONGODB_URI"))
    database_name: str = Field(default="pathfinder", validation_alias=AliasChoices("DATABASE_NAME", "MONGODB_DB_NAME"))

    jwt_secret_key: str = Field(default="change-this-secret-in-env", validation_alias=AliasChoices("JWT_SECRET_KEY", "SECRET_KEY"))
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7

    cors_origins: list[str] | str = Field(default=["http://localhost:8081"], validation_alias=AliasChoices("CORS_ORIGINS", "BACKEND_CORS_ORIGINS"))

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: list[str] | str) -> list[str]:
        if isinstance(value, list):
            return value
        if not value:
            return []
        if value == "*":
            return ["*"]
        return [origin.strip() for origin in value.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
