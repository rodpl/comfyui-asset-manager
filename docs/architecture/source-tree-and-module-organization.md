# Source Tree and Module Organization

## Project Structure (Actual)
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

## Key Modules and Their Purpose
- **`src/domain/services/output_service.py`** – caches and enriches output metadata; supports refresh, filtering, workflow loading.
- **`src/adapters/driven/comfyui_output_adapter.py`** – auto-discovers ComfyUI paths, extracts workflow JSON, supports system interactions.
- **`src/adapters/driving/web_api_adapter.py`** – exposes folder/model/output/external model endpoints and HTTP proxies.
- **`src/domain/services/model_service.py`** – wraps filesystem repositories, merges external tags/descriptions, handles metadata updates.
- **`ui/src/features/outputs/OutputsTab.tsx`** – renders gallery, context menu, modal, and handles API integration for Outputs feature.
- **`ui/src/services/api.ts`** – centralised REST client with request deduplication, retries, and health monitoring.
- **`ui/src/hooks/useComfyUIIntegration.ts`** – bridges React components with ComfyUI globals for drag/drop and usage tracking.
