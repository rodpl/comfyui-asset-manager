"""Model repository driven port (secondary interface)."""

from abc import ABC, abstractmethod
from typing import List, Optional

from ...entities.model import Model


class ModelRepositoryPort(ABC):
    """Secondary port for model data access.
    
    This port defines what the application needs for model persistence.
    It is implemented by driven adapters and used by domain services.
    """
    
    @abstractmethod
    def find_all_in_folder(self, folder_id: str) -> List[Model]:
        """Find all models in a specific folder.
        
        Args:
            folder_id: The ID of the folder to search in
            
        Returns:
            List of models found in the folder
        """
        pass
    
    @abstractmethod
    def find_by_id(self, model_id: str) -> Optional[Model]:
        """Find a model by its ID.
        
        Args:
            model_id: The ID of the model to find
            
        Returns:
            The model if found, None otherwise
        """
        pass
    
    @abstractmethod
    def search(self, query: str, folder_id: Optional[str] = None) -> List[Model]:
        """Search for models based on query and optional folder filter.
        
        Args:
            query: Search query string
            folder_id: Optional folder ID to limit search scope
            
        Returns:
            List of models matching the search criteria
        """
        pass
    
    @abstractmethod
    def save(self, model: Model) -> None:
        """Save or update a model.
        
        Args:
            model: The model to save
        """
        pass
    
    @abstractmethod
    def delete(self, model_id: str) -> bool:
        """Delete a model by its ID.
        
        Args:
            model_id: The ID of the model to delete
            
        Returns:
            True if model was deleted, False if not found
        """
        pass
    
    @abstractmethod
    def get_all_user_tags(self) -> List[str]:
        """Get all unique user tags across all models.
        
        Returns:
            List of unique user tags
        """
        pass