# AGENTS.md — Build Rules for AI Coding Agents

**Project:** Agent Access Governance Auditor
**Reference spec:** `SRS.md` (in repo root) — this file is the single source of truth for scope, requirements (FR/NFR), architecture, and data model. Read it fully before writing any code.

This file tells any AI coding agent (Claude Code, Cursor, Copilot Workspace, Devin, etc.) **how** to work on this repo — not what to build (that's `SRS.md`). Follow every rule below on every task, not just the first one. Re-read this file at the start of each session.

---

## 0. Ground Rules (non-negotiable)

1. **SRS.md is law.** Every FR/NFR maps to real, working code — not a stub, not a TODO, not a "// implement later" comment. If something in the SRS is ambiguous, make the most reasonable engineering decision, write it down in `docs/decisions.md`, and move on. Never silently drop a requirement.
2. **No fake progress.** Don't mark a task done unless it runs, passes its tests, and has been manually exercised at least once (curl the endpoint, click the button).
3. **No placeholder data pretending to be real.** Mock/demo data (per NFR-15) must be clearly labeled as demo data in the UI and in code comments — never presented as if it were live DataHub output.
4. **Small, verifiable steps.** Plan → implement one vertical slice (API endpoint + store + UI wired to it) → test it → commit → move to the next. Don't write 2,000 lines across ten files before running anything.
5. **Read before you write.** Before creating a file, check if it already exists and what conventions the rest of the codebase already uses (naming, folder structure, import style). Match it. Don't introduce a second pattern for something that already has one.

---

## 1. Required Workflow (every feature, every time)

For each unit of work (a page, an endpoint, a feature from the SRS), go through **all six** steps — don't skip to "write code":

1. **Plan** — Restate the requirement(s) being implemented (cite FR/NFR IDs). List the files you'll touch/create. If the change is non-trivial, write a 3–5 line plan before touching code.
2. **Implement** — Write production-quality code (see §2). No shortcuts, no `any`/`# type: ignore` to dodge a type error, no swallowed exceptions.
3. **Design the UI properly** — for anything user-facing, follow §3 before considering it done. A working-but-ugly screen is not done.
4. **Debug** — Actually run what you built. Fix errors you encounter yourself; don't hand a broken build back to the user. If you can't run it (no environment), say so explicitly instead of assuming it works.
5. **Test** — Add/extend automated tests per §4. Run the full test suite, not just the new test, before considering the task complete.
6. **Document** — Update docs per §5 in the same change, not as a follow-up task.

A task is only "done" when all six steps are complete. If you run out of room in one turn, say clearly what's left rather than claiming completion.

---

## 2. Code Quality Rules

- **Follow the architecture in SRS §5 exactly**: `api/`, `core/`, `store/`, `integrations/` on the backend. `core/` (the audit engine: context read → policy check → write-back) must stay framework-independent — no FastAPI imports inside `core/`. This is NFR-8, don't violate it.
- **Full features, not skeletons.** If a page needs sorting, filtering, and pagination per the SRS, build all three — not just a static table.
- **Real error handling.** Every external call (DataHub SDK, GitHub API, DB) is wrapped in explicit try/except with a meaningful, user-facing message (NFR-7). Never let a raw stack trace reach the UI.
- **Type everything.** Python: full type hints + Pydantic models for all API I/O. TypeScript: no `any`; define proper interfaces/types for every API response and component prop.
- **No hardcoded secrets.** Tokens/credentials come from environment variables or a gitignored config file (NFR-10). Provide a `.env.example`.
- **Idempotency and edge cases matter.** Handle unknown agents/datasets (FR-19), duplicate violation tags (FR-22), DataHub unreachable (FR-37) — these are explicit requirements, not nice-to-haves.
- **Keep functions small and named for what they do.** If a function does three things, split it into three functions.
- **Consistent formatting.** Run `black` + `ruff`/`flake8` on Python, `prettier` + `eslint` on TypeScript before considering a file finished.
- **Commit in logical units** with clear messages referencing the FR/NFR or feature being implemented.

---

## 3. UI Rules — "Must NOT look AI-generated"

This is a hard requirement from the user, treat it as strictly as a functional requirement.

**Banned / red flags (do not do these):**

- The generic "AI slop" look: purple-to-blue gradient hero banners, glassmorphism cards everywhere, emoji used as icons, default shadcn palette left completely untouched, centered hero + 3 feature cards + generic testimonials layout.
- Lorem-ipsum-feeling copy, generic icon-in-a-circle stat cards with no real hierarchy.
- Overusing rounded-full badges and soft pastel backgrounds on every element "just because."
- Inconsistent spacing/sizing that wasn't deliberately chosen (don't just take Tailwind defaults untouched across the whole app).

