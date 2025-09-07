# ComfyUI Asset Manager Brownfield Architecture Document

## Introduction

This document captures the CURRENT STATE of the ComfyUI Asset Manager codebase, including technical debt, workarounds, and real-world patterns. It serves as a reference for AI agents working on enhancements. The project is a hybrid Python-React extension for ComfyUI, focusing on asset management (local models, downloads, outputs) integrated into ComfyUI's sidebar.

### Document Scope

Comprehensive documentation of entire system.

### Change Log

| Date       | Version | Description                  | Author    |
|------------|---------|------------------------------|-----------|
| 2025-09-07 | 1.0     | Initial brownfield analysis | Winston  |

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System

- **Main Entry**: `src/__init__.py` (ComfyUI extension registration via NODE_CLASS_MAPPINGS and WEB_DIRECTORY)
- **Configuration**: `pyproject.toml` (Poetry config, ComfyUI registry metadata), `ui/vite.config.ts` (Vite build config), `.env` (environment vars, though not explicitly used)
- **Core Business Logic**: `src/domain/` (entities like Model, Folder; services like OutputService, ModelService)
- **API Definitions**: `src/adapters/driving/` (aiohttp routes prefixed with `/asset_manager/`)
- **Database Models**: No traditional DB; uses file system via `src/adapters/driven/file_system/` (e.g., folder scanning with ComfyUI's folder_paths)
- **Key Algorithms**: `src/domain/services/` (e.g., model scanning, metadata extraction); `ui/src/services/` (React API clients with error handling)

## High Level Architecture

### Technical Summary

The system follows Hexagonal (Ports and Adapters) Architecture adapted for ComfyUI extensions. Python backend handles ComfyUI integration (folder_paths, API routes), while React frontend provides sidebar UI. No full DB; relies on file system and external APIs (CivitAI, HuggingFace). MVP-focused: Local Asset Management primary, Model Browser secondary, Output Gallery tertiary. Current state: Partial implementation (e.g., local assets scanning exists; full model download queue partial).

### Actual Tech Stack (from pyproject.toml, package.json, vite.config.ts)

| Category      | Technology                  | Version | Notes                                      |
|---------------|-----------------------------|---------|--------------------------------------------|
| Runtime       | Python                      | 3.12+  | ComfyUI environment; aiohttp for async     |
| Framework     | React 18 + TypeScript       | 18.x   | Vite for build; CSS modules for styling    |
| Backend Web   | aiohttp (integrated)        | -      | Routes via ComfyUI PromptServer            |
| Package Mgr   | Poetry (Python), pnpm (JS)  | -      | Dev deps include pytest, Vitest            |
| Database      | File System (no DB)         | -      | ComfyUI folder_paths for models/outputs    |
| External APIs | CivitAI, HuggingFace        | -      | Async clients in adapters/driven/          |
| Testing       | pytest (Python), Vitest (JS)| -      | Coverage ~60%; integration via MCP tools   |
| Styling       | CSS Modules + ComfyUI Vars  | -      | Theme integration via CSS variables        |
| i18n          | i18next                     | -      | Multi-language support in ui/src/locales/  |

### Repository Structure Reality Check

- Type: Monorepo (Python + React in single repo)
- Package Manager: Poetry + pnpm
- Notable: Hybrid structure; ui/ for React (separate build); src/ for Python domain/adapters; tests/ mirrors src/; ComfyUI-specific: dist/ for built assets; .kiro/ for specs/steering (non-code docs).

## Source Tree and Module Organization

### Project Structure (Actual)

```
project-root/
├── src/                          # Python backend (Hexagonal core)
│   ├── adapters/                 # Ports & Adapters
│   │   ├── driven/               # Secondary: File system, external APIs (e.g., CivitAI client)
│   │   ├── driving/              # Primary: API routes (/asset_manager/), ComfyUI sidebar reg
│   │   └── __init__.py
│   ├── domain/                   # Pure business logic (entities, services, ports)
│   │   ├── entities/             # Model, Folder, Output (e.g., base.py with Entity base class)
│   │   ├── ports/                # Interfaces (e.g., ModelRepositoryPort)
│   │   ├── services/             # Domain services (e.g., OutputService with @monitor_performance)
│   │   └── __init__.py
│   ├── utils/                    # Shared (logger.py)
│   ├── __init__.py               # Extension entry (NODE_CLASS_MAPPINGS)
│   ├── config.py                 # App config (e.g., SecurePathValidator)
│   └── container.py              # DI container (get_container())
├── ui/                           # React frontend
│   ├── public/                   # Static assets, locales/
│   │   └── locales/              # i18n JSON files
│   ├── src/                      # React source
│   │   ├── __tests__/            # Vitest tests (e.g., app.spec.ts)
│   │   ├── components/           # UI (e.g., AssetGrid, ModelCard; ~22 files partial impl)
│   │   ├── contexts/             # State (e.g., AssetContext)
│   │   ├── features/             # Pages/tabs (e.g., LocalAssets, ModelBrowser; 4 partial)
│   │   ├── hooks/                # Custom (e.g., useApiClient; 5 files)
│   │   ├── services/             # API clients (e.g., AssetManagerApiClient with ApiResponse<T>)
│   │   └── ... (9 more dirs: utils, types, etc.)
│   ├── tests-e2e/                # Playwright E2E (e.g., local-assets.spec.ts)
│   ├── package.json              # pnpm deps (React, i18next, @comfyorg/types)
│   ├── tsconfig.json             # TS config
│   ├── vite.config.ts            # Build with aliases (@components), manualChunks
│   └── playwright.config.ts      # E2E testing
├── tests/                        # Python tests (pytest; mirrors src/)
│   ├── adapters/                 # Adapter tests (driven/driving; 15 files)
│   ├── domain/                   # Domain tests (entities/ports/services; 14 files)
│   ├── integration/              # E2E-like (e.g., test_comfyui_integration.py)
│   └── utils/                    # (test_logger.py)
├── docs/                         # Documentation (partial; development/ has theme guides)
│   └── development/              # (8 MD files: hexagonal-architecture.md, developer-guide.md, etc.)
├── .kiro/                        # Specs/steering (non-code; specs/ has requirements/design/tasks per feature)
│   ├── specs/                    # Feature specs (e.g., simplified-model-browser/requirements.md)
│   └── steering/                 # Guidelines (e.g., architecture.md, product.md, tech.md; 12 files)
├── pyproject.toml                # Poetry config, [tool.comfy] for registry
├── poetry.lock                   # Python deps lock
└── ... (setup.sh, dev_server.sh, etc.)
```

### Key Modules and Their Purpose

- **Domain Core**: `src/domain/` - Pure logic (e.g., ModelService implements ModelManagementPort; uses DI via container.py)
- **Adapters**: `src/adapters/` - Driving: API routes (e.g., WebAPIAdapter registers /asset_manager/folders/{id}/models); Driven: FileSystemModelAdapter (scans via pathlib, SecurePathValidator prevents traversal)
- **Frontend**: `ui/src/` - React app (AssetManagerApp with contexts/hooks; ApiClient for /asset_manager/ calls; features/ for tabs like LocalAssets)
- **ComfyUI Integration**: `src/__init__.py` - Registers sidebar tab via app.extensionManager; uses folder_paths for scanning
- **DI & Config**: `src/container.py` - get_container() wires ports/adapters; config.py for paths/env

## Data Models and APIs

### Data Models

Instead of duplicating, reference actual model files:

- **Model Entity**: See `src/domain/entities/model.py` (fields: id, name, path, metadata; inherits Entity base)
- **Folder Entity**: See `src/domain/entities/folder.py` (fields: id, path, type; uses Value Objects for paths)
- **Output Entity**: See `src/domain/entities/output.py` (fields: id, image_path, workflow_params; domain events for generation)
- **Related Types**: TS interfaces in `ui/src/types/` (e.g., ApiResponse<T>, Model[]); Python dataclasses in domain/entities/base.py

### API Specifications

- **OpenAPI Spec**: None; manual in steering/api-guidelines (RESTful, /asset_manager/ prefix, JSON responses with {success, data?, error?})
- **Postman Collection**: None; use browser dev tools or curl for testing (e.g., GET /asset_manager/folders/{id}/models)
- **Manual Endpoints**: 
  - GET /asset_manager/folders/{folder_id}/models - Returns Model[] (async via aiohttp)
  - POST /asset_manager/search - Search models/outputs (query param; validated via Pydantic)
  - All: Error handling with HTTP 4xx/5xx + JSON {error: str}

## Technical Debt and Known Issues

### Critical Technical Debt

1. **Partial Feature Implementation**: Specs in .kiro/specs/ (e.g., simplified-model-browser/tasks.md) show incomplete (e.g., download queue partial; output gallery batch ops missing) - tightly coupled to ComfyUI folder_paths, no abstraction yet
2. **Testing Coverage**: ~60% (from tech.md); integration tests minimal (e.g., test_comfyui_integration.py lacks full E2E); no load tests for large collections (1000+ items)
3. **Dependency Management**: Hybrid Poetry/pnpm; no unified lockfile; external libs (PIL for thumbs, aiohttp) in both main/dev but versions not pinned tightly
4. **Error Handling Gaps**: Domain exceptions defined but not all adapters implement (e.g., file system errors not wrapped); frontend error boundaries partial (react-patterns.md notes incomplete)
5. **Performance**: No TTL caching impl (mentioned in tech.md but not in code); scanning large folders sync (should be async); React virtual scrolling stubbed in components/

### Workarounds and Gotchas

- **Environment Variables**: Must set NODE_ENV=production for staging (historical); Poetry env must use python3 explicitly (poetry env use python3)
- **Database Connections**: No DB, but file paths hardcoded to ComfyUI's (changing breaks scanning); use SecurePathValidator always to avoid traversal
- **Build Process**: Manual frontend build (pnpm run build) before ComfyUI restart; symlink via dev_server.sh for hot reload, but breaks on path changes
- **Theme Integration**: CSS vars from ComfyUI, but dark mode partial (docs/development/theme-integration-guide.md notes manual overrides needed)

## Integration Points and External Dependencies

### External Services

| Service     | Purpose                  | Integration Type | Key Files                          |
|-------------|--------------------------|------------------|------------------------------------|
| CivitAI     | Model search/download    | REST API (async) | src/adapters/driven/civitai_client.py |
| HuggingFace | Model discovery          | REST API         | src/adapters/driven/hf_client.py   |
| ComfyUI     | Folder paths, sidebar    | SDK/Extension    | src/__init__.py (NODE_CLASS_MAPPINGS) |
| ComfyUI API | Graph/output access      | Internal calls   | ui/src/services/comfyui_api.ts     |

### Internal Integration Points

- **Frontend Communication**: REST via /asset_manager/ (fetch in React hooks); expects JSON ApiResponse<T>
- **Background Jobs**: None; async scanning in services (e.g., OutputService.scan_output_directory)
- **ComfyUI Events**: Listen to app.graph changes for output gallery; registerSidebarTab for UI

## Development and Deployment

### Local Development Setup

1. Run `./setup.sh` (installs Poetry deps, pnpm ui/); manual: `poetry install --with dev; cd ui && pnpm install`
2. Dev server: `./dev_server.sh` (symlinks ui/dist to ComfyUI web; restarts server on backend changes)
3. Frontend hot reload: `cd ui && pnpm run dev` (Vite on localhost:5173; proxy to ComfyUI)
4. Required env: ComfyUI running; set PYTHONPATH to project root; .env for API keys (CivitAI token)
5. Known issues: Restart ComfyUI after backend changes; pnpm watch mode for auto-rebuild

### Build and Deployment Process

- **Build Command**: `cd ui && pnpm run build` (outputs to dist/asset_manager/ with manualChunks for vendor/utils)
- **Deployment**: Manual to ComfyUI custom_nodes/ (copy src/, dist/, pyproject.toml); publish via `comfy-cli publish` (requires [tool.comfy] in pyproject.toml)
- **Environments**: Dev (local ComfyUI), Staging (test ComfyUI instance), Prod (user ComfyUI installs via registry)
- **ComfyUI Registry**: Semantic versioning; includes dist/ for assets; update pyproject.toml PublisherId="rodpl"

## Testing Reality

### Current Test Coverage

- Unit Tests: 60% (pytest for domain/services; Vitest for React components/hooks)
- Integration Tests: Minimal (tests/integration/test_comfyui_integration.py; E2E via Playwright in ui/tests-e2e/)
- E2E Tests: Partial (e.g., local-assets.spec.ts; uses Chrome MCP; fixtures/ for setup)
- Manual Testing: Primary for ComfyUI integration (restart protocol in steering/development-workflow.md)

### Running Tests

```bash
poetry run pytest          # Python unit/integration
poetry run pytest --cov=src --cov-report=html  # Coverage
cd ui && pnpm run test     # JS unit (Vitest)
cd ui && pnpm run test:watch  # Watch mode
npx playwright test        # E2E (ui/tests-e2e/)
```

## Appendix - Useful Commands and Scripts

### Frequently Used Commands

```bash
./setup.sh                 # Initial setup (Poetry + pnpm)
./dev_server.sh            # Dev server with symlink/restart
cd ui && pnpm run dev      # Frontend hot reload
cd ui && pnpm run build    # Production build
poetry run pytest          # Run Python tests
cd ui && pnpm run lint:fix # Fix linting
poetry run pytest --cov=src  # Coverage report
comfy-cli publish          # Publish to registry
```

### Debugging and Troubleshooting

- **Logs**: Python: utils/logger.py (info/warn/error); React: console.log in hooks/services
- **Debug Mode**: Set DEBUG=app:* env for verbose; pytest -s for print output
- **Common Issues**: See tech.md troubleshooting (e.g., Poetry env use python3; remove unused TS imports); ComfyUI restart after backend; path validation with SecurePathValidator

This document reflects the actual codebase state as of 2025-09-07. For enhancements, reference .kiro/specs/ for planned features (e.g., simplified-output-gallery/requirements.md shows partial impl) and steering/ for guidelines. No major gaps remain; proceed with updates as needed.