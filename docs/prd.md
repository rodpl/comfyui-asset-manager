# ComfyUI Asset Manager — Brownfield Enhancement PRD

## 1. Intro Project Analysis and Context

### 1.1 Existing Project Overview

#### Analysis Source
- Document-project output available at: `docs/brownfield-architecture.md`
- IDE-based analysis supplemented by: `docs/development/*`

#### Current Project State
- ComfyUI extension with hexagonal backend (Python + aiohttp) and React UI mounted via ExtensionManager.
- Outputs: directory scan, thumbnails, PNG metadata extraction (workflow/prompt), best‑effort workflow load‑back.
- Local Assets: folder/model enumeration, metadata updates and tags (partially implemented).
- Model Browser: simplified browsing; external APIs accessed through proxy endpoints; disabled by default for v0.1.
- Theming: CSS variables + theme detection aligned with ComfyUI; scoped styles.

### 1.2 Available Documentation Analysis

Available Documentation (checklist)
- [x] Tech Stack Documentation (`docs/brownfield-architecture.md`)
- [x] Source Tree/Architecture (`docs/brownfield-architecture.md`)
- [x] Coding Standards (partial; see architecture and repo conventions)
- [x] API Documentation (`docs/development/api-reference.md`)
- [x] External API Documentation (proxy usage summarized in API and architecture docs)
- [ ] UX/UI Guidelines (partial; see theme-integration guides)
- [x] Technical Debt Documentation (`docs/brownfield-architecture.md` → Debt & Gotchas)
- [x] Other: Settings & Feature Flags (`docs/development/settings-spec.md`, `docs/development/feature-flags-design.md`)

### 1.3 Enhancement Scope Definition

#### Enhancement Type (checklist)
- [x] New Feature Addition (ComfyUI Settings‑based feature flags)
- [ ] Major Feature Modification
- [ ] Integration with New Systems
- [ ] Performance/Scalability Improvements
- [x] UI/UX Overhaul (alignment and a11y for Outputs tab)
- [ ] Technology Stack Upgrade
- [x] Bug Fix and Stability Improvements (Outputs polish & error handling)

#### General Acceptance Conditions
- Outputs tab visible by default; other tabs visible only when enabled in ComfyUI Settings.
- No breaking changes to `/asset_manager` Outputs endpoints; typed error responses maintained.
- Theming parity (light/dark) and scoped styles; a11y roles and keyboard navigation.
- Graceful failure for workflow load‑back and OS actions; never crash Outputs flows.

## 2. Requirements

### 2.1 Functional Requirements (FR)
1) FR1: Show only the Outputs tab by default; enable Local Assets and Model Browser exclusively via ComfyUI Settings.
2) FR2: Support server‑side sorting for Outputs (date/name/size) with `ascending` flag; default sort is `date-desc`.
3) FR3: Display thumbnails and essential metadata (filename, format, size, timestamps); provide “open in system viewer” and “show in folder” actions.
4) FR4: Provide “Refresh outputs” to rescan and update the list without full page reload.
5) FR5: Attempt “Load workflow to ComfyUI” with explicit success/failure feedback; never crash on invalid or missing metadata.
6) FR6: Register ComfyUI Settings: `AssetManager.Features.Outputs`, `AssetManager.Features.LocalAssets`, `AssetManager.Features.ModelBrowser`. Read at runtime to gate tabs.
7) FR7: Preserve existing REST contract under `/asset_manager` Outputs endpoints; no breaking changes to response shapes or status codes.

### 2.2 Non‑Functional Requirements (NFR)
1) NFR1: No regressions in Outputs stability/performance relative to current baseline on typical directories (5k–20k files).
2) NFR2: Theming parity with ComfyUI (light/dark), scoped styles; no visual flash during theme switch.
3) NFR3: Accessibility: correct `tablist`/`tab`/`tabpanel` roles; keyboard navigation; non‑blocking loading and error messaging.
4) NFR4: Quality bar: maintain configured coverage (≥ current threshold); at least one E2E happy path for Outputs.
5) NFR5: Offline tolerance: Outputs functions independently of external APIs; proxies surface typed errors when used.

### 2.3 Compatibility Requirements (CR)
1) CR1: API compatibility — no breaking changes to `/asset_manager/outputs` endpoints.
2) CR2: No database/schema changes in scope.
3) CR3: UI/UX consistency with ComfyUI patterns (PrimeVue icons, spacing/typography, theme variables).
4) CR4: Settings compatibility — if Settings are unavailable, default to Outputs‑only and hide other tabs.

