import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.store.database import init_db

init_db()
client = TestClient(app)

def ensure_test_user():
    payload = {
        "email": "auditor.user@example.com",
        "password": "SecurePassword123!",
        "full_name": "Governance Officer"
    }
    client.post("/api/auth/signup", json=payload)

def test_signup_success():
    import uuid
    unique_email = f"user.{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "email": unique_email,
        "password": "SecurePassword123!",
        "full_name": "Governance Officer"
    }
    response = client.post("/api/auth/signup", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == unique_email

def test_signup_duplicate_email():
    ensure_test_user()
    payload = {
        "email": "auditor.user@example.com",
        "password": "AnotherPassword123!",
        "full_name": "Duplicate User"
    }
    response = client.post("/api/auth/signup", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_signup_short_password():
    payload = {
        "email": "short.pwd@example.com",
        "password": "123",
        "full_name": "Short Pwd"
    }
    response = client.post("/api/auth/signup", json=payload)
    assert response.status_code == 400
    assert "at least 6 characters" in response.json()["detail"]

def test_login_success():
    ensure_test_user()
    payload = {
        "email": "auditor.user@example.com",
        "password": "SecurePassword123!"
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "auditor.user@example.com"

def test_login_invalid_password():
    payload = {
        "email": "auditor.user@example.com",
        "password": "WrongPassword!"
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]

def test_protected_me_endpoint_success():
    # First login to get token
    login_resp = client.post("/api/auth/login", json={"email": "auditor.user@example.com", "password": "SecurePassword123!"})
    token = login_resp.json()["access_token"]

    # Request /api/auth/me with Bearer token
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "auditor.user@example.com"

def test_protected_me_endpoint_unauthorized():
    response = client.get("/api/auth/me")
    assert response.status_code == 401

def test_github_oauth_url_endpoint():
    response = client.get("/api/auth/github/url")
    assert response.status_code == 200
    data = response.json()
    assert "github.com/login/oauth/authorize" in data["url"]

@patch("app.integrations.github_client.github_oauth_client.exchange_code_for_token")
@patch("app.integrations.github_client.github_oauth_client.get_user_profile")
def test_github_oauth_callback(mock_get_profile, mock_exchange_token):
    mock_exchange_token.return_value = "gho_mock_access_token_12345"
    mock_get_profile.return_value = {
        "login": "octocat_governance",
        "email": "octocat@github.com"
    }

    # Login user first
    login_resp = client.post("/api/auth/login", json={"email": "auditor.user@example.com", "password": "SecurePassword123!"})
    token = login_resp.json()["access_token"]

    # Send callback
    callback_resp = client.post(
        "/api/auth/github/callback",
        json={"code": "mock_auth_code_999"},
        headers={"Authorization": f"Bearer {token}"}
    )

    assert callback_resp.status_code == 200
    user_data = callback_resp.json()
    assert user_data["github_username"] == "octocat_governance"
    assert user_data["has_github_connected"] is True
