import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.store.database import init_db

init_db()
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_audit_records():
    # Trigger batch simulation to populate audit records
    client.post("/api/audit/simulate-batch")

def test_get_audit_logs_pagination_and_filter():
    response = client.get("/api/audit/logs?page=1&page_size=3")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert len(data["items"]) <= 3
    assert data["page"] == 1
    assert data["page_size"] == 3

def test_get_audit_logs_status_filter():
    response = client.get("/api/audit/logs?status=FLAGGED")
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        assert item["status"] == "FLAGGED"

def test_get_audit_logs_search():
    response = client.get("/api/audit/logs?search=CustomerSupportBot")
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        assert "CustomerSupportBot" in item["agent_name"] or "CustomerSupportBot" in (item.get("violation_reason") or "")

def test_get_audit_metrics():
    response = client.get("/api/audit/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "total_events" in data
    assert "compliance_rate_percent" in data
    assert "flagged_count" in data
    assert "top_violating_agent" in data
    assert data["total_events"] >= 5

def test_export_audit_logs_csv():
    response = client.get("/api/audit/export/csv")
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"
    assert "attachment; filename=" in response.headers["content-disposition"]
    content = response.text
    assert "Event ID" in content
    assert "Agent Name" in content

def test_export_audit_logs_json():
    response = client.get("/api/audit/export/json")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"
    assert "attachment; filename=" in response.headers["content-disposition"]
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 5
