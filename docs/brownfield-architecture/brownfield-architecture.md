# ComfyUI Asset Manager - Brownfield Architecture Document

## Introduction

This document captures the CURRENT STATE of the ComfyUI Asset Manager codebase, including technical debt, workarounds, and real-world patterns. It serves as a reference for AI agents working on enhancements. The project is a full-stack application that integrates with ComfyUI for asset management, providing local asset browsing, model management from external sources (CivitAI, HuggingFace), and output gallery functionality.

### Document Scope

Comprehensive documentation of the entire system, focused on areas relevant to ongoing development based on .kiro/steering, .kiro/specs, and docs/development files. This covers the hexagonal architecture implementation, Python backend services, React frontend components, and integration with ComfyUI.

### Change Log

| Date       | Version | Description                     | Author    |
|------------|---------|---------------------------------|-----------|
| 2025-09-07 | 1.0     | Initial brownfield analysis     | Architect |

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System

- **Main Entry (Backend)**: `src/main.py` - FastAPI application entry point, configures routes and dependency injection via `container.py`
- **Configuration**: `src/config.py` - Application settings, including paths for ComfyUI integration and asset directories
- **Core Business Logic**: 
  - Domain services: `src/domain/services/` (e.g., `model_service.py`, `output_service.py`, `folder_service.py`)
  - Adapters: `src/adapters/` (driven adapters like `filesystem_model_adapter.py`, driving `web_api_adapter.py`)
- **API Definitions**: `src/adapters/driving/web_api_adapter.py` - FastAPI routes for asset management endpoints
- **Database Models**: No traditional DB; uses filesystem-based repositories via adapters (e.g., `filesystem_model_adapter.py`)
- **Key Algorithms**: 
  - Model metadata handling: `src/adapters/driven/civitai_metadata_adapter.py` and `huggingface_metadata_adapter.py`
  - Output processing: `src/domain/services/output_service.py` with sorting/filtering in `test_output_service_sorting_filtering.py`
- **Frontend Entry**: `ui/src/main.tsx` - React app bootstrap, sets up routing and contexts
- **Frontend Core**: `ui/src/features/` (e.g., `local-assets/`, `model-browser/`, `outputs/`) - Feature-based organization with components and services

### Enhancement Impact Areas

Based on .kiro/specs (local-asset-management, simplified-output-gallery, simplified-model-browser, comfyui-theme-integration), key areas for ongoing work:
- Local asset enhancements: `src/domain/services/folder_service.py` and `ui/src/features/local-assets/`
- Model browser: `ui/src/features/model-browser/` with services for CivitAI/HuggingFace
- Output gallery: `ui/src/features/outputs/` and `src/domain/services/output_service.py`
- Theme integration: `ui/src/hooks/useComfyUITheme.ts` and `ui/src/styles/theme.css`

## High Level Architecture

### Technical Summary

The system follows a hexagonal (ports and adapters) architecture with a Python FastAPI backend and React TypeScript frontend. Backend handles asset metadata, model downloading, and output management via filesystem and external API adapters. Frontend provides tabs for local assets, model browsing, and outputs, with ComfyUI integration for theme and workflow loading.

### Actual Tech Stack (from pyproject.toml and ui/package.json)

| Category       | Technology              | Version/Notes                          |
|----------------|-------------------------|----------------------------------------|
| Backend Runtime| Python 3.10+           | Managed via Poetry (`poetry install`) |
| Backend Framework | FastAPI               | API server with dependency injection  |
| Backend Package Manager | Poetry              | `pyproject.toml`, `poetry.lock`       |
| Frontend Runtime | Node.js 18+          | Vite for dev/build                    |
| Frontend Framework | React 18 + TypeScript | Hooks-based components                |
| Frontend Styling | CSS Modules + Tailwind? | `ui/src/styles/theme.css`, custom theme integration |
| External Integrations | CivitAI/HuggingFace APIs | Adapters in `src/adapters/driven/`    |
| Testing (Backend) | pytest               | `tests/` with unit/integration        |
| Testing (Frontend) | Vitest + Playwright  | `ui/tests/` and `ui/tests-e2e/`       |
| ComfyUI Integration | Custom hooks/services | `ui/src/services/comfyuiIntegration.ts`, `ui/src/types/comfyui.ts` |
| Deployment     | Vercel (frontend)     | `.vercel/project.json`                |

### Repository Structure Reality Check

- Type: Monorepo with separate backend (`src/`, `tests/`) and frontend (`ui/`) directories
- Package Manager: Poetry (backend), npm (frontend)
- Notable: Hexagonal architecture strictly followed with domain/ports/adapters separation. Frontend uses feature-based organization. GitHub workflows for CI (`python-ci.yml`, `react-ci.yml`). Some inconsistencies in adapter naming (e.g., `combined_external_model_adapter.py`).

