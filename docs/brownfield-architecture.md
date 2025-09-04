# ComfyUI Asset Manager — Brownfield Architecture (Current State)

> Scope: full-system documentation for brownfield work (Python backend + React UI) with focus on Outputs-first rollout, ComfyUI visual alignment, and completion of Kiro specs. Audience: mixed (PO/Dev/QA).

## Introduction

This document captures the current, real-world state of the ComfyUI Asset Manager. It reflects existing patterns, constraints, and technical debt to help agents perform bug fixes, enhancements, and refactors safely.

- Primary purpose (from owner): Extension for ComfyUI enabling easier management of models, generated outputs, and browsing/downloading models from CivitAI/HuggingFace (inspired by Stability Matrix).
- Critical areas: Python backend architecture; React UI adapted to ComfyUI’s Vue/PrimeVue look and styling.
- Agent tasks: bug fixing, feature development, refactoring.
- Feature focus: feature-based switches for staged rollout (Outputs tab only first), unified ComfyUI look, and finishing .kiro/specs items.

### Change Log

| Date | Version | Description | Author |
| ---- | ------- | ----------- | ------ |
| 2025-09-04 | 1.0 | Initial comprehensive brownfield architecture | Architect |


## Quick Reference — Key Files and Entry Points

- Main app (standalone dev): `src/main.py` → aiohttp app, routes registered via `WebAPIAdapter`, health at `/health` when run standalone.
- ComfyUI integration: `src/main.py::register_with_comfyui(comfyui_app)` registers routes and health at `/asset_manager/health` on ComfyUI’s app.
- Dependency Injection container: `src/container.py` wires services and adapters.
- Configuration & env: `src/config.py` (env-driven settings: external APIs, cache, debug/log).
- API endpoints (REST): `src/adapters/driving/web_api_adapter.py` (prefix `/asset_manager`).
- Domain entities & ports: `src/domain/entities/*`, `src/domain/ports/*`.
- Driven adapters (infrastructure): `src/adapters/driven/*` (filesystem models/folders/outputs; CivitAI/HF; cache).
- React UI entry: `ui/src/main.tsx` registers a ComfyUI sidebar tab; root component `ui/src/App.tsx` manages tabs.
- UI API client: `ui/src/services/api.ts` (base `'/asset_manager'`).
- Dev symlink & watch: `dev_server.sh` (creates symlink into your ComfyUI `custom_nodes` and runs `pnpm run watch`).


## High-Level Architecture

- Style: Hexagonal (Ports & Adapters) with a small DI container.
- Driving adapter: Web API adapter (`web_api_adapter.py`) exposes REST endpoints that call domain services via driving ports.
- Driven adapters: Filesystem adapters for models/folders/outputs; metadata/model discovery adapters for CivitAI/HuggingFace; file cache.
- React UI: Mounted as a custom ComfyUI sidebar tab via `window.app.extensionManager.registerSidebarTab(...)`; integrates visually with ComfyUI theme variables and PrimeVue iconography.

### Actual Tech Stack

| Category | Technology | Notes |
| -------- | ---------- | ----- |
| Runtime (backend) | Python 3.12+ | AIOHTTP web server, runs standalone or inside ComfyUI |
| Web framework | `aiohttp` 3.12.x | REST endpoints, middleware for errors/logging |
| Imaging | `Pillow` 11.x | Thumbnailing, metadata extraction from PNGs |
| Frontend | React 18 + Vite 7 + TypeScript 5.8 | Mounted into ComfyUI sidebar; i18n with `i18next` |
| Testing (backend) | pytest + pytest-asyncio + coverage | Threshold configured (70%) in `pyproject.toml` |
| Testing (frontend) | Vitest + Testing Library + Playwright | E2E targets running ComfyUI at `PLAYWRIGHT_BASE_URL` |
| Package mgmt (py) | Poetry + Setuptools | Dual config present in `pyproject.toml` |
| Package mgmt (ui) | pnpm | Lockfile in `ui/pnpm-lock.yaml` |

### Repository Structure Reality Check

- Polyrepo with combined backend (`src/`) and frontend (`ui/`), installed as a ComfyUI extension.
- Backend adheres to hexagon boundaries; ports kept in `src/domain/ports` with clear driving vs driven separation.
- UI uses a context pattern (`AssetManagerContext`) and services layer; tabbed UX rendered in `App.tsx`.


## Source Tree and Module Organization

