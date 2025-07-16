# Tech Stack: ComfyUI Asset Manager

## Backend
- **Language:** Python
- **Framework:** The backend is an extension for ComfyUI, using `aiohttp` for web routes as seen in `__init__.py`.
- **Packaging:** `pyproject.toml` is used for project metadata and dependencies.

## Frontend
- **Framework:** React
- **Language:** TypeScript
- **Bundler:** Vite
- **Styling:** Standard CSS only (`App.css`, `index.css`) - **NO CUSTOM UI FRAMEWORKS ALLOWED**
- **CSS Constraints:** Must use CSS classes provided by ComfyUI or define custom CSS that doesn't conflict
- **ComfyUI CSS Reference:** Can use CSS from ComfyUI frontend dependencies (https://github.com/Comfy-Org/ComfyUI_frontend/blob/main/package.json)
- **Internationalization (i18n):** `i18next` with `react-i18next`. Locale files are in `ui/public/locales/`.
- **Dependencies:**
  - `react`, `react-dom`
  - `i18next` and related packages for translation.
- **Dev Dependencies:**
  - `vite`, `typescript`, `eslint`, `prettier`
  - `@comfyorg/comfyui-frontend-types` for ComfyUI frontend type definitions.
  - `vitest` and `@testing-library/react` for testing.

## Development Environment
- The frontend development server can be started with `npm run dev` in the `ui/` directory.
- The frontend is built into the `dist/` directory using `npm run build`.
- The Python backend serves the built frontend assets.