```
comfyui-asset-manager.crush-sonoma-dusk/
├── src/                          # Backend (Python/FastAPI)
│   ├── domain/                   # Core entities, services, ports
│   ├── adapters/                 # Driven (repositories) and driving (API) adapters
│   ├── utils/                    # Logger, etc.
│   ├── config.py, main.py, container.py
├── tests/                        # Backend tests (pytest)
│   ├── domain/, adapters/, integration/
├── ui/                           # Frontend (React/TS)
│   ├── src/
│   │   ├── features/             # Local-assets, model-browser, outputs
│   │   ├── hooks/, services/, contexts/
│   │   ├── components/           # Shared UI components (LoadingSpinner, Toast, etc.)
│   ├── tests/                    # Unit tests (Vitest)
│   ├── tests-e2e/                # E2E (Playwright)
│   ├── package.json, vite.config.ts
├── docs/                         # Documentation
│   ├── development/              # Developer guide, TODO, current status
│   ├── prd.md                    # Product requirements
├── .kiro/                        # Project specs and steering
│   ├── specs/                    # Feature specs (local-asset-management, etc.)
│   ├── steering/                 # Architecture, conventions, workflows
├── .bmad-core/                   # BMAD method files (agents, tasks, templates)
├── .github/workflows/            # CI/CD
└── pyproject.toml, poetry.lock   # Backend dependencies
```

### Key Modules and Their Purpose

- **Domain Layer**: `src/domain/` - Pure business logic. Entities (`model.py`, `output.py`, `folder.py`), services (`model_service.py` for model CRUD, `output_service.py` for gallery management with sorting/filtering), ports (interfaces for repositories and external management).
- **Adapters (Driven)**: `src/adapters/driven/` - Filesystem-based (`filesystem_model_adapter.py`, `filesystem_output_adapter.py`), external (`civitai_external_model_adapter.py`, `huggingface_external_model_adapter.py`), cache (`file_cache_adapter.py`), ComfyUI folder integration (`comfyui_folder_adapter.py`).
- **Adapters (Driving)**: `src/adapters/driving/web_api_adapter.py` - FastAPI endpoints for asset operations.
- **Frontend Features**:
  - Local Assets: `ui/src/features/local-assets/` - Folder navigation, model grid, metadata editing, search/filtering.
  - Model Browser: `ui/src/features/model-browser/` - CivitAI/HuggingFace integration, model cards, search filters.
  - Outputs: `ui/src/features/outputs/` - Gallery view, output cards, modal details, toolbar for sorting/filtering.
- **Shared Frontend**: `ui/src/services/api.ts` for backend calls, `ui/src/services/comfyuiIntegration.ts` for ComfyUI theme/workflow integration, `ui/src/contexts/AssetManagerContext.tsx`.
- **Testing**: Backend unit/integration in `tests/domain/` and `tests/adapters/`, frontend unit in `ui/src/__tests__/`, E2E in `ui/tests-e2e/` with Playwright.

## Data Models and APIs

### Data Models

Reference actual entity files for schemas:

- **Model**: See `src/domain/entities/model.py` - Represents local models with metadata (name, path, type, tags).
- **Output**: See `src/domain/entities/output.py` - ComfyUI generation outputs with preview images, metadata.
- **Folder**: See `src/domain/entities/folder.py` - Directory structure for asset organization.
- **External Model/Metadata**: Adapters handle remote data; see `src/domain/entities/external_model.py` and `external_metadata.py`.
- Frontend Types: `ui/src/types/comfyui.ts` for ComfyUI-specific types.

No relational DB; all persistent via filesystem with JSON metadata.

### API Specifications

- **OpenAPI Spec**: Auto-generated by FastAPI; access via `/docs` endpoint.
- **Key Endpoints** (from `web_api_adapter.py`):
  - Models: GET/POST `/models/` (list, add), GET `/models/{id}` (details).
  - Outputs: GET `/outputs/` (gallery with filters), DELETE `/outputs/{id}`.
  - Folders: GET/POST `/folders/` (navigation, create).
  - External Models: GET `/external-models/search` (CivitAI/HF search).
- **Postman Collection**: None found; recommend creating based on FastAPI docs.
- **Manual Endpoints**: Bulk metadata updates via POST `/models/bulk-metadata`.

## Technical Debt and Known Issues

### Critical Technical Debt

1. **Adapter Inconsistencies**: `combined_external_model_adapter.py` mixes CivitAI/HF logic; lacks unified error handling. Tests in `test_civitai_external_model_adapter.py` and `test_huggingface_external_model_adapter.py` cover separately but integration tests missing.
2. **Frontend Theme Integration**: `useComfyUITheme.ts` has incomplete transitions; see `ui/src/hooks/useComfyUITheme.transitions.test.ts`. Relies on custom CSS variables without full fallback support.
3. **Output Service Sorting/Filtering**: `test_output_service_sorting_filtering.py` shows good coverage, but real-world performance with large galleries untested (no load tests).
4. **E2E Testing**: `ui/tests-e2e/` has basic specs (`app.spec.ts`, `local-assets.spec.ts`), but coverage gaps in model browser and outputs (see `tests-e2e/README.md` TODOs).
5. **BMAD Integration**: .bmad-core files present but incomplete workflows; steering docs (.kiro/steering/) reference them but some tasks like `shard-doc` need md-tree tool installation.

