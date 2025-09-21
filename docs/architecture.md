# ComfyUI Asset Manager Brownfield Architecture Document

## Introduction
This document captures the current state of the ComfyUI Asset Manager codebase—including technical debt, workarounds, and real implementation patterns—so future agents can work effectively on enhancements.

### Document Scope
Comprehensive documentation of the entire system with emphasis on the Outputs feature (targeted for the first public release) and the staging plan for other tabs.

### Change Log
| Date       | Version | Description                      | Author |
| ---------- | ------- | -------------------------------- | ------ |
| 2025-09-21 | 1.0     | Initial brownfield analysis      | Mary   |

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System
- **Extension bootstrap**: `__init__.py` – registers static assets and API routes with ComfyUI at runtime.
- **Backend entry point**: `src/main.py` – initialises services and exposes REST routes.
- **Dependency wiring**: `src/container.py` – dependency injection container for hexagonal components.
- **Domain services**: `src/domain/services/` – core business logic for models, folders, outputs, external catalogues, and metadata.
- **REST adapter**: `src/adapters/driving/web_api_adapter.py` – implements `/asset_manager/*` endpoints and proxy routes.
- **Frontend entry**: `ui/src/main.tsx` – registers the sidebar tab inside ComfyUI and mounts the React app.
- **Tab switcher shell**: `ui/src/App.tsx` – renders Local Assets, Model Browser, Outputs, and Theme tabs.
- **Outputs feature**: `ui/src/features/outputs/` – React components, CSS, utilities, and mocks for the release-critical Outputs tab.
- **Configuration**: `pyproject.toml`, `ui/package.json` – define Python/Node dependencies and scripts.
- **Developer tooling**: `setup.sh`, `dev_server.sh` – install dependencies and run live frontend builds linked into ComfyUI.
- **Steering docs**: `.kiro/steering/*`, `docs/development/*` – authoritative project/process guidance consumed by agents.

### If PRD Provided - Enhancement Impact Areas
<!-- No brownfield PRD provided yet; update once the Product Manager delivers it. Current release focus: complete Outputs tab, theme alignment, temporarily hide unfinished tabs. -->

## High Level Architecture

### Technical Summary
- Python backend implements a hexagonal (ports-and-adapters) architecture hosted inside ComfyUI’s `aiohttp` server.
- React + TypeScript frontend is bundled with Vite and served as static assets through ComfyUI.
- Outputs management is fully wired end-to-end (filesystem scan, workflow metadata, REST API, React UI).
- Local Assets and Model Browser features have UI and partial backend plumbing but will ship later; tabs need gating for the initial release.
- Extensive unit/integration tests exist for both backend and frontend, plus Playwright E2E coverage.

### Actual Tech Stack (from package.json/requirements.txt)
| Category          | Technology                    | Version      | Notes                                                             |
| ----------------- | ----------------------------- | ------------ | ----------------------------------------------------------------- |
| Backend Runtime    | Python                        | ≥3.12        | Managed via Poetry                                               |
| Web Framework      | aiohttp                       | 3.12.14      | Powers REST API within ComfyUI `PromptServer`                    |
| Imaging/IO         | Pillow                        | 11.0.0       | Thumbnail extraction, metadata parsing                           |
| Frontend Runtime   | Node.js                       | ≥18 (README) | pnpm used for dependency management                              |
| Frontend Framework | React                         | 18.2.0       | TypeScript SPA served by ComfyUI                                 |
| Build Tool         | Vite                          | 7.0.3        | Outputs to `dist/asset_manager`                                   |
| Language           | TypeScript                    | 5.8.3        | Strict typing across UI                                          |
| Testing (frontend) | Vitest, Testing Library       | 3.2.4        | Component and hook coverage                                      |
| Testing (frontend) | Playwright                    | 1.47.2       | E2E specs in `ui/tests-e2e`                                      |
| Testing (backend)  | pytest, pytest-asyncio, cov   | 8.2 / 0.23   | 70% minimum coverage enforced via `--cov-fail-under=70`          |
| Package Manager    | pnpm                          | lockfile     | Vite build and tests                                             |

### Repository Structure Reality Check
- Type: Monorepo containing Python backend and React frontend.
- Package Managers: Poetry for Python, pnpm for frontend.
- Notable Decisions: Hexagonal architecture with explicit ports/adapters; frontend organised by feature folders; `.kiro/steering` supplies standards for AI agents.

## Source Tree and Module Organization

