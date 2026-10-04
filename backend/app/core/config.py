from pathlib import Path
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]
DEFAULT_DATABASE_PATH = BASE_DIR / "campusconnect.db"


class Settings(BaseSettings):
    PROJECT_NAME: str = "CampusConnect"
    API_V1_STR: str = "/api/v1"

    ENVIRONMENT: Literal["development", "production", "test"] = "development"

    SECRET_KEY: str = "campusconnect-development-secret-key-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    ENABLE_DEMO_ACCOUNTS: bool = False

    DATABASE_URL: str = f"sqlite:///{DEFAULT_DATABASE_PATH}"

    UPLOAD_DIR: str = str(BASE_DIR / "app" / "uploads")

    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    ENABLE_HSTS: bool = False

    AUTO_SEED: bool = True

    HOST: str = "127.0.0.1"
    PORT: int = 8000
    WORKERS: int = 1

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @model_validator(mode="after")
    def validate_production_configuration(self):
        if self.ENVIRONMENT != "production":
            return self

        if self.SECRET_KEY == "campusconnect-development-secret-key-2026":
            raise ValueError(
                "SECRET_KEY must be changed before starting CampusConnect in production"
            )

        if self.ENABLE_DEMO_ACCOUNTS:
            raise ValueError(
                "ENABLE_DEMO_ACCOUNTS must be false in production"
            )

        if self.AUTO_SEED:
            raise ValueError(
                "AUTO_SEED must be false in production"
            )

        if not self.DATABASE_URL.startswith(("postgresql://", "postgresql+")):
            raise ValueError(
                "Production deployments must use PostgreSQL via DATABASE_URL"
            )

        if not self.ENABLE_HSTS:
            raise ValueError(
                "ENABLE_HSTS must be true for production deployments"
            )

        if not self.CORS_ORIGINS:
            raise ValueError(
                "CORS_ORIGINS must contain the production frontend origin"
            )

        return self


settings = Settings()
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
