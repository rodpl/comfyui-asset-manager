"""Model management driving port (primary interface)."""

from abc import ABC, abstractmethod
from typing import List, Optional

from ...entities.model import Model


class ModelManagementPort(ABC):
    """Primary port for model management operations.
    
    This port defines what the application can do with models.
    It is implemented by domain services and used by driving adapters.
    """
    
    @abstractmethod
    def get_models_in_folder(self, folder_id: str) -> List[Model]:
        """Get all models in a specific folder.
        
        Args:
            folder_id: The ID of the folder to get models from
            
        Returns:
            List of models in the folder
            
        Raises:
            ValidationError: If folder_id is invalid
        """
        pass
    
    @abstractmethod
    def get_model_details(self, model_id: str) -> Model:
        """Get detailed information about a specific model.
        
        Args:
            model_id: The ID of the model to get details for
            
        Returns:
            Model with detailed information
            
        Raises:
            ValidationError: If model_id is invalid
            NotFoundError: If model is not found
        """
        pass
    
    @abstractmethod
    def search_models(self, query: str, folder_id: Optional[str] = None) -> List[Model]:
        """Search for models based on query and optional folder filter.
        
        Args:
            query: Search query string
            folder_id: Optional folder ID to limit search scope
            
        Returns:
            List of models matching the search criteria
            
        Raises:
            ValidationError: If query is invalid
        """
        pass
    
    @abstractmethod
    def enrich_model_metadata(self, model: Model) -> Model:
        """Enrich model with external metadata.
        
        Args:
            model: The model to enrich with external metadata
            
        Returns:
            Model with enriched metadata
            
        Raises:
            ValidationError: If model is invalid
        """
        pass
    
    @abstractmethod
    def update_model_metadata(self, model_id: str, metadata: dict) -> Model:
        """Update user metadata for a specific model.
        
        Args:
            model_id: The ID of the model to update
            metadata: Dictionary containing metadata updates
            
        Returns:
            Updated model with new metadata
            
        Raises:
            ValidationError: If model_id or metadata is invalid
            NotFoundError: If model is not found
        """
        pass
    
    @abstractmethod
    def bulk_update_metadata(self, model_ids: List[str], metadata: dict) -> List[Model]:
        """Update metadata for multiple models at once.
        
        Args:
            model_ids: List of model IDs to update
            metadata: Dictionary containing metadata updates
            
        Returns:
            List of updated models
            
        Raises:
            ValidationError: If model_ids or metadata is invalid
        """
        pass
    
    @abstractmethod
    def get_all_user_tags(self) -> List[str]:
        """Get all unique user tags across all models for autocomplete.
        
        Returns:
            List of unique user tags
        """
        pass