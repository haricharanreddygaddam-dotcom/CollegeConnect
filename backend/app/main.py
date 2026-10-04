import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from starlette.responses import JSONResponse, Response

from app.core.config import settings
from app.core.database import SessionLocal
from app.services.seed import seed_database
from app.routers import (
    auth,
    academic,
    attendance,
    marks,
    timetable,
    assignments,
    notices,
    events,
    leaves,
    certificates,
    misc,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Database schema is managed exclusively by Alembic.
    #
    # Development/test environments may optionally seed demo data.
    # Production never seeds automatically.
    if settings.AUTO_SEED and settings.ENVIRONMENT != "production":
        db = SessionLocal()
        try:
            seed_database(db)
        finally:
            db.close()

    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="CampusConnect — Complete Centralized College Management Portal API",
    version="1.0.0",
    lifespan=lifespan,
)


# CORS middleware.
# Keep the browser trust boundary limited to configured frontend origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = (
        "camera=(), microphone=(), geolocation=(), "
        "payment=(), usb=()"
    )

    if settings.ENABLE_HSTS and request.url.scheme == "https":
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )

    return response


@app.get("/health")
def health():
    """Lightweight liveness endpoint with no database dependency."""
    return {
        "status": "ok",
        "service": "campusconnect-api",
    }


@app.get("/ready")
def readiness():
    """Readiness endpoint that verifies database connectivity."""
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "service": "campusconnect-api",
            "database": "ok",
        }
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "not_ready",
                "service": "campusconnect-api",
                "database": "unavailable",
            },
        )
    finally:
        db.close()


# Include Routers.
api_v1 = settings.API_V1_STR

app.include_router(auth.router, prefix=api_v1)
app.include_router(academic.router, prefix=api_v1)
app.include_router(attendance.router, prefix=api_v1)
app.include_router(marks.router, prefix=api_v1)
app.include_router(timetable.router, prefix=api_v1)
app.include_router(assignments.router, prefix=api_v1)
app.include_router(notices.router, prefix=api_v1)
app.include_router(events.router, prefix=api_v1)
app.include_router(leaves.router, prefix=api_v1)
app.include_router(certificates.router, prefix=api_v1)
app.include_router(misc.router, prefix=api_v1)


# Expose only certificate QR-code images publicly.
# Uploaded documents are served through the authenticated API endpoint.
qrcodes_dir = os.path.join(settings.UPLOAD_DIR, "qrcodes")
os.makedirs(qrcodes_dir, exist_ok=True)

app.mount(
    "/api/v1/uploads/qrcodes",
    StaticFiles(directory=qrcodes_dir),
    name="qrcodes",
)


@app.get("/")
def root():
    return {
        "portal": "CampusConnect API",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
    }
