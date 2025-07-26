"""Unit tests for FolderService."""

import pytest
from unittest.mock import Mock

from src.domain.services.folder_service import FolderService
from src.domain.entities.folder import Folder
from src.domain.entities.model import ModelType
from src.domain.entities.base import ValidationError, NotFoundError


@pytest.fixture
def mock_folder_repository():
    """Mock folder repository for testing."""
    return Mock()


@pytest.fixture
def sample_folder():
    """Sample folder for testing."""
    return Folder(
        id="folder-1",
        name="Checkpoints",
        path="/path/to/checkpoints",
        model_type=ModelType.CHECKPOINT,
        model_count=5
    )


@pytest.fixture
def sample_folder_structure(sample_folder):
    """Sample folder structure for testing."""
    folder2 = Folder(
        id="folder-2",
        name="LoRAs",
        path="/path/to/loras",
        model_type=ModelType.LORA,
        model_count=10
    )
    return {
        "folder-1": sample_folder,
        "folder-2": folder2
    }


class TestFolderService:
    """Test cases for FolderService."""
    
    def test_init(self, mock_folder_repository):
        """Test service initialization."""
        service = FolderService(mock_folder_repository)
        assert service._folder_repository == mock_folder_repository
    
    def test_get_all_folders_success(self, mock_folder_repository, sample_folder):
        """Test successful retrieval of all folders."""
        mock_folder_repository.get_all_folders.return_value = [sample_folder]
        service = FolderService(mock_folder_repository)
        
        result = service.get_all_folders()
        
        assert result == [sample_folder]
        mock_folder_repository.get_all_folders.assert_called_once()
    
    def test_get_all_folders_empty_list(self, mock_folder_repository):
        """Test get_all_folders returns empty list when no folders exist."""
        mock_folder_repository.get_all_folders.return_value = []
        service = FolderService(mock_folder_repository)
        
        result = service.get_all_folders()
        
        assert result == []
        mock_folder_repository.get_all_folders.assert_called_once()
    
    def test_get_folder_by_id_success(self, mock_folder_repository, sample_folder):
        """Test successful retrieval of folder by ID."""
        mock_folder_repository.find_by_id.return_value = sample_folder
        service = FolderService(mock_folder_repository)
        
        result = service.get_folder_by_id("folder-1")
        
        assert result == sample_folder
        mock_folder_repository.find_by_id.assert_called_once_with("folder-1")
    
    def test_get_folder_by_id_not_found(self, mock_folder_repository):
        """Test get_folder_by_id when folder is not found."""
        mock_folder_repository.find_by_id.return_value = None
        service = FolderService(mock_folder_repository)
        
        with pytest.raises(NotFoundError) as exc_info:
            service.get_folder_by_id("nonexistent")
        
        assert exc_info.value.entity_type == "Folder"
        assert exc_info.value.identifier == "nonexistent"
    
    def test_get_folder_by_id_empty_folder_id(self, mock_folder_repository):
        """Test get_folder_by_id with empty folder_id raises ValidationError."""
        service = FolderService(mock_folder_repository)
        
        with pytest.raises(ValidationError) as exc_info:
            service.get_folder_by_id("")
        
        assert exc_info.value.field == "folder_id"
        assert "cannot be empty" in exc_info.value.message
    
    def test_get_folder_by_id_whitespace_folder_id(self, mock_folder_repository):
        """Test get_folder_by_id with whitespace folder_id raises ValidationError."""
        service = FolderService(mock_folder_repository)
        
        with pytest.raises(ValidationError) as exc_info:
            service.get_folder_by_id("   ")
        
        assert exc_info.value.field == "folder_id"
    
    def test_get_folder_by_id_strips_whitespace(self, mock_folder_repository, sample_folder):
        """Test get_folder_by_id strips whitespace from folder_id."""
        mock_folder_repository.find_by_id.return_value = sample_folder
        service = FolderService(mock_folder_repository)
        
        service.get_folder_by_id("  folder-1  ")
        
        mock_folder_repository.find_by_id.assert_called_once_with("folder-1")
    
    def test_get_folder_structure_success(self, mock_folder_repository, sample_folder_structure):
        """Test successful retrieval of folder structure."""
        mock_folder_repository.get_folder_structure.return_value = sample_folder_structure
        service = FolderService(mock_folder_repository)
        
        result = service.get_folder_structure()
        
        assert result == sample_folder_structure
        mock_folder_repository.get_folder_structure.assert_called_once()
    
    def test_get_folder_structure_empty_dict(self, mock_folder_repository):
        """Test get_folder_structure returns empty dict when no folders exist."""
        mock_folder_repository.get_folder_structure.return_value = {}
        service = FolderService(mock_folder_repository)
        
        result = service.get_folder_structure()
        
        assert result == {}
        mock_folder_repository.get_folder_structure.assert_called_once()
    
    def test_get_folder_structure_maintains_hierarchy(self, mock_folder_repository):
        """Test that get_folder_structure maintains folder hierarchy."""
        # Create a hierarchical structure
        parent_folder = Folder(
            id="parent-1",
            name="Models",
            path="/path/to/models",
            model_type=ModelType.CHECKPOINT,
            model_count=0
        )
        child_folder = Folder(
            id="child-1",
            name="SD1.5",
            path="/path/to/models/sd15",
            model_type=ModelType.CHECKPOINT,
            model_count=3,
            parent_folder_id="parent-1"
        )
        
        folder_structure = {
            "parent-1": parent_folder,
            "child-1": child_folder
        }
        
        mock_folder_repository.get_folder_structure.return_value = folder_structure
        service = FolderService(mock_folder_repository)
        
        result = service.get_folder_structure()
        
        assert result == folder_structure
        assert result["parent-1"].is_root_folder
        assert not result["child-1"].is_root_folder
        assert result["child-1"].parent_folder_id == "parent-1"