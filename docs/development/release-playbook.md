# Release Playbook (Staged Rollout via ComfyUI Settings)

This playbook describes how to stage feature releases by toggling user-visible features in ComfyUI’s Settings, without rebuilding the extension.

## Versions and Flags

- v0.1 (Outputs‑only)
  - AssetManager.Features.Outputs = true
  - AssetManager.Features.LocalAssets = false
  - AssetManager.Features.ModelBrowser = false
- v0.2 (Enable Local Assets)
  - Outputs = true, LocalAssets = true, ModelBrowser = false
- v0.3 (Enable Model Browser)
  - Outputs = true, LocalAssets = true, ModelBrowser = true

## Operator Steps

1) Open ComfyUI Settings → Extensions → Asset Manager → Features.
2) Toggle flags according to the target release.
3) Press Save/Apply as required; re-open the Asset Manager tab to verify.

## QA Checklist per Release

- Outputs‑only (v0.1)
  - Outputs tab visible; Local/Browser tabs hidden
  - Sorting, view mode, and refresh work; thumbnails and metadata present
  - Load Workflow action behaves as expected (success or graceful failure)
- Local Assets (v0.2)
  - Local Assets tab visible; can browse folders, open detail modal, edit metadata/tags
  - Search/filter functional; tags autocomplete visible
- Model Browser (v0.3)
  - Model Browser tab visible; platform sub‑sections visible per External.* settings
  - Proxy calls succeed; errors surfaced gracefully

## Rollback

- If issues arise, disable the corresponding flag(s) in Settings. The UI will immediately hide the affected tab(s) while keeping the extension installed.

## Notes

- Backend may still restrict external API usage (env). The UI reflects settings, but backend decisions are authoritative.
- Consider versioned defaults to promote features by default in future frontend versions.

