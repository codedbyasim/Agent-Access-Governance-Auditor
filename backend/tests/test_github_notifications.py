import pytest
from unittest.mock import patch, MagicMock
from app.integrations.github_client import github_client
from app.store.models import UserModel

def test_github_issue_body_formatting():
    event_data = {
        "event_id": "evt_abc123",
        "agent_name": "SupportBot",
        "dataset_name": "analytics.customer_pii",
        "access_type": "query",
        "timestamp": "2026-08-08 12:00 UTC",
        "violation_reason": "Bot policy forbids access to PII datasets."
    }
    body = github_client.format_issue_body(event_data)
    assert "SupportBot" in body
    assert "analytics.customer_pii" in body
    assert "evt_abc123" in body
    assert "Bot policy forbids access to PII datasets." in body
    assert "Required Action" in body

def test_github_issue_fallback_when_disconnected():
    # User with no GitHub connected
    user = UserModel(
        email="unconnected@example.com",
        github_username=None,
        github_access_token=None
    )
    event_data = {
        "event_id": "evt_def456",
        "agent_name": "FinancialBot",
        "dataset_name": "finance.payroll",
        "violation_reason": "Missing human approval."
    }
    res = github_client.create_governance_violation_issue(user, event_data)
    assert res["status"] == "fallback"
    assert res["github_issue_url"] is None
    assert "NOTIFICATION FALLBACK" in res["message"]

@patch("requests.post")
def test_github_issue_posting_success(mock_post):
    # Mock GitHub REST API 201 Created response
    mock_resp = MagicMock()
    mock_resp.status_code = 201
    mock_resp.json.return_value = {
        "html_url": "https://github.com/octocat/governance-alerts/issues/42",
        "number": 42
    }
    mock_post.return_value = mock_resp

    user = UserModel(
        email="connected@example.com",
        github_username="octocat",
        github_access_token="gho_mock_oauth_token_123"
    )
    event_data = {
        "event_id": "evt_ghi789",
        "agent_name": "RogueBot",
        "dataset_name": "healthcare.patient_records",
        "violation_reason": "Unknown agent policy violation."
    }
    res = github_client.create_governance_violation_issue(user, event_data)
    assert res["status"] == "posted"
    assert res["github_issue_url"] == "https://github.com/octocat/governance-alerts/issues/42"
    assert res["github_issue_number"] == 42
    assert "posted successfully" in res["message"]
