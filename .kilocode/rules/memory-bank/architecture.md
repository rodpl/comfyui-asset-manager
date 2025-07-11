# Architecture: ComfyUI Asset Manager

## Overview
The project is a ComfyUI extension composed of a Python backend and a React frontend. The backend integrates with ComfyUI's server, while the frontend provides the user interface for asset management.

## Backend
- **Entry Point:** `__init__.py`
- **Functionality:**
    - Serves the static frontend assets (HTML, CSS, JS) located in the `dist/` directory.
    - Registers web routes under `/asset_manager/` using `aiohttp`.
    - Handles internationalization by serving locale files from `dist/locales/`.

## Frontend
- **Root Component:** `ui/src/App.tsx`
- **Structure:**
    - A single-page application built with React and TypeScript.
    - The UI is organized into three main tabs: "Local Assets", "Model Browser", and "Outputs".
    - State management for the active tab is handled within the `App` component.
- **Build Process:**
    - Vite is used to bundle the frontend code into the `ui/dist/` directory.

## Key Technical Decisions
- **Separation of Concerns:** The backend is responsible for server-side logic and file serving, while the frontend handles the user interface and experience. This is a standard and robust model for web applications.
- **Static Serving:** The Python backend serves the compiled React application as static files. This is a simple and effective way to integrate a modern frontend with a Python-based backend.
- **Component-Based UI:** The use of React promotes a modular and maintainable frontend architecture.
- **CSS Constraint:** **CRITICAL** - No custom UI frameworks allowed. Extension must use only CSS provided by ComfyUI or custom CSS that doesn't conflict. This is because the extension acts as a plugin within ComfyUI's environment.