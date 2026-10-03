import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "CampusConnect"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "campusconnect_super_secret_jwt_key_2026_modern_portal"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./campusconnect.db")
    UPLOAD_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "../uploads"))
    CORS_ORIGINS: list[str] = ["*"]

    class Config:
        case_sensitive = True

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
