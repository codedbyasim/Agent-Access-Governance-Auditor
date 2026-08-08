import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.store.database import init_db
from app.integrations.datahub_client import datahub_client

init_db()
client = TestClient(app)

def get_auth_token():
    payload = {
        "email": "writeback.officer@example.com",
        "password": "OfficerPassword123!",
        "full_name": "Compliance Officer"
    }
    resp = client.post("/api/auth/signup", json=payload)
    if resp.status_code == 400:
        resp = client.post("/api/auth/login", json={"email": "writeback.officer@example.com", "password": "OfficerPassword123!"})
    return resp.json()["access_token"]

def test_datahub_writeback_on_violation():
    # Trigger a violation writeback directly
    success = datahub_client.tag_governance_violation(
        identifier="analytics.customer_pii",
        reason="Agent CustomerSupportBot attempted unauthorized PII access.",
        agent_name="CustomerSupportBot"
    )
    assert success is True

    # Verify DataHub dataset detail reflects governance-risk tag & audit notes (FR-20, FR-21)
    detail = datahub_client.get_dataset_detail("analytics.customer_pii")
    assert detail is not None
    assert detail.has_governance_violation is True
    assert "governance-risk" in detail.tags
    assert len(detail.audit_notes) > 0
    assert "Governance Violation" in detail.audit_notes[-1]

def test_datahub_remediation_tag_clearance():
    # Tag violation first
    datahub_client.tag_governance_violation("analytics.customer_pii", "Sample violation", "TestBot")

    # Call remediation (FR-22)
    remediated = datahub_client.remove_governance_risk_tag("analytics.customer_pii", resolved_by="Jane Officer")
    assert remediated.has_governance_violation is False
    assert "governance-risk" not in remediated.tags
    assert "Governance Risk Tag cleared" in remediated.audit_notes[-1]

def test_remediate_endpoint_authenticated():
    token = get_auth_token()
    # Tag violation first
    datahub_client.tag_governance_violation("finance.payroll_transactions", "Unauthorized access", "RogueBot")

    # Call /api/datasets/{identifier}/remediate endpoint
    response = client.post(
        "/api/datasets/finance.payroll_transactions/remediate",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["has_governance_violation"] is False
    assert "governance-risk" not in data["tags"]
