# Context

## Current State
The project is in its initial setup phase. The basic structure for the Python backend and React frontend is in place. The backend serves the frontend, and the frontend has a basic tabbed navigation structure.

## Next Steps
- Implement the functionality for each of the three main tabs: "Local Assets", "Model Browser", and "Outputs".
- Connect the frontend to the backend to handle asset management operations.
- Develop the API endpoints required for the frontend to interact with the backend.

## Critical Constraints
- **CSS Framework Restriction**: Extension CANNOT use custom UI frameworks. Must use only CSS classes provided by ComfyUI or write custom CSS that doesn't conflict. This is because the extension acts as a plugin within ComfyUI's environment.