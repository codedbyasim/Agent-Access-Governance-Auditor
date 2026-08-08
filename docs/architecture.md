# Architecture & Data Flow Specification

## 1. System Component Overview

```
 ┌───────────────────────────────────────────────────────────┐
 │                   Frontend (React 18 + TS)                │
 │   Dashboard · Datasets · Agents · AuditRunner · AuditLog  │
 └─────────────────────────────┬─────────────────────────────┘
                               │ REST / JSON (JWT Bearer Auth)
 ┌─────────────────────────────▼─────────────────────────────┐
 │                    Backend API (FastAPI)                   │
 │   routers: auth, datasets, agents, audit, health          │
 └──────────────┬──────────────────────────────┬─────────────┘
                │                              │
 ┌──────────────▼──────────────┐ ┌──────────────▼─────────────┐
 │       Core Audit Engine     │ │      Database Store        │
 │ (auditor.py, policy.py)     │ │   (SQLite via SQLAlchemy)  │
 └──────────────┬──────────────┘ └────────────────────────────┘
                │
 ┌──────────────▼──────────────┐
 │    Integrations Layer       │
 └──────┬──────────────┬───────┘
        │              │
 DataHub MCP Server  GitHub REST API
 (mcp-server-datahub) (OAuth Issues)
        │              │
 ┌──────▼──────┐ ┌─────▼──────┐
 │   DataHub   │ │   GitHub   │
 │   (GMS)     │ │ (Issues)   │
 └─────────────┘ └────────────┘
```

---

## 2. DataHub Model Context Protocol (MCP) Integration

The system uses **`mcp-server-datahub` (v0.6.0)** under an active `MCPContext` with explicit 3-second timeout protection (`timeout_sec=3.0`, `retry_max_times=0`):

- **Live Context-Read Path**:
  - `search`: Uses `mcp_server_datahub.tools.search.search` to query cataloged datasets from DataHub GMS (`http://localhost:8080`).
  - `get_entities`: Uses `mcp_server_datahub.tools.entities.get_entities` to fetch live tags, classification levels (`pii`, `confidential`, `public`), and asset descriptions.
- **Live Write-Back Path**:
  - `add_tags`: Emits `urn:li:tag:governance-risk` violation tags and structured audit notes onto DataHub dataset entities using `mcp_server_datahub.tools.tags.add_tags`.
  - `remove_tags`: Clears `governance-risk` tags upon remediation via `mcp_server_datahub.tools.tags.remove_tags`.

---

## 3. Layering & Module Organization

- `backend/app/api/`: FastAPI REST endpoints, request/response validation, dependency injection.
  - `auth.py`: Authentication, registration, JWT tokens, and GitHub OAuth callback routes.
  - `datasets.py`: Catalog queries, classification tag editor, and DataHub risk tag remediation.
  - `agents.py`: AI agent policy registry CRUD routes.
  - `audit.py`: Access event evaluation, scenario simulator, audit log filtering, metrics, and CSV/JSON exports.
  - `health.py`: Live DataHub & database connection health check.
- `backend/app/core/`: Framework-independent business domain policy engine.
  - `policy.py`: Policy evaluation logic comparing agent permissions against dataset classifications.
  - `auditor.py`: Audit orchestration executing policy checks, persisting logs, and triggering write-backs.
- `backend/app/store/`: Database persistence layer (SQLAlchemy models: `UserModel`, `AgentModel`, `AuditLogModel`).
- `backend/app/integrations/`: DataHub MCP Client wrapper (`datahub_client.py`) & GitHub notification client (`github_client.py`).
- `frontend/src/`: React frontend client application (pages, components, services).

---

## 4. REST API Matrix

| Endpoint | Method | Scope | Description |
| :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | Public | System and DataHub GMS connection status |
| `/api/auth/signup` | `POST` | Public | Register new governance officer account |
| `/api/auth/login` | `POST` | Public | Authenticate user & issue JWT Bearer token |
| `/api/auth/me` | `GET` | Protected | Fetch current user session details |
| `/api/auth/github/url` | `GET` | Public | Generate GitHub OAuth redirect URL |
| `/api/auth/github/callback` | `POST` | Protected | Exchange code & link GitHub account |
| `/api/datasets` | `GET` | Public | List DataHub datasets with filters & sorting |
| `/api/datasets/{identifier}` | `GET` | Public | Fetch dataset details, tags, and audit notes |
| `/api/datasets/{identifier}/classification` | `POST` | Protected | Edit DataHub classification level tag |
| `/api/datasets/{identifier}/remediate` | `POST` | Protected | Clear DataHub `governance-risk` tag |
| `/api/agents` | `GET` / `POST` | Mixed | List registered agents / Register new agent |
| `/api/agents/{id}` | `PUT` / `DELETE` | Protected | Update or delete agent policy configuration |
| `/api/audit/evaluate` | `POST` | Public | Evaluate AI access event & execute write-backs |
| `/api/audit/simulate-batch` | `POST` | Public | Execute 5 pre-configured test scenarios |
| `/api/audit/logs` | `GET` | Public | Filtered audit logs with pagination |
| `/api/audit/metrics` | `GET` | Public | KPI compliance summary statistics |
| `/api/audit/export/csv` | `GET` | Public | Download audit trail report as CSV file |
| `/api/audit/export/json` | `GET` | Public | Download audit trail report as JSON file |
