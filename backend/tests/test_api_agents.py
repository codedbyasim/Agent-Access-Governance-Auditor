import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.store.database import init_db

init_db()
client = TestClient(app)

def get_auth_token():
    payload = {
        "email": "agent.admin@example.com",
        "password": "AdminPassword123!",
        "full_name": "Agent Administrator"
    }
    resp = client.post("/api/auth/signup", json=payload)
    if resp.status_code == 400:
        resp = client.post("/api/auth/login", json={"email": "agent.admin@example.com", "password": "AdminPassword123!"})
    return resp.json()["access_token"]

def test_list_agents():
    response = client.get("/api/agents")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 5
    names = [a["name"] for a in data]
    assert "CustomerSupportBot" in names
    assert "FinancialAnalystAgent" in names

def test_create_agent_success():
    token = get_auth_token()
    import uuid
    agent_name = f"DataScienceExplorerBot_{uuid.uuid4().hex[:6]}"
    payload = {
        "name": agent_name,
        "declared_purpose": "Explores analytical data assets for feature engineering.",
        "allowed_classifications": ["public", "confidential"],
        "requires_approval": False
    }
    response = client.post(
        "/api/agents",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == agent_name
    assert "confidential" in data["allowed_classifications"]
    assert data["requires_approval"] is False

def test_create_agent_invalid_classification_rejection():
    token = get_auth_token()
    payload = {
        "name": "RogueAgent",
        "declared_purpose": "Attempts invalid classification access.",
        "allowed_classifications": [],  # Empty classifications violate FR-10
        "requires_approval": False
    }
    response = client.post(
        "/api/agents",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 400
    assert "at least one allowed classification" in response.json()["detail"]

def test_update_agent_policy():
    token = get_auth_token()
    import uuid
    agent_name = f"AgentToUpdate_{uuid.uuid4().hex[:6]}"
    create_resp = client.post(
        "/api/agents",
        json={
            "name": agent_name,
            "declared_purpose": "Initial declared purpose.",
            "allowed_classifications": ["public"],
            "requires_approval": False
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    agent_id = create_resp.json()["id"]

    updated_payload = {
        "name": agent_name,
        "declared_purpose": "Updated operational purpose.",
        "allowed_classifications": ["public", "confidential"],
        "requires_approval": True
    }
    response = client.put(
        f"/api/agents/{agent_id}",
        json=updated_payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["requires_approval"] is True
    assert "confidential" in data["allowed_classifications"]

def test_delete_agent():
    token = get_auth_token()
    # Register a temporary agent to delete
    create_resp = client.post(
        "/api/agents",
        json={
            "name": "TempAgentToDelete",
            "declared_purpose": "Temporary agent for deletion test.",
            "allowed_classifications": ["public"],
            "requires_approval": False
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    agent_id = create_resp.json()["id"]

    # Delete agent
    delete_resp = client.delete(
        f"/api/agents/{agent_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert delete_resp.status_code == 204

    # Verify 404 on GET
    get_resp = client.get(f"/api/agents/{agent_id}")
    assert get_resp.status_code == 404
