import pytest
import time
from unittest.mock import patch
import requests
from fastapi.testclient import TestClient
from app.main import app
from app.integrations.datahub_client import DataHubClient

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert "health_check" in data

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "datahub_connected" in data
    assert "database_connected" in data
    assert data["database_connected"] is True

def test_datahub_unreachable_timeout_fails_fast():
    """
    Verifies that when DataHub GMS is unreachable or times out, client connection test and MCP calls
    fail fast within timeout_sec (3-5s) with clean fallback, avoiding indefinite hangs.
    """
    unreachable_client = DataHubClient(
        gms_url="http://127.0.0.1:59999",
        token="invalid_token",
        timeout_sec=2.0
    )

    with patch("requests.get", side_effect=requests.exceptions.ConnectTimeout("Connection timed out after 2.0s")):
        start_time = time.time()
        connected = unreachable_client.test_connection()
        elapsed = time.time() - start_time

        assert connected is False
        assert elapsed < 1.0, f"Connection test took {elapsed:.2f}s, expected < 1.0s"

    # Verify get_cataloged_datasets clean fast fallback within 5s when DataHub is unreachable
    start_time = time.time()
    datasets = unreachable_client.get_cataloged_datasets()
    elapsed_datasets = time.time() - start_time

    assert len(datasets) > 0
    assert elapsed_datasets < 5.0, f"Catalog fetch took {elapsed_datasets:.2f}s, expected < 5.0s timeout"

def test_tag_governance_violation_unreachable_emitter_fails_fast():
    """
    Verifies that tag_governance_violation() (and its underlying DatahubRestEmitter.emit call)
    fails fast within 7s when DataHub GMS is unreachable, avoiding 20+ second hangs.
    """
    unreachable_client = DataHubClient(
        gms_url="http://127.0.0.1:59999",
        token="invalid_token",
        timeout_sec=1.5
    )

    start_time = time.time()
    success = unreachable_client.tag_governance_violation(
        identifier="analytics.customer_pii",
        reason="Testing emitter timeout behavior on unreachable GMS",
        agent_name="TimeoutTestAgent"
    )
    elapsed = time.time() - start_time

    assert success is True
    assert elapsed < 5.0, f"tag_governance_violation took {elapsed:.2f}s, expected < 5.0s on unreachable GMS"
