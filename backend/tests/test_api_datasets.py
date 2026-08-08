import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.store.database import init_db

init_db()
client = TestClient(app)

def test_list_datasets_all():
    response = client.get("/api/datasets")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 5
    names = [d["name"] for d in data]
    assert "analytics.customer_pii" in names
    assert "finance.payroll_transactions" in names

def test_list_datasets_filter_pii():
    response = client.get("/api/datasets?classification=pii")
    assert response.status_code == 200
    data = response.json()
    for d in data:
        assert d["classification"] == "pii"

def test_list_datasets_search():
    response = client.get("/api/datasets?search=payroll")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "finance.payroll_transactions"

def test_dataset_detail_success():
    response = client.get("/api/datasets/analytics.customer_pii")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "analytics.customer_pii"
    assert "urn:li:dataset" in data["urn"]
    assert data["classification"] == "pii"
    assert data["owner"] == "data-platform-team@company.com"

def test_dataset_detail_not_found():
    response = client.get("/api/datasets/non_existent_dataset")
    assert response.status_code == 404

def test_refresh_datasets():
    response = client.post("/api/datasets/refresh")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_update_classification_authenticated():
    # Login first
    login_resp = client.post("/api/auth/signup", json={
        "email": "dataset.editor@example.com",
        "password": "Password123!",
        "full_name": "Dataset Editor"
    })
    if login_resp.status_code == 400:
        login_resp = client.post("/api/auth/login", json={
            "email": "dataset.editor@example.com",
            "password": "Password123!"
        })
    token = login_resp.json()["access_token"]

    # Update classification to confidential
    update_resp = client.post(
        "/api/datasets/sales.quarterly_revenue_public/classification",
        json={"classification": "confidential"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["classification"] == "confidential"

    # Restore back to public for test isolation
    client.post(
        "/api/datasets/sales.quarterly_revenue_public/classification",
        json={"classification": "public"},
        headers={"Authorization": f"Bearer {token}"}
    )

def test_update_classification_unauthorized():
    response = client.post(
        "/api/datasets/analytics.customer_pii/classification",
        json={"classification": "public"}
    )
    assert response.status_code == 401
