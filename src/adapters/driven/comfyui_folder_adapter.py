"""ComfyUI folder adapter implementation."""

import os
from pathlib import Path
from typing import List, Dict, Optional
import uuid

from ...domain.ports.driven.folder_repository_port import FolderRepositoryPort
from ...domain.entities.folder import Folder
from ...domain.entities.model import ModelType
from src.utils import logger


class ComfyUIFolderAdapter(FolderRepositoryPort):
    """Adapter that integrates with ComfyUI's folder_paths module to discover model folders.
    
    This adapter implements the FolderRepositoryPort interface and provides
    access to ComfyUI's model folder structure.
    """
    
    def __init__(self):
        """Initialize the ComfyUI folder adapter."""
        self._folders_cache: Dict[str, Folder] = {}
        self._folder_paths = None
        self._initialize_folder_paths()
    
    def _initialize_folder_paths(self) -> None:
        """Initialize ComfyUI's folder_paths module."""
        try:
            import folder_paths
            self._folder_paths = folder_paths
        except ImportError:
            # For testing or when ComfyUI is not available
            self._folder_paths = None
    
    def _get_model_type_mapping(self) -> Dict[str, ModelType]:
        """Get mapping from ComfyUI folder names to ModelType enum values."""
        return {
            "checkpoints": ModelType.CHECKPOINT,
            "loras": ModelType.LORA,
            "vae": ModelType.VAE,
            "embeddings": ModelType.EMBEDDING,
            "controlnet": ModelType.CONTROLNET,
            "upscale_models": ModelType.UPSCALER,
        }
    
    def _discover_folders(self) -> Dict[str, Folder]:
        """Discover all model folders from ComfyUI's folder_paths."""
        folders = {}
        
        if self._folder_paths is None:
            return folders
        
        model_type_mapping = self._get_model_type_mapping()
        
        # Get all folder types from ComfyUI
        for folder_name, model_type in model_type_mapping.items():
            try:
                # Get folder paths for this model type
                folder_paths = self._folder_paths.get_folder_paths(folder_name)
                
                for folder_path in folder_paths:
                    if os.path.exists(folder_path):
                        folder_id = self._generate_folder_id(folder_path, model_type)
                        
                        # Count models in folder
                        model_count = self._count_models_in_folder(folder_path)
                        
                        folder = Folder(
                            id=folder_id,
                            name=self._get_display_name(folder_name, folder_path),
                            path=folder_path,
                            model_type=model_type,
                            model_count=model_count
                        )
                        
                        folders[folder_id] = folder
                        
            except Exception as e:
                # Log error but continue with other folders
                logger.error(f"Error discovering folder {folder_name}: {e}")
                continue
        
        return folders
    
    def _generate_folder_id(self, folder_path: str, model_type: ModelType) -> str:
        """Generate a unique ID for a folder based on path and type."""
        # Use a combination of model type and path hash for consistent IDs
        path_hash = str(hash(folder_path))
        return f"{model_type.value}_{path_hash}"
    
    def _get_display_name(self, folder_name: str, folder_path: str) -> str:
        """Get a display name for the folder."""
        path_obj = Path(folder_path)
        
        # If it's a custom path, use the actual folder name
        if path_obj.name != folder_name:
            return f"{folder_name.title()} ({path_obj.name})"
        
        return folder_name.title()
    
    def _count_models_in_folder(self, folder_path: str) -> int:
        """Count the number of model files in a folder."""
        if not os.path.exists(folder_path):
            return 0
        
        model_extensions = {'.safetensors', '.ckpt', '.pt', '.pth', '.bin'}
        count = 0
        
        try:
            for file_path in Path(folder_path).iterdir():
                if file_path.is_file() and file_path.suffix.lower() in model_extensions:
                    count += 1
        except (OSError, PermissionError):
            # Handle cases where we can't read the directory
            pass
        
        return count
    
    def get_all_folders(self) -> List[Folder]:
        """Get all available folders.
        
        Returns:
            List of all folders discovered from ComfyUI
        """
        self._folders_cache = self._discover_folders()
        return list(self._folders_cache.values())
    
    def get_folder_structure(self) -> Dict[str, Folder]:
        """Get the complete folder structure.
        
        Returns:
            Dictionary mapping folder IDs to Folder objects
        """
        self._folders_cache = self._discover_folders()
        return self._folders_cache.copy()
    
    def find_by_id(self, folder_id: str) -> Optional[Folder]:
        """Find a folder by its ID.
        
        Args:
            folder_id: The ID of the folder to find
            
        Returns:
            The folder if found, None otherwise
        """
        if not self._folders_cache:
            self._folders_cache = self._discover_folders()
        
        return self._folders_cache.get(folder_id)
    
    def save(self, folder: Folder) -> None:
        """Save or update a folder.
        
        Note: This adapter is read-only as it reflects ComfyUI's folder structure.
        This method is implemented for interface compliance but doesn't persist changes.
        
        Args:
            folder: The folder to save
        """
        # ComfyUI folder structure is read-only, but we can update our cache
        self._folders_cache[folder.id] = folder
    
    def delete(self, folder_id: str) -> bool:
        """Delete a folder by its ID.
        
        Note: This adapter is read-only as it reflects ComfyUI's folder structure.
        This method is implemented for interface compliance but doesn't actually delete folders.
        
        Args:
            folder_id: The ID of the folder to delete
            
        Returns:
            False as deletion is not supported
        """
        # ComfyUI folder structure is read-only
        return False