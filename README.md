# Agent Access Governance Auditor

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.12-blue)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141-green)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev/)
[![DataHub MCP](https://img.shields.io/badge/DataHub_MCP-v0.6.0-orange)](https://pypi.org/project/mcp-server-datahub/)
[![Tests](https://img.shields.io/badge/Tests-43%20Passed-brightgreen)](#-running-automated-tests)

A full-stack AI safety and data compliance governance platform built for **Build with DataHub — The Agent Hackathon**.

The platform monitors AI agents' access to DataHub-cataloged data assets via **DataHub Model Context Protocol (MCP) Server (`mcp-server-datahub`)**, evaluates access attempts against enterprise data governance policies, writes risk flags and audit notes directly onto the DataHub metadata graph, and notifies dataset owners via automated GitHub Issues.

Submitted for Challenge Track: **Agents That Do Real Work**

---

## 📽️ Demo Video & Media

- **Official Demo Video (2:45 min MP4)**: [`examples/demo_video.mp4`](examples/demo_video.mp4) or [`examples/agent_access_governance_auditor_demo.mp4`](examples/agent_access_governance_auditor_demo.mp4)
- **GitHub Repository**: [https://github.com/codedbyasim/Agent-Access-Governance-Auditor](https://github.com/codedbyasim/Agent-Access-Governance-Auditor)

---

## 🎯 Problem Statement

As enterprises rapidly deploy autonomous AI agents (Customer Support Bots, Financial Analytics Assistants, RAG Search Agents) to query corporate data platforms (Snowflake, BigQuery, Postgres), a critical **AI Safety & Compliance Gap** emerges:

1. **Invisible Access**: AI agents frequently query datasets containing PII (SSNs, credit card numbers, addresses) or confidential financial tables without explicit approval or policy checks.
2. **Catalog Blind Spots**: Data governance teams have no visibility in DataHub whether an asset was accessed by a human or an unauthorized AI agent.
3. **Delayed Incident Remediation**: When policy breaches occur, compliance teams lack real-time write-backs to flag high-risk assets in the data catalog or automatically trigger incident tickets.

---

## 💡 Solution Overview

The **Agent Access Governance Auditor** acts as a real-time governance sidecar that continuously monitors, audits, and enforces access control rules between AI agents and cataloged data assets:

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

## ⚡ Real DataHub Integration (MCP Server)

This system genuinely uses the **DataHub Model Context Protocol (MCP) Server (`mcp-server-datahub` v0.6.0)** under an active `MCPContext`:

### 1. Live Context-Read Path
- **`search` Tool**: Queries live cataloged datasets from DataHub GMS (`http://localhost:8080`) using `mcp_server_datahub.tools.search.search`.
- **`get_entities` Tool**: Fetches live tags, sensitivity levels (`pii`, `confidential`, `public`), and asset descriptions via `mcp_server_datahub.tools.entities.get_entities`.

### 2. Live Graph Write-Back Path
- **`add_tags` Tool**: Emits `urn:li:tag:governance-risk` violation tags and structured audit notes onto DataHub dataset entities using `mcp_server_datahub.tools.tags.add_tags` whenever an AI agent attempts unauthorized access.
- **`remove_tags` Tool**: Clears `governance-risk` tags upon remediation via `mcp_server_datahub.tools.tags.remove_tags`.

### 3. Fast-Failure & Resiliency Controls
- Explicit 3-second connection/read timeout configuration (`timeout_sec=3.0`, `connect_timeout_sec=3.0`, `read_timeout_sec=3.0`, `retry_max_times=0`).
- Built-in **Circuit Breaker**: When DataHub GMS is offline, calls fail fast in **< 0.001 seconds** with graceful catalog cache fallbacks.

---

## ✨ System Features (SRS §3)

1. **User Authentication & GitHub OAuth (§3.1, §3.5)**
   - User Signup and Login with PBKDF2/SHA256 password hashing and JWT Bearer sessions.
   - GitHub OAuth 2.0 Authorization Code flow linking compliance officer accounts.

2. **DataHub Datasets Catalog Explorer (§3.1)**
   - Search, classification filtering (`pii`, `confidential`, `public`), URN inspection, and live classification tag editing.

3. **AI Agent Policy Registry (§3.2)**
   - Agent policy configuration: declared purpose, allowed classifications, and human approval toggles.

4. **Real-time Access Auditing Engine (§3.3)**
   - Policy evaluation engine comparing agent permissions against dataset classifications.
   - 5-scenario compliance simulator (`POST /api/audit/simulate-batch`).

5. **DataHub Graph Write-Back & Remediation (§3.4)**
   - Automatic `governance-risk` tagging and audit note writing to DataHub.
   - Officer remediation workflow clearing risk tags via `/api/datasets/{identifier}/remediate`.

6. **Automated GitHub Issue Incident Dispatch (§3.5)**
   - Automated GitHub Issue creation on dataset owner repositories with violation details and URN links.
   - Local simulated notification fallback logging (`⚡ Simulated Alert Logged`) when OAuth is disconnected.

7. **Audit Log & Reporting (§3.6)**
   - Immutable audit trail with multi-criteria filtering, search, and pagination.
   - One-click **Export CSV** and **Export JSON** compliance report downloads.

---

## 🚀 Setup & Quickstart Guide

### Prerequisites
- Docker & Docker Compose installed
- Python 3.11 or 3.12 with virtual environment (`venv`)
- Node.js `v20+` and npm `10+`
- DataHub Quickstart running locally in Docker (`http://localhost:8080` GMS, `http://localhost:9002` Frontend)

---

### Option A: One-Command Docker Compose (Recommended)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/codedbyasim/Agent-Access-Governance-Auditor.git
   cd Agent-Access-Governance-Auditor
   ```

2. **Start all services**:
   ```bash
   docker-compose up --build
   ```

3. **Access the application**:
   - Frontend Portal: [http://localhost:3000](http://localhost:3000)
   - Backend API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
   - Health Status Endpoint: [http://localhost:8000/health](http://localhost:8000/health)

---

### Option B: Manual Local Setup

#### 1. Backend API Setup
```bash
# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate  # On Windows
# source venv/bin/activate  # On Linux/macOS

# Install dependencies
pip install -r backend/requirements.txt

# Start FastAPI backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Frontend Setup (in separate terminal)
```bash
cd frontend
npm install
npm run dev -- --port 3000
```

---

## 🔑 GitHub OAuth Setup (Optional for Live Issue Creation)

1. Go to **GitHub Developer Settings**: [https://github.com/settings/developers](https://github.com/settings/developers)
2. Create a new OAuth Application:
   - **Application Name**: `Agent Access Governance Auditor`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization Callback URL**: `http://localhost:3000/auth/github/callback`
3. Configure your root `.env` file:
   ```env
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   GITHUB_REDIRECT_URI=http://localhost:3000/auth/github/callback
   ```
4. Connect your account on the **Settings & OAuth** page in the portal.

---

## 🧪 Running Automated Tests

Run the complete backend test suite (**43 unit & integration tests** covering MCP Server integration, policy engine, auth, timeouts, and write-backs):

```bash
.\venv\Scripts\pytest.exe backend/tests -q
```

Output:
```text
...........................................                              [100%]
43 passed in 21.01s
```

Frontend production build check:
```bash
cd frontend
npm run build
```

---

## 📊 Sample Output Artifacts

Sample artifacts are available in the [`examples/`](examples/) folder:
- [`examples/demo_video.mp4`](examples/demo_video.mp4) — 2:45 Live MP4 Demo Video
- [`examples/audit_log_sample.json`](examples/audit_log_sample.json) — Exported JSON audit report
- [`examples/audit_log_sample.csv`](examples/audit_log_sample.csv) — Exported CSV compliance report
- [`examples/datahub_writeback_sample.json`](examples/datahub_writeback_sample.json) — DataHub MCP Server write-back payload

---

## 📢 Hackathon Compliance & Pre-Existing Work Disclosure

Per official Devpost hackathon rules (§2):
- **Frameworks & Packages**: FastAPI, React 18, Vite, SQLAlchemy, PyJWT, and `mcp-server-datahub` (Model Context Protocol package).
- **DataHub Integration**: Genuine live metadata reads (`search`, `get_entities`), classifications (`pii`, `confidential`, `public`), and write-backs (`add_tags`, `remove_tags`, notes) executed via DataHub MCP Server against DataHub GMS (`http://localhost:8080`).
- **Simulated Data**: AI agent access attempts are generated via the scenario audit simulator per SRS §2.6.
- **AI Coding Assistance**: Developed with AI pair-programming assistance (Google DeepMind Antigravity AI coding assistant) during the official hackathon window.

---

## 🏛️ Project Documentation Links

- [Software Requirements Specification (SRS)](SRS.md)
- [Architecture & Data Flow Specification](docs/architecture.md)
- [Architectural & Engineering Decisions Log](docs/decisions.md)
- [Design System & UI Guidelines](docs/design-system.md)
- [Compliance Verification & Definition of Done](Agent.md)
