# Software Requirements Specification (SRS)
## Agent Access Governance Auditor

**Version:** 1.0
**Date:** August 2026
**Hackathon:** Build with DataHub — The Agent Hackathon
**Track:** Open / Wildcard (Regulatory Automation)
**Document Owner:** _[Your name / team name here]_

---

## 1. Introduction

### 1.1 Purpose
This document specifies the functional and non-functional requirements for the **Agent Access Governance Auditor**, a system that monitors AI agents' access to DataHub-cataloged data assets, checks that access against governance policy, and writes compliance findings back into DataHub.

This SRS is written to guide implementation of a **full-stack version** of the project — a proper backend service plus a proper frontend UI — expanding on the original CLI/Streamlit prototype.

### 1.2 Scope
The system will:
- Read data asset metadata (classification, ownership, description) from DataHub.
- Maintain a registry of AI agents and their access policies.
- Record and evaluate agent access events against policy.
- Write violation flags and audit notes back to DataHub.
- Notify data owners of violations.
- Present all of the above through a web dashboard (frontend) backed by a REST API (backend).
- Maintain a persistent, queryable audit trail suitable for compliance reporting.

Out of scope for the hackathon version: real-time interception of live production AI agent traffic, a general-purpose policy engine/DSL, multi-tenant support, and integration with real IAM/SSO systems. These are noted as future work.

### 1.3 Intended Audience
- Hackathon judges evaluating technical execution and completeness.
- Developers extending or maintaining the project after the hackathon.
- Data platform / governance teams evaluating real-world applicability.

### 1.4 Definitions

| Term | Meaning |
|---|---|
| **Agent** | A registered AI agent/workflow that queries data assets, identified by name, with a declared purpose and a policy. |
| **Data Asset / Dataset** | A DataHub-cataloged entity (table, view, etc.) with classification and ownership metadata. |
| **Classification** | Sensitivity level of a dataset: `pii`, `confidential`, or `public`. |
| **Access Event** | A record of an agent accessing a dataset at a point in time, with an approval flag. |
| **Violation** | An access event that fails the agent's policy check against the dataset's classification. |
| **Write-back** | The act of the Auditor writing a tag and/or note onto a DataHub entity. |
| **Audit Log** | The persisted, chronological record of all evaluated access events and their outcomes. |

---

## 2. Overall Description

### 2.1 Product Perspective
The system is a standalone application that sits alongside an existing DataHub instance. It is not a replacement for DataHub; it is a governance layer that reads from and writes back to DataHub via DataHub's APIs (REST / Python SDK / MCP Server).

### 2.2 System Context Diagram

```
                     ┌────────────────────────────────────────┐
                     │              Frontend (Web UI)           │
                     │  Dashboard · Agents · Datasets · Audit    │
                     │  Log · Violation Detail · Settings        │
                     └───────────────────┬────────────────────┘
                                          │ REST / JSON (HTTPS)
                     ┌───────────────────▼────────────────────┐
                     │              Backend API                 │
                     │  FastAPI service: policy engine,          │
                     │  audit engine, notification dispatcher,   │
                     │  audit log store                          │
                     └──────┬───────────────────────┬──────────┘
                            │                        │
              DataHub SDK / MCP Server        Notification channel
                            │                   (GitHub API / webhook)
                     ┌──────▼───────┐                │
                     │   DataHub     │                ▼
                     │ (metadata,    │        GitHub Issues / Slack
                     │  classification,│       (owner notification)
                     │  ownership,    │
                     │  write-back)   │
                     └───────────────┘
```

### 2.3 User Classes and Characteristics

| User Class | Description | Technical Level |
|---|---|---|
| **Governance/Compliance Officer** | Primary user. Reviews violations, exports audit reports, manages agent policies. | Low–medium |
| **Data Platform Engineer** | Configures agent registrations, dataset classifications, integrates with DataHub. | High |
| **Data Asset Owner** | Receives notifications when their datasets are involved in a violation. | Low |
| **Hackathon Judge / Evaluator** | Explores the running system and demo data to assess functionality. | Medium–high |

### 2.4 Operating Environment
- Backend: Python 3.11 (DataHub SDK compatibility), containerizable via Docker.
- Frontend: Modern web browser (Chrome, Edge, Firefox).
- Data store: DataHub (via Docker Quickstart) for metadata; a lightweight database (SQLite/Postgres) for the audit log and agent/policy registry.
- Deployable locally (hackathon demo) or in a containerized cloud environment.

