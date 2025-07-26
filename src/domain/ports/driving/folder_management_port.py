"""Folder management driving port (primary interface)."""

from abc import ABC, abstractmethod
from typing import List, Dict

from ...entities.folder import Folder


class FolderManagementPort(ABC):
    """Primary port for folder management operations.
    
    This port defines what the application can do with folders.
    It is implemented by domain services and used by driving adapters.
    """
    
    @abstractmethod
    def get_all_folders(self) -> List[Folder]:
        """Get all available model folders.
        
        Returns:
            List of all folders in the system
        """
        pass
    
    @abstractmethod
    def get_folder_by_id(self, folder_id: str) -> Folder:
        """Get a specific folder by its ID.
        
        Args:
            folder_id: The ID of the folder to retrieve
            
        Returns:
            The folder with the specified ID
            
        Raises:
            ValidationError: If folder_id is invalid
            NotFoundError: If folder is not found
        """
        pass
    
    @abstractmethod
    def get_folder_structure(self) -> Dict[str, Folder]:
        """Get the complete folder structure as a hierarchical dictionary.
        
        Returns:
            Dictionary mapping folder IDs to Folder objects, representing
            the complete folder hierarchy
        """
        pass