---
inclusion: always
---

# Project Structure

## Root Level

- `__init__.py` - Main ComfyUI extension entry point, registers web routes and sidebar tab
- `pyproject.toml` - Python project configuration and ComfyUI registry metadata
- `setup.sh` - Automated setup script for both Python and Node.js dependencies
- `dev_server.sh` - Development script that creates symlink and runs watch mode

## Frontend (`ui/`)

React-based frontend with TypeScript, organized by features:

```
ui/
├── src/
│   ├── main.tsx              # Extension entry point, registers with ComfyUI
│   ├── App.tsx               # Main app component with tab navigation
│   ├── features/             # Feature-based organization
│   │   ├── index.ts          # Clean feature exports
│   │   ├── local-assets/     # Local asset management feature
│   │   ├── model-browser/    # Model browsing and download feature
│   │   └── outputs/          # Output gallery feature
│   └── utils/
│       └── i18n.ts           # Internationalization configuration
├── public/locales/           # Translation files (en, zh)
├── package.json              # Node.js dependencies and scripts
└── vite.config.ts            # Vite build configuration
```

## Build Output (`dist/`)

- `asset_manager/` - Compiled frontend assets served by ComfyUI
- `locales/` - Localization files for i18n support

## Development Structure

- `tests/` - Test files organized by domain (adapters, domain, integration)
- `models/` - Empty directory for model-related code
- `docs/development/` - Development documentation and TODO items

## Code Organization Patterns

### Feature-Based Structure

Each feature in `ui/src/features/` follows this pattern:

- `FeatureTab.tsx` - Main component
- `FeatureTab.css` - Feature-specific styles
- `index.ts` - Clean exports

### Internationalization

- Translation keys organized hierarchically (app.title, tabs.localAssets, etc.)
- Fallback translations defined in i18n.ts for development
- JSON files in `public/locales/{lang}/main.json`

### ComfyUI Integration

- Extension registers via `window.app.extensionManager.registerSidebarTab()`
- Static assets served through aiohttp routes
- External ComfyUI scripts (`/scripts/app.js`, `/scripts/api.js`) handled by Vite plugin
- Integration with ComfyUI's internal APIs:
  - Graph/workflow manipulation via `window.app.graph`
  - Settings integration via `window.app.ui.settings`
  - Event system via `window.app.canvas`
  - API client via `window.api`

### Development Workflow

- Symlink creation for live development with ComfyUI
- Watch mode for automatic rebuilds
- Separate development and production Vite configurations
- ComfyUI Registry integration for easy distribution
- Feature flags for capability negotiation with ComfyUI backend

## Backend Structure (`src/`)

```
src/
├── domain/
│   ├── entities/             # Core business objects
│   │   ├── __init__.py
│   │   ├── base.py          # Base entity class
│   │   ├── model.py         # Model entity
│   │   ├── folder.py        # Folder entity
│   │   ├── output.py        # Output entity
│   │   └── external_model.py # External model entity
│   ├── services/            # Business logic services
│   │   ├── __init__.py
│   │   ├── model_service.py
│   │   ├── folder_service.py
│   │   ├── output_service.py
│   │   └── metadata_service.py
│   └── ports/               # Interface definitions
│       ├── driving/         # Primary ports (API)
│       │   ├── __init__.py
│       │   ├── model_management_port.py
│       │   ├── folder_management_port.py
│       │   └── output_management_port.py
│       └── driven/          # Secondary ports (SPI)
│           ├── __init__.py
│           ├── model_repository_port.py
│           ├── folder_repository_port.py
│           ├── output_repository_port.py
│           ├── external_metadata_port.py
│           └── cache_port.py
├── adapters/
│   ├── driving/             # Primary adapters
│   │   ├── __init__.py
│   │   └── web_api_adapter.py
│   └── driven/              # Secondary adapters
│       ├── __init__.py
│       ├── filesystem_model_adapter.py
│       ├── comfyui_folder_adapter.py
│       ├── filesystem_output_adapter.py
│       ├── civitai_metadata_adapter.py
│       ├── huggingface_metadata_adapter.py
│       └── file_cache_adapter.py
├── utils/
│   ├── __init__.py
│   └── logger.py
├── config.py                # Configuration management
├── container.py             # Dependency injection
└── main.py                  # Application entry point
```

## Test Structure (`tests/`)

```
tests/
├── domain/
│   ├── entities/
│   │   ├── __init__.py
│   │   ├── test_model.py
│   │   ├── test_folder.py
│   │   ├── test_output.py
│   │   └── test_external_model.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── test_model_service.py
│   │   ├── test_folder_service.py
│   │   ├── test_output_service.py
│   │   └── test_metadata_service.py
│   └── ports/
│       ├── __init__.py
│       ├── test_driving_ports.py
│       └── test_driven_ports.py
├── adapters/
│   ├── driving/
│   │   ├── __init__.py
│   │   └── test_web_api_adapter.py
│   └── driven/
│       ├── __init__.py
│       ├── test_filesystem_model_adapter.py
│       ├── test_comfyui_folder_adapter.py
│       ├── test_filesystem_output_adapter.py
│       ├── test_civitai_metadata_adapter.py
│       ├── test_huggingface_metadata_adapter.py
│       └── test_file_cache_adapter.py
├── integration/
│   ├── __init__.py
│   ├── test_application_setup.py
│   ├── test_comfyui_integration.py
│   ├── test_cache_integration.py
│   └── test_output_integration.py
└── fixtures/
    ├── __init__.py
    ├── sample_models.py
    ├── sample_outputs.py
    └── test_data.py
```

## Configuration Files

### Root Configuration

- `pyproject.toml` - Python dependencies, build config, ComfyUI registry metadata
- `setup.sh` - Automated environment setup
- `dev_server.sh` - Development server with symlink creation
- `.gitignore` - Version control exclusions
- `README.md` - Project documentation

### Frontend Configuration

- `ui/package.json` - Node.js dependencies and scripts
- `ui/vite.config.ts` - Build tool configuration
- `ui/tsconfig.json` - TypeScript compiler options
- `ui/eslint.config.js` - Code quality rules
- `ui/playwright.config.ts` - E2E testing configuration

### Development Configuration

- `.kiro/` - Kiro IDE configuration and specs
- `docs/development/` - Development documentation
- `htmlcov/` - Test coverage reports
- `.pytest_cache/` - Test framework cache

This structure ensures clear separation of concerns, maintainability, and scalability while supporting both development and production workflows.
