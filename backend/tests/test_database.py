import os
import subprocess
import sys
from pathlib import Path

import pytest
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from app.models import User, Department, Student
from app.services import seed as seed_service


ROOT = Path(__file__).resolve().parents[2]
EXPECTED_TABLES = {
    "users",
    "departments",
    "students",
    "faculty",
    "subjects",
    "timetables",
    "attendance_sessions",
    "attendance_records",
    "marks",
    "assignments",
    "assignment_submissions",
    "notices",
    "events",
    "event_registrations",
    "leave_requests",
    "certificate_requests",
    "feedback",
    "notifications",
}


@pytest.fixture()
def migrated_database(tmp_path):
    db_path = tmp_path / "migration_test.db"
    database_url = f"sqlite:///{db_path}"

    env = os.environ.copy()
    env["DATABASE_URL"] = database_url

    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=ROOT,
        env=env,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, (
        "Alembic migration failed.\n"
        f"STDOUT:\n{result.stdout}\n"
        f"STDERR:\n{result.stderr}"
    )

    engine = create_engine(database_url)
    try:
        yield engine
    finally:
        engine.dispose()


def test_alembic_creates_expected_schema(migrated_database):
    inspector = inspect(migrated_database)

    tables = set(inspector.get_table_names())

    assert EXPECTED_TABLES.issubset(tables)

    with migrated_database.connect() as connection:
        revision = connection.execute(
            text("SELECT version_num FROM alembic_version")
        ).scalar_one()

    assert revision == "e0d486ff466b"


def test_sqlite_foreign_keys_are_enforced(migrated_database):
    with migrated_database.connect() as connection:
        foreign_keys = connection.execute(
            text("PRAGMA foreign_keys")
        ).scalar_one()

    assert foreign_keys == 1


def test_database_enforces_unique_user_email(migrated_database):
    Session = sessionmaker(bind=migrated_database)
    db = Session()

    try:
        db.add(
            User(
                name="Unique Test User",
                email="unique-db-test@campusconnect.test",
                password_hash="test-hash",
                role="student",
            )
        )
        db.commit()

        db.add(
            User(
                name="Duplicate Test User",
                email="unique-db-test@campusconnect.test",
                password_hash="test-hash",
                role="student",
            )
        )

        with pytest.raises(IntegrityError):
            db.commit()

        db.rollback()
    finally:
        db.close()


def test_database_rejects_invalid_foreign_key(migrated_database):
    Session = sessionmaker(bind=migrated_database)
    db = Session()

    try:
        db.add(
            Student(
                user_id=999999,
                roll_number="DB-FK-TEST-001",
                department_id=None,
            )
        )

        with pytest.raises(IntegrityError):
            db.commit()

        db.rollback()
    finally:
        db.close()


def test_seed_populates_and_is_idempotent(tmp_path, monkeypatch):
    database_path = tmp_path / "seed_test.db"
    engine = create_engine(f"sqlite:///{database_path}")

    # Prevent the seed's certificate QR generation from writing test
    # artifacts into the application's real upload directory.
    monkeypatch.setattr(
        seed_service,
        "generate_qr_code_image",
        lambda *args, **kwargs: None,
    )

    env = os.environ.copy()
    env["DATABASE_URL"] = f"sqlite:///{database_path}"

    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=ROOT,
        env=env,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, (
        "Alembic migration failed before seed test.\\n"
        f"STDOUT:\\n{result.stdout}\\n"
        f"STDERR:\\n{result.stderr}"
    )

    Session = sessionmaker(bind=engine)

    try:
        db = Session()

        seed_service.seed_database(db)

        first_user_count = db.query(User).count()
        first_department_count = db.query(Department).count()

        assert first_user_count == 11
        assert first_department_count == 4

        # seed_database() should not duplicate an already-populated DB.
        seed_service.seed_database(db)

        assert db.query(User).count() == first_user_count
        assert db.query(Department).count() == first_department_count

        db.close()
    finally:
        engine.dispose()
