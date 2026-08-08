# Architectural & Engineering Decisions Log

This document records key technical decisions and trade-offs made during the implementation of the Agent Access Governance Auditor, in accordance with **SRS §1.2** and **AGENTS.md §5**.

---

### Decision 1: Backend Layering & Core Isolation (NFR-8)
- **Context**: SRS §5.1 requires `core/` (policy check engine) to remain framework-independent.
- **Decision**: `backend/app/core/` contains pure Python logic with no dependencies on FastAPI, Starlette, or web request context. API endpoints in `backend/app/api/` wrap `core/` logic and handle HTTP status codes, validation, and JSON serialization.

### Decision 2: DataHub Integration & Write-Back Hooks (NFR-12, SRS §3.4)
- **Context**: DataHub is already running in Docker Quickstart on port `8080` (GMS).
- **Decision**: The Auditor backend connects directly to `http://localhost:8080` via REST API. When a policy violation occurs, the system automatically emits a `governance-risk` tag and attaches a structured audit note aspect to the dataset entity in DataHub. A remediation endpoint (`POST /api/datasets/{identifier}/remediate`) allows governance officers to clear the risk tag upon remediation.

### Decision 3: Auth & GitHub Integration (§3.5)
- **Context**: AGENTS.md §3.5 mandates user authentication and real GitHub OAuth for issue notifications.
- **Decision**: Implemented password hashing using PBKDF2 with SHA256 and JWT bearer token sessions (`PyJWT`). Added GitHub OAuth Authorization Code Flow (`/api/auth/github/url` and `/api/auth/github/callback`) so the app can create GitHub issues on behalf of the user when violations occur.

### Decision 4: GitHub Notification Fallback Strategy (FR-27)
- **Context**: FR-27 requires graceful fallback when GitHub account is not connected or GitHub API is unavailable.
- **Decision**: If a user is not connected or GitHub API encounters network timeouts, the system falls back to logging a local simulated notification entry (`⚡ Simulated Alert Logged`) without throwing unhandled exceptions or breaking the audit pipeline.

### Decision 5: Audit Trail Persistence & Export Formats (FR-28, FR-30, FR-32)
- **Context**: Regulatory auditing requires immutable event records, multi-field search, pagination, and offline reporting.
- **Decision**: Persisted all access events in SQLite database (`auditor.db`) via SQLAlchemy. Implemented server-side pagination (default 20 records per page) and streaming export endpoints for CSV (`/api/audit/export/csv`) and JSON (`/api/audit/export/json`).

### Decision 6: Visual Design System & Anti-AI-Slop Styling (AGENTS.md §3)
- **Context**: AGENTS.md strictly forbids generic AI slop UI (glassmorphism cards, purple/blue gradient hero banners, raw Tailwind defaults, color-only badges).
- **Decision**: Created a dense compliance & governance theme using custom dark charcoal/navy scales (`#0f172a`, `#1e293b`), high-contrast typography (`Inter`), accessible badges combining icons, shapes, and text (NFR-17), and real data tables.
