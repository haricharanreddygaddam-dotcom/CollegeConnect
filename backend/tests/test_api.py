from fastapi.testclient import TestClient
from app.main import app

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
    response = client.get("/api/v1/auth/demo-users")
    assert response.status_code == 200
    demo_users = response.json()
    assert len(demo_users) >= 4
