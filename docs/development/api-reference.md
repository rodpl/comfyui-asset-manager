# REST API Reference (Asset Manager)

Base prefix: `/asset_manager`

Note: All responses include a `success` boolean and use `error_type` keys for typed failures. Dates are ISO strings.

## Folders & Models

- GET `/folders`
  - Returns list of available ComfyUI model folders.
- GET `/folders/{folder_id}/models`
  - Returns models in a folder. Response includes model `id`, `name`, `file_path`, `file_size`, timestamps, `model_type`, `hash`, `folder_id`, `thumbnail_path`, `user_metadata`.
- GET `/models/{model_id}`
  - Returns model details.
- GET `/search?query=...&folder_id=...`
  - Search by query (and optional folder). 400 on validation errors.
- PUT `/models/{model_id}/metadata`
  - Body: JSON user metadata (e.g., `{ "tags": [...], "rating": 4, "description": "..." }`). Returns updated model.
- POST `/models/bulk-metadata`
  - Body: `{ "model_ids": [..], "metadata": { ... } }`. Updates many models.
- GET `/tags`
  - Returns unique user tags.
- POST `/models/{model_id}/track-usage`
  - Tracks usage (stubbed: returns success; no persistence yet).

## Outputs

- GET `/outputs`
  - Query params: `format=png|jpg|jpeg|webp`, `start_date`, `end_date`, `sort_by=date|name|size`, `ascending=true|false`.
  - Returns outputs with `file_url` and `thumbnail_url` (served by endpoints below).
- GET `/outputs/{output_id}`
  - Returns output details, including extracted workflow metadata when available.
- POST `/outputs/refresh`
  - Forces rescan of output directory. Returns same shape as GET `/outputs`.
- POST `/outputs/{output_id}/load-workflow`
  - Best‑effort load of workflow back into ComfyUI (falls back to FS drop if direct load fails).
- POST `/outputs/{output_id}/open-system`
  - Opens file in system’s image viewer.
- POST `/outputs/{output_id}/show-folder`
  - Reveals file in system’s file explorer.
- GET `/outputs/{output_id}/file`, GET `/outputs/{output_id}/thumbnail`
  - Serves binary image/thumbnail data.

## External Models (CivitAI / HuggingFace)

- GET `/external/models`
  - Cross‑platform search. Query: `query`, `limit`, `offset`, optional filters (`model_type`, `sort`, `comfyui_compatible=true|false`).
- GET `/external/models/{platform}`
  - Platform-specific search. `platform` resolved to enum; returns models and counts.
- GET `/external/models/{platform}/{model_id}`
  - Returns platform model details.
- GET `/external/popular`, GET `/external/recent`
  - Popular/recent models (optional `platform` and `model_type`).
- GET `/external/platforms`, GET `/external/platforms/{platform}/info`
  - Lists supported platforms and per‑platform info.

## Proxies (CORS)

- GET `/proxy/civitai/models`, `/proxy/civitai/models/{model_id}`
- GET `/proxy/huggingface/models`, `/proxy/huggingface/models/{model_id}`, `/proxy/huggingface/file?url=...`

## Error Shapes

- 400 validation: `{ success: false, error: "...", error_type: "validation_error", field?: "..." }`
- 404 not found: `{ success: false, error: "...", error_type: "not_found_error", entity_type, identifier }`
- 422 domain: `{ success: false, error: "...", error_type: "domain_error" }`
- 500 internal: `{ success: false, error: "An unexpected error occurred", error_type: "internal_error" }`
- 502 external/proxy: `{ success: false, error: "...", error_type: "external_api_error|proxy_error" }`

