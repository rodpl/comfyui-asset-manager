"""Driven adapters (secondary adapters) for external systems.

These adapters implement the driven ports to integrate with
external systems like databases, APIs, file systems, etc.
"""

from .comfyui_folder_adapter import ComfyUIFolderAdapter
from .file_cache_adapter import FileCacheAdapter

__all__ = [
    "ComfyUIFolderAdapter",
    "FileCacheAdapter",
]