**Required instead:**

- Before building any screen, pick a deliberate visual direction and write it down once (e.g. in `docs/design-system.md`): a real color system with a primary + neutral scale + semantic colors for OK/FLAGGED/PII, a type scale (not default browser sizes), and consistent spacing units (e.g. a 4px/8px scale). Apply it consistently across **all** pages — Dashboard, Datasets, Agents, Run Audit, Audit Log, Settings. Don't invent a new palette or spacing rule per page.
- This is a **compliance/governance tool**, not a marketing site. Design for density and clarity: real data tables, sortable columns, clear status chips (not emoji) for `OK`/`FLAGGED`, sensible use of whitespace, a persistent nav/sidebar, not a scrolling single-page layout.
- Classification (PII/confidential/public) and violation status must be distinguishable by **shape/icon/label, not color alone** (NFR-17 — accessibility, no color-only signaling).
- Every interactive element (buttons, table rows, forms) has real hover/focus/disabled states. Forms are keyboard-navigable (NFR-17).
- Loading, empty, and error states are designed for every page — not just the happy path (e.g., "No datasets found," DataHub-disconnected banner, empty audit log state).
- Charts/trend views (FR-33) use a real charting library with proper axes/labels — not a decorative sparkline with no meaning.

---

## 3.5 Authentication & GitHub Integration (added scope, beyond base SRS)

The SRS's original scope did not include user authentication — this project adds it. Treat these as **Must**-priority, same rigor as the rest of §2–§4:

- **Signup/Login**: proper email+password auth with hashed passwords (bcrypt/argon2, never plaintext or reversible encryption), session/JWT-based auth, protected routes on both API and frontend. Include basic validation (email format, password strength) and clear error messages — not raw 500s.
- **Connect with GitHub Account**: implement real GitHub OAuth (Authorization Code flow) — "Sign in with GitHub" and/or "Connect GitHub" from Settings, so the app can act on the user's behalf for FR-25 (violation notifications as GitHub issues). Store the OAuth token securely server-side (never expose it to the frontend), scoped to only what's needed (repo/issues scope).
- Treat GitHub Client ID/Secret exactly like any other credential under NFR-10 — env vars only, `.env.example` documents the required keys, never committed.
- Add a dedicated auth test suite: signup, login, invalid credentials, protected-route rejection when unauthenticated, and the GitHub OAuth callback handler (mock the GitHub token exchange in tests — never hit real GitHub in CI).
- Document the GitHub OAuth app setup steps (callback URL, required scopes) in the README so a judge/reviewer can configure their own GitHub OAuth app in minutes.

---

## 3.6 Existing Environment (do not re-create what's already set up)

This project is being developed on a machine where infrastructure already exists — **detect and use it, don't overwrite or duplicate it**:

- **DataHub is already running in Docker** (via DataHub Quickstart). Before writing any DataHub integration code, verify connectivity against the running instance (check the standard GMS port, e.g. `http://localhost:8080`) rather than assuming it needs to be started or reconfigured. If it's unreachable, report that clearly instead of silently falling back to mocks.
- **A Python venv already exists** for this project. Use it (`pip install` into the existing venv) rather than creating a second one or switching package managers. Confirm the venv's Python version matches SRS §2.4 (Python 3.11) before assuming compatibility.
- Only add new Docker Compose services (backend, frontend) — don't redefine or duplicate the existing DataHub service definition; reference/depend on it as an external service if it's already managed separately.

