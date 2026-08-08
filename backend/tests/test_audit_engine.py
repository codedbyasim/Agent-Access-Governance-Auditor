import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.store.database import init_db

init_db()
client = TestClient(app)

def test_audit_compliant_access():
    payload = {
        "agent_name": "ResearchAssistantAgent",
        "dataset_name": "sales.quarterly_revenue_public",
        "access_type": "read",
        "is_approved": False
    }
    response = client.post("/api/audit/evaluate", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "OK"
    assert data["violation_reason"] is None
    assert data["dataset_classification"] == "public"

def test_audit_classification_violation():
    payload = {
        "agent_name": "CustomerSupportBot",
        "dataset_name": "analytics.customer_pii",
        "access_type": "query",
        "is_approved": False
    }
    response = client.post("/api/audit/evaluate", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "FLAGGED"
    assert "permits access to" in data["violation_reason"]
    assert "PII" in data["violation_reason"]
    assert data["datahub_written"] is True

def test_audit_approval_missing_violation():
    payload = {
        "agent_name": "FinancialAnalystAgent",
        "dataset_name": "finance.payroll_transactions",
        "access_type": "export",
        "is_approved": False
    }
    response = client.post("/api/audit/evaluate", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "FLAGGED"
    assert "mandates prior approval" in data["violation_reason"]
    assert data["datahub_written"] is True

def test_audit_unknown_agent_violation():
    payload = {
        "agent_name": "UnregisteredRogueBot",
        "dataset_name": "healthcare.patient_records",
        "access_type": "read",
        "is_approved": False
    }
    response = client.post("/api/audit/evaluate", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "FLAGGED"
    assert "Unknown Agent Violation" in data["violation_reason"]

def test_simulate_batch_scenarios():
    response = client.post("/api/audit/simulate-batch")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 5
    statuses = [item["status"] for item in data]
    assert "OK" in statuses
    assert "FLAGGED" in statuses
