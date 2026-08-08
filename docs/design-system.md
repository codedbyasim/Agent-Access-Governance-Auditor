# Design System Specification — Agent Access Governance Auditor

Per **AGENTS.md §3**, this document defines the deliberate visual direction for the governance auditor interface.

---

## 1. Design Direction
- **Purpose**: Institutional data governance and regulatory auditing dashboard. Designed for high information density, rapid scannability, and high-contrast accessibility.
- **Strictly Banned**: Glassmorphism cards, purple/blue background gradients, decorative emojis, rounded-full pill buttons with no text hierarchy, unstyled Tailwind defaults.

---

## 2. Color Palette & Semantic Tokens
- **Background Slate**: `#0f172a` (Slate 900)
- **Card / Container Background**: `#1e293b` (Slate 800)
- **Border Neutral**: `#334155` (Slate 700)
- **Primary Interactive Accent**: `#3b82f6` (Blue 500), `#2563eb` (Blue 600 Hover)
- **Status OK (Compliant)**: `#10b981` (Emerald 500) background `rgba(16, 185, 129, 0.15)` fill. Icon: `CheckCircle`
- **Status FLAGGED (Violation)**: `#ef4444` (Red 500) background `rgba(239, 68, 68, 0.15)` fill. Icon: `AlertTriangle`
- **Classification PII**: `#f59e0b` (Amber 500) badge fill `rgba(245, 158, 11, 0.15)`. Icon: `Shield`
- **Classification CONFIDENTIAL**: `#8b5cf6` (Purple 500) badge fill `rgba(139, 92, 246, 0.15)`. Icon: `Lock`
- **Classification PUBLIC**: `#64748b` (Slate 500) badge fill `rgba(100, 116, 139, 0.15)`. Icon: `Globe`

---

## 3. Accessibility & Typography Rules (NFR-17)
- **Font Family**: `'Inter', system-ui, -apple-system, sans-serif`
- **Base Spacing Unit**: 4px scale (4px, 8px, 12px, 16px, 24px, 32px)
- **Triple-Indicator Badges**: All badges combine distinct text, background color, AND a distinct Lucide SVG icon to ensure accessibility for color-blind users (NFR-17).
- **Dense Data Tables**: Governance records use dense grid layouts, monospace event URNs, clear status badges, and explicit row action buttons (`Inspect`, `Edit`, `Delete`, `Remediate`).

---

## 4. UI Components

- `DataHubBanner`: Top bar indicator showing live DataHub GMS connection health and container URN endpoint.
- `DatasetDetailModal`: Data asset inspector displaying metadata URN, description, classification tag editor (FR-6), `governance-risk` tag remediation banner (FR-22), and historical audit notes.
- `AgentModal`: AI agent policy configuration modal for declared purpose, permitted classifications, and human approval rules.
- `AuditLogDetailModal`: Event inspector modal displaying complete access event details, violation reasons, DataHub write-back tags, and GitHub alert status.
