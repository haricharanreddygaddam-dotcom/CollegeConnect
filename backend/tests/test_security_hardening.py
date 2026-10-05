from pathlib import Path
from fastapi.testclient import TestClient

from app.core.security import create_access_token
from app.main import app
from app.core.database import SessionLocal
from app.models import User


client = TestClient(app)

def _login(email: str, password: str) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]



def test_oauth_token_rejects_deactivated_user():
    db = SessionLocal()
    user = db.query(User).filter(
        User.email == "hod.cse@campusconnect.edu"
    ).first()

    assert user is not None

    try:
        user.is_active = False
        db.commit()

        response = client.post(
            "/api/v1/auth/token",
            data={
                "username": "hod.cse@campusconnect.edu",
                "password": "HodPassword@123",
            },
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "Account is deactivated"
    finally:
        user.is_active = True
        db.commit()
        db.close()


def test_malformed_jwt_subject_returns_401():
    token = create_access_token(
        {"sub": "not-an-integer", "role": "admin"}
    )

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Could not validate credentials"


def test_demo_accounts_disabled_by_default(monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "ENABLE_DEMO_ACCOUNTS", False)

    response = client.get("/api/v1/auth/demo-users")

    assert response.status_code == 404
    assert response.json()["detail"] == "Demo accounts are disabled"


def test_demo_accounts_available_when_explicitly_enabled(monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "ENABLE_DEMO_ACCOUNTS", True)

    response = client.get("/api/v1/auth/demo-users")

    assert response.status_code == 200

    demo_users = response.json()

    assert len(demo_users) == 4
    assert all("email" in user for user in demo_users)
    assert all("password" in user for user in demo_users)


def test_upload_requires_authentication():
    response = client.post(
        "/api/v1/uploads/file",
        files={
            "file": (
                "test.txt",
                b"CampusConnect security test",
                "text/plain",
            )
        },
    )

    assert response.status_code == 401


def test_upload_rejects_unsupported_extension():
    from tests.test_api import _login

    token = _login(
        "haricharan.reddy@campusconnect.edu",
        "StudentPassword@123",
    )

    response = client.post(
        "/api/v1/uploads/file",
        headers={"Authorization": f"Bearer {token}"},
        files={
            "file": (
                "malware.exe",
                b"MZ",
                "application/octet-stream",
            )
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Unsupported file format"


def test_upload_rejects_mismatched_content_type():
    from tests.test_api import _login

    token = _login(
        "haricharan.reddy@campusconnect.edu",
        "StudentPassword@123",
    )

    response = client.post(
        "/api/v1/uploads/file",
        headers={"Authorization": f"Bearer {token}"},
        files={
            "file": (
                "document.pdf",
                b"not really a pdf",
                "text/plain",
            )
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid file content type"


def test_upload_accepts_valid_authenticated_file():
    from app.core.config import settings
    from tests.test_api import _login

    token = _login(
        "haricharan.reddy@campusconnect.edu",
        "StudentPassword@123",
    )

    response = client.post(
        "/api/v1/uploads/file",
        headers={"Authorization": f"Bearer {token}"},
        files={
            "file": (
                "assignment.txt",
                b"CampusConnect assignment submission",
                "text/plain",
            )
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["filename"] == "assignment.txt"
    assert data["size"] == len(b"CampusConnect assignment submission")
    assert "/api/v1/uploads/docs/" in data["url"]

    stored_name = data["url"].rsplit("/", 1)[-1]
    stored_path = Path(settings.UPLOAD_DIR) / "docs" / stored_name

    assert stored_path.exists()

    stored_path.unlink()


def test_upload_rejects_files_over_10mb():
    from tests.test_api import _login

    token = _login(
        "haricharan.reddy@campusconnect.edu",
        "StudentPassword@123",
    )

    oversized_content = b"x" * (10 * 1024 * 1024 + 1)

    response = client.post(
        "/api/v1/uploads/file",
        headers={"Authorization": f"Bearer {token}"},
        files={
            "file": (
                "large.txt",
                oversized_content,
                "text/plain",
            )
        },
    )

    assert response.status_code == 413
    assert response.json()["detail"] == "File exceeds the 10 MB size limit"


def test_document_download_requires_authentication():
    from app.core.config import settings

    docs_dir = Path(settings.UPLOAD_DIR) / "docs"
    docs_dir.mkdir(parents=True, exist_ok=True)

    test_file = docs_dir / "security-test.txt"
    test_file.write_text("CampusConnect protected document")

    try:
        response = client.get("/api/v1/uploads/docs/security-test.txt")

        assert response.status_code == 401
    finally:
        test_file.unlink(missing_ok=True)


def test_authenticated_user_can_download_document():
    from app.core.config import settings
    from tests.test_api import _login

    token = _login(
        "haricharan.reddy@campusconnect.edu",
        "StudentPassword@123",
    )

    docs_dir = Path(settings.UPLOAD_DIR) / "docs"
    docs_dir.mkdir(parents=True, exist_ok=True)

    test_file = docs_dir / "authenticated-test.txt"
    test_file.write_text("CampusConnect protected document")

    try:
        response = client.get(
            "/api/v1/uploads/docs/authenticated-test.txt",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        assert response.text == "CampusConnect protected document"
    finally:
        test_file.unlink(missing_ok=True)


def test_document_download_rejects_path_traversal():
    from app.core.config import settings

    docs_dir = Path(settings.UPLOAD_DIR) / "docs"
    docs_dir.mkdir(parents=True, exist_ok=True)

    response = client.get(
        "/api/v1/uploads/docs/../security-test.txt"
    )

    assert response.status_code in {400, 404}


def test_missing_document_returns_404():
    from tests.test_api import _login

    token = _login(
        "haricharan.reddy@campusconnect.edu",
        "StudentPassword@123",
    )

    response = client.get(
        "/api/v1/uploads/docs/does-not-exist.txt",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Document not found"


def test_active_attendance_session_requires_authentication():
    response = client.get("/api/v1/attendance/sessions/active/1")
    assert response.status_code == 401


def test_faculty_cannot_create_assignment_for_another_facultys_subject():
    from app.core.database import SessionLocal
    from app.models import Subject

    token = _login(
        "david.thorne@campusconnect.edu",
        "FacultyPassword@123",
    )

    db = SessionLocal()
    try:
        foreign_subject = (
            db.query(Subject)
            .filter(Subject.code == "CS502DB")
            .first()
        )
        assert foreign_subject is not None

        response = client.post(
            "/api/v1/assignments/",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "subject_id": foreign_subject.id,
                "title": "Unauthorized Assignment Test",
                "description": "Authorization regression test",
                "max_marks": 20,
                "due_date": "2030-01-01T10:00:00",
                "file_url": None,
            },
        )

        assert response.status_code == 403
    finally:
        db.close()


def test_faculty_cannot_enter_marks_for_another_facultys_subject():
    from app.core.database import SessionLocal
    from app.models import Subject, Student

    token = _login(
        "david.thorne@campusconnect.edu",
        "FacultyPassword@123",
    )

    db = SessionLocal()
    try:
        foreign_subject = (
            db.query(Subject)
            .filter(Subject.code == "CS502DB")
            .first()
        )
        student = db.query(Student).first()

        assert foreign_subject is not None
        assert student is not None

        response = client.post(
            "/api/v1/marks/bulk",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "subject_id": foreign_subject.id,
                "exam_type": "Security Test",
                "max_marks": 20,
                "semester": foreign_subject.semester,
                "entries": [
                    {
                        "student_id": student.id,
                        "marks_obtained": 10,
                        "remarks": "Unauthorized test",
                    }
                ],
            },
        )

        assert response.status_code == 403
    finally:
        db.close()


def test_faculty_cannot_start_attendance_for_another_facultys_subject():
    from app.core.database import SessionLocal
    from app.models import Subject

    token = _login(
        "david.thorne@campusconnect.edu",
        "FacultyPassword@123",
    )

    db = SessionLocal()
    try:
        foreign_subject = (
            db.query(Subject)
            .filter(Subject.code == "CS502DB")
            .first()
        )
        assert foreign_subject is not None

        response = client.post(
            "/api/v1/attendance/sessions",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "subject_id": foreign_subject.id,
                "date": "2026-10-04",
                "expires_in_minutes": 5,
            },
        )

        assert response.status_code == 403
    finally:
        db.close()


def test_faculty_cannot_view_another_facultys_marks():
    from app.core.database import SessionLocal
    from app.models import Subject

    token = _login(
        "david.thorne@campusconnect.edu",
        "FacultyPassword@123",
    )

    db = SessionLocal()
    try:
        foreign_subject = (
            db.query(Subject)
            .filter(Subject.code == "CS502DB")
            .first()
        )
        assert foreign_subject is not None

        response = client.get(
            f"/api/v1/marks/?subject_id={foreign_subject.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 403
    finally:
        db.close()


def test_active_attendance_session_requires_authentication():
    response = client.get("/api/v1/attendance/sessions/active/1")
    assert response.status_code == 401


def test_faculty_cannot_create_assignment_for_another_facultys_subject():
    from app.core.database import SessionLocal
    from app.models import Subject

    token = _login(
        "david.thorne@campusconnect.edu",
        "FacultyPassword@123",
    )

    db = SessionLocal()
    try:
        foreign_subject = (
            db.query(Subject)
            .filter(Subject.code == "CS502DB")
            .first()
        )
        assert foreign_subject is not None

        response = client.post(
            "/api/v1/assignments/",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "subject_id": foreign_subject.id,
                "title": "Unauthorized Assignment Test",
                "description": "Authorization regression test",
                "max_marks": 20,
                "due_date": "2030-01-01T10:00:00",
                "file_url": None,
            },
        )

        assert response.status_code == 403
    finally:
        db.close()


def test_faculty_cannot_enter_marks_for_another_facultys_subject():
    from app.core.database import SessionLocal
    from app.models import Subject, Student

    token = _login(
        "david.thorne@campusconnect.edu",
        "FacultyPassword@123",
    )

    db = SessionLocal()
    try:
        foreign_subject = (
            db.query(Subject)
            .filter(Subject.code == "CS502DB")
            .first()
        )
        student = db.query(Student).first()

        assert foreign_subject is not None
        assert student is not None

        response = client.post(
            "/api/v1/marks/bulk",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "subject_id": foreign_subject.id,
                "exam_type": "Security Test",
                "max_marks": 20,
                "semester": foreign_subject.semester,
                "entries": [
                    {
                        "student_id": student.id,
                        "marks_obtained": 10,
                        "remarks": "Unauthorized test",
                    }
                ],
            },
        )

        assert response.status_code == 403
    finally:
        db.close()


def test_faculty_cannot_start_attendance_for_another_facultys_subject():
    from app.core.database import SessionLocal
    from app.models import Subject

    token = _login(
        "david.thorne@campusconnect.edu",
        "FacultyPassword@123",
    )

    db = SessionLocal()
    try:
        foreign_subject = (
            db.query(Subject)
            .filter(Subject.code == "CS502DB")
            .first()
        )
        assert foreign_subject is not None

        response = client.post(
            "/api/v1/attendance/sessions",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "subject_id": foreign_subject.id,
                "date": "2026-10-04",
                "expires_in_minutes": 5,
            },
        )

        assert response.status_code == 403
    finally:
        db.close()


def test_faculty_cannot_view_another_facultys_marks():
    from app.core.database import SessionLocal
    from app.models import Subject

    token = _login(
        "david.thorne@campusconnect.edu",
        "FacultyPassword@123",
    )

    db = SessionLocal()
    try:
        foreign_subject = (
            db.query(Subject)
            .filter(Subject.code == "CS502DB")
            .first()
        )
        assert foreign_subject is not None

        response = client.get(
            f"/api/v1/marks/?subject_id={foreign_subject.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 403
    finally:
        db.close()


def test_hod_cannot_review_leave_from_another_department():
    from app.core.database import SessionLocal
    from app.models import Department, Faculty, LeaveRequest, User

    db = SessionLocal()
    original_department_id = None
    original_active = None
    temp_department = None
    hod = None

    try:
        hod = (
            db.query(Faculty)
            .join(User, Faculty.user_id == User.id)
            .filter(User.email == "hod.cse@campusconnect.edu")
            .first()
        )

        assert hod is not None

        original_department_id = hod.department_id
        original_active = hod.user.is_active

        # The seeded HOD is intentionally deactivated. Temporarily enable
        # the account so this test can exercise department authorization.
        hod.user.is_active = True
        db.commit()

        token = _login(
            "hod.cse@campusconnect.edu",
            "HodPassword@123",
        )
        leave = db.query(LeaveRequest).filter(LeaveRequest.id == 3).first()

        assert hod is not None
        assert leave is not None

        original_department_id = hod.department_id

        temp_department = Department(
            name="Security Test Department",
            code="SEC-TEST",
        )
        db.add(temp_department)
        db.commit()
        db.refresh(temp_department)

        hod.department_id = temp_department.id
        db.commit()

        response = client.post(
            f"/api/v1/leaves/{leave.id}/review",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "status": "Approved",
                "reviewer_remarks": "Unauthorized cross-department test",
            },
        )

        assert response.status_code == 403
        assert response.json()["detail"] == (
            "You are not authorized for this department"
        )
    finally:
        if hod is not None:
            if original_department_id is not None:
                hod.department_id = original_department_id
            if original_active is not None:
                hod.user.is_active = original_active
            db.commit()

        if temp_department is not None:
            db.delete(temp_department)
            db.commit()

        db.close()


def test_hod_cannot_review_certificate_from_another_department():
    from app.core.database import SessionLocal
    from app.models import Department, Faculty, CertificateRequest, User

    db = SessionLocal()
    original_department_id = None
    original_active = None
    temp_department = None
    hod = None

    try:
        hod = (
            db.query(Faculty)
            .join(User, Faculty.user_id == User.id)
            .filter(User.email == "hod.cse@campusconnect.edu")
            .first()
        )

        assert hod is not None

        original_department_id = hod.department_id
        original_active = hod.user.is_active

        # The seeded HOD is intentionally deactivated. Temporarily enable
        # the account so this test can exercise department authorization.
        hod.user.is_active = True
        db.commit()

        token = _login(
            "hod.cse@campusconnect.edu",
            "HodPassword@123",
        )
        cert = (
            db.query(CertificateRequest)
            .filter(CertificateRequest.id == 2)
            .first()
        )

        assert hod is not None
        assert cert is not None

        original_department_id = hod.department_id

        temp_department = Department(
            name="Certificate Security Test Department",
            code="CERT-TEST",
        )
        db.add(temp_department)
        db.commit()
        db.refresh(temp_department)

        hod.department_id = temp_department.id
        db.commit()

        response = client.post(
            f"/api/v1/certificates/{cert.id}/review",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "status": "Approved",
            },
        )

        assert response.status_code == 403
        assert response.json()["detail"] == (
            "You are not authorized for this department"
        )
    finally:
        if hod is not None:
            if original_department_id is not None:
                hod.department_id = original_department_id
            if original_active is not None:
                hod.user.is_active = original_active
            db.commit()

        if temp_department is not None:
            db.delete(temp_department)
            db.commit()

        db.close()


def test_faculty_cannot_bulk_mark_another_facultys_subject():
    from app.core.database import SessionLocal
    from app.models import AttendanceRecord, Subject

    token = _login(
        "david.thorne@campusconnect.edu",
        "FacultyPassword@123",
    )

    db = SessionLocal()
    try:
        foreign_subject = (
            db.query(Subject)
            .filter(Subject.code == "CS502DB")
            .first()
        )

        assert foreign_subject is not None

        response = client.post(
            "/api/v1/attendance/mark-bulk",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "subject_id": foreign_subject.id,
                "date": "2030-01-01",
                "records": [
                    {
                        "student_id": 1,
                        "status": "Present",
                    }
                ],
            },
        )

        assert response.status_code == 403
    finally:
        db.close()


def test_unauthorized_bulk_attendance_does_not_delete_existing_records():
    from app.core.database import SessionLocal
    from app.models import AttendanceRecord, Subject

    token = _login(
        "david.thorne@campusconnect.edu",
        "FacultyPassword@123",
    )

    db = SessionLocal()

    test_date = __import__("datetime").date(2030, 1, 2)
    record = None

    try:
        foreign_subject = (
            db.query(Subject)
            .filter(Subject.code == "CS502DB")
            .first()
        )

        assert foreign_subject is not None

        record = AttendanceRecord(
            student_id=1,
            subject_id=foreign_subject.id,
            date=test_date,
            status="Present",
            method="SecurityTest",
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        response = client.post(
            "/api/v1/attendance/mark-bulk",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "subject_id": foreign_subject.id,
                "date": str(test_date),
                "records": [
                    {
                        "student_id": 1,
                        "status": "Absent",
                    }
                ],
            },
        )

        assert response.status_code == 403

        db.expire_all()

        preserved = (
            db.query(AttendanceRecord)
            .filter(AttendanceRecord.id == record.id)
            .first()
        )

        assert preserved is not None
        assert preserved.status == "Present"
        assert preserved.method == "SecurityTest"
    finally:
        if record is not None:
            db.query(AttendanceRecord).filter(
                AttendanceRecord.id == record.id
            ).delete()
            db.commit()

        db.close()


def test_faculty_cannot_view_another_facultys_attendance_records():
    from app.core.database import SessionLocal
    from app.models import Subject

    token = _login(
        "david.thorne@campusconnect.edu",
        "FacultyPassword@123",
    )

    db = SessionLocal()
    try:
        foreign_subject = (
            db.query(Subject)
            .filter(Subject.code == "CS502DB")
            .first()
        )

        assert foreign_subject is not None

        response = client.get(
            f"/api/v1/attendance/records?subject_id={foreign_subject.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 403
    finally:
        db.close()


def test_hod_cannot_view_students_from_another_department():
    from app.core.database import SessionLocal
    from app.models import Department, User

    db = SessionLocal()
    hod_user = db.query(User).filter(
        User.email == "hod.cse@campusconnect.edu"
    ).first()
    assert hod_user is not None

    original_active = hod_user.is_active
    hod_user.is_active = True
    db.commit()

    try:
        token = _login(
            "hod.cse@campusconnect.edu",
            "HodPassword@123",
        )

        foreign_department = Department(
            name="Security Test Department",
            code="SEC-TEST",
        )
        db.add(foreign_department)
        db.commit()
        db.refresh(foreign_department)

        try:
            response = client.get(
                f"/api/v1/students?department_id={foreign_department.id}",
                headers={"Authorization": f"Bearer {token}"},
            )

            assert response.status_code == 403
            assert response.json()["detail"] == (
                "You are not authorized for this department"
            )
        finally:
            db.delete(foreign_department)
            db.commit()
    finally:
        hod_user.is_active = original_active
        db.commit()
        db.close()


def test_hod_cannot_create_student_in_another_department():
    from app.core.database import SessionLocal
    from app.models import Department, User

    db = SessionLocal()
    hod_user = db.query(User).filter(
        User.email == "hod.cse@campusconnect.edu"
    ).first()
    assert hod_user is not None

    original_active = hod_user.is_active
    hod_user.is_active = True
    db.commit()

    try:
        token = _login(
            "hod.cse@campusconnect.edu",
            "HodPassword@123",
        )

        foreign_department = Department(
            name="Student Security Test Department",
            code="STD-TEST",
        )
        db.add(foreign_department)
        db.commit()
        db.refresh(foreign_department)

        try:
            response = client.post(
                "/api/v1/students",
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "name": "Unauthorized Student",
                    "email": "unauthorized.student@campusconnect.edu",
                    "password": "StudentPassword@123",
                    "roll_number": "SEC-TEST-001",
                    "department_id": foreign_department.id,
                    "year": 3,
                    "semester": 5,
                    "section": "A",
                    "phone": "9999999999",
                    "address": "Security Test",
                    "parent_name": "Security Parent",
                    "parent_phone": "9999999998",
                    "admission_year": 2024,
                    "cgpa": 8.0,
                },
            )

            assert response.status_code == 403
            assert response.json()["detail"] == (
                "You are not authorized for this department"
            )

            created_user = (
                db.query(User)
                .filter(
                    User.email
                    == "unauthorized.student@campusconnect.edu"
                )
                .first()
            )
            assert created_user is None
        finally:
            db.delete(foreign_department)
            db.commit()
    finally:
        hod_user.is_active = original_active
        db.commit()
        db.close()


def test_hod_cannot_create_subject_in_another_department():
    from app.core.database import SessionLocal
    from app.models import Department, User

    db = SessionLocal()
    hod_user = db.query(User).filter(
        User.email == "hod.cse@campusconnect.edu"
    ).first()
    assert hod_user is not None

    original_active = hod_user.is_active
    hod_user.is_active = True
    db.commit()

    try:
        token = _login(
            "hod.cse@campusconnect.edu",
            "HodPassword@123",
        )

        foreign_department = Department(
            name="Subject Security Test Department",
            code="SUB-TEST",
        )
        db.add(foreign_department)
        db.commit()
        db.refresh(foreign_department)

        try:
            response = client.post(
                "/api/v1/subjects",
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "name": "Unauthorized Subject",
                    "code": "SEC999",
                    "credits": 3,
                    "department_id": foreign_department.id,
                    "semester": 5,
                    "faculty_id": None,
                },
            )

            assert response.status_code == 403
            assert response.json()["detail"] == (
                "You are not authorized for this department"
            )
        finally:
            db.delete(foreign_department)
            db.commit()
    finally:
        hod_user.is_active = original_active
        db.commit()
        db.close()


def test_hod_cannot_create_subject_for_foreign_faculty():
    from app.core.database import SessionLocal
    from app.models import Department, Faculty, User

    db = SessionLocal()

    hod_user = db.query(User).filter(
        User.email == "hod.cse@campusconnect.edu"
    ).first()
    assert hod_user is not None

    original_hod_active = hod_user.is_active
    hod_user.is_active = True

    # Use an existing seeded faculty record rather than creating
    # another Faculty row for an existing user_id.
    foreign_faculty = db.query(Faculty).filter(
        Faculty.id == 4
    ).first()
    assert foreign_faculty is not None

    original_faculty_department = foreign_faculty.department_id

    db.commit()

    try:
        token = _login(
            "hod.cse@campusconnect.edu",
            "HodPassword@123",
        )

        foreign_department = Department(
            name="Faculty Security Test Department",
            code="FAC-TEST",
        )
        db.add(foreign_department)
        db.commit()
        db.refresh(foreign_department)

        try:
            foreign_faculty.department_id = foreign_department.id
            db.commit()

            response = client.post(
                "/api/v1/subjects",
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "name": "Unauthorized Faculty Subject",
                    "code": "SEC998",
                    "credits": 3,
                    "department_id": 1,
                    "semester": 5,
                    "faculty_id": foreign_faculty.id,
                },
            )

            assert response.status_code == 403
            assert response.json()["detail"] == (
                "You are not authorized for this faculty member"
            )
        finally:
            foreign_faculty.department_id = original_faculty_department
            db.commit()

            db.delete(foreign_department)
            db.commit()
    finally:
        hod_user.is_active = original_hod_active
        db.commit()
        db.close()