### Workarounds and Gotchas

- **ComfyUI Paths**: `src/config.py` hardcodes ComfyUI root; changing requires manual update and restart. See `ui/src/services/comfyuiIntegration.ts` for frontend sync.
- **External API Rate Limits**: CivitAI/HF adapters lack caching; repeated searches may hit limits. Use `file_cache_adapter.py` but it's not auto-applied.
- **Frontend Dev Server**: `npm run dev` in `ui/` requires backend running; CORS issues if ports mismatch (default backend 8000, frontend 5173).
- **Poetry vs npm**: Backend `poetry run python src/main.py`; frontend separate `cd ui && npm run dev`. No unified start script.
- **Git Submodules**: `.gitmodules` present; ensure `git submodule update --init` after clone.

## Integration Points and External Dependencies

### External Services

| Service      | Purpose                  | Integration Type | Key Files                              |
|--------------|--------------------------|------------------|----------------------------------------|
| CivitAI     | Model search/metadata   | REST API        | `src/adapters/driven/civitai_external_model_adapter.py` |
| HuggingFace | Model search/metadata   | REST API        | `src/adapters/driven/huggingface_external_model_adapter.py` |
| ComfyUI    | Theme, workflow loading | Custom protocol | `ui/src/services/comfyuiIntegration.ts`, `src/adapters/driven/comfyui_folder_adapter.py` |

### Internal Integration Points

- **Backend-Frontend**: REST API via `ui/src/services/api.ts`; assumes backend at `/api`.
- **Asset Storage**: Filesystem via adapters; outputs in ComfyUI's `output/` dir.
- **Cache**: `file_cache_adapter.py` for metadata; not universally applied.
- **Notifications**: `ui/src/services/notificationService.ts` for UI feedback.

## Development and Deployment

### Local Development Setup

1. Backend: `poetry install && poetry run python src/main.py` (runs on http://localhost:8000).
2. Frontend: `cd ui && npm install && npm run dev` (runs on http://localhost:5173).
3. ComfyUI: Run separately; configure paths in `src/config.py`.
4. Tests: Backend `poetry run pytest tests/`; Frontend `cd ui && npm run test` and `npm run e2e`.
Known issues: E2E requires Playwright setup (`npx playwright install`); theme integration needs ComfyUI running for full testing.

### Build and Deployment Process

- **Backend Build**: `poetry build` (wheels/sdist); no formal deployment script.
- **Frontend Build**: `cd ui && npm run build` (outputs to `ui/dist/`); deploy via Vercel (`.vercel/project.json`).
- **Environments**: Use `.env` files; no multi-env config in `src/config.py`.
- **CI/CD**: GitHub Actions (`python-ci.yml` for backend lint/test, `react-ci.yml` for frontend, `react-build.yml` for builds).

## Testing Reality

### Current Test Coverage

- Backend: ~70%+ (pytest); unit in `tests/domain/`, integration in `tests/integration/` (e.g., `test_output_integration.py`, `test_comfyui_integration.py`).
- Frontend: Vitest unit tests (~80% coverage); Playwright E2E in `tests-e2e/` (basic app flows, local assets, outputs).
- Gaps: Full E2E for model browser; performance tests absent; cross-browser testing manual.

### Running Tests

```bash
# Backend
poetry run pytest tests/                  # All tests
poetry run pytest tests/integration/      # Integration only

# Frontend
cd ui && npm run test                     # Unit (Vitest)
cd ui && npm run e2e                      # E2E (Playwright)
cd ui && npx playwright test tests-e2e/outputs.spec.ts  # Single spec
```

## Appendix - Useful Commands and Scripts

### Frequently Used Commands

```bash
# Backend
poetry install                           # Install deps
poetry run ruff check src/ tests/        # Lint
poetry run pytest tests/                 # Test
poetry run python src/main.py            # Run server

# Frontend
cd ui && npm install                     # Install deps
cd ui && npm run dev                     # Dev server
cd ui && npm run build                   # Build
cd ui && npm run lint                    # Lint
cd ui && npm run test                    # Unit tests
cd ui && npm run e2e                     # E2E tests
```

### Debugging and Troubleshooting

- **Logs**: Backend uses `src/utils/logger.py`; check console. Frontend console in browser dev tools.
- **Debug Mode**: Set `LOG_LEVEL=DEBUG` env var for backend; frontend uses React DevTools.
- **Common Issues**: 
  - ComfyUI not running: Start ComfyUI first for integration tests.
  - External API failures: Mock in tests (e.g., `test_civitai_external_model_adapter.py`).
  - E2E flakes: Restart Playwright session (per rules).
  - See `docs/development/TODO.md` for open issues; `ui/tests-e2e/README.md` for E2E setup.
