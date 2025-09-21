# Data Models and APIs

## Data Models
- **Models**: `src/domain/entities/model.py` defines model metadata, tags, ratings, file info.
- **Folders**: `src/domain/entities/folder.py` captures hierarchy and model type associations from ComfyUI.
- **Outputs**: `src/domain/entities/output.py` represents generated images with dimensions, workflow metadata, thumbnails.
- **External Models**: `src/domain/entities/external_model.py` aggregates CivitAI/HuggingFace data.

## API Specifications
- REST endpoints defined in `src/adapters/driving/web_api_adapter.py`; no OpenAPI/Postman spec committed. <!-- Consider generating OpenAPI documentation for the /asset_manager API set. -->
- Proxy endpoints mirror CivitAI/HuggingFace APIs to bypass browser CORS limitations.
