# HACKATHON.md — Build with DataHub: The Agent Hackathon Compliance Guide

This file translates the **official Devpost hackathon rules** into concrete engineering tasks for finishing this project. Read this alongside `SRS.md` (what to build) and `AGENTS.md`/`Agent.md` (how to work). This file governs **hackathon-submission compliance** specifically — treat every item as a hard requirement, not a suggestion. A technically great project that fails Stage 1 scores zero.

Submission deadline: **August 10, 2026, 5:00 PM ET**.

---

## 0. THE #1 RISK — Fix this first

> "Projects must incorporate DataHub by using the open-source platform together with **at least one of**: the MCP Server, Agent Context Kit, DataHub Skills, or Analytics Agent."

**Current state: this project only uses `DatahubRestEmitter` (plain REST/Python SDK) in `backend/app/integrations/datahub_client.py`. That does NOT satisfy this requirement on its own.** Stage 1 is pass/fail on "reasonably applies the required APIs/SDKs featured in the Hackathon" — this must be fixed before anything else matters.

**Required fix — pick ONE (MCP Server is the best fit for this project and matches what SRS.md already describes):**

- Stand up / connect to **DataHub's MCP Server** (it ships with DataHub — check the current DataHub docs for the MCP Server package/endpoint, since this may have changed since training data cutoff — **search the web for "DataHub MCP Server setup" before implementing**, don't guess at an outdated API).
- Refactor `core/auditor.py`'s context-read step (and ideally the write-back step too) to go through the MCP Server's tools instead of calling `DatahubRestEmitter` directly. The audit engine agent should genuinely _use_ the MCP Server as its way of understanding "what's connected to what" (dataset metadata, ownership, classification) — this is exactly what Challenge Category 1 ("Agents That Do Real Work") asks for, and it's the best-fit category for this project.
- Keep `DatahubRestEmitter` only where MCP doesn't cover a needed write-back operation (document why in `docs/decisions.md`), not as the primary integration path.
- Update `SRS.md` §5 and `README.md` to accurately describe the MCP Server as the primary DataHub integration, not just a mentioned option.

**Do not skip this. Do not mark this project "ready to submit" until the MCP Server (or one of the other three) is genuinely wired into the core read/write path, not just mentioned in docs.**

---

## 1. Challenge Category — declare one explicitly

SRS.md currently says "Open / Wildcard (Regulatory Automation)." Given what this project actually does (an agent that reads DataHub context, checks policy, writes findings back so the next agent/person inherits the knowledge), it is a much stronger fit for:

> **"Agents That Do Real Work"** — _"Your agent reads DataHub through the MCP Server or Agent Context Kit to understand what's connected to what, takes action, and writes results back so the next person or agent inherits the knowledge."_

This is a near word-for-word description of this project's audit engine. Once §0 is fixed (MCP Server wired in), pick this category explicitly in `README.md` and the Devpost submission form — it scores better on "Use of DataHub" than Open/Wildcard because the fit is so direct. Keep Open/Wildcard as a fallback only if the MCP integration proves genuinely infeasible.

---

## 2. Submission Requirements Checklist

Work through this in order. Nothing here is optional — these are Devpost's stated Submission Requirements.