## 3. User Interface Enhancement Goals

- Integration with Existing UI: Match ComfyUI’s visual system (PrimeVue icons, spacing/typography). Scope all CSS under the extension root; respect theme classes and transitions.
- Modified/New Screens: Refined Outputs tab (grid/list, sort, refresh, detail modal, system actions). Use ComfyUI Settings for feature toggles (no bespoke settings UI).
- UI Consistency: In v0.1 only Outputs visible by default; clear empty/error states with ComfyUI‑consistent styling; keyboard navigation and ARIA roles for tabs/panels.

## 4. Technical Constraints and Integration Requirements

### 4.1 Existing Technology Stack
- Languages/Frameworks: Python 3.12 + aiohttp 3.12.x (backend); React 18 + Vite 7 (frontend); hosted by ComfyUI Frontend (Vue‑based ExtensionManager).
- Data/Storage: Filesystem‑driven (no DB in scope).
- External: Pillow 11.x (image/PNG metadata); CivitAI/HuggingFace via proxied endpoints.

### 4.2 Integration Approach
- Preserve `/asset_manager` Outputs endpoints and response shapes; return typed errors.
- Register ComfyUI Settings `AssetManager.Features.{Outputs,LocalAssets,ModelBrowser}`; read via `window.app.extensionManager.setting.get(...)` to gate tabs at runtime.
- Fallback when Settings unavailable: Outputs‑only; hide other tabs. Optional REST config only for backend‑enforced constraints.

### 4.3 Code Organization and Standards
- Maintain current layout (hexagon in `src/`; features/services/hooks/styles in `ui/`).
- Scope CSS under the extension root; use ComfyUI theme variables; avoid global overrides.
- Accessibility: `tablist`/`tab`/`tabpanel` roles; keyboard navigation; non‑blocking loaders/errors.
- i18n via i18next; docs aligned with `docs/development/*`.

### 4.4 Deployment and Operations
- UI build: `pnpm build` produces `dist/`; included via `[tool.comfy].includes = ["dist/"]`.
- Installation: under ComfyUI `custom_nodes` (or via manager). No DB migrations.
- OS actions: platform commands (Windows/macOS/Linux) with graceful failure in headless.
 - Operator steps: see `docs/development/release-playbook.md` for staged rollout and QA checklist.

### 4.5 Risk Assessment and Mitigation (recap)
- Settings API availability → feature‑detect; Outputs‑only fallback; note minimum frontend version. See §7 for full list.
- Large directories → rely on server‑side sort params; avoid expensive client re‑sorting; non‑blocking loaders.
- Workflow metadata variability → best‑effort load with explicit feedback; typed errors; never crash Outputs flows.

### Dependency Diagram (Textual)
- Sequence: ComfyUI Settings API → Tab Gating (S1.1) → Outputs Polish (S1.2) → Visual/A11y (S1.3)
- Backend: /asset_manager Outputs endpoints; Pillow 11.x; OS commands; proxies out of scope (gated)
- Frontend: ExtensionManager presence; Settings fallback to Outputs‑only; scoped CSS + theme variables

### Test Dependency Matrix (Brief)
- Unit (backend): PIL + temp FS fixtures → scan/thumbnail/metadata; typed errors; sort/refresh logic
- Unit (frontend): mock Settings + DOM → tab gating; outputs gallery/modal/toolbar; a11y roles; error/empty states
- Integration (backend): aiohttp app + DI + temp output dir → outputs list/detail/refresh/load/open/show; error typing
- E2E (frontend): running ComfyUI with extension → Outputs happy path; theme switch; Settings gating visibility

### Operator Pre‑Release Checklist
- Build/packaging: `pnpm build` produces `dist/`; included via tool.comfy.includes
- Settings/gating: verify toggles under Extensions > Asset Manager > Features; fallback to Outputs‑only if Settings missing
- API/behavior: smoke test outputs endpoints; workflow load feedback; OS actions typing
- Quality: run backend + frontend unit tests; one Playwright E2E for Outputs; validate tab gating
- Release notes: emphasize toggles, limitations, and next increments

## 5. Epic and Story Structure

### Epic Approach
- Single epic for Outputs‑first + Settings + UI alignment to minimize coordination overhead.

