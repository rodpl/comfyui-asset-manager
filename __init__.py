from __future__ import annotations

import os
import sys
import importlib
import importlib.util

NODE_CLASS_MAPPINGS = {}
__all__ = ["NODE_CLASS_MAPPINGS"]


def _is_pytest_environment() -> bool:
    # Common pytest indicators
    return (
        "PYTEST_CURRENT_TEST" in os.environ
        or "pytest" in sys.modules
    )


def _is_comfyui_runtime_available() -> bool:
    # Detect availability of ComfyUI runtime without importing modules
    required_modules = ["server", "nodes"]
    return all(importlib.util.find_spec(m) is not None for m in required_modules)


# Only run ComfyUI-specific initialization when ComfyUI is available and not under pytest
if _is_comfyui_runtime_available() and not _is_pytest_environment():
    server = importlib.import_module("server")
    web = importlib.import_module("aiohttp").web  # type: ignore[attr-defined]
    nodes = importlib.import_module("nodes")

    # Define the path to our extension
    workspace_path = os.path.dirname(__file__)
    dist_path = os.path.join(workspace_path, "dist/asset_manager")
    dist_locales_path = os.path.join(workspace_path, "dist/locales")

    # Print the current paths for debugging
    print(f"ComfyUI Asset Manager workspace path: {workspace_path}")
    print(f"Dist path: {dist_path}")
    print(f"Dist locales path: {dist_locales_path}")
    print(f"Locales exist: {os.path.exists(dist_locales_path)}")

    # Register the static route for serving our React app assets
    if os.path.exists(dist_path):
        server.PromptServer.instance.app.add_routes([web.static("/asset_manager/", dist_path)])

        # Register the locale files route
        if os.path.exists(dist_locales_path):
            server.PromptServer.instance.app.add_routes([web.static("/locales/", dist_locales_path)])
            print("Registered locale files route at /locales/")
        else:
            print("WARNING: Locale directory not found!")

        # Initialize and register the asset manager API
        try:
            from src.main import register_with_comfyui

            register_with_comfyui(server.PromptServer.instance.app)
            print("Asset Manager API registered successfully")
        except Exception as e:
            print(f"WARNING: Failed to register Asset Manager API: {e}")

        # Also register the standard ComfyUI extension web directory
        project_name = os.path.basename(workspace_path)

        try:
            # Method added in https://github.com/comfyanonymous/ComfyUI/pull/8357
            config_parser = importlib.import_module("comfy_config.config_parser")
            project_config = config_parser.extract_node_configuration(workspace_path)  # type: ignore[attr-defined]
            project_name = project_config.project.name
            print(f"project name read from pyproject.toml: {project_name}")
        except Exception as e:
            print(f"Could not load project config, using default name '{project_name}': {e}")

        try:
            nodes.EXTENSION_WEB_DIRS[project_name] = os.path.join(workspace_path, "dist")  # type: ignore[name-defined]
        except Exception:
            pass
    else:
        print("ComfyUI Asset Manager: Web directory not found")