```
project-root/
├─ src/
│  ├─ main.py                      # App lifecycle, ComfyUI integration
│  ├─ container.py                 # DI wiring for services/adapters
│  ├─ config.py                    # Env-driven configuration
│  ├─ adapters/
│  │  ├─ driving/
│  │  │  └─ web_api_adapter.py     # REST endpoints (/asset_manager/...)
│  │  └─ driven/
│  │     ├─ filesystem_output_adapter.py
│  │     ├─ comfyui_output_adapter.py
│  │     ├─ filesystem_model_adapter.py
│  │     ├─ comfyui_folder_adapter.py
│  │     ├─ civitai_external_model_adapter.py
│  │     ├─ huggingface_external_model_adapter.py
│  │     └─ file_cache_adapter.py
│  └─ domain/
│     ├─ entities/                 # Model, Output, ExternalModel, ExternalMetadata, ...
│     └─ ports/                    # driving (services), driven (infrastructure)
└─ ui/
   ├─ src/
   │  ├─ main.tsx                  # ComfyUI sidebar registration
   │  ├─ App.tsx                   # Tabs: Local, Browse, Outputs, Theme
   │  ├─ contexts/AssetManagerContext.tsx
   │  ├─ services/api.ts           # Calls /asset_manager endpoints
   │  ├─ features/
   │  │  ├─ local-assets
   │  │  ├─ model-browser
   │  │  └─ outputs                # Outputs tab
   │  ├─ hooks/useComfyUITheme.ts  # Theme detection/alignment helpers
   │  └─ styles/theme.css          # Scoped ComfyUI-aligned styles
   └─ package.json, vite.config.ts, tests
```

### Key Modules and Their Purpose

- Domain entities: `Model`, `Output`, `ExternalModel`, `ExternalMetadata` — include validation and helper properties (e.g., `file_name`, `file_extension`).
- Services (via DI): model/folder/output services; external model service (optional) aggregates CivitAI/HF.
- Web API adapter: Provides endpoints for folders/models/search/tags/metadata, outputs (list/detail, refresh, workflow load/open/show), and external model queries and proxies.
- FilesystemOutputAdapter: Recursively scans outputs, generates thumbnails, extracts PNG metadata, formats output DTOs.
- ComfyUIOutputAdapter: Extends workflow extraction; can attempt load-back into ComfyUI via prompt queue or FS fallback.
- UI Tabs: Local Assets, Model Browser, Outputs, Theme Demo; each uses the API client, context state, and ComfyUI-aligned styles.


## Data Models and APIs

### Domain Model Highlights

- `Model`: name/path/size/timestamps/type/hash/folder_id (+ optional `thumbnail_path`, `user_metadata` with tags/rating/description).
- `Output`: file path/timestamps/dimensions/format/size; metadata extraction to expose `prompt`/`workflow` where available; computed `file_url` and `thumbnail_url` served by Web API.
- `ExternalModel`: normalized fields for models from CivitAI/HF; includes `ComfyUICompatibility` and optional `model_type` mapping.
- `ExternalMetadata`: joint container for CivitAI/HF metadata with `cached_at` and helpers (`get_primary_description`, `get_all_tags`).

### REST Endpoints (current)

Prefix: `/asset_manager`

- Folders/Models
  - `GET /folders` — list folders
  - `GET /folders/{folder_id}/models` — list models in a folder
  - `GET /models/{model_id}` — model details
  - `GET /search?query=...&folder_id=...` — search; validation errors map to 400
  - `PUT /models/{model_id}/metadata` — update user metadata for one model
  - `POST /models/bulk-metadata` — update many models
  - `GET /tags` — all user tags
  - `POST /models/{model_id}/track-usage` — stubbed usage tracking (returns success without persistence)

- Outputs
  - `GET /outputs[?format=&start_date=&end_date=]` — list outputs (with `file_url`/`thumbnail_url`)
  - `GET /outputs/{output_id}` — output details
  - `POST /outputs/refresh` — rescan output directory
  - `POST /outputs/{output_id}/load-workflow` — try load workflow into ComfyUI (best-effort)
  - `POST /outputs/{output_id}/open-system` — open image in system viewer
  - `POST /outputs/{output_id}/show-folder` — reveal in system file explorer
  - `GET /outputs/{output_id}/file` — serve image bytes
  - `GET /outputs/{output_id}/thumbnail` — serve thumbnail bytes

- External Models
  - `GET /external/models` — cross-platform search
  - `GET /external/models/{platform}` — platform-specific search
  - `GET /external/models/{platform}/{model_id}` — model details
  - `GET /external/popular` — platform popular
  - `GET /external/recent` — recent models
  - `GET /external/platforms` — supported platforms
  - `GET /external/platforms/{platform}/info` — platform info

- Proxies (CORS avoidance)
  - `GET /proxy/civitai/models` and `/proxy/civitai/models/{model_id}`
  - `GET /proxy/huggingface/models`, `/proxy/huggingface/models/{model_id}`, `/proxy/huggingface/file?url=...`


## Technical Debt and Known Issues

1. External usage tracking is stubbed: `/models/{id}/track-usage` returns success without domain persistence.
2. External metadata composition: DI returns the first available adapter (CivitAI/HF), not a true composite aggregator.
3. Workflow load-back to ComfyUI is best-effort; internal APIs may change and fallback saves a temp JSON for manual load.
4. `dev_server.sh` uses a hardcoded `custom_nodes` path — adjust for local environments.
5. Dual dependency config in `pyproject.toml` (PEP 621 `project` and Poetry’s `[tool.poetry]`) can be confusing.
6. Feature flags are not yet implemented; current UI shows all tabs unconditionally.
7. Network-dependent features (external model lookups, proxies) require internet; failure modes mapped to 5xx with `error_type` markers.


