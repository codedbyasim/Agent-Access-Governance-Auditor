# Agent Access Governance Auditor

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.12-blue)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141-green)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev/)
[![DataHub](https://img.shields.io/badge/DataHub-v1.7.0-orange)](https://datahubproject.io/)
[![Tests](https://img.shields.io/badge/Tests-41%20Passed-brightgreen)](#-running-automated-tests)

A full-stack AI safety and compliance governance platform that monitors AI agents' access to DataHub-cataloged data assets, evaluates access events against policy rules, writes compliance flags/notes back to DataHub, and notifies data owners via automated GitHub Issues.

Created for **Build with DataHub — The Agent Hackathon** (Open / Regulatory Automation Track).

---

## ✨ Features Implemented (SRS §3)

- **Feature 1: User Authentication & GitHub OAuth (§3.1, §3.5)**
  - User Signup and Login with PBKDF2/SHA256 password hashing and JWT Bearer token sessions.
  - GitHub OAuth 2.0 Authorization Code flow linking user accounts for automated GitHub Issue creation.

- **Feature 2: DataHub Dataset Catalog Integration (§3.1)**
  - Dynamic metadata ingestion from DataHub GMS (`http://localhost:8080`).
  - Search, classification filtering (`pii`, `confidential`, `public`), and live classification tag editing (write-back to DataHub).

- **Feature 3: AI Agent Policy Registry (§3.2)**
  - Registered AI agent management (`CustomerSupportBot`, `FinancialAnalystAgent`, `DataGovernanceCheckerAgent`, etc.).
  - Agent policy configuration: declared purpose, allowed dataset classifications, and human approval enforcement.

- **Feature 4: Access Event Auditing Engine (§3.3)**
  - Real-time access policy evaluation engine (`evaluate_and_record_access_event`).
  - Interrogates target dataset sensitivity and agent policies to classify access events as `OK` (Compliant) or `FLAGGED` (Policy Violation).
  - Pre-configured 5-scenario test suite simulator (`POST /api/audit/simulate-batch`).

- **Feature 5: DataHub Write-Back Engine (§3.4)**
  - Automatic `governance-risk` tag emission and structured audit note aspect write-back to DataHub entities upon policy violations.
  - Remediation endpoint (`POST /api/datasets/{identifier}/remediate`) allowing governance officers to clear risk tags upon violation resolution.

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
- Python 3.11 / 3.12 with virtual environment (`venv`)
- Node.js `v22+` and npm `10+`
- DataHub Quickstart running locally in Docker (`http://localhost:8080` GMS, `http://localhost:9002` Frontend)

### 1. Start the Backend API (FastAPI)
```bash
# In project root using pre-configured venv
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive API Swagger Documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 2. Start the Frontend UI (React + Vite)
```bash
# In frontend directory
cd frontend
npm install
npx vite --port 3000
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

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

Run the complete backend test suite (41 unit & integration tests):

```bash
.\venv\Scripts\pytest.exe backend/tests
```

Frontend production bundle build validation:
```bash
cd frontend
npm run build
```

---

## 🏛️ Architecture & Documentation

- [Architecture & Data Flow Specification](docs/architecture.md)
- [Architectural & Engineering Decisions Log](docs/decisions.md)
- [Design System & UI Guidelines](docs/design-system.md)

---

## 📢 Disclosure of Simulated vs. Live Data (NFR-15)

Per hackathon transparency guidelines:
- **Live DataHub Reads**: Cataloged datasets, classification sensitivity levels (`pii`, `confidential`, `public`), and asset owners are read directly from DataHub GMS (`http://localhost:8080`).
- **Live DataHub Write-Back**: Governance violation tags (`governance-risk`), structured audit notes, and remediation tag removals are written directly back to DataHub dataset entities.
- **Simulated Data**: AI agent access events are simulated via the Audit Runner scenario simulator per SRS §2.6.

---

## 📄 License
This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.
