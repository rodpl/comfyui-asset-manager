# Feature Flags Design (Staged Rollout)

Purpose: enable staged feature rollout (Outputs → Local Assets → Model Browser) without shipping separate builds, and prepare for future adoption of ComfyUI’s capability flags over WebSocket.

## Goals
- Outputs-only initial release without code removal.
- Toggle Local Assets and Model Browser independently.
- Provide a minimal, stable contract the React UI can consume on startup.

## Configuration Model

Environment variables (backend):
- `FEATURE_OUTPUTS` (default: true)
- `FEATURE_LOCAL_ASSETS` (default: false)
- `FEATURE_MODEL_BROWSER` (default: false)

Leverage existing envs for external APIs:
- `CIVITAI_ENABLED` (default: true)
- `HUGGINGFACE_ENABLED` (default: true)

Cache configuration (already present):
- `CACHE_ENABLED`, `CACHE_DIR`, TTLs, etc. (see `src/config.py`).

## ComfyUI Settings (Canonical)

Register Asset Manager settings in ComfyUI’s Settings panel using the frontend extension API.

Settings IDs (namespaced):
- `AssetManager.Features.Outputs` (boolean, default: true)
- `AssetManager.Features.LocalAssets` (boolean, default: false)
- `AssetManager.Features.ModelBrowser` (boolean, default: false)
- [Future] Additional attributes (e.g., cache size, default sort) under `AssetManager.*`

Recommended registration (frontend):
- Extend the existing `window.app.registerExtension({...})` call to include a `settings: SettingParams[]` array. ComfyUI will surface these in the Settings UI and persist values via its `/settings` backend.
- Access at runtime with `window.app.extensionManager.setting.get(id)` / `.set(id, value)` for gating.

Example SettingParams (simplified):
```
{
  id: 'AssetManager.Features.Outputs',
  name: 'Enable Outputs Tab',
  type: 'boolean',
  defaultValue: true,
  category: ['Extensions', 'Asset Manager', 'Features']
}
```

UI gating flow:
1) On render, read settings via `extensionManager.setting.get(...)`.
2) Compute effective `TABS` in `App.tsx` based on the three flags.
3) Optionally subscribe to Settings changes (if required) and re-render.

Notes from ComfyUI-Frontend-Docs:
- Settings are stored in a Pinia store and persisted per user through the ComfyUI backend (`/settings`).
- Extensions can register settings via `app.registerExtension({ settings: [...] })` (preferred) or older `app.ui.settings.addSetting(...)` APIs.

## Backend Contract (REST) — Optional Fallback

Introduce optional read-only config endpoint if needed for backend-side gating:
- `GET /asset_manager/config`
- Response shape:
```json
{
  "success": true,
  "data": {
    "features": {
      "outputs": true,
      "local": false,
      "browser": false
    },
    "external_api": {
      "civitai": true,
      "huggingface": true
    },
    "cache_enabled": true
  }
}
```
Notes:
- Prefer ComfyUI Settings for UI gating. Use REST config only for backend concerns (e.g., disabling external API calls regardless of UI).
- Derive values from env and `ApplicationConfig` (see `src/config.py`).
- Keep endpoint side‑effect free; add simple in‑memory cache with very short TTL if ever needed.

Pseudo‑wiring (no code yet):
- WebAPIAdapter: add `get_config(request)` → returns structure above based on `self._container.config` + env flags.
- Route: `GET /asset_manager/config` → `get_config`.

## Frontend Consumption

Initialization flow (UI):
1) Primary: Read values from ComfyUI Settings via `extensionManager.setting.get()`.
2) Build `TABS` dynamically:
   - Always show Outputs if `AssetManager.Features.Outputs` is true.
   - Show Local Assets if `AssetManager.Features.LocalAssets` is true.
   - Show Model Browser if `AssetManager.Features.ModelBrowser` is true.
3) Optional: If Settings unavailable (very old frontend), fallback to REST `/asset_manager/config` or to safe defaults (Outputs-only).

## Future: ComfyUI Capability Flags

ComfyUI Frontend provides capability negotiation (FEATURE_FLAGS.md) over WebSocket. Migration plan:
- Phase 1 (now): REST config → trivial, robust.
- Phase 2: mirror REST in a client/server flags handshake; REST remains as fallback.

## Operational Considerations
- Security: endpoint returns only non‑sensitive booleans; safe to expose.
- Performance: negligible; one GET on startup.
- DX: flags are centralized and easy to test via env overrides.

## Risks & Mitigations
- Divergence between REST config and future WS flags → mitigate by keeping REST as ground truth early on.
- UI not respecting flags → unit tests to assert tab visibility given config fixtures.
