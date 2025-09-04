# ComfyUI Integration Guide (Project-Specific)

This guide explains exactly how this extension integrates with ComfyUI, mapping ComfyUI’s extension APIs and frontend feature systems to the code in this repository.

## Extension Footprint

- Sidebar Tab Registration: `ui/src/main.tsx` uses `window.app.extensionManager.registerSidebarTab({ id: 'comfyui-asset-manager', type: 'custom', render })` to mount React inside ComfyUI’s Vue/PrimeVue shell.
- About Panel: `window.app.registerExtension({ name: 'rodpl.AssetManager', aboutPageBadges: [...] })` adds badges to ComfyUI’s about page.
- Served Assets: Frontend build output is included via `pyproject.toml` → `[tool.comfy].includes = ["dist/"]` so ComfyUI can serve static assets for this extension.

## Backend Attachment

- Runtime: The backend is an aiohttp app (see `src/main.py`). For ComfyUI embedding, `register_with_comfyui(comfyui_app: web.Application)` is called to register API routes on ComfyUI’s server.
- API Adapter: `src/adapters/driving/web_api_adapter.py` registers endpoints under `/asset_manager/...` for folders, models, outputs, and external models.

## Frontend Mounting

- Entry: `ui/src/main.tsx` waits for `window.app`, injects global stylesheet (`/asset_manager/main.css`), and mounts React into a created container `#comfyui-asset-manager-root` inside the sidebar panel.
- Tabs (local/browse/outputs/theme): Defined in `ui/src/App.tsx`; each tab renders a feature area from `ui/src/features/*`.

## Settings Registration (Feature Flags & Preferences)

- Preferred approach: register extension settings with ComfyUI’s Settings dialog via `window.app.registerExtension({ settings: [...] })`.
- Define SettingParams with namespaced IDs (e.g., `AssetManager.Features.Outputs`), default values, and categories. ComfyUI persists these per user.
- At runtime, read/write using `window.app.extensionManager.setting.get(id)` / `.set(id, value)` to control React UI behavior (e.g., tab gating).

Example (conceptual):
```
window.app.registerExtension?.({
  name: 'rodpl.AssetManager',
  settings: [
    { id: 'AssetManager.Features.Outputs', name: 'Enable Outputs Tab', type: 'boolean', defaultValue: true, category: ['Extensions','Asset Manager','Features'] },
    { id: 'AssetManager.Features.LocalAssets', name: 'Enable Local Assets Tab', type: 'boolean', defaultValue: false, category: ['Extensions','Asset Manager','Features'] },
    { id: 'AssetManager.Features.ModelBrowser', name: 'Enable Model Browser Tab', type: 'boolean', defaultValue: false, category: ['Extensions','Asset Manager','Features'] }
  ],
  aboutPageBadges: [...]
})
```

React usage:
```
const outputsEnabled = window.app?.extensionManager?.setting.get('AssetManager.Features.Outputs') ?? true
// Build TABS based on these values
```

## Theme & Styling

- Theme Detection: `ui/src/hooks/useComfyUITheme.ts` observes ComfyUI theme classes on `:root` and exposes `isLight`, `isDark`, transitions, and helpers.
- Scoped Styles: `ui/src/styles/theme.css` applies ComfyUI variables to the extension root (`#comfyui-asset-manager-root`) to avoid style leakage.
- Visual Parity: Components use PrimeVue icon classes (e.g., `pi pi-images`) and ComfyUI’s spacing/typography variables to blend with the host UI.

## Graph & Workflow Interop

- Output Workflows: The backend extracts ComfyUI workflow metadata from PNGs (see `comfyui_output_adapter.py`).
- Load Back Into ComfyUI: `POST /asset_manager/outputs/{id}/load-workflow` triggers best‑effort load into ComfyUI. The UI’s `OutputModal` also attempts to apply graph data directly via `window.app` fallbacks where available.

## Proxies & CORS

- External Model APIs: To avoid browser CORS, the backend proxies select CivitAI/HF endpoints (`/asset_manager/proxy/...`). The UI calls these via `ui/src/services/api.ts`.

## Feature Flags (Project Plan)

- Purpose: Stage features (Outputs-only → Local Assets → Model Browser) while maintaining a single build.
- Proposed Minimal Contract:
  - Backend: `GET /asset_manager/config` returns `{ features: { outputs, local, browser }, external_api: {...}, cache_enabled }` based on env vars.
  - Frontend: At init, fetch config and conditionally render tabs in `App.tsx`.
- Future Alignment: ComfyUI Frontend supports richer capability negotiation over WebSocket (see FEATURE_FLAGS.md). This extension can later adopt that for deeper integration.

## Settings Integration (Future)

- ComfyUI’s settings store can surface extension options (e.g., cache size, default view). Once needed, wire via `window.app.ui.settings.addSetting(...)` from the frontend and a REST endpoint for persistence.

## Development Notes

- Symlink into ComfyUI: `./dev_server.sh` creates a symlink under your ComfyUI `custom_nodes` and runs `pnpm run watch` in `ui/`.
- Standalone Backend: `python -m src.main` exposes `/asset_manager` routes and `/health` on `http://localhost:8080` for local API development.
