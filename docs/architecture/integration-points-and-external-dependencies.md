# Integration Points and External Dependencies

## External Services
| Service            | Purpose                               | Integration Type | Key Files                                                |
| ------------------ | ------------------------------------- | ---------------- | -------------------------------------------------------- |
| ComfyUI Runtime    | Host UI/API, model/output directories  | Python modules    | `__init__.py`, `src/adapters/driven/comfyui_*_adapter.py` |
| CivitAI            | External model catalogue               | REST API (proxy)  | `src/adapters/driven/civitai_*_adapter.py`, web API proxy|
| HuggingFace        | External model catalogue               | REST API (proxy)  | `src/adapters/driven/huggingface_*_adapter.py`, proxy    |
| System Shell       | Open files/folders for users           | Subprocess calls  | `src/adapters/driven/comfyui_output_adapter.py`         |

## Internal Integration Points
- **Frontend ↔ Backend**: `ui/src/services/api.ts` targets `/asset_manager/*` endpoints served by `WebAPIAdapter`.
- **Backend ↔ Filesystem**: Driven adapters read ComfyUI `models/` and `output/` directories, compute hashes, and locate thumbnails.
- **Backend ↔ External APIs**: Metadata and external model adapters call CivitAI/HuggingFace and merge data into domain entities.
- **Frontend ↔ ComfyUI Globals**: `useComfyUIIntegration` manipulates `window.app.graph`, `window.api`, and UI settings for drag-and-drop and usage tracking.