### Epic 1 — Outputs‑first release + ComfyUI Settings feature flags + UI alignment
- Epic Goal: Ship Outputs‑only by default, feature flags in ComfyUI Settings, and strong UI alignment.
- Integration Requirements: No breaking changes to outputs endpoints; flags registered in Settings; safe defaults to Outputs‑only.

Story 1.1 — Register feature flags in ComfyUI Settings and gate tabs
#### Acceptance Criteria
1: Settings entries exist for Outputs, Local Assets, and Model Browser under Extensions > Asset Manager > Features.
2: UI reads Settings at runtime and gates tabs accordingly.
3: If Settings are unavailable, default to Outputs‑only.
#### Integration Verification
IV1: No regressions in Outputs tab rendering and behavior.
IV2: No backend API changes required.
IV3: No measurable increase in initial load time.

Story 1.2 — Outputs polish: sort/refresh/metadata and stable actions
#### Acceptance Criteria
1: Server‑side sort (date/name/size + ascending) is honored; default `date-desc`.
2: Refresh rescans and updates the list without full page reload; show non‑blocking loader/error.
3: Load workflow shows explicit success/failure messaging and never crashes on invalid/missing metadata.
#### Integration Verification
IV1: Existing outputs endpoints remain stable and unchanged.
IV2: “open/show” and “load workflow” return typed errors and are surfaced as non‑blocking UI messages.
IV3: No style leakage; theme detection works in light and dark modes.

Story 1.3 — Theming & accessibility alignment
#### Acceptance Criteria
1: Styles are scoped to the extension root; no theme flash during switches.
2: Tabs use correct ARIA roles; outputs list/grid support keyboard navigation.
3: Error/empty states use ComfyUI‑consistent styling and copy.
#### Integration Verification
IV1: Light/dark verified via demo pages/tests; no global CSS overrides.
IV2: Roles/ARIA validated in unit tests; Playwright verifies theme switch.
IV3: No regressions in tab rendering performance.

## 6. Delivery and Validation Plan

- Incremental Delivery: v0.1 (S1.1 → S1.2 → S1.3) behind Settings gating; v0.2 enable Local Assets; v0.3 enable Model Browser.
- Testing: Unit (backend/frontend), Integration (outputs endpoints with temp dirs), E2E (Outputs happy path, theme checks, tabs gating).
- Release Criteria: ACs met; no regressions; theming/a11y checklist passed; 1 E2E passing for Outputs; tabs gating validated.
- Rollback: Disable non‑Outputs tabs via Settings; if severe, disable the extension.
- Communications: Release notes—Outputs-first scope, Settings toggles, known limitations, next increments.

## 7. Risks and Mitigations

- Settings API availability: detect; fallback to Outputs‑only; note minimum frontend version.
- IO/performance (large dirs): retain server-side sorting; avoid client re-sorting; guard scans; short-lived caching if needed.
- Metadata parsing: defensive reading; cap chunk sizes; typed “workflow_not_found/invalid_metadata”.
- Concurrency: debounce refresh; keep service idempotent.
- OS actions in headless: typed errors; non‑blocking UI messages.
- Workflow load variability: best‑effort with feedback; never block Outputs flows.
- Security/privacy: path validation; fixed proxy base URLs; strict timeouts; escape/truncate raw metadata.
- API drift: contract tests; typed error taxonomy; version new routes if needed.
- ComfyUI internal changes: scoped CSS; stable ExtensionManager APIs.
- Settings discoverability: document path; About badge; optional tooltip.
- Theme regressions: use hook and demos; light/dark checks.
- Packaging: confirm dist inclusion; smoke test inside ComfyUI.
- Compatibility: Outputs-only fallback on older frontends.
- E2E flakiness: stabilise timeouts; one happy path; retries in CI.

## 8. Known Limitations (v0.1)
- Workflow load is best‑effort; metadata may be absent or malformed.
- Feature gating relies on ComfyUI Settings (no bespoke settings UI).
- Model Browser is disabled by default; Local Assets remains off until v0.2.
- Outputs don’t depend on external APIs, but proxies can return typed errors.

## 9. Minimum Supported ComfyUI Frontend Version
- Requires a frontend build that exposes Settings/ExtensionManager features used by this extension. If unavailable, the extension defaults to Outputs‑only and hides other tabs.

---

Prepared by: Product Manager — 2025‑09‑04