### 2.5 Design and Implementation Constraints
- Must use DataHub's open-source stack (MCP Server, Agent Context Kit, or REST/Python SDK) as the source of governance metadata — per hackathon rules.
- Must write back to the DataHub graph (tags/notes), not just read from it.
- Repository must be Apache 2.0 licensed and publicly available.
- All functionality must be demonstrable within a 3-minute video and runnable by judges without proprietary/paid dependencies.

### 2.6 Assumptions and Dependencies
- A local or cloud DataHub instance is reachable from the backend.
- Agent "access events" are simulated for the hackathon (no live production agent traffic integration) — documented explicitly, per the project's risk mitigation plan.
- GitHub API token (optional) is available if GitHub issue notifications are enabled; otherwise notifications fall back to an in-app log entry.

---

## 3. Functional Requirements (FR)

Each requirement has an ID, description, and priority (Must / Should / Could — MoSCoW).

### 3.1 Dataset & Classification Management

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | The system shall read a dataset's name, description, classification, and owner from DataHub. | Must |
| FR-2 | The system shall display all cataloged datasets in a sortable, filterable table in the UI. | Must |
| FR-3 | The system shall allow a user to view full detail for a single dataset, including its DataHub URN and current governance-risk tags/notes. | Must |
| FR-4 | The system shall visually distinguish datasets by classification (e.g., color coding for PII / confidential / public). | Should |
| FR-5 | The system shall support refreshing dataset metadata from DataHub on demand (manual refresh) without restarting the application. | Should |
| FR-6 | The system shall allow an authorized user to edit a dataset's classification tag directly from the UI, writing the change back to DataHub. | Could |

### 3.2 Agent Registry & Policy Management

| ID | Requirement | Priority |
|---|---|---|
| FR-7 | The system shall maintain a registry of AI agents, each with a name, declared purpose, allowed classification(s), and an approval requirement flag. | Must |
| FR-8 | The system shall display all registered agents and their policies in the UI. | Must |
| FR-9 | The system shall allow an authorized user to create, edit, and delete agent policy entries via the UI. | Should |
| FR-10 | The system shall validate that an agent policy references at least one valid classification value. | Should |
| FR-11 | The system shall support a "requires approval" flag per agent per classification level (not just a single global flag), for finer-grained policy in future iterations. | Could |

### 3.3 Access Event Ingestion & Auditing

| ID | Requirement | Priority |
|---|---|---|
| FR-12 | The system shall accept an access event consisting of: agent name, dataset name, approval status, and timestamp. | Must |
| FR-13 | The system shall provide a pre-loaded demo set of access events for the hackathon walkthrough. | Must |
| FR-14 | The system shall provide a UI form to submit a custom/ad-hoc access event and audit it immediately. | Must |
| FR-15 | The system shall provide a backend API endpoint to submit access events programmatically (for future integration with real agent platforms). | Should |
| FR-16 | The system shall evaluate each access event against the accessing agent's policy and the target dataset's classification. | Must |
| FR-17 | The system shall classify each evaluated event as `OK` (compliant) or `FLAGGED` (violation), with a plain-language reason for any violation. | Must |
| FR-18 | The system shall support batch auditing of multiple access events in a single run, with progress feedback in the UI. | Must |
| FR-19 | The system shall handle an access event referencing an unknown agent or unknown dataset gracefully, flagging it as a violation with a clear reason rather than crashing. | Must |

### 3.4 Write-Back to DataHub

| ID | Requirement | Priority |
|---|---|---|
| FR-20 | On detecting a violation, the system shall write a `governance-risk` tag onto the affected dataset in DataHub. | Must |
| FR-21 | On detecting a violation, the system shall write a human-readable note (institutional memory / documentation) onto the affected dataset explaining the violation and the responsible agent. | Must |
| FR-22 | The system shall avoid duplicate tags on repeated violations against the same dataset (idempotent tagging). | Should |
| FR-23 | The system shall timestamp and attribute each write-back action distinctly, so multiple violations on one dataset remain individually traceable. | Should |

### 3.5 Notifications

| ID | Requirement | Priority |
|---|---|---|
| FR-24 | On a violation, the system shall identify the dataset owner from DataHub ownership metadata. | Must |
| FR-25 | The system shall generate a notification (GitHub issue, or in-app alert if GitHub integration is not configured) summarizing the violation and tagging the owner. | Must |
| FR-26 | The system shall log all notifications sent (or attempted) as part of the audit trail. | Should |
| FR-27 | The system shall support a configurable notification channel (GitHub / Slack-style webhook / none) via settings. | Could |

### 3.6 Audit Log & Reporting

