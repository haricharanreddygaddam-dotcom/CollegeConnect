from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]
DEFAULT_DATABASE_PATH = BASE_DIR / "campusconnect.db"


class Settings(BaseSettings):
    PROJECT_NAME: str = "CampusConnect"
    API_V1_STR: str = "/api/v1"

    # Always override this in non-demo deployments via .env/environment.
    SECRET_KEY: str = "campusconnect-development-secret-key-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    DATABASE_URL: str = f"sqlite:///{DEFAULT_DATABASE_PATH}"
    UPLOAD_DIR: str = str(BASE_DIR / "app" / "uploads")
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
