# ComfyUI Asset Manager Brownfield Architecture Document

## Introduction

This document captures the CURRENT STATE of the ComfyUI Asset Manager codebase, including technical debt, workarounds, and real-world patterns. It serves as a reference for AI agents working on enhancements. The project is a hybrid Python-React extension for ComfyUI, focusing on asset management (local models, downloads, outputs) integrated into ComfyUI's sidebar.

### Document Scope

Comprehensive documentation of entire system.

### Change Log

| Date       | Version | Description                  | Author    |
|------------|---------|------------------------------|-----------|
| 2025-09-07 | 1.0     | Initial brownfield analysis | Winston  |
| 2025-09-07 | 1.1     | Updated with codebase verification details | Winston  |

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System

- **Main Entry**: `src/__init__.py` (ComfyUI extension registration via NODE_CLASS_MAPPINGS and WEB_DIRECTORY)
- **Startup & Routes**: `src/main.py` (Initializes container, registers aiohttp routes with ComfyUI PromptServer, e.g., /asset_manager/health)
- **Configuration**: `pyproject.toml` (Poetry config, ComfyUI registry metadata), `ui/vite.config.ts` (Vite build config with aliases and manualChunks), `.env` (environment vars, though not explicitly used)
- **Core Business Logic**: `src/domain/` (entities like Model, Folder; services like OutputService, ModelService)
- **API Definitions**: `src/adapters/driving/web/` (aiohttp routes prefixed with `/asset_manager/`, e.g., get_models endpoint with Pydantic validation)
- **Database Models**: No traditional DB; uses file system via `src/adapters/driven/file_system/` (e.g., folder scanning with ComfyUI's folder_paths)
- **Key Algorithms**: `src/domain/services/` (e.g., model_service.py for get_models with caching stub; output_service.py for async scanning and metadata extraction via PIL); `ui/src/services/` (React API clients with error handling, e.g., assetApi.ts for /asset_manager/ calls)

## High Level Architecture

### Technical Summary

The system follows Hexagonal (Ports and Adapters) Architecture adapted for ComfyUI extensions. Python backend handles ComfyUI integration (folder_paths, API routes via main.py and adapters/driving/), while React frontend provides sidebar UI (via ui/src/App.tsx registering tab). No full DB; relies on file system and external APIs (CivitAI, HuggingFace). MVP-focused: Local Asset Management primary, Model Browser secondary, Output Gallery tertiary. Current state: Partial implementation (e.g., local assets scanning exists in adapters/driven/file_system/; full model download queue partial in services/; external_api/ clients stubbed with async aiohttp but no retries).

### Actual Tech Stack (from pyproject.toml, package.json, vite.config.ts)

| Category      | Technology                  | Version | Notes                                      |
|---------------|-----------------------------|---------|--------------------------------------------|
| Runtime       | Python                      | 3.12+  | ComfyUI environment; aiohttp for async     |
| Framework     | React 18 + TypeScript       | 18.x   | Vite for build; CSS modules for styling    |
| Backend Web   | aiohttp (integrated)        | -      | Routes via ComfyUI PromptServer in main.py |
| Package Mgr   | Poetry (Python), pnpm (JS)  | -      | Dev deps include pytest, Vitest            |
| Database      | File System (no DB)         | -      | ComfyUI folder_paths for models/outputs    |
| External APIs | CivitAI, HuggingFace        | -      | Async clients in adapters/driven/external_api/ (partial impl) |
| Testing       | pytest (Python), Vitest (JS)| -      | Coverage ~60%; integration via MCP tools and Playwright |
| Styling       | CSS Modules + ComfyUI Vars  | -      | Theme integration via CSS variables        |
| i18n          | i18next                     | -      | Multi-language support in ui/src/locales/ (partial JSON files) |

### Repository Structure Reality Check

- Type: Monorepo (Python + React in single repo)
- Package Manager: Poetry + pnpm
- Notable: Hybrid structure; ui/ for React (separate build to dist/asset_manager/); src/ for Python domain/adapters (with __init__.py in subdirs); tests/ mirrors src/; ComfyUI-specific: dist/ for built assets; .kiro/ for specs/steering (non-code docs).

## Source Tree and Module Organization

### Project Structure (Actual)

```
project-root/
├── src/                          # Python backend (Hexagonal core)
│   ├── adapters/                 # Ports & Adapters (5 subdirs/files total)
│   │   ├── driven/               # Secondary adapters (11 files: e.g., file_system_adapter.py scans via pathlib with SecurePathValidator; external_api/ for CivitAI/HF async clients - partial impl)
│   │   │   ├── __init__.py
│   │   │   ├── file_system/      # Folder scanning adapters
│   │   │   └── external_api/     # API clients (aiohttp stubs, no retries)
│   │   ├── driving/              # Primary adapters (2 files: web/ with route registration)
│   │   │   ├── __init__.py
│   │   │   └── web/              # API routes (e.g., GET /asset_manager/folders/{id}/models with Pydantic)
│   │   └── __init__.py
│   ├── domain/                   # Pure business logic (6 subdirs/files total)
│   │   ├── entities/             # Core objects (7 files: e.g., base.py with Entity ABC and __hash__; model.py with id/name/path/metadata; folder.py; output.py with workflow_params)
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── model.py
│   │   │   └── ... (4 more)
│   │   ├── ports/                # Interfaces (3 files: e.g., model_port.py ABC with get_models_in_folder; output_port.py for scan_output_directory)
│   │   │   ├── __init__.py
│   │   │   ├── model_port.py
│   │   │   └── output_port.py
│   │   └── services/             # Domain services (6 files: e.g., model_service.py implements ModelManagementPort with caching stub; output_service.py async scan with @monitor_performance decorator)
│   │       ├── __init__.py
│   │       ├── model_service.py
│   │       └── output_service.py  # ... (4 more)
│   ├── utils/                    # Shared (1 file: logger.py with info/warn/error and perf monitoring)
│   │   ├── __init__.py
│   │   └── logger.py
│   ├── __init__.py               # Extension entry (NODE_CLASS_MAPPINGS={'AssetManagerNode': AssetManagerNode}, WEB_DIRECTORY='asset_manager')
│   ├── config.py                 # App config (SecurePathValidator class for path resolution and traversal prevention)
│   └── container.py              # DI: get_container() singleton wires ports/adapters (e.g., ModelService -> FileSystemModelAdapter)
├── ui/                           # React frontend (17 subdirs; ~100 files partial impl)
│   ├── public/                   # Static assets (locales/ with partial JSON: en.json, es.json)
│   │   └── locales/              # i18n files
│   ├── src/                      # React source
│   │   ├── __tests__/            # Vitest tests (3 files: app.test.tsx, utils.test.ts)
│   │   ├── components/           # UI (22 files: e.g., AssetGrid.tsx with thumbnails and mocked data; ModelCard.tsx stub; theme/ with CSS vars)
│   │   │   ├── common/           # Shared (Button.tsx, Modal.tsx)
│   │   │   ├── asset/            # Asset-specific (Grid.tsx, SearchBar.tsx)
│   │   │   └── ... (20 more subdirs/files)
│   │   ├── contexts/             # State (2 files: AssetContext.tsx for models/folders; ThemeContext.tsx)
│   │   ├── features/             # Pages/tabs (4 files: LocalAssets.tsx partial; ModelBrowser.tsx with search stub)
│   │   ├── hooks/                # Custom (5 files: useApiClient.ts with fetch and ApiResponse<T>; useModels.ts)
│   │   ├── services/             # API clients (5 files: assetApi.ts for /asset_manager/; comfyuiApi.ts for graph access)
│   │   ├── utils/                # Helpers (i18n.ts, theme.ts with CSS vars)
│   │   ├── types/                # TS defs (Model.ts, ApiResponse.ts)
│   │   ├── App.tsx               # Root entry: i18n provider, contexts, sidebar tab reg via window.app.extensionManager.registerSidebarTab()
│   │   └── index.tsx             # ReactDOM.render entry
│   ├── tests-e2e/                # Playwright E2E (9 files: app.spec.ts, local-assets.spec.ts; fixtures/ for setup; global-setup.ts; uses Chrome MCP)
│   ├── package.json              # pnpm deps (React 18, i18next, @comfyorg/comfyui-frontend-types; scripts for dev/build/test/lint)
│   ├── tsconfig.json             # TS config (strict mode, paths for @/*)
│   ├── tsconfig.node.json        # Node TS config (for Vite)
│   ├── vite.config.ts            # Build: React plugin, aliases (@components -> src/components), outDir=../dist/asset_manager, manualChunks (vendor/utils)
│   └── playwright.config.ts      # E2E config (Chrome MCP, 30s timeouts)
├── tests/                        # Python tests (pytest; mirrors src/; 35+ files partial)
│   ├── adapters/                 # Adapter tests (driven/driving; 15 files)
│   ├── domain/                   # Domain tests (entities/ports/services; 14 files)
│   ├── integration/              # E2E-like (e.g., test_comfyui_integration.py partial)
│   └── utils/                    # (test_logger.py)
├── docs/                         # Documentation (partial; development/ has 8 MD files: hexagonal-architecture.md, developer-guide.md, etc.)
│   └── development/              # Theme guides, TODO.md, current-implementation-status.md
├── .kiro/                        # Specs/steering (non-code; specs/ has requirements/design/tasks per feature; steering/ has 12 MD guidelines)
│   ├── specs/                    # Feature specs (e.g., simplified-model-browser/requirements.md partial impl)
│   └── steering/                 # Guidelines (e.g., architecture.md, product.md, tech.md)
├── pyproject.toml                # Poetry config, [tool.comfy] for registry (PublisherId="rodpl", includes=["dist/"])
├── poetry.lock                   # Python deps lock
└── ... (setup.sh, dev_server.sh for symlink/restart, etc.)
```

### Key Modules and Their Purpose

- **Domain Core**: `src/domain/` - Pure logic (e.g., model_service.py implements ModelManagementPort with caching stub; output_service.py async scan with @monitor_performance; entities/ has 7 files with dataclasses and ABC base.py)
- **Adapters**: `src/adapters/` - Driving: web/ (2 files, registers /asset_manager/ routes with Pydantic); Driven: file_system/ (scans via pathlib, SecurePathValidator prevents traversal); external_api/ (async aiohttp clients for CivitAI/HF - stubs, no retries; 11 files total)
- **Frontend**: `ui/src/` - React app (App.tsx root with i18n/contexts and sidebar reg via window.app.extensionManager; ApiClient in services/ for /asset_manager/ calls with ApiResponse<T>; features/ for tabs like LocalAssets partial; 22 components with stubs e.g., AssetGrid.tsx mocked data)
- **ComfyUI Integration**: `src/__init__.py` - Registers sidebar tab via app.extensionManager; uses folder_paths for scanning; main.py initializes container and PromptServer routes
- **DI & Config**: `src/container.py` - get_container() singleton wires ports/adapters (e.g., ModelService -> FileSystemModelAdapter); config.py for SecurePathValidator (path resolution and relative_to checks)

## Data Models and APIs

### Data Models

Instead of duplicating, reference actual model files:

- **Model Entity**: See `src/domain/entities/model.py` (fields: id, name, path, metadata dict; inherits Entity base with __hash__/__eq__)
- **Folder Entity**: See `src/domain/entities/folder.py` (fields: id, path, type enum; uses Value Objects for paths)
- **Output Entity**: See `src/domain/entities/output.py` (fields: id, image_path, workflow_params; domain events for generation)
- **Related Types**: TS interfaces in `ui/src/types/` (e.g., ApiResponse<T> with success/data/error, Model[]); Python dataclasses in domain/entities/base.py (7 entities total)

### API Specifications

- **OpenAPI Spec**: None; manual in steering/api-guidelines (RESTful, /asset_manager/ prefix, JSON responses with {success, data?, error?})
- **Postman Collection**: None; use browser dev tools or curl for testing (e.g., GET /asset_manager/folders/{id}/models)
- **Manual Endpoints**: 
  - GET /asset_manager/folders/{folder_id}/models - Returns Model[] (async via aiohttp in driving/web/)
  - POST /asset_manager/search - Search models/outputs (query param; validated via Pydantic in adapters/)
  - All: Error handling with HTTP 4xx/5xx + JSON {error: str}; registered in main.py via PromptServer

## Technical Debt and Known Issues

### Critical Technical Debt

1. **Partial Feature Implementation**: Specs in .kiro/specs/ (e.g., simplified-model-browser/tasks.md) show incomplete (e.g., download queue partial in services/; output gallery batch ops missing) - tightly coupled to ComfyUI folder_paths, no abstraction yet
2. **Testing Coverage**: ~60% (from tech.md); integration tests minimal (e.g., test_comfyui_integration.py lacks full E2E); no load tests for large collections (1000+ items); Vitest/Playwright partial (3 unit, 9 E2E files)
3. **Dependency Management**: Hybrid Poetry/pnpm; no unified lockfile; external libs (PIL for thumbs, aiohttp) in both main/dev but versions not pinned tightly
4. **Error Handling Gaps**: Domain exceptions defined but not all adapters implement (e.g., file system errors not wrapped in driven/file_system/); frontend error boundaries partial (react-patterns.md notes incomplete in components/)
5. **Performance**: No TTL caching impl (mentioned in tech.md but not in services/); scanning large folders sync in utils/ (should be async); React virtual scrolling stubbed in components/ (no impl in hooks/)

### Workarounds and Gotchas

- **Environment Variables**: Must set NODE_ENV=production for staging (historical); Poetry env must use python3 explicitly (poetry env use python3)
- **Database Connections**: No DB, but file paths hardcoded to ComfyUI's (changing breaks scanning in adapters/driven/file_system/); use SecurePathValidator always to avoid traversal
- **Build Process**: Manual frontend build (pnpm run build) before ComfyUI restart; symlink via dev_server.sh for hot reload, but breaks on path changes; vite.config.ts manualChunks for vendor/utils
- **Theme Integration**: CSS vars from ComfyUI, but dark mode partial (docs/development/theme-integration-guide.md notes manual overrides needed in components/theme/)

## Integration Points and External Dependencies

### External Services

| Service     | Purpose                  | Integration Type | Key Files                          |
|-------------|--------------------------|------------------|------------------------------------|
| CivitAI     | Model search/download    | REST API (async) | src/adapters/driven/external_api/civitai_client.py (stub) |
| HuggingFace | Model discovery          | REST API         | src/adapters/driven/external_api/hf_client.py (partial) |
| ComfyUI     | Folder paths, sidebar    | SDK/Extension    | src/__init__.py (NODE_CLASS_MAPPINGS); main.py (routes) |
| ComfyUI API | Graph/output access      | Internal calls   | ui/src/services/comfyui_api.ts (fetch for app.graph) |

### Internal Integration Points

- **Frontend Communication**: REST via /asset_manager/ (fetch in ui/src/hooks/useApiClient.ts); expects JSON ApiResponse<T>
- **Background Jobs**: None; async scanning in domain/services/output_service.py (e.g., scan_output_directory with PIL metadata)
- **ComfyUI Events**: Listen to app.graph changes for output gallery in ui/src/services/; registerSidebarTab in App.tsx

## Development and Deployment

### Local Development Setup

1. Run `./setup.sh` (installs Poetry deps, pnpm ui/); manual: `poetry install --with dev; cd ui && pnpm install`
2. Dev server: `./dev_server.sh` (symlinks ui/dist to ComfyUI web; restarts server on backend changes)
3. Frontend hot reload: `cd ui && pnpm run dev` (Vite on localhost:5173; proxy to ComfyUI)
4. Required env: ComfyUI running; set PYTHONPATH to project root; .env for API keys (CivitAI token)
5. Known issues: Restart ComfyUI after backend changes (main.py/routes); pnpm watch mode for auto-rebuild (vite.config.ts hmr overlay=false)

### Build and Deployment Process

- **Build Command**: `cd ui && pnpm run build` (outputs to dist/asset_manager/ with manualChunks for vendor/utils; minify with terser drop_console)
- **Deployment**: Manual to ComfyUI custom_nodes/ (copy src/, dist/, pyproject.toml); publish via `comfy-cli publish` (requires [tool.comfy] in pyproject.toml)
- **Environments**: Dev (local ComfyUI), Staging (test ComfyUI instance), Prod (user ComfyUI installs via registry)
- **ComfyUI Registry**: Semantic versioning; includes dist/ for assets; update pyproject.toml PublisherId="rodpl"

## Testing Reality

### Current Test Coverage

- Unit Tests: 60% (pytest for domain/services in tests/domain/; Vitest for React components/hooks in ui/src/__tests__/ - 3 files)
- Integration Tests: Minimal (tests/integration/test_comfyui_integration.py partial; E2E via Playwright in ui/tests-e2e/ - 9 files with fixtures/global-setup.ts; uses Chrome MCP)
- E2E Tests: Partial (e.g., local-assets.spec.ts covers basics; not full for model browser)
- Manual Testing: Primary for ComfyUI integration (restart protocol in steering/development-workflow.md)

### Running Tests

```bash
poetry run pytest          # Python unit/integration
poetry run pytest --cov=src --cov-report=html  # Coverage
cd ui && pnpm run test     # JS unit (Vitest)
cd ui && pnpm run test:watch  # Watch mode
npx playwright test        # E2E (ui/tests-e2e/; Chrome MCP config in playwright.config.ts)
```

## Appendix - Useful Commands and Scripts

### Frequently Used Commands

```bash
./setup.sh                 # Initial setup (Poetry + pnpm)
./dev_server.sh            # Dev server with symlink/restart
cd ui && pnpm run dev      # Frontend hot reload (Vite)
cd ui && pnpm run build    # Production build (to dist/asset_manager/)
poetry run pytest          # Run Python tests
cd ui && pnpm run lint:fix # Fix linting (eslint.config.js)
poetry run pytest --cov=src  # Coverage report
comfy-cli publish          # Publish to registry ([tool.comfy] in pyproject.toml)
```

### Debugging and Troubleshooting

- **Logs**: Python: utils/logger.py (info/warn/error with perf timing); React: console.log in hooks/services (e.g., useApiClient.ts)
- **Debug Mode**: Set DEBUG=app:* env for verbose; pytest -s for print output; Vitest --debug
- **Common Issues**: See tech.md troubleshooting (e.g., Poetry env use python3; remove unused TS imports in vite.config.ts); ComfyUI restart after backend (main.py); path validation with SecurePathValidator in config.py; no circular imports found

This document reflects the actual codebase state as of 2025-09-07. For enhancements, reference .kiro/specs/ for planned features (e.g., simplified-output-gallery/requirements.md shows partial impl) and steering/ for guidelines. No major gaps remain; proceed with updates as needed.