| ID | Requirement | Priority |
|---|---|---|
| FR-28 | The system shall persist every evaluated access event (compliant or violating) to a durable audit log. | Must |
| FR-29 | The system shall display the full audit log in the UI, sortable by timestamp, filterable by status (OK/FLAGGED), agent, or dataset. | Must |
| FR-30 | The system shall allow the audit log to be exported as JSON. | Must |
| FR-31 | The system shall allow the audit log to be exported as CSV for spreadsheet-based compliance review. | Should |
| FR-32 | The system shall show summary metrics (total events audited, count compliant, count flagged) prominently on the dashboard. | Must |
| FR-33 | The system shall provide a time-series or trend view of violations over time. | Could |
| FR-34 | The system shall provide a per-agent "risk score" (e.g., count and severity of violations attributed to that agent), surfaced as a ranked list. | Could |
| FR-35 | The system shall allow clearing/resetting the audit log for demo purposes, with a confirmation step. | Should |

### 3.7 System / Connectivity

| ID | Requirement | Priority |
|---|---|---|
| FR-36 | The system shall display a live connection status to the DataHub instance. | Must |
| FR-37 | The system shall show a clear, actionable error state if DataHub is unreachable, rather than failing silently. | Must |
| FR-38 | The system shall expose its core functions (context read, policy check, write-back, audit log) as a documented backend API, independent of the frontend. | Must |
| FR-39 | The system shall provide a health-check endpoint (`/health`) for the backend service. | Should |

---

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement |
|---|---|---|
| NFR-1 | **Performance** | A single access-event audit (context read + policy check + write-back) shall complete in under 3 seconds under normal local DataHub load. |
| NFR-2 | **Performance** | The dashboard shall load the dataset and agent overview within 2 seconds for a catalog of up to 100 datasets. |
| NFR-3 | **Scalability** | The backend shall be able to process a batch of at least 500 access events in a single run without memory errors, queued/paginated if needed. |
| NFR-4 | **Reliability** | The system shall not lose audit log entries on backend restart; the audit log shall be persisted to disk/database, not held only in memory. |
| NFR-5 | **Reliability** | If DataHub write-back fails for one event (e.g., transient network error), the system shall retry a bounded number of times and clearly report the failure rather than crash the batch. |
| NFR-6 | **Usability** | A first-time user shall be able to understand dashboard status (connected/disconnected, compliant/violation counts) within 5 seconds of loading the page, without reading documentation. |
| NFR-7 | **Usability** | All violation messages shall be in plain, non-technical language suitable for a compliance officer, not raw stack traces or error codes. |
| NFR-8 | **Maintainability** | Core audit logic (context read, policy check, write-back) shall be implemented as a separate, framework-independent module from the API and UI layers, to support reuse and testing. |
| NFR-9 | **Maintainability** | The codebase shall include automated tests covering the policy-check logic at minimum (unit tests for compliant and violating cases). |
| NFR-10 | **Security** | Any credentials (DataHub tokens, GitHub tokens) shall be read from environment variables or a config file excluded from version control — never hardcoded. |
| NFR-11 | **Security** | The backend API shall validate and sanitize all incoming access-event submissions (reject malformed agent/dataset names) before processing. |
| NFR-12 | **Portability** | The system shall run via Docker Compose (backend + frontend, pointing at an existing DataHub Quickstart instance) with a documented one-command startup. |
| NFR-13 | **Portability** | The system shall run on Windows, macOS, and Linux without OS-specific code paths (or with clearly documented platform notes, given known Windows quirks encountered during DataHub Quickstart setup). |
| NFR-14 | **Observability** | The backend shall log key lifecycle events (audit run started/completed, DataHub connection errors, write-back failures) to a readable application log. |
| NFR-15 | **Transparency** | The UI and README shall clearly disclose which parts of the system are simulated for demo purposes (e.g., agent access events) versus live DataHub reads/writes, per the project's stated risk-mitigation approach. |
| NFR-16 | **Compliance-readiness** | The exported audit log format shall include, at minimum, timestamp, agent identity, dataset identity, classification, owner, and outcome — sufficient fields to serve as a basic compliance evidence record. |
| NFR-17 | **Accessibility** | The frontend shall meet basic accessibility practices: sufficient color contrast (not relying on color alone to indicate classification/violation — icons or labels included), and keyboard-navigable forms. |
| NFR-18 | **License Compliance** | The project and all its dependencies shall be compatible with an Apache 2.0 license for the repository, per hackathon submission requirements. |

---

## 5. Proposed Architecture (Full-Stack Version)

### 5.1 Backend

**Framework:** FastAPI (Python) — chosen for async support, automatic OpenAPI docs, and strong typing via Pydantic, which fits naturally with DataHub's typed SDK models.