def test_student_cannot_view_another_students_attendance_stats():
    from app.core.database import SessionLocal
    from app.models import Student, User

    db = SessionLocal()
    try:
        student = (
            db.query(Student)
            .join(User, Student.user_id == User.id)
            .filter(
                User.is_active == True,
                User.role == "student",
            )
            .order_by(Student.id)
            .first()
        )

        other_student = (
            db.query(Student)
            .filter(Student.id != student.id)
            .order_by(Student.id)
            .first()
            if student
            else None
        )

        assert student is not None
        assert other_student is not None

        student_user = db.query(User).filter(
            User.id == student.user_id
        ).first()
        assert student_user is not None

        token = _login(
            student_user.email,
            "StudentPassword@123",
        )

        response = client.get(
            f"/api/v1/attendance/stats/student/{other_student.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 403
        assert response.json()["detail"] == (
            "You are not authorized to view this student's attendance"
        )
    finally:
        db.close()


def test_security_headers_are_present():
    response = client.get("/")

    assert response.status_code == 200
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert (
        response.headers["Referrer-Policy"]
        == "strict-origin-when-cross-origin"
    )
    assert (
        response.headers["Permissions-Policy"]
        == "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
    )


def test_hsts_is_disabled_for_local_http_by_default():
    response = client.get("/")

    assert "Strict-Transport-Security" not in response.headers


def test_cors_allows_configured_frontend_origin():
    response = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == (
        "http://localhost:5173"
    )


def test_cors_rejects_unconfigured_origin():
    response = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "https://evil.example",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert "access-control-allow-origin" not in response.headers


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_readiness_endpoint():
    response = client.get("/ready")

    assert response.status_code == 200
    assert response.json()["status"] == "ready"
    assert response.json()["database"] == "ok"
