# Domain Models and Ports

This reference summarizes the domain entities and ports used by the Asset Manager.

## Entities

### Model
- Purpose: Represent a local AI model file.
- Key fields: `id`, `name`, `file_path`, `file_size`, `created_at`, `modified_at`, `model_type (checkpoint|lora|vae|embedding|controlnet|upscaler)`, `hash`, `folder_id`, `thumbnail_path?`, `user_metadata` (tags, rating, description).
- Helpers: `file_name`, `file_extension`; methods to add/remove tags and set rating/description.

### Output
- Purpose: Represent a generated image (output) from ComfyUI.
- Key fields: `id`, `file_path`, `file_size`, `created_at`, `modified_at`, `width`, `height`, `file_format`, `thumbnail_path?`, `workflow_metadata?`.
- Notes: `workflow_metadata` may include `prompt`, `workflow` (graph), sampler params (seed, steps, cfg), and a computed `workflow_summary`.

### ExternalModel
- Purpose: Normalize external platform models (CivitAI/HuggingFace) with ComfyUI‑relevant attributes.
- Key: `platform`, identity, descriptive fields, and ComfyUI compatibility (`ComfyUICompatibility` with required nodes/capabilities).

### ExternalMetadata
- Purpose: Joint container for platform metadata; includes `civitai?`, `huggingface?`, and `cached_at`.
- Helpers: `has_civitai_data`, `has_huggingface_data`, `is_cached`, `get_primary_description()`, `get_all_tags()`.

## Driving Ports (Use Cases)

- ModelManagementPort: list/search models, read one model, update user metadata, list tags.
- FolderManagementPort: list ComfyUI model folders and their contents.
- OutputManagementPort: list outputs (filters: date/format), sort outputs, get details, refresh, load workflow, open/show in system.
- ExternalModelManagementPort: search/list/get from external platforms; compute compatibility and suggestions.

## Driven Ports (Infrastructure)

- ModelRepositoryPort: access local model files and metadata.
- FolderRepositoryPort: read ComfyUI model folder structure.
- OutputRepositoryPort: scan outputs, extract image/workflow metadata, create thumbnails, OS operations (open/show).
- ExternalMetadataPort: fetch and cache external metadata for models by hash/name.
- ExternalModelPort: perform cross‑platform discovery/search and retrieve details.

## Adapters (Examples)

- FilesystemOutputAdapter: scans output dir, extracts PNG metadata, generates thumbnails, serves image/thumbnail files.
- ComfyUIOutputAdapter: enhances workflow extraction and supports loading workflows back into ComfyUI.
- FileSystemModelAdapter / ComfyUIFolderAdapter: enumerate local models and folders according to ComfyUI paths.
- CivitAI/HuggingFace adapters: query platform APIs and normalize results for compatibility checks.

## Services

- ModelService / FolderService / OutputService: implement driving ports; enforce validation, sorting, caching; enrich outputs.
- ExternalModelService: orchestrates platform discovery and normalization.

