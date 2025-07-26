"""Folder repository driven port (secondary interface)."""

from abc import ABC, abstractmethod
from typing import List, Dict, Optional

from ...entities.folder import Folder


class FolderRepositoryPort(ABC):
    """Secondary port for folder data access.
    
    This port defines what the application needs for folder persistence.
    It is implemented by driven adapters and used by domain services.
    """
    
    @abstractmethod
    def get_all_folders(self) -> List[Folder]:
        """Get all available folders.
        
        Returns:
            List of all folders in the system
        """
        pass
    
    @abstractmethod
    def get_folder_structure(self) -> Dict[str, Folder]:
        """Get the complete folder structure.
        
        Returns:
            Dictionary mapping folder IDs to Folder objects
        """
        pass
    
    @abstractmethod
    def find_by_id(self, folder_id: str) -> Optional[Folder]:
        """Find a folder by its ID.
        
        Args:
            folder_id: The ID of the folder to find
            
        Returns:
            The folder if found, None otherwise
        """
        pass
    
    @abstractmethod
    def save(self, folder: Folder) -> None:
        """Save or update a folder.
        
        Args:
            folder: The folder to save
        """
        pass
    
    @abstractmethod
    def delete(self, folder_id: str) -> bool:
        """Delete a folder by its ID.
        
        Args:
            folder_id: The ID of the folder to delete
            
        Returns:
            True if folder was deleted, False if not found
        """
        pass