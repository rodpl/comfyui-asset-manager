# Appendix - Useful Commands and Scripts

## MCP Tooling Reference
- `ComfyUI-Docs__fetch_ComfyUI_documentation` – loads the canonical backend documentation snapshot from the `comfyanonymous/ComfyUI` repository.
- `ComfyUI-Docs__search_ComfyUI_code` / `ComfyUI-Docs__search_ComfyUI_documentation` – scoped search across backend source files or docs when you know the symbol or concept to locate.
- `ComfyUI-Frontend-Docs__fetch_ComfyUI_frontend_docs` – pulls the frontend documentation bundle from `Comfy-Org/ComfyUI_frontend` for UI-specific behaviour and conventions.
- `ComfyUI-Frontend-Docs__search_ComfyUI_frontend_code` / `ComfyUI-Frontend-Docs__search_ComfyUI_frontend_docs` – targeted lookup of components, hooks, or styling patterns in the upstream ComfyUI UI.
- `ComfyUI-Docs__fetch_generic_url_content` and `ComfyUI-Frontend-Docs__fetch_generic_url_content` – follow-up fetchers for absolute URLs referenced in the base documentation responses.

## Frequently Used Commands
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

## Debugging and Troubleshooting
- **Logs**: Backend logging configured via `src/utils/logger.py`; respect `LOG_LEVEL`/`DEBUG` env vars.
- **Health Check**: `GET /asset_manager/health` verifies registered services and cache status.
- **Frontend Missing Translations**: i18next fallback logs missing keys to console and injects debug strings.
- **Symlink Issues**: Rerun `dev_server.sh` to refresh `custom_nodes` link if ComfyUI cannot locate assets.
- **CORS / External API Failures**: Check proxy routes in `web_api_adapter.py` and confirm network access; rate limit errors bubble up as structured JSON.
