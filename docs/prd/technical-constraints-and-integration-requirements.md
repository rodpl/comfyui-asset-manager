# Technical Constraints and Integration Requirements

## Existing Technology Stack
- **Languages**: Python ≥3.12, TypeScript 5.8, JSX/TSX
- **Frameworks**: aiohttp 3.12, React 18 with Vite build, Vitest/Playwright for testing
- **Database**: None (filesystem-based storage via ComfyUI paths)
- **Infrastructure**: Runs inside ComfyUI PromptServer, optional file cache in `.cache/asset_manager`
- **External Dependencies**: CivitAI & HuggingFace REST APIs, Pillow 11 for metadata/thumbnail handling, system shell operations per output spec

## Integration Approach
- **Database Integration Strategy**: Continue reading/writing through filesystem adapters and caches; no schema migrations required.
- **API Integration Strategy**: Reuse `/asset_manager` endpoints; enhance error handling and sorting parameters without breaking contracts; respect external API limits.
- **Frontend Integration Strategy**: Consume API data via `apiClient`; add feature gating and theme validation within existing feature modules; ensure Local Assets/Model Browser code is bypassed—not removed—per spec tasks backlog.
- **Testing Integration Strategy**: Extend pytest, Vitest, and Playwright suites to cover gating, workflow operations, and theme compliance; plan follow-up integration testing to close remaining spec tasks (#7–8 outputs, #11 model browser).

## Code Organization and Standards
- **File Structure Approach**: Keep enhancements within `ui/src/features/outputs`, gating logic in `ui/src/App.tsx` and `ui/src/features/index.ts`, and backend adjustments in `src/domain/services/output_service.py`, `src/adapters/driven/comfyui_output_adapter.py`.
- **Naming Conventions**: Follow existing camelCase for JS/TS, snake_case for Python; maintain domain-driven naming in backend services and ports.
- **Coding Standards**: Adhere to hexagonal boundaries; align UI code with theme integration utilities; ensure TODOs referencing spec tasks persist for future completion.
- **Documentation Standards**: Update `docs/development` and `.kiro/specs` notes where behaviour changes (e.g., gating doc, theme verification results) and log outstanding spec tasks.

## Deployment and Operations
- **Build Process Integration**: Keep Vite build (`pnpm run build`) and Poetry install steps unchanged; ensure Outputs assets included in `dist/asset_manager`.
- **Deployment Strategy**: Release via ComfyUI custom_nodes distribution; include release notes explaining tab gating and future roadmap.
- **Monitoring and Logging**: Rely on existing `src/utils/logger.py` instrumentation; no new telemetry or monitoring tooling will be added in this release.
- **Configuration Management**: Introduce feature gating via environment flag or config module without expanding configuration surface drastically; document defaults and how to re-enable tabs for internal testing.

## Risk Assessment and Mitigation
- **Technical Risks**: Remaining tasks in Local Assets (ErrorBoundary, enhanced empty states, advanced search feedback, metadata error handling, drag-and-drop resilience, performance) and Model Browser (API caching/perf) could degrade user experience if accessed prematurely; Outputs performance tuning (task #7) remains open.
- **Integration Risks**: Hiding tabs must not break ComfyUI integration hooks or deferred routes; external API rate limits may still bubble up; untested workflows could fail on specific OSs.
- **Deployment Risks**: Missing feature toggle documentation could confuse installers; bundling stale assets may reintroduce old UI; gating must clearly communicate roadmap.
- **Mitigation Strategies**: Add automated visual regression tests, validate gating in Playwright E2E, expand error handling in `apiClient`, maintain a checklist of remaining spec tasks, and document how to re-enable tabs for QA/internal builds.
