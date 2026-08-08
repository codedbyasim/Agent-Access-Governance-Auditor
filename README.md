# Agent Access Governance Auditor

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.12-blue)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141-green)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev/)
[![DataHub MCP](https://img.shields.io/badge/DataHub_MCP-v0.6.0-orange)](https://pypi.org/project/mcp-server-datahub/)
[![Tests](https://img.shields.io/badge/Tests-41%20Passed-brightgreen)](#-running-automated-tests)

A full-stack AI safety and compliance governance platform that monitors AI agents' access to DataHub-cataloged data assets via **DataHub MCP Server**, evaluates access events against policy rules, writes compliance flags/notes back to DataHub, and notifies data owners via automated GitHub Issues.

Created for **Build with DataHub — The Agent Hackathon** (Challenge Category: **Agents That Do Real Work**).

---

## 🎯 Challenge Category

**Agents That Do Real Work**
> *"Your agent reads DataHub through the MCP Server or Agent Context Kit to understand what's connected to what, takes action, and writes results back so the next person or agent inherits the knowledge."*

This system genuinely integrates **DataHub's Model Context Protocol (MCP) Server (`mcp-server-datahub`)**:
1. **Context-Read Path**: Interrogates dataset sensitivity (`pii`, `confidential`, `public`), ownership, and metadata using MCP Server `search` and `get_entities` tools under an active `MCPContext`.
2. **Write-Back Path**: Emits `urn:li:tag:governance-risk` violation flags and structured audit notes back onto DataHub dataset entities using the MCP Server `add_tags` tool, and clears tags post-remediation using `remove_tags`.

---

## ✨ Features Implemented (SRS §3)

- **Feature 1: User Authentication & GitHub OAuth (§3.1, §3.5)**
  - User Signup and Login with PBKDF2/SHA256 password hashing and JWT Bearer token sessions.
  - GitHub OAuth 2.0 Authorization Code flow linking user accounts for automated GitHub Issue creation.

- **Feature 2: DataHub Dataset Catalog Integration via MCP Server (§3.1)**
  - Dynamic metadata ingestion from DataHub GMS (`http://localhost:8080`) using MCP Server `search` and `get_entities` tools.
  - Search, classification filtering (`pii`, `confidential`, `public`), and live classification tag editing (write-back to DataHub).

- **Feature 3: AI Agent Policy Registry (§3.2)**
  - Registered AI agent management (`CustomerSupportBot`, `FinancialAnalystAgent`, `DataGovernanceCheckerAgent`, etc.).
  - Agent policy configuration: declared purpose, allowed dataset classifications, and human approval enforcement.

- **Feature 4: Access Event Auditing Engine (§3.3)**
  - Real-time access policy evaluation engine (`evaluate_and_record_access_event`).
  - Interrogates target dataset sensitivity via DataHub MCP Server to classify access events as `OK` (Compliant) or `FLAGGED` (Policy Violation).
  - Pre-configured 5-scenario test suite simulator (`POST /api/audit/simulate-batch`).

- **Feature 5: DataHub MCP Write-Back & Remediation Engine (§3.4)**
  - Automatic `governance-risk` tag emission via MCP `add_tags` tool and structured audit note aspect write-back to DataHub entities upon policy violations.
  - Remediation endpoint (`POST /api/datasets/{identifier}/remediate`) executing MCP `remove_tags` tool to clear risk tags upon violation resolution.

- **Feature 6: Automated GitHub Issue Notification Engine (§3.5)**
  - Automated GitHub Issue creation on dataset owner repositories via GitHub REST API using OAuth tokens.
  - Structured Markdown issue formatting with violation reason, audit URN, and remediation checklist.
  - Graceful local fallback logging (`⚡ Simulated Alert Logged`) when GitHub OAuth is disconnected.

- **Feature 7: Audit Log & Reporting Engine (§3.6)**
  - Persistent immutable audit log store with multi-criteria search, status filtering, agent filtering, and pagination.
  - One-click **Export CSV** and **Export JSON** report downloads.
  - Real-time KPI summary metrics cards (Total Evaluations, Compliance Rate %, Flagged Violations, Top Violating Agent).
  - Deep audit record inspector modal (`AuditLogDetailModal`).

---

## 🚀 One-Command Quickstart

### Prerequisites
- Docker & Docker Compose installed
- Python 3.11 / 3.12 with virtual environment (`venv`)
- Node.js `v22+` and npm `10+`
- DataHub Quickstart running locally in Docker (`http://localhost:8080` GMS, `http://localhost:9002` Frontend)

### Option A: One-Command Docker Compose Startup (Recommended for Judges)
```bash
docker-compose up --build
```
- Backend API: [http://localhost:8000](http://localhost:8000)
- Frontend Web App: [http://localhost:3000](http://localhost:3000)

### Option B: Local Development Startup
```bash
# 1. Start Backend API
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# 2. Start Frontend Web App (in separate terminal)
cd frontend
npx vite --port 3000
```
Interactive API Swagger Documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

---

## 🔑 Authentication & GitHub OAuth Setup

1. Go to **GitHub Developer Settings**: [https://github.com/settings/developers](https://github.com/settings/developers)
2. Register a new OAuth Application:
   - **Application Name**: `Agent Access Governance Auditor`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/auth/github/callback`
3. Copy **Client ID** and generate **Client Secret**.
4. Configure your `.env` file in the root directory:
   ```env
   GITHUB_CLIENT_ID=your_client_id_here
   GITHUB_CLIENT_SECRET=your_client_secret_here
   GITHUB_REDIRECT_URI=http://localhost:3000/auth/github/callback
   ```
5. Navigate to **Settings & OAuth** in the portal to connect your account.

---

## 🧪 Running Automated Tests

Run the complete backend test suite (41 unit & integration tests covering MCP Server integration, policy engine, auth, and write-backs):

```bash
.\venv\Scripts\pytest.exe backend/tests
```

Frontend production bundle build validation:
```bash
cd frontend
npm run build
```

---

## 📊 Sample Artifacts & Examples

Sample exported artifacts are available in the [`examples/`](examples/) folder:
- [`examples/audit_log_sample.json`](examples/audit_log_sample.json) — Exported JSON audit report
- [`examples/audit_log_sample.csv`](examples/audit_log_sample.csv) — Exported CSV compliance report
- [`examples/datahub_writeback_sample.json`](examples/datahub_writeback_sample.json) — Sample DataHub MCP Server write-back payload

---

## 📢 Disclosure of Pre-Existing Work & AI Assistance (NFR-15, Hackathon Rules §2)

Per official Devpost hackathon guidelines:
- **Frameworks & Libraries**: FastAPI, React 18, Vite, SQLAlchemy, PyJWT, and `mcp-server-datahub` (Model Context Protocol package).
- **Live DataHub Integration**: Dataset metadata reads (`search`, `get_entities`), classification sensitivity levels (`pii`, `confidential`, `public`), and write-backs (`add_tags`, `remove_tags`, notes) are executed live against DataHub GMS (`http://localhost:8080`).
- **Simulated Data**: AI agent access events are simulated via the Audit Runner scenario simulator per SRS §2.6.
- **AI Coding Assistance**: Developed with AI pair-programming assistance (Google DeepMind Antigravity AI coding assistant) during the official submission period (July 6 – August 10, 2026).

---

## 🏛️ Architecture & Documentation

- [Architecture & Data Flow Specification](docs/architecture.md)
- [Architectural & Engineering Decisions Log](docs/decisions.md)
- [Design System & UI Guidelines](docs/design-system.md)

---

## 📄 License
This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.
