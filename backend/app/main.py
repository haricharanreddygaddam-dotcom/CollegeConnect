import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.services.seed import seed_database
from app.routers import (
    auth, academic, attendance, marks, timetable,
    assignments, notices, events, leaves, certificates, misc
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed sample data
    Base.metadata.create_all(bind=engine)
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

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads directory
uploads_dir = settings.UPLOAD_DIR
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/api/v1/uploads", StaticFiles(directory=uploads_dir), name="uploads")

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

@app.get("/")
def root():
    return {
        "portal": "CampusConnect API",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }
