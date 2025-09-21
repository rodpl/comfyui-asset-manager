# Quick Reference - Key Files and Entry Points

## Critical Files for Understanding the System
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
- **AI knowledge tools**: MCP tools `ComfyUI-Docs` (backend) and `ComfyUI-Frontend-Docs` (frontend) – provide on-demand access to upstream source trees and documentation for the vanilla ComfyUI project. Developers can call the exposed functions (e.g. `ComfyUI-Docs__fetch_ComfyUI_documentation`, `ComfyUI-Docs__search_ComfyUI_code`, `ComfyUI-Frontend-Docs__fetch_ComfyUI_frontend_docs`) to pull design details, API signatures, or code snippets without leaving the agent environment.

## If PRD Provided - Enhancement Impact Areas
<!-- No brownfield PRD provided yet; update once the Product Manager delivers it. Current release focus: complete Outputs tab, theme alignment, temporarily hide unfinished tabs. -->
