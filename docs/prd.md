# ComfyUI Asset Manager Brownfield Enhancement PRD

## Intro Project Analysis and Context

### Existing Project Overview

#### Analysis Source
- Document-project output available at: `docs/architecture.md`
- Supplemental specifications: `.kiro/specs/*` (theme integration, local assets, simplified model browser, simplified output gallery)

#### Current Project State
- Hexagonal Python backend (aiohttp) embedded in ComfyUI manages models, folders, outputs, and external catalogs via `/asset_manager` APIs; theme-supporting adapters and ComfyUI workflow integration are in place.
- React + TypeScript frontend implements Local Assets, Model Browser (CivitAI/HuggingFace sub-tabs), and Outputs features using ComfyUI-aligned theming; Outputs tab is closest to releasable quality, while other tabs retain partially completed functionality.
- Theme integration tasks (per `.kiro/specs/comfyui-theme-integration`) are complete; Local Assets and Model Browser specs show core flows implemented with outstanding polish/performance/error-handling tasks (#20–25, #11 in respective task lists). Outputs gallery spec indicates base gallery and workflow utilities shipped, with remaining performance and integration validation tasks (#7–8).

### Available Documentation Analysis
- Using existing project analysis from document-project output plus spec files.
- Key references: `docs/architecture.md`, `.kiro/specs/**`, `docs/development/*`, `.kiro/steering/*`.

- [x] Tech Stack Documentation
- [x] Source Tree/Architecture
- [x] Coding Standards
- [x] API Documentation
- [x] External API Documentation
- [ ] UX/UI Guidelines <!-- Dedicated UX design doc not formalized; rely on theme integration spec and development guides. -->
- [x] Technical Debt Documentation
- Other: Theme integration guides (`docs/development/theme-integration-guide.md`, `.kiro/specs/comfyui-theme-integration`)

### Enhancement Scope Definition

#### Enhancement Type
- [ ] New Feature Addition
- [x] Major Feature Modification
- [ ] Integration with New Systems
- [ ] Performance/Scalability Improvements
- [x] UI/UX Overhaul
- [ ] Technology Stack Upgrade
- [ ] Bug Fix and Stability Improvements
- [ ] Other: _n/a_

#### Enhancement Description
Deliver a release-ready Outputs experience that satisfies the simplified output gallery spec, aligns with the ComfyUI theme integration requirements, and temporarily hides the Local Assets and Model Browser tabs—whose remaining polish items are tracked in their respective specs—until they complete outstanding tasks.

#### Impact Assessment
- [ ] Minimal Impact (isolated additions)
- [ ] Moderate Impact (some existing code changes)
- [x] Significant Impact (substantial existing code changes)
- [ ] Major Impact (architectural changes required)

### Goals and Background Context

#### Goals
- Provide a polished Outputs gallery with reliable workflow utilities that meets or exceeds the simplified output gallery specification.
- Validate and document compliance with ComfyUI theme integration requirements across all surfaced UI elements.
- Gate Local Assets and Model Browser tabs while preserving their partially implemented code paths and clearly enumerating outstanding tasks (error boundaries, advanced search highlighting, metadata error handling, performance optimizations, caching).

#### Background Context
Specs in `.kiro/specs/*` capture full feature ambitions. Local Asset Management and Simplified Model Browser have extensive implemented foundations but still list open tasks for error boundary integration, advanced feedback, and performance (tasks #20–25 and #11). Outputs gallery spec shows core flows completed with pending performance/QA work. Shipping now requires focusing on Outputs, validating theme compliance, and deferring unfinished checklist items without losing momentum on future enhancements.

### Change Log
| Change | Date | Version | Description | Author |
| ------ | ---- | ------- | ----------- | ------ |
| Initial PRD draft | 2025-09-21 | 0.1 | Captured Outputs-first release plan and scope | John |
| Updated with spec analysis | 2025-09-21 | 0.2 | Incorporated `.kiro/specs` status, outstanding tasks, and theme requirements | John |

## Requirements
These requirements are based on the validated understanding of the existing system and the referenced specifications.

### Functional
1. **FR1:** Deliver a production-ready Outputs tab that consumes live `/asset_manager/outputs` data with resilient loading, sorting, and error states, satisfying simplified output gallery requirements 1–5.
2. **FR2:** Ensure workflow actions (load workflow, open in system viewer, show folder, copy path) operate reliably across supported operating systems and align with simplified output gallery requirement 6.
3. **FR3:** Introduce feature gating so only the Outputs experience ships in the initial release while the Local Assets and Model Browser tabs—and their unfinished tasks—remain dormant but intact for completion.
4. **FR4:** Confirm surfaced UI elements comply with ComfyUI theme integration requirements 1–8, documenting any gaps for follow-up.

### Non Functional
1. **NFR1:** Maintain current ComfyUI responsiveness—Outputs interactions must not introduce noticeable latency even with large galleries; address pending performance tasks (#7 in simplified output gallery spec).
2. **NFR2:** Preserve automated test coverage: pytest suites, Vitest unit/integration tests, and Playwright E2E flows must continue to pass, with scenarios updated for gating logic and theme verification.
3. **NFR3:** Degrade gracefully when external services (CivitAI, HuggingFace) are unavailable—surface non-blocking errors without crashing the extension, reflecting patterns defined in model browser spec.
4. **NFR4:** Document remaining backlog items from specs (Local Assets tasks 20–25, Model Browser task 11, Output Gallery tasks 7–8) and ensure gating does not regress their future feasibility.

### Compatibility Requirements
- **CR1:** Keep existing `/asset_manager` REST contracts stable for frontend and any external consumers.
- **CR2:** Avoid introducing new persistent storage; continue leveraging ComfyUI’s filesystem paths and existing cache adapters.
- **CR3:** Match ComfyUI theme tokens and interaction patterns so the surfaced UI feels native (per theme integration spec).
- **CR4:** Ensure ComfyUI integrations (drag/drop hooks, extension registration, health endpoint) remain fully operational despite hiding other tabs.
- **CR5:** Preserve the ability to finish outstanding spec tasks post-release (e.g., ErrorBoundary integration, virtual scrolling) without major refactors.

## User Interface Enhancement Goals

### Integration with Existing UI
Adopt ComfyUI theme variables and PrimeVue-influenced layout to ensure the Outputs tab (and any minimal gating UI) satisfies the theme integration requirements, including smooth transitions and fallback behavior.

### Modified/New Screens and Views
- Outputs Gallery (grid/list views with context menu and toolbar)
- Output Detail Modal (workflow metadata, navigation, actions)
- Toolbar controls for sort, view mode, refresh, and error banners
- Minimal gating affordance for hidden tabs (e.g., tooltip or release note)

### UI Consistency Requirements
- Use theme tokens defined in `ui/src/styles/theme.css` and ComfyUI’s `:root` variables; verify against requirements 1–8 of the theme spec.
- Maintain keyboard accessibility (Escape to close modal/context menu, tab order preserved); align with output gallery spec testing expectations.
- Surface errors via non-blocking banners/toasts consistent with ComfyUI visual language; reuse notification utilities from theme integration spec.

## Technical Constraints and Integration Requirements

### Existing Technology Stack
- **Languages**: Python ≥3.12, TypeScript 5.8, JSX/TSX
- **Frameworks**: aiohttp 3.12, React 18 with Vite build, Vitest/Playwright for testing
- **Database**: None (filesystem-based storage via ComfyUI paths)
- **Infrastructure**: Runs inside ComfyUI PromptServer, optional file cache in `.cache/asset_manager`
- **External Dependencies**: CivitAI & HuggingFace REST APIs, Pillow 11 for metadata/thumbnail handling, system shell operations per output spec

### Integration Approach
- **Database Integration Strategy**: Continue reading/writing through filesystem adapters and caches; no schema migrations required.
- **API Integration Strategy**: Reuse `/asset_manager` endpoints; enhance error handling and sorting parameters without breaking contracts; respect external API limits.
- **Frontend Integration Strategy**: Consume API data via `apiClient`; add feature gating and theme validation within existing feature modules; ensure Local Assets/Model Browser code is bypassed—not removed—per spec tasks backlog.
- **Testing Integration Strategy**: Extend pytest, Vitest, and Playwright suites to cover gating, workflow operations, and theme compliance; plan follow-up integration testing to close remaining spec tasks (#7–8 outputs, #11 model browser).

### Code Organization and Standards
- **File Structure Approach**: Keep enhancements within `ui/src/features/outputs`, gating logic in `ui/src/App.tsx` and `ui/src/features/index.ts`, and backend adjustments in `src/domain/services/output_service.py`, `src/adapters/driven/comfyui_output_adapter.py`.
- **Naming Conventions**: Follow existing camelCase for JS/TS, snake_case for Python; maintain domain-driven naming in backend services and ports.
- **Coding Standards**: Adhere to hexagonal boundaries; align UI code with theme integration utilities; ensure TODOs referencing spec tasks persist for future completion.
- **Documentation Standards**: Update `docs/development` and `.kiro/specs` notes where behaviour changes (e.g., gating doc, theme verification results) and log outstanding spec tasks.

### Deployment and Operations
- **Build Process Integration**: Keep Vite build (`pnpm run build`) and Poetry install steps unchanged; ensure Outputs assets included in `dist/asset_manager`.
- **Deployment Strategy**: Release via ComfyUI custom_nodes distribution; include release notes explaining tab gating and future roadmap.
- **Monitoring and Logging**: Continue leveraging `src/utils/logger.py`; add targeted logs around workflow actions, system operations, and gating decisions for diagnostics.
- **Configuration Management**: Introduce feature gating via environment flag or config module without expanding configuration surface drastically; document defaults and how to re-enable tabs for internal testing.

### Risk Assessment and Mitigation
- **Technical Risks**: Remaining tasks in Local Assets (ErrorBoundary, enhanced empty states, advanced search feedback, metadata error handling, drag-and-drop resilience, performance) and Model Browser (API caching/perf) could degrade user experience if accessed prematurely; Outputs performance tuning (task #7) remains open.
- **Integration Risks**: Hiding tabs must not break ComfyUI integration hooks or deferred routes; external API rate limits may still bubble up; untested workflows could fail on specific OSs.
- **Deployment Risks**: Missing feature toggle documentation could confuse installers; bundling stale assets may reintroduce old UI; gating must clearly communicate roadmap.
- **Mitigation Strategies**: Add automated visual regression tests, validate gating in Playwright E2E, expand error handling in `apiClient`, maintain a checklist of remaining spec tasks, and document how to re-enable tabs for QA/internal builds.

## Epic and Story Structure
Based on the existing architecture and spec analysis, this enhancement should be structured as a single epic that sequences backend hardening, UI/theme compliance, and release gating. This keeps risk contained, satisfies outstanding spec-driven checks, and leverages existing modularity. Does this align with your understanding of the work required?

**Epic Structure Decision**: Single epic delivering an Outputs-first release and theme-compliant UI while staging future tabs, justified by shared code paths, outstanding spec tasks, and need for tight coordination.

## Epic 1: Outputs-First Release

**Epic Goal**: Ship a production-ready Outputs experience with reliable workflow utilities, verified theme compliance, and clear gating for unfinished Local Assets and Model Browser features.

**Integration Requirements**: Maintain stable `/asset_manager` APIs, respect theme tokens, preserve ComfyUI extension hooks, catalog outstanding spec tasks, and ensure tests remain green across backend/frontend/E2E layers.

### Story 1.0 Feature Flag & Telemetry Scaffolding
As a maintainer,
I want feature-gating, telemetry, and release-note scaffolding in place first,
so that subsequent stories can build safely and we capture Outputs-specific metrics from day one.

#### Acceptance Criteria
1. Feature flag configuration (env variable or config module) controls tab visibility and is documented for QA/release notes.
2. Telemetry/monitoring hooks (logging fields, optional metrics) defined for Outputs operations, even if initial plumbing is basic.
3. Placeholder release-note template drafted to communicate gated tabs and future roadmap.

#### Integration Verification
- IV1: Verify gating toggle is accessible to developers/QA without code changes.
- IV2: Ensure telemetry hooks/logging do not disrupt existing logging pipeline.
- IV3: Confirm release-note template and documentation references exist for later updates.

### Story 1.1 Outputs Backend Hardening
As a ComfyUI user,
I want backend outputs APIs to behave reliably under real workloads,
so that I can trust workflow actions and gallery data during daily use.

#### Acceptance Criteria
1. API responses handle empty directories, malformed metadata, and large collections without 500 errors; logging covers failure modes from simplified output gallery spec.
2. Workflow actions (load, open, show folder, copy path) return success/failure payloads with actionable messages and cover OS-specific cases.
3. Telemetry/logging from Story 1.0 captures workflow action outcomes and gating decisions for diagnostics.

#### Integration Verification
- IV1: Confirm existing `/asset_manager/outputs` clients (frontend, tests) still receive compatible payloads; use spec task #8 integration tests as reference.
- IV2: Validate ComfyUI PromptServer registration and health endpoint remain unaffected.
- IV3: Run pytest integration suite and targeted load tests to ensure caching/performance remain within spec expectations.

### Story 1.2 Outputs UI Polish and Theme Compliance
As a ComfyUI user,
I want the Outputs tab to feel native to ComfyUI’s UI,
so that I can manage outputs without noticing visual or interaction inconsistencies.

#### Acceptance Criteria
1. Outputs gallery uses ComfyUI theme variables for colors, typography, spacing, and transitions; verify against theme integration requirements 1–8.
2. Error banners, modals, context menus, and workflow actions meet accessibility requirements (keyboard shortcuts, focus traps) and match spec expectations.
3. Vitest component tests, visual regression snapshots, and Playwright “Outputs” suite updated to reflect final design and gating; incorporate spec task #7 monitoring criteria.

#### Integration Verification
- IV1: Check frontend unit tests and Playwright “Outputs” suite pass with new styling and gating.
- IV2: Verify drag-and-drop hooks, clipboard fallbacks, and notification utilities still operate in ComfyUI runtime.
- IV3: Measure render timings and memory usage to ensure no regressions; document remaining performance tasks (#7).

### Story 1.3 Feature Gating and Release Packaging
As a product maintainer,
I want to expose only the Outputs functionality for the initial release,
so that users get a stable experience while other tabs remain under development.

#### Acceptance Criteria
1. Feature gating hides Local Assets and Model Browser tabs (UI and navigation) without removing their code; gating logic documents outstanding spec tasks (Local Assets #20–25, Model Browser #11).
2. Release documentation instructs how to toggle future tabs for internal testing and references remaining backlog items for completion.
3. Build artifacts (`dist/asset_manager`, locales) verified before distribution; release notes highlight Outputs features, theme compliance, and gated tabs.

#### Integration Verification
- IV1: Ensure ComfyUI extension registration and health checks still reflect Outputs availability and report gated features for transparency.
- IV2: Validate gating logic doesn’t break route-based imports, lazy loading, or future completion of spec tasks; include QA plan for re-enabling tabs.
- IV3: Confirm Playwright smoke tests for initial load and gating scenarios pass with tabs disabled; ensure Outputs workflows continue functioning on supported OSs.

This story sequence is designed to minimize risk to the existing system. Does this order make sense given the project’s architecture and constraints?
