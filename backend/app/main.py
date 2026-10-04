import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import Response

from app.core.config import settings
from app.core.database import SessionLocal
from app.services.seed import seed_database
from app.routers import (
    auth, academic, attendance, marks, timetable,
    assignments, notices, events, leaves, certificates, misc
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Database schema is managed by Alembic before the application starts.
    # Seed data is idempotent and only fills an empty development database.
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
    lifespan=lifespan
)

# CORS middleware.
# Keep the browser trust boundary limited to the configured frontend origins.
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

    # Prevent MIME-type sniffing.
    response.headers["X-Content-Type-Options"] = "nosniff"

    # Prevent the API from being embedded in frames.
    response.headers["X-Frame-Options"] = "DENY"

    # Limit referrer information sent to other origins.
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    # Restrict browser capabilities that are not required by the API.
    response.headers["Permissions-Policy"] = (
        "camera=(), microphone=(), geolocation=(), "
        "payment=(), usb=()"
    )

    # HSTS is only appropriate when the deployed API is HTTPS-only.
    if settings.ENABLE_HSTS and request.url.scheme == "https":
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )

    return response


# Include Routers
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
        "redoc_url": "/redoc"
    }
