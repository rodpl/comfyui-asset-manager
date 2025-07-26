"""Folder service implementing folder management operations."""

from typing import List, Dict

from ..ports.driving.folder_management_port import FolderManagementPort
from ..ports.driven.folder_repository_port import FolderRepositoryPort
from ..entities.folder import Folder
from ..entities.base import ValidationError, NotFoundError


class FolderService(FolderManagementPort):
    """Domain service implementing folder management operations.
    
    This service contains the core business logic for folder management
    and implements the FolderManagementPort interface.
    """
    
    def __init__(self, folder_repository: FolderRepositoryPort):
        """Initialize the folder service.
        
        Args:
            folder_repository: Repository for folder data access
        """
        self._folder_repository = folder_repository
    
    def get_all_folders(self) -> List[Folder]:
        """Get all available model folders.
        
        Returns:
            List of all folders in the system
        """
        return self._folder_repository.get_all_folders()
    
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
        if not folder_id or not folder_id.strip():
            raise ValidationError("folder_id cannot be empty", "folder_id")
        
        folder = self._folder_repository.find_by_id(folder_id.strip())
        if folder is None:
            raise NotFoundError("Folder", folder_id)
        
        return folder
    
    def get_folder_structure(self) -> Dict[str, Folder]:
        """Get the complete folder structure as a hierarchical dictionary.
        
        Returns:
            Dictionary mapping folder IDs to Folder objects, representing
            the complete folder hierarchy
        """
        return self._folder_repository.get_folder_structure()