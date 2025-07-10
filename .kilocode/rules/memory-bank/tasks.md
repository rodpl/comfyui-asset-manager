# Tasks

## Create a new UI component
**Last performed:** N/A
**Description:** This task outlines the process for creating and integrating a new React component into the application.

**Files to modify/create:**
- `ui/src/components/<NewComponent>/<NewComponent>.tsx` (create)
- `ui/src/components/<NewComponent>/<NewComponent>.css` (create)
- `ui/src/App.tsx` (modify)

**Steps:**
1.  Create a new directory for the component under `ui/src/components/`.
2.  Create the component's `.tsx` file with its React code.
3.  Create the component's `.css` file for styling.
4.  Import the new component into `ui/src/App.tsx` or its relevant parent component.
5.  Integrate the component into the JSX of the parent component.

**Important notes:**
- Replace `<NewComponent>` with the actual name of the component.
- Ensure the new component follows the existing coding style and conventions.

---

## Add a new API endpoint
**Last performed:** N/A
**Description:** This task outlines the process for adding a new API endpoint to the Python backend.

**Files to modify/create:**
- `__init__.py` (modify)

**Steps:**
1.  Define a new handler function for the endpoint logic.
2.  Register the new route using `server.PromptServer.instance.app.add_routes`.
3.  Ensure the route is prefixed with `/asset_manager/` to avoid conflicts.
4.  Restart the ComfyUI server to apply the changes.

**Important notes:**
- Follow the `aiohttp` request handling patterns.
- Ensure the endpoint handles request validation and error responses gracefully.

---

## Add a new translation language
**Last performed:** N/A
**Description:** This task outlines the process for adding support for a new language to the frontend.

**Files to modify/create:**
- `ui/public/locales/<lang_code>/main.json` (create)

**Steps:**
1.  Create a new directory for the language under `ui/public/locales/` using the appropriate two-letter language code (e.g., `es` for Spanish, `fr` for French).
2.  Inside the new language directory, create a `main.json` file.
3.  Copy the content from an existing `main.json` file (e.g., `ui/public/locales/en/main.json`) into the new `main.json` file.
4.  Translate the values within the new `main.json` file to the new language.

**Important notes:**
- Ensure the language code directory name is correct and follows ISO 639-1 standards.
- The `main.json` file should contain all the necessary translation keys used in the application.