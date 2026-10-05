from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models import User

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["portal"] == "CampusConnect API"

def test_student_login():
    response = client.post("/api/v1/auth/login", json={
        "email": "haricharan.reddy@campusconnect.edu",
        "password": "StudentPassword@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "student"

def test_admin_login():
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@campusconnect.edu",
        "password": "AdminPassword@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "admin"

def test_demo_users_endpoint():
    from app.core.config import settings

    original_value = settings.ENABLE_DEMO_ACCOUNTS
    settings.ENABLE_DEMO_ACCOUNTS = True

    try:
        response = client.get("/api/v1/auth/demo-users")
        assert response.status_code == 200
    finally:
        settings.ENABLE_DEMO_ACCOUNTS = original_value
    demo_users = response.json()
    assert len(demo_users) >= 4


def _login(email, password):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def test_invalid_login_returns_401():
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "haricharan.reddy@campusconnect.edu",
            "password": "WrongPassword@123",
        },
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"


def test_deactivated_account_login_returns_400():
    db = SessionLocal()
    user = db.query(User).filter(
        User.email == "hod.cse@campusconnect.edu"
    ).first()

    assert user is not None

    try:
        user.is_active = False
        db.commit()

        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "hod.cse@campusconnect.edu",
                "password": "HodPassword@123",
            },
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "Account is deactivated"
    finally:
        user.is_active = True
        db.commit()
        db.close()


def test_protected_admin_endpoint_requires_authentication():
    response = client.get("/api/v1/users")
    assert response.status_code == 401


def test_student_cannot_access_admin_endpoint():
    token = _login(
        "haricharan.reddy@campusconnect.edu",
        "StudentPassword@123",
    )

    response = client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_admin_can_access_admin_endpoint():
    token = _login(
        "admin@campusconnect.edu",
        "AdminPassword@123",
    )

    response = client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_student_can_read_assignments():
    token = _login(
        "haricharan.reddy@campusconnect.edu",
        "StudentPassword@123",
    )

    response = client.get(
        "/api/v1/assignments/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_student_can_read_only_their_marks():
    token = _login(
        "haricharan.reddy@campusconnect.edu",
        "StudentPassword@123",
    )

    response = client.get(
        "/api/v1/marks/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    marks = response.json()
    assert isinstance(marks, list)

    if marks:
        student_ids = {mark["student_id"] for mark in marks}
        assert len(student_ids) == 1


def test_student_can_read_their_leave_requests():
    token = _login(
        "haricharan.reddy@campusconnect.edu",
        "StudentPassword@123",
    )

    response = client.get(
        "/api/v1/leaves/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_authenticated_user_can_read_events():
    token = _login(
        "haricharan.reddy@campusconnect.edu",
        "StudentPassword@123",
    )

    response = client.get(
        "/api/v1/events/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_student_can_read_their_certificate_requests():
    token = _login(
        "haricharan.reddy@campusconnect.edu",
        "StudentPassword@123",
    )

    response = client.get(
        "/api/v1/certificates/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_student_can_read_role_filtered_notices():
    token = _login(
        "haricharan.reddy@campusconnect.edu",
        "StudentPassword@123",
    )

    response = client.get(
        "/api/v1/notices/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    notices = response.json()
    assert isinstance(notices, list)

    for notice in notices:
        assert notice["target_role"] in ["All", "Student"]


def test_nonexistent_assignment_submission_returns_404():
    token = _login(
        "haricharan.reddy@campusconnect.edu",
        "StudentPassword@123",
    )

    response = client.post(
        "/api/v1/assignments/submit",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "assignment_id": 999999,
            "submission_text": "Invalid assignment test",
            "file_url": None,
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Assignment not found"


def test_nonexistent_assignment_submissions_endpoint_returns_404():
    token = _login(
        "admin@campusconnect.edu",
        "AdminPassword@123",
    )

    response = client.get(
        "/api/v1/assignments/999999/submissions",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Assignment not found"


def test_nonexistent_submission_grade_returns_404():
    token = _login(
        "admin@campusconnect.edu",
        "AdminPassword@123",
    )

    response = client.post(
        "/api/v1/assignments/submissions/999999/grade",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "marks_awarded": 10,
            "feedback": "Invalid submission test",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Submission not found"


def test_nonexistent_leave_review_returns_404():
    token = _login(
        "admin@campusconnect.edu",
        "AdminPassword@123",
    )

    response = client.post(
        "/api/v1/leaves/999999/review",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "status": "Approved",
            "reviewer_remarks": "Invalid leave test",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Leave request not found"


def test_nonexistent_event_registration_returns_404():
    token = _login(
        "haricharan.reddy@campusconnect.edu",
        "StudentPassword@123",
    )

    response = client.post(
        "/api/v1/events/999999/register",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Event not found"


def test_nonexistent_certificate_review_returns_404():
    token = _login(
        "admin@campusconnect.edu",
        "AdminPassword@123",
    )

    response = client.post(
        "/api/v1/certificates/999999/review",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "status": "Rejected",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Certificate request not found"


def test_unknown_certificate_verification_returns_invalid():
    response = client.get(
        "/api/v1/certificates/verify/nonexistent-verification-hash"
    )

    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert "Certificate not found" in data["message"]


def test_login_missing_password_returns_422():
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "haricharan.reddy@campusconnect.edu",
        },
    )

    assert response.status_code == 422


def test_login_missing_email_returns_422():
    response = client.post(
        "/api/v1/auth/login",
        json={
            "password": "StudentPassword@123",
        },
    )

    assert response.status_code == 422


def test_login_malformed_json_body_returns_422():
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "haricharan.reddy@campusconnect.edu",
            "password": 12345,
        },
    )

    assert response.status_code == 422


def test_assignment_submission_missing_assignment_id_returns_422():
    token = _login(
        "haricharan.reddy@campusconnect.edu",
        "StudentPassword@123",
    )

    response = client.post(
        "/api/v1/assignments/submit",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "submission_text": "Missing assignment ID test",
            "file_url": None,
        },
    )

    assert response.status_code == 422


def test_leave_creation_missing_required_fields_returns_422():
    token = _login(
        "haricharan.reddy@campusconnect.edu",
        "StudentPassword@123",
    )

    response = client.post(
        "/api/v1/leaves/",
        headers={"Authorization": f"Bearer {token}"},
        json={},
    )

    assert response.status_code == 422