---

## 4. Testing Rules

- **Unit tests are mandatory for `core/`** — the policy-check logic must have tests for both compliant and violating cases at minimum (NFR-9), plus edge cases: unknown agent, unknown dataset, missing classification.
- **API tests** for every endpoint in §5.1 of the SRS: happy path + at least one failure/validation path (NFR-11 — malformed input rejected).
- **Integration test** for at least one full audit cycle: submit event → policy check → write-back call → audit log entry persisted. Mock the DataHub client at the boundary.
- **Frontend**: component tests for the Run Audit flow and Audit Log filtering at minimum; don't ship a UI feature with zero test coverage if it has non-trivial logic (filtering, sorting, exports).
- Run the **entire** test suite before marking any task complete, not just the new tests. Fix regressions immediately — don't leave them for later.
- Never delete or weaken a test to make it pass. If a test is wrong, fix the test deliberately and say why.

---

## 5. Documentation Rules

Keep these current, in the same commit as the code change that affects them:

- **`README.md`** — one-command startup (Docker Compose, per NFR-12), prerequisites, env vars, how to run tests, screenshots of the actual UI (not mockups).
- **API docs** — FastAPI's auto-generated OpenAPI docs must stay accurate (i.e., every endpoint has a proper Pydantic model, description, and example).
- **`docs/decisions.md`** — every ambiguous call you made while interpreting the SRS, with a one-line rationale.
- **`docs/architecture.md`** — short doc mirroring SRS §5, updated if the real structure diverges from the spec (and note _why_ it diverged).
- **Disclosure of simulated data** — per NFR-15, the README and the UI itself must clearly state which parts are simulated (demo agent access events) vs. live DataHub reads/writes. This is a hackathon judging requirement — do not skip it.
- **`examples/`** — include a sample exported audit log (JSON and CSV) as required by the Definition of Done.
- Code comments explain _why_, not _what_ — don't narrate obvious code.

---

## 6. Definition of Done (use this checklist before saying "finished")

- [ ] All **Must**-priority FRs from SRS §3 are implemented and demonstrable end-to-end.
- [ ] Backend (`core/`, `api/`, `store/`, `integrations/`) matches the architecture in SRS §5.1.
- [ ] Every page in SRS §5.2 exists, is wired to real backend data, and follows §3 of this file (no AI-slop UI).
- [ ] `docker-compose up` (or equivalent single command) starts backend + frontend against an existing DataHub Quickstart instance, per NFR-12.
- [ ] At least one full audit cycle (one compliant event, one violating event) works live, with the violation tag/note visible in DataHub.
- [ ] Audit log is viewable, filterable, and exportable as JSON and CSV from the UI (FR-29–31).
- [ ] `core/` policy-check logic has passing unit tests for compliant, violating, and unknown-agent/dataset cases.
- [ ] Full test suite passes (backend + frontend).
- [ ] README, architecture doc, and decisions log are all up to date.
- [ ] No hardcoded secrets anywhere in the repo; `.env.example` present.
- [ ] Simulated vs. live data is clearly disclosed in both the UI and README (NFR-15).
- [ ] Repo is Apache 2.0 licensed with a `LICENSE` file, and all dependencies are license-compatible (NFR-18).
- [ ] Signup and Login work end-to-end with hashed passwords and protected routes (§3.5).
- [ ] "Connect with GitHub" performs a real OAuth flow and the resulting token is used for violation notifications (FR-25, §3.5).
- [ ] App connects to the already-running DataHub Docker instance and the already-existing venv without recreating either (§3.6).

---

## 7. When Stuck

- If a DataHub instance isn't reachable in the dev environment, build against a well-documented mock/fake client behind the same interface as the real one (in `integrations/`), so swapping in the real DataHub SDK later is a one-line change. Document this clearly — don't silently fake it forever.
- If a requirement conflicts with another, prioritize by MoSCoW (Must > Should > Could) and note the tradeoff in `docs/decisions.md`.
- Never fabricate test results, screenshots, or "it works" claims — if you didn't run it, say so.