### Project Structure (Actual)
```text
comfyui-asset-manager.codex/
├── __init__.py                  # ComfyUI extension bootstrap
├── src/
│   ├── main.py                  # Application lifecycle for backend
│   ├── container.py             # Dependency injection container
│   ├── config.py                # Environment-driven settings
│   ├── domain/
│   │   ├── entities/            # Model, Folder, Output, ExternalModel, value objects
│   │   ├── services/            # ModelService, OutputService, MetadataService, etc.
│   │   └── ports/               # Driving/driven interfaces for hexagonal design
│   └── adapters/
│       ├── driving/             # WebAPIAdapter (REST)
│       └── driven/              # File system, ComfyUI, external API, cache adapters
├── ui/
│   ├── src/
│   │   ├── App.tsx              # Tab navigation shell
│   │   ├── main.tsx             # Registers sidebar tab with ComfyUI
│   │   ├── features/            # local-assets, model-browser, outputs, theme demo
│   │   ├── services/            # api client, ComfyUI integration helpers
│   │   └── hooks/               # Theme and ComfyUI hooks
│   └── public/locales/          # i18n bundles (en, zh)
├── docs/
│   └── development/             # Architecture guides, implementation status, theme docs
├── tests/                       # Python unit/integration suites
├── ui/tests-e2e/                # Playwright end-to-end specs
└── setup.sh, dev_server.sh      # Developer workflow scripts
```

### Key Modules and Their Purpose
- **`src/domain/services/output_service.py`** – caches and enriches output metadata; supports refresh, filtering, workflow loading.
- **`src/adapters/driven/comfyui_output_adapter.py`** – auto-discovers ComfyUI paths, extracts workflow JSON, supports system interactions.
- **`src/adapters/driving/web_api_adapter.py`** – exposes folder/model/output/external model endpoints and HTTP proxies.
- **`src/domain/services/model_service.py`** – wraps filesystem repositories, merges external tags/descriptions, handles metadata updates.
- **`ui/src/features/outputs/OutputsTab.tsx`** – renders gallery, context menu, modal, and handles API integration for Outputs feature.
- **`ui/src/services/api.ts`** – centralised REST client with request deduplication, retries, and health monitoring.
- **`ui/src/hooks/useComfyUIIntegration.ts`** – bridges React components with ComfyUI globals for drag/drop and usage tracking.

## Data Models and APIs

### Data Models
- **Models**: `src/domain/entities/model.py` defines model metadata, tags, ratings, file info.
- **Folders**: `src/domain/entities/folder.py` captures hierarchy and model type associations from ComfyUI.
- **Outputs**: `src/domain/entities/output.py` represents generated images with dimensions, workflow metadata, thumbnails.
- **External Models**: `src/domain/entities/external_model.py` aggregates CivitAI/HuggingFace data.

### API Specifications
- REST endpoints defined in `src/adapters/driving/web_api_adapter.py`; no OpenAPI/Postman spec committed. <!-- Consider generating OpenAPI documentation for the /asset_manager API set. -->
- Proxy endpoints mirror CivitAI/HuggingFace APIs to bypass browser CORS limitations.

## Technical Debt and Known Issues