## Workarounds and Gotchas

- CORS: Use built-in proxy endpoints for CivitAI/HuggingFace to avoid browser CORS issues.
- Output scanning: Thumbnails directory is skipped; corrupted images are logged and ignored.
- UI in non-ComfyUI context: `ui/src/main.tsx` expects `window.app` (ComfyUI) — logs error if absent.
- Cross-platform open/reveal: Uses OS-specific commands (`open`, `xdg-open`, `explorer`) and may vary by environment.


## Integration Points and External Dependencies

- External services: CivitAI and HuggingFace via adapters and proxy routes.
- ComfyUI integration: registered sidebar tab (id `comfyui-asset-manager`, icon `pi pi-server`) and About badges.
- Theme integration: Detects `.comfy-theme-light` on `:root`; CSS variables and hooks map visuals to ComfyUI style.


## Development and Deployment

### Local Development Setup

- Backend (dev):
  - Poetry install: `poetry install --with dev`
  - Run standalone server: `python -m src.main` (serves `/health` and `/asset_manager/...` on `localhost:8080`).
- Frontend (dev):
  - `cd ui && pnpm install`
  - Hot dev: `pnpm run dev` or watch build: `pnpm run watch`
  - Symlink into ComfyUI: `./dev_server.sh` (edit target path inside script to your ComfyUI `custom_nodes`).

### Build and Ship

- Frontend production build: `cd ui && pnpm run build` → outputs to `dist/` consumed by ComfyUI.
- Install as extension: place repo under ComfyUI’s `custom_nodes/`.


## Testing Reality

- Backend (pytest): markers and coverage configured in `pyproject.toml`; adapters/services tested with in-memory images and PIL.
- Frontend (Vitest): unit tests on context/components/services; E2E via Playwright against a running ComfyUI on `PLAYWRIGHT_BASE_URL`.

Commands:

```bash
# Backend
poetry install --with dev
poetry run pytest -v --cov=src --cov-report=html

# Frontend
cd ui
pnpm test              # unit tests
PLAYWRIGHT_BASE_URL=http://localhost:8188 pnpm e2e  # E2E (ComfyUI must be running)
```


## Feature Focus and Rollout Strategy

### Goal

- Introduce “feature-based switches” to allow an Outputs-only initial release, then progressively enable Local Assets and Model Browser.
- Unify UI visuals with ComfyUI (Vue/PrimeVue) while remaining in React.
- Complete .kiro/specs: simplified-output-gallery, theme integration, local-asset management, simplified-model-browser.

### Proposed Feature Flagging (design)

- Backend config (env):
  - `FEATURE_OUTPUTS=true|false`
  - `FEATURE_LOCAL_ASSETS=true|false`
  - `FEATURE_MODEL_BROWSER=true|false`
  - Expose a simple `GET /asset_manager/config` returning `{ features: {...}, cache_enabled, external_api: {...} }`.
- Frontend gating:
  - Add a feature flag service reading `/asset_manager/config` once at init; store in context.
  - In `App.tsx`, compute `TABS` dynamically based on flags; default to Outputs-only if flags unavailable.

Release plan:

1) v0.1 Outputs-only
- Enable: Outputs tab
- Disable: Local Assets, Model Browser (hidden)
- Verify: Output scanning, metadata extraction, thumbnails, load-workflow flows; theme alignment and accessibility pass.

2) v0.2 Local Assets
- Enable: Local Assets tab; stabilize model metadata editing, tags, bulk edit; ensure APIs covered with tests.

3) v0.3 Model Browser
- Enable: Model Browser; ensure CORS avoided via proxy endpoints; surface compatibility hints; polish infinite-scroll and filters.

### Visual Alignment with ComfyUI

- Use PrimeVue icon names where appropriate and ComfyUI CSS variables via `theme.css`.
- Respect `.comfy-theme-light`/dark classes on `:root`; hook `useComfyUITheme` already supports detection and transition smoothing.
- Validate with provided HTML demos: `ui/test-theme-variables.html` and `ui/validate-theme-system.html`.


## Appendix — Useful Commands and Scripts

- Dev symlink and watch: `./dev_server.sh` (edit path to your ComfyUI `custom_nodes`).
- Build UI: `cd ui && pnpm build`; clean/reinstall: delete `ui/node_modules` then `pnpm install`.
- Show Playwright report: `pnpm --filter ./ui exec playwright show-report`.


## Risks, Constraints, and Next Steps

- ComfyUI internal APIs for workflow queuing are not stable contracts; handle gracefully with FS fallback.
- External API limits and network availability can impact search/browse; maintain clear error types and retries.
- Implement feature flags end-to-end (env → backend → `/config` → UI gating) before the Outputs-only release cut.
- Ensure Kiro specs are reflected in acceptance tests (unit + E2E) before enabling each tab in production.

