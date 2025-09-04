# ComfyUI Settings Specification (Asset Manager)

This document defines the Asset Manager settings registered in ComfyUI’s Settings panel. Settings act as the canonical source for user‑level feature flags and preferences. They are persisted by ComfyUI and accessible at runtime via `window.app.extensionManager.setting.get/set`.

## Goals
- Control feature availability per user (staged rollout without separate builds).
- Keep toggles close to the UI (fast feedback, no server redeploy).
- Align with ComfyUI’s settings architecture (Pinia store, `/settings` persistence).

## Settings Catalog

All IDs are namespaced under `AssetManager.*` and grouped for UI under the category path `Extensions > Asset Manager > ...`.

1) AssetManager.Features.Outputs
- Type: boolean
- Default: true
- Category: [Extensions, Asset Manager, Features]
- Description: Enables the Outputs tab.

2) AssetManager.Features.LocalAssets
- Type: boolean
- Default: false
- Category: [Extensions, Asset Manager, Features]
- Description: Enables the Local Assets tab.

3) AssetManager.Features.ModelBrowser
- Type: boolean
- Default: false
- Category: [Extensions, Asset Manager, Features]
- Description: Enables the Model Browser tab.

4) AssetManager.Outputs.DefaultSort
- Type: combo
- Options: ["date-desc", "date-asc", "name-asc", "name-desc", "size-desc", "size-asc"]
- Default: "date-desc"
- Category: [Extensions, Asset Manager, Outputs]
- Description: Default sort used on Outputs tab when loading items.

5) AssetManager.Outputs.ViewMode
- Type: combo
- Options: ["grid", "list"]
- Default: "grid"
- Category: [Extensions, Asset Manager, Outputs]
- Description: Default view mode for Outputs.

6) AssetManager.External.CivitAIEnabled
- Type: boolean
- Default: true
- Category: [Extensions, Asset Manager, External]
- Description: Show CivitAI sections in Model Browser (UI hint). Note: backend availability may still be enforced separately.

7) AssetManager.External.HuggingFaceEnabled
- Type: boolean
- Default: true
- Category: [Extensions, Asset Manager, External]
- Description: Show HuggingFace sections in Model Browser (UI hint). Backend may enforce true/false independently.

## Registration Pattern (Frontend)

Register settings in the same call where the extension is registered:

- app.registerExtension({
  name: 'rodpl.AssetManager',
  settings: [
    { id: 'AssetManager.Features.Outputs', name: 'Enable Outputs Tab', type: 'boolean', defaultValue: true, category: ['Extensions','Asset Manager','Features'] },
    { id: 'AssetManager.Features.LocalAssets', name: 'Enable Local Assets Tab', type: 'boolean', defaultValue: false, category: ['Extensions','Asset Manager','Features'] },
    { id: 'AssetManager.Features.ModelBrowser', name: 'Enable Model Browser Tab', type: 'boolean', defaultValue: false, category: ['Extensions','Asset Manager','Features'] },
    { id: 'AssetManager.Outputs.DefaultSort', name: 'Outputs: Default Sort', type: 'combo', options: ['date-desc','date-asc','name-asc','name-desc','size-desc','size-asc'], defaultValue: 'date-desc', category: ['Extensions','Asset Manager','Outputs'] },
    { id: 'AssetManager.Outputs.ViewMode', name: 'Outputs: View Mode', type: 'combo', options: ['grid','list'], defaultValue: 'grid', category: ['Extensions','Asset Manager','Outputs'] },
    { id: 'AssetManager.External.CivitAIEnabled', name: 'Model Browser: Show CivitAI', type: 'boolean', defaultValue: true, category: ['Extensions','Asset Manager','External'] },
    { id: 'AssetManager.External.HuggingFaceEnabled', name: 'Model Browser: Show HuggingFace', type: 'boolean', defaultValue: true, category: ['Extensions','Asset Manager','External'] }
  ],
  aboutPageBadges: [...]
})

Notes
- This spec describes the shape; the actual code will use the ComfyUI Frontend’s SettingParams.
- For i18n, provide translation keys instead of raw `name` strings in production.

## Runtime Usage (React)

- Read: `window.app.extensionManager.setting.get('AssetManager.Features.Outputs')`
- Write: `window.app.extensionManager.setting.set('AssetManager.Features.Outputs', true)`
- Tabs gating (App.tsx): construct the tab list based on the three feature flags.
- Outputs defaults: read `DefaultSort` and `ViewMode` on mount; allow per‑session overrides within the tab.

## Precedence and Backend Interplay

- UI settings are user preferences. Backend configuration (e.g., external APIs disabled by env) is authoritative and may override functionality even if UI says enabled.
- Recommended: when backend says external API is disabled, grey out corresponding UI areas regardless of UI setting.

## Versioned Defaults (Optional)

- ComfyUI’s settings allow `defaultsByInstallVersion`.
- Example: promote `AssetManager.Features.LocalAssets` to true by default from frontend version X.Y.Z.

## Testing

- Unit tests (UI): assert tabs visibility for each flag combination.
- Integration: ensure settings are readable/writable and survive reload.
- E2E: simulate toggling flags in Settings and verify UI updates.

