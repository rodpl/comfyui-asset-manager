"""File system model adapter implementation."""

import hashlib
import os
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Set
import uuid

from ...domain.ports.driven.model_repository_port import ModelRepositoryPort
from ...domain.ports.driven.folder_repository_port import FolderRepositoryPort
from ...domain.entities.model import Model, ModelType
from ...domain.entities.folder import Folder


class FileSystemModelAdapter(ModelRepositoryPort):
    """Adapter that scans file system for model files and extracts metadata.
    
    This adapter implements the ModelRepositoryPort interface and provides
    access to model files stored in the file system, integrating with
    ComfyUI's folder structure.
    """
    
    def __init__(self, folder_repository: FolderRepositoryPort):
        """Initialize the file system model adapter.
        
        Args:
            folder_repository: Repository for accessing folder information
        """
        self._folder_repository = folder_repository
        self._models_cache: Dict[str, Model] = {}
        self._cache_timestamp: Optional[datetime] = None
        self._cache_ttl_seconds = 300  # 5 minutes cache TTL
    
    @property
    def _supported_extensions(self) -> Set[str]:
        """Get set of supported model file extensions."""
        return {'.safetensors', '.ckpt', '.pt', '.pth', '.bin'}
    
    def _is_cache_valid(self) -> bool:
        """Check if the models cache is still valid."""
        if self._cache_timestamp is None:
            return False
        
        time_diff = datetime.now() - self._cache_timestamp
        return time_diff.total_seconds() < self._cache_ttl_seconds
    
    def _invalidate_cache(self) -> None:
        """Invalidate the models cache."""
        self._models_cache.clear()
        self._cache_timestamp = None
    
    def _generate_model_hash(self, file_path: str) -> str:
        """Generate SHA256 hash for a model file.
        
        Args:
            file_path: Path to the model file
            
        Returns:
            SHA256 hash of the file
        """
        hash_sha256 = hashlib.sha256()
        
        try:
            with open(file_path, 'rb') as f:
                # Read file in chunks to handle large files efficiently
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_sha256.update(chunk)
            return hash_sha256.hexdigest()
        except (OSError, IOError) as e:
            # If we can't read the file, generate a hash based on file path and size
            fallback_data = f"{file_path}_{os.path.getsize(file_path) if os.path.exists(file_path) else 0}"
            return hashlib.sha256(fallback_data.encode()).hexdigest()
    
    def _extract_model_metadata(self, file_path: str, folder: Folder) -> Optional[Model]:
        """Extract metadata from a model file.
        
        Args:
            file_path: Path to the model file
            folder: Folder containing the model
            
        Returns:
            Model object with extracted metadata, or None if extraction fails
        """
        try:
            path_obj = Path(file_path)
            
            # Check if file exists and has supported extension
            if not path_obj.exists() or path_obj.suffix.lower() not in self._supported_extensions:
                return None
            
            # Get file stats
            stat = path_obj.stat()
            
            # Generate model ID based on file path
            model_id = str(uuid.uuid5(uuid.NAMESPACE_URL, file_path))
            
            # Extract basic metadata
            model = Model(
                id=model_id,
                name=path_obj.stem,  # Filename without extension
                file_path=str(path_obj.absolute()),
                file_size=stat.st_size,
                created_at=datetime.fromtimestamp(stat.st_ctime),
                modified_at=datetime.fromtimestamp(stat.st_mtime),
                model_type=folder.model_type,
                hash=self._generate_model_hash(file_path),
                folder_id=folder.id,
                thumbnail_path=self._find_thumbnail_path(file_path)
            )
            
            return model
            
        except Exception as e:
            # Log error but don't fail completely
            print(f"Error extracting metadata from {file_path}: {e}")
            return None
    
    def _find_thumbnail_path(self, model_path: str) -> Optional[str]:
        """Find thumbnail image for a model file.
        
        Args:
            model_path: Path to the model file
            
        Returns:
            Path to thumbnail image if found, None otherwise
        """
        path_obj = Path(model_path)
        model_name = path_obj.stem
        model_dir = path_obj.parent
        
        # Common thumbnail extensions and naming patterns
        thumbnail_extensions = ['.png', '.jpg', '.jpeg', '.webp']
        thumbnail_patterns = [
            f"{model_name}",  # Same name as model
            f"{model_name}.preview",  # Model name with .preview
            f"preview_{model_name}",  # preview_ prefix
        ]
        
        for pattern in thumbnail_patterns:
            for ext in thumbnail_extensions:
                thumbnail_path = model_dir / f"{pattern}{ext}"
                if thumbnail_path.exists():
                    return str(thumbnail_path.absolute())
        
        return None
    
    def _scan_folder_for_models(self, folder: Folder) -> List[Model]:
        """Scan a folder for model files and extract metadata.
        
        Args:
            folder: Folder to scan
            
        Returns:
            List of models found in the folder
        """
        models = []
        
        try:
            folder_path = Path(folder.path)
            
            if not folder_path.exists() or not folder_path.is_dir():
                return models
            
            # Scan all files in the folder
            for file_path in folder_path.iterdir():
                if file_path.is_file():
                    model = self._extract_model_metadata(str(file_path), folder)
                    if model:
                        models.append(model)
            
        except Exception as e:
            print(f"Error scanning folder {folder.path}: {e}")
        
        return models
    
    def _refresh_models_cache(self) -> None:
        """Refresh the models cache by scanning all folders."""
        self._models_cache.clear()
        
        try:
            # Get all folders from the folder repository
            folders = self._folder_repository.get_all_folders()
            
            # Scan each folder for models
            for folder in folders:
                models = self._scan_folder_for_models(folder)
                for model in models:
                    self._models_cache[model.id] = model
            
            self._cache_timestamp = datetime.now()
            
        except Exception as e:
            print(f"Error refreshing models cache: {e}")
            self._invalidate_cache()
    
    def find_all_in_folder(self, folder_id: str) -> List[Model]:
        """Find all models in a specific folder.
        
        Args:
            folder_id: The ID of the folder to search in
            
        Returns:
            List of models found in the folder
        """
        # Refresh cache if needed
        if not self._is_cache_valid():
            self._refresh_models_cache()
        
        # Filter models by folder ID
        return [model for model in self._models_cache.values() if model.folder_id == folder_id]
    
    def find_by_id(self, model_id: str) -> Optional[Model]:
        """Find a model by its ID.
        
        Args:
            model_id: The ID of the model to find
            
        Returns:
            The model if found, None otherwise
        """
        # Refresh cache if needed
        if not self._is_cache_valid():
            self._refresh_models_cache()
        
        return self._models_cache.get(model_id)
    
    def search(self, query: str, folder_id: Optional[str] = None) -> List[Model]:
        """Search for models based on query and optional folder filter.
        
        Args:
            query: Search query string
            folder_id: Optional folder ID to limit search scope
            
        Returns:
            List of models matching the search criteria
        """
        # Refresh cache if needed
        if not self._is_cache_valid():
            self._refresh_models_cache()
        
        if not query.strip():
            # If no query, return all models (optionally filtered by folder)
            if folder_id:
                return self.find_all_in_folder(folder_id)
            else:
                return list(self._models_cache.values())
        
        query_lower = query.lower().strip()
        matching_models = []
        
        # Search through all models
        models_to_search = (
            self.find_all_in_folder(folder_id) if folder_id 
            else self._models_cache.values()
        )
        
        for model in models_to_search:
            # Search in model name
            if query_lower in model.name.lower():
                matching_models.append(model)
                continue
            
            # Search in file name
            if query_lower in model.file_name.lower():
                matching_models.append(model)
                continue
            
            # Search in user tags if available
            user_tags = model.user_metadata.get('tags', [])
            if any(query_lower in tag.lower() for tag in user_tags):
                matching_models.append(model)
                continue
            
            # Search in user description if available
            user_description = model.user_metadata.get('description', '')
            if query_lower in user_description.lower():
                matching_models.append(model)
                continue
        
        return matching_models
    
    def save(self, model: Model) -> None:
        """Save or update a model.
        
        Note: This adapter primarily reads from the file system.
        This method updates the cache and user metadata but doesn't
        modify the actual model files.
        
        Args:
            model: The model to save
        """
        # Update the cache
        self._models_cache[model.id] = model
        
        # In a full implementation, this might save user metadata
        # to a separate metadata file or database
    
    def delete(self, model_id: str) -> bool:
        """Delete a model by its ID.
        
        Note: This adapter doesn't actually delete files from the file system
        for safety reasons. It only removes the model from the cache.
        
        Args:
            model_id: The ID of the model to delete
            
        Returns:
            True if model was removed from cache, False if not found
        """
        if model_id in self._models_cache:
            del self._models_cache[model_id]
            return True
        return False
    
    def get_all_models(self) -> List[Model]:
        """Get all models from all folders.
        
        Returns:
            List of all models
        """
        # Refresh cache if needed
        if not self._is_cache_valid():
            self._refresh_models_cache()
        
        return list(self._models_cache.values())
    
    def get_models_by_type(self, model_type: ModelType) -> List[Model]:
        """Get all models of a specific type.
        
        Args:
            model_type: The type of models to retrieve
            
        Returns:
            List of models of the specified type
        """
        # Refresh cache if needed
        if not self._is_cache_valid():
            self._refresh_models_cache()
        
        return [model for model in self._models_cache.values() if model.model_type == model_type]
    
    def get_all_user_tags(self) -> List[str]:
        """Get all unique user tags across all models.
        
        Returns:
            List of unique user tags
        """
        # Refresh cache if needed
        if not self._is_cache_valid():
            self._refresh_models_cache()
        
        all_tags = set()
        
        for model in self._models_cache.values():
            user_tags = model.user_metadata.get('tags', [])
            all_tags.update(user_tags)
        
        return sorted(list(all_tags))