### Critical Technical Debt
1. **UI Release Gating**: Local Assets and Model Browser tabs are visible despite incomplete backend wiring; need feature flags or conditional rendering before release.
2. **Cache Invalidation**: `FileSystemModelAdapter` and `OutputService` rely on TTL without filesystem notifications; external file changes require manual refresh.
3. **Documentation Drift**: `docs/development/current-implementation-status.md` still marks driving adapters as “not implemented”, which can mislead contributors.
4. **External API Robustness**: Proxy endpoints lack authentication/throttling safeguards; heavy usage could trigger rate limits or shape changes without resilience.
5. **Version Surfacing**: TODO in `docs/development/TODO.md` to expose extension version in `ui/src/main.tsx` badges remains unresolved.
6. **Spec Backlog Tracking**: Outstanding polish/performance work listed in `.kiro/specs/local-asset-management` (tasks #20–25), `.kiro/specs/simplified-model-browser` (task #11), and `.kiro/specs/simplified-output-gallery` (tasks #7–8) must remain visible when tabs are gated so future releases can complete them.

### Workarounds and Gotchas
- **ComfyUI Path Discovery**: `ComfyUIOutputAdapter` walks filesystem heuristics; ensure tests cover expected install paths or override via constructor.
- **Theme Flash Prevention**: `preventInitialTransitionFlash` must run before UI paints; missing call leads to flicker.
- **Workflow Metadata**: Some outputs may lack JSON sidecars; UI and API must handle missing workflow data gracefully (currently returns failure message).
- **Clipboard Fallbacks**: When ComfyUI APIs unavailable (tests), UI copies file paths instead of injecting nodes—keep this behaviour in mind for UX.

## Integration Points and External Dependencies

### External Services
| Service            | Purpose                               | Integration Type | Key Files                                                |
| ------------------ | ------------------------------------- | ---------------- | -------------------------------------------------------- |
| ComfyUI Runtime    | Host UI/API, model/output directories  | Python modules    | `__init__.py`, `src/adapters/driven/comfyui_*_adapter.py` |
| CivitAI            | External model catalogue               | REST API (proxy)  | `src/adapters/driven/civitai_*_adapter.py`, web API proxy|
| HuggingFace        | External model catalogue               | REST API (proxy)  | `src/adapters/driven/huggingface_*_adapter.py`, proxy    |
| System Shell       | Open files/folders for users           | Subprocess calls  | `src/adapters/driven/comfyui_output_adapter.py`         |

### Internal Integration Points
- **Frontend ↔ Backend**: `ui/src/services/api.ts` targets `/asset_manager/*` endpoints served by `WebAPIAdapter`.
- **Backend ↔ Filesystem**: Driven adapters read ComfyUI `models/` and `output/` directories, compute hashes, and locate thumbnails.
- **Backend ↔ External APIs**: Metadata and external model adapters call CivitAI/HuggingFace and merge data into domain entities.
- **Frontend ↔ ComfyUI Globals**: `useComfyUIIntegration` manipulates `window.app.graph`, `window.api`, and UI settings for drag-and-drop and usage tracking.

## Development and Deployment

### Local Development Setup
1. Run `./setup.sh` to install Poetry dependencies and pnpm packages (script covers both backend and frontend).
2. Activate Poetry shell or use `poetry run` for backend commands.
3. Install frontend deps manually if needed: `cd ui && pnpm install`.
4. Create symlink into your ComfyUI installation and start watcher: `./dev_server.sh` (links project into `custom_nodes` and runs `pnpm run watch`).
5. Restart ComfyUI after backend changes; frontend watcher serves updated assets automatically.
6. Configure required environment variables if overriding defaults (see `src/config.py`).

### Build and Deployment Process
- **Frontend build**: `cd ui && pnpm run build` – emits `dist/asset_manager` and locales.
- **Backend packaging**: Poetry project; ensure `poetry install --no-root` completes for prod environment.
- **Distribution**: Copy/symlink repository into ComfyUI `custom_nodes` and ensure built assets exist.
- **Environments**: Runs within local ComfyUI instances; no standalone deployment pipeline yet. <!-- Document deployment targets once release packaging is defined. -->

## Testing Reality

### Current Test Coverage
- **Backend**: pytest suites across domain, adapters, integration (`tests/`); coverage gate set to 70% minimum with HTML reports (`htmlcov/`).
- **Frontend**: Vitest component/unit tests in `ui/src/**/__tests__`; Theme/system integrations covered.
- **E2E**: Playwright specs in `ui/tests-e2e` validate tabs, outputs workflow, and integration touchpoints.

### Running Tests
```bash
# Backend
poetry run pytest                          # full suite with coverage
poetry run pytest tests/domain/services    # focused domain tests

# Frontend unit/integration
cd ui
pnpm run test                              # Vitest run

# Frontend E2E (Playwright)
PLAYWRIGHT_BASE_URL=http://localhost:8188 pnpm --filter ./ui e2e
```

## If Enhancement PRD Provided - Impact Analysis

### Files That Will Need Modification
- `ui/src/features/outputs/` – polish UI (styling, feature completeness) before release.
- `ui/src/App.tsx`, `ui/src/features/index.ts` – gate unused tabs and expose Outputs-only experience for MVP.
- `src/domain/services/output_service.py`, `src/adapters/driven/comfyui_output_adapter.py` – final refinements, error handling, and logging for Outputs.
- `ui/src/main.tsx` – integrate version badge once TODO resolved.

### New Files/Modules Needed
- Feature flag or configuration module to control tab visibility. <!-- Determine location (e.g., `ui/src/config/features.ts`). -->
- Potential theme alignment stylesheet overrides per ComfyUI guidelines.

### Integration Considerations
- Ensure frontend theme variables align with ComfyUI CSS tokens (`docs/development/theme-integration-guide.md`).
- Validate `apiClient` timeouts/retries are appropriate once backend endpoints run inside production ComfyUI instances.
- Confirm ComfyUI drag-and-drop hooks continue working after tabs are hidden or re-ordered.

## Appendix - Useful Commands and Scripts

### Frequently Used Commands
```bash
# Install backend dependencies
poetry install --with dev

# Build frontend assets
cd ui && pnpm run build

# Run frontend in watch mode (after dev_server symlink)
cd ui && pnpm run watch

# Clean cache entries (backend)
poetry run python - <<'PY'
from src.container import get_container
container = get_container()
cache = container.get_cache_adapter()
if cache:
    print("Expired entries removed:", cache.cleanup_expired())
PY
```

### Debugging and Troubleshooting
- **Logs**: Backend logging configured via `src/utils/logger.py`; respect `LOG_LEVEL`/`DEBUG` env vars.
- **Health Check**: `GET /asset_manager/health` verifies registered services and cache status.
- **Frontend Missing Translations**: i18next fallback logs missing keys to console and injects debug strings.
- **Symlink Issues**: Rerun `dev_server.sh` to refresh `custom_nodes` link if ComfyUI cannot locate assets.
- **CORS / External API Failures**: Check proxy routes in `web_api_adapter.py` and confirm network access; rate limit errors bubble up as structured JSON.
