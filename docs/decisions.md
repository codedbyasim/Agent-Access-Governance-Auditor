# Architectural & Engineering Decisions Log

This document records key technical decisions and trade-offs made during the implementation of the Agent Access Governance Auditor, in accordance with **SRS §1.2**, **HACKATHON.md**, and **AGENTS.md §5**.

---

### Decision 1: Backend Layering & Core Isolation (NFR-8)
- **Context**: SRS §5.1 requires `core/` (policy check engine) to remain framework-independent.
- **Decision**: `backend/app/core/` contains pure Python logic with no dependencies on FastAPI, Starlette, or web request context. API endpoints in `backend/app/api/` wrap `core/` logic and handle HTTP status codes, validation, and JSON serialization.

### Decision 2: DataHub MCP Server Integration & Live Read Reconciliation (HACKATHON.md §0)
- **Context**: Hackathon rules mandate using DataHub MCP Server, Agent Context Kit, or Skills (not just plain REST SDK).
- **Decision**: Integrated `mcp-server-datahub` (v0.6.0). Converted context-read path (`get_cataloged_datasets`, `get_dataset_detail`) to execute live `search` and `get_entities` tool calls under an active `MCPContext`. Reconciles live tags, violation states, descriptions, and owners directly from DataHub GMS, using default catalog cache as a fallback on network failure.

### Decision 3: Fast Timeout & Fast-Failure Control (NFR-1, NFR-12)
- **Context**: When DataHub GMS is slow or unreachable, network requests can hang indefinitely.
- **Decision**: Configured `timeout_sec=3.0` and `retry_max_times=0` on `DataHubGraphConfig` and `requests`. Added automated test `test_datahub_unreachable_timeout_fails_fast()` to verify that connection tests and catalog reads fail fast within 3s with clean fallback rather than blocking.

### Decision 4: DataHub Write-Back & Remediation Engine (SRS §3.4)
- **Context**: DataHub is running in Docker Quickstart on port `8080`.
- **Decision**: On policy violations, the backend emits `urn:li:tag:governance-risk` via MCP `add_tags` tool and attaches audit notes. Governance officers can clear the risk tag post-remediation via `/api/datasets/{identifier}/remediate` executing MCP `remove_tags`.

### Decision 5: Auth & GitHub OAuth Integration (§3.5)
- **Context**: User authentication and real GitHub OAuth issue notifications.
- **Decision**: Implemented password hashing using PBKDF2/SHA256 and JWT sessions (`PyJWT`). Added GitHub OAuth Authorization Code Flow (`/api/auth/github/url` and `/api/auth/github/callback`) for automated GitHub issue creation.

### Decision 6: Notification Fallback Strategy (FR-27)
- **Context**: FR-27 requires graceful fallback when GitHub account is not connected.
- **Decision**: If GitHub OAuth is disconnected or API is unreachable, system logs a local simulated notification entry (`⚡ Simulated Alert Logged`) without breaking the audit pipeline.

### Decision 7: Audit Trail Persistence & Streaming Exports (FR-28, FR-30, FR-32)
- **Context**: Persistent immutable audit log and reporting requirements.
- **Decision**: Persisted all access events in SQLite database (`auditor.db`) via SQLAlchemy. Implemented server-side pagination (20 records/page) and streaming export endpoints for CSV (`/api/audit/export/csv`) and JSON (`/api/audit/export/json`).