**Layers:**
- `api/` — FastAPI routers (`/datasets`, `/agents`, `/events`, `/audit-log`, `/health`)
- `core/` — framework-independent audit engine (context read, policy check, write-back) — this is `auditor_core.py`, evolved
- `store/` — persistence layer (SQLite for hackathon; swappable for Postgres) for agent registry and audit log
- `integrations/` — DataHub client wrapper, GitHub notification client

**Key Endpoints (illustrative):**

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/datasets` | List all cataloged datasets with classification/owner |
| GET | `/api/datasets/{name}` | Get full detail + current risk flags for one dataset |
| GET | `/api/agents` | List registered agents and policies |
| POST | `/api/agents` | Register/update an agent policy |
| POST | `/api/events` | Submit and audit a single access event |
| POST | `/api/events/batch` | Submit and audit a batch of access events |
| GET | `/api/audit-log` | Retrieve the audit log (filterable, paginated) |
| GET | `/api/audit-log/export` | Export audit log as JSON or CSV |
| GET | `/health` | Health check / DataHub connectivity status |

### 5.2 Frontend

**Framework:** React (with a component library such as shadcn/ui or plain Tailwind) — chosen over the hackathon-prototype Streamlit app for a production-quality, customizable UI suitable for a "proper frontend" deliverable.

**Pages / Views:**

| Page | Purpose | Related FRs |
|---|---|---|
| **Dashboard** | Connection status, summary metrics, recent violations | FR-32, FR-36, FR-37 |
| **Datasets** | Table of cataloged datasets, classification, owner, drill-down detail | FR-1–FR-6 |
| **Agents** | Table/cards of registered agents and policies, create/edit | FR-7–FR-11 |
| **Run Audit** | Trigger demo batch audit or submit a custom event, live progress + results | FR-12–FR-19 |
| **Audit Log** | Full filterable/sortable log, export buttons, trend chart | FR-28–FR-35 |
| **Settings** | DataHub connection info, notification channel config | FR-27, NFR-10 |

### 5.3 Data Flow (Single Access Event)

1. Frontend submits an access event (form or batch trigger) → Backend `/api/events`.
2. Backend `core` module reads dataset context from DataHub (classification, owner).
3. Backend evaluates the agent's policy against that context.
4. If violation: backend writes tag + note back to DataHub; triggers notification.
5. Backend persists the result to the audit log store.
6. Backend returns the result to the frontend, which updates the dashboard/table in real time.

---

## 6. Data Model (Core Entities)

### 6.1 Dataset (sourced from DataHub, not owned by this system)
- `urn` (string, DataHub identifier)
- `name` (string)
- `classification` (enum: `pii` | `confidential` | `public`)
- `owner` (string)
- `description` (string)

### 6.2 Agent (owned by this system)
- `id` (string/UUID)
- `name` (string, unique)
- `declared_purpose` (string)
- `allowed_classifications` (list of enum)
- `requires_approval_tag` (boolean)

### 6.3 Access Event (owned by this system)
- `id` (string/UUID)
- `agent_id` (foreign key → Agent)
- `dataset_name` (string, references DataHub dataset)
- `approved` (boolean)
- `timestamp` (datetime)

### 6.4 Audit Log Entry (owned by this system)
- `id` (string/UUID)
- `timestamp` (datetime)
- `agent` (string)
- `dataset` (string)
- `classification` (string)
- `owner` (string)
- `violation_reason` (string, nullable)
- `status` (enum: `OK` | `FLAGGED`)

---

## 7. Traceability: Proposal → Requirements

| Proposal Section | Covered By |
|---|---|
| "Reads context from DataHub" | FR-1 to FR-6 |
| "Monitors agent access events" | FR-12 to FR-19 |
| "Cross-checks access against policy" | FR-16, FR-17 |
| "Writes compliance flag and note" | FR-20 to FR-23 |
| "Generates audit-trail entry" | FR-28 to FR-35 |
| "Notifies the data asset's owner" | FR-24 to FR-27 |
| Known Risk: simulated agents disclosed | NFR-15 |
| Stretch Goal: per-agent risk score | FR-34 |

---

## 8. Acceptance Criteria (Definition of Done for Hackathon Submission)

- [ ] All **Must**-priority FRs implemented and demonstrable.
- [ ] Backend and frontend run via a single documented startup process (README + Docker Compose or equivalent).
- [ ] At least one full audit cycle (compliant + violation) demonstrable live, with DataHub UI showing the resulting tag/note.
- [ ] Audit log exportable and viewable in the frontend.
- [ ] Repository is public, Apache 2.0 licensed, with `examples/` containing sample audit log output.
- [ ] Demo video (< 3 minutes) shows the frontend, a live audit run, and the resulting DataHub write-back.

---

*This SRS extends the original project proposal into a full-stack (frontend + backend) implementation plan for the DataHub Agent Hackathon submission.*