- [ ] **§0 fixed**: MCP Server (or Agent Context Kit / DataHub Skills / Analytics Agent) genuinely used in the core read/write path.
- [ ] **Public git repository**, initialized, with full commit history showing the project was built during the Submission Period (July 6 – Aug 10, 2026). `git init` this repo now if not already done, and push to a public GitHub repo.
- [ ] **Apache 2.0 LICENSE file** at repo root (already present — verify it renders as "Apache-2.0" in GitHub's repo "About" section license detector once pushed; GitHub auto-detects it from `LICENSE`, don't rename the file).
- [ ] **`docker-compose.yml`** at repo root that starts backend + frontend and connects to an already-running DataHub Quickstart instance with a **single command** (per the "one-command startup" you already advertise in the README badge). Verify this actually works from a clean clone, not just in the dev environment.
- [ ] **`examples/` folder** with real sample outputs: at least one exported audit log (JSON) and one (CSV), and — since Stage 2 rewards "sample generated artifacts" — a sample of what gets written back to DataHub (e.g. a screenshot or JSON dump of a violation tag/note actually applied to a dataset).
- [ ] **README.md** clearly states: what the project does, why it matters, the chosen Challenge Category, setup instructions a judge can actually follow from scratch, and — per NFR-15 — which parts are simulated demo data vs. live DataHub reads/writes.
- [ ] **Disclosure of pre-existing work**: Devpost rules require disclosing any pre-existing code/frameworks/AI assistants used. Add a short "Built With" / "Acknowledgments" section in the README listing frameworks (FastAPI, React, DataHub SDK/MCP, etc.) and noting AI coding assistants were used — this is expected and fine, just must be disclosed, not hidden.
- [ ] **Text description** (written directly on the Devpost submission form, not just the README) summarizing features, functionality, technologies, and data used.
- [ ] **Demo video**: under 3 minutes, uploaded to YouTube/Vimeo/Youku and set public, shows the app actually running (not slides), no copyrighted music/trademarks without permission. Script it to show: login → GitHub connect → an agent triggering a policy violation → the violation appearing in DataHub → the GitHub issue notification → the audit log/export. That sequence demonstrates every judging criterion in under 3 minutes.
- [ ] **Testing access for judges**: either a hosted URL, or crystal-clear local setup instructions (the docker-compose one-liner) since judges are not required to fight a broken setup. If anything requires credentials (e.g. a demo login), include them plainly in the README/testing instructions.
- [ ] **Third-party integration authorization**: GitHub OAuth app and DataHub SDK usage must comply with their respective terms — nothing unusual here, just don't skip creating a proper GitHub OAuth App (not reusing someone else's credentials) and document its setup in the README.

---

## 3. Judging Criteria — what to optimize for (all equally weighted)

Keep these in mind while finishing features, since they're literally how the project gets scored:

1. **Use of DataHub** — meaningfully uses the context graph (lineage, ownership, schema, governance signals) via MCP Server/Agent Context Kit/Skills/Analytics Agent, and _contributes back_ to the graph (this project already does this well via violation tags/notes — once §0 is fixed, this becomes a real strength).
2. **Technical Execution** — does it actually work end-to-end, robustly. This is why `AGENTS.md`'s "no fake progress, always test" rules matter — a judge testing the live app is the real bar.
3. **Originality** — goes beyond DataHub's out-of-the-box features rather than just re-displaying them. The policy-check + write-back + GitHub-notification loop is the differentiator — make sure the demo foregrounds _that_, not just "we show a DataHub dataset list."
4. **Real-World Usefulness** — would a real data/platform team want this. Lean into the compliance/audit-trail angle in the README and demo narration — that's the practical hook.
5. **Submission Quality** — video + README + description clarity. Don't leave this for the last hour; budget real time for it.

**Bonus (optional but favorable):** if a genuine gap or improvement in DataHub itself is found while integrating the MCP Server, consider filing it as an issue/PR against DataHub's open-source repo and mentioning it in the submission — explicitly called out as scoring favorably.

---

## 4. New-Projects-Only Rule

> "The work described and submitted must have been built during the Submission Period" (July 6 – Aug 10, 2026).

This repo's work should reflect that timeframe (commit dates, etc.) once pushed to git. Standard frameworks/libraries/starter templates/AI coding assistants are explicitly allowed — just disclose them per §2 above. Don't backdate or misrepresent when code was written.

---

## 5. Order of Operations

1. Fix §0 (MCP Server integration) — this blocks everything else being worth doing.
2. Re-run the full `AGENTS.md` Definition of Done checklist against the current codebase; fix any gaps.
3. Add `docker-compose.yml`, `examples/` folder, and disclosure section per §2.
4. `git init`, commit, push to a public GitHub repo; confirm the Apache-2.0 license badge shows in GitHub's About section.
5. Do a full clean-clone test: clone the repo fresh, run the one-command startup, verify it works with zero manual fixes.
6. Record the demo video last, once everything above is stable.
7. Fill out the Devpost submission form (category, description, links) and submit before Aug 10, 5 PM ET.
