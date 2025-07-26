"""Tests for ComfyUI folder adapter."""

import os
import tempfile
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
import pytest

from src.adapters.driven.comfyui_folder_adapter import ComfyUIFolderAdapter
from src.domain.entities.folder import Folder
from src.domain.entities.model import ModelType


class TestComfyUIFolderAdapter:
    """Test cases for ComfyUIFolderAdapter."""
    
    @pytest.fixture
    def mock_folder_paths(self):
        """Mock ComfyUI's folder_paths module."""
        mock_module = Mock()
        mock_module.get_folder_paths = Mock()
        return mock_module
    
    @pytest.fixture
    def adapter_with_mock(self, mock_folder_paths):
        """Create adapter with mocked folder_paths."""
        adapter = ComfyUIFolderAdapter()
        adapter._folder_paths = mock_folder_paths
        return adapter
    
    @pytest.fixture
    def temp_model_folders(self):
        """Create temporary folders with model files for testing."""
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Create checkpoint folder with model files
            checkpoint_dir = temp_path / "checkpoints"
            checkpoint_dir.mkdir()
            (checkpoint_dir / "model1.safetensors").touch()
            (checkpoint_dir / "model2.ckpt").touch()
            (checkpoint_dir / "readme.txt").touch()  # Non-model file
            
            # Create lora folder with model files
            lora_dir = temp_path / "loras"
            lora_dir.mkdir()
            (lora_dir / "lora1.safetensors").touch()
            
            # Create empty vae folder
            vae_dir = temp_path / "vae"
            vae_dir.mkdir()
            
            yield {
                "checkpoints": str(checkpoint_dir),
                "loras": str(lora_dir),
                "vae": str(vae_dir)
            }
    
    def test_initialization_with_folder_paths_available(self):
        """Test adapter initialization when folder_paths is available."""
        with patch('builtins.__import__') as mock_import:
            mock_folder_paths = Mock()
            mock_import.return_value = mock_folder_paths
            
            adapter = ComfyUIFolderAdapter()
            assert adapter._folder_paths == mock_folder_paths
            assert adapter._folders_cache == {}
    
    def test_initialization_without_folder_paths(self):
        """Test adapter initialization when folder_paths is not available."""
        with patch('builtins.__import__', side_effect=ImportError):
            adapter = ComfyUIFolderAdapter()
            assert adapter._folder_paths is None
            assert adapter._folders_cache == {}
    
    def test_get_model_type_mapping(self, adapter_with_mock):
        """Test model type mapping is correct."""
        mapping = adapter_with_mock._get_model_type_mapping()
        
        expected_mapping = {
            "checkpoints": ModelType.CHECKPOINT,
            "loras": ModelType.LORA,
            "vae": ModelType.VAE,
            "embeddings": ModelType.EMBEDDING,
            "controlnet": ModelType.CONTROLNET,
            "upscale_models": ModelType.UPSCALER,
        }
        
        assert mapping == expected_mapping
    
    def test_generate_folder_id(self, adapter_with_mock):
        """Test folder ID generation is consistent."""
        folder_path = "/path/to/checkpoints"
        model_type = ModelType.CHECKPOINT
        
        id1 = adapter_with_mock._generate_folder_id(folder_path, model_type)
        id2 = adapter_with_mock._generate_folder_id(folder_path, model_type)
        
        # Same inputs should generate same ID
        assert id1 == id2
        assert id1.startswith("checkpoint_")
        
        # Different paths should generate different IDs
        id3 = adapter_with_mock._generate_folder_id("/different/path", model_type)
        assert id1 != id3
    
    def test_get_display_name(self, adapter_with_mock):
        """Test display name generation."""
        # Standard folder name
        name1 = adapter_with_mock._get_display_name("checkpoints", "/path/to/checkpoints")
        assert name1 == "Checkpoints"
        
        # Custom folder name
        name2 = adapter_with_mock._get_display_name("checkpoints", "/path/to/my_models")
        assert name2 == "Checkpoints (my_models)"
    
    def test_count_models_in_folder(self, adapter_with_mock, temp_model_folders):
        """Test model counting in folders."""
        # Folder with 2 model files (ignoring readme.txt)
        count1 = adapter_with_mock._count_models_in_folder(temp_model_folders["checkpoints"])
        assert count1 == 2
        
        # Folder with 1 model file
        count2 = adapter_with_mock._count_models_in_folder(temp_model_folders["loras"])
        assert count2 == 1
        
        # Empty folder
        count3 = adapter_with_mock._count_models_in_folder(temp_model_folders["vae"])
        assert count3 == 0
        
        # Non-existent folder
        count4 = adapter_with_mock._count_models_in_folder("/non/existent/path")
        assert count4 == 0
    
    def test_discover_folders_success(self, adapter_with_mock, temp_model_folders):
        """Test successful folder discovery."""
        # Mock folder_paths.get_folder_paths to return our temp folders
        def mock_get_folder_paths(folder_name):
            if folder_name in temp_model_folders:
                return [temp_model_folders[folder_name]]
            return []
        
        adapter_with_mock._folder_paths.get_folder_paths.side_effect = mock_get_folder_paths
        
        folders = adapter_with_mock._discover_folders()
        
        # Should discover 3 folders (checkpoints, loras, vae)
        assert len(folders) == 3
        
        # Check folder properties
        checkpoint_folder = next(f for f in folders.values() if f.model_type == ModelType.CHECKPOINT)
        assert checkpoint_folder.name == "Checkpoints"
        assert checkpoint_folder.model_count == 2
        assert checkpoint_folder.path == temp_model_folders["checkpoints"]
        
        lora_folder = next(f for f in folders.values() if f.model_type == ModelType.LORA)
        assert lora_folder.name == "Loras"
        assert lora_folder.model_count == 1
    
    def test_discover_folders_with_errors(self, adapter_with_mock):
        """Test folder discovery handles errors gracefully."""
        # Mock folder_paths.get_folder_paths to raise exception for some folders
        def mock_get_folder_paths(folder_name):
            if folder_name == "checkpoints":
                raise Exception("Access denied")
            return []
        
        adapter_with_mock._folder_paths.get_folder_paths.side_effect = mock_get_folder_paths
        
        # Should not raise exception and return empty dict
        folders = adapter_with_mock._discover_folders()
        assert isinstance(folders, dict)
    
    def test_discover_folders_without_folder_paths(self):
        """Test folder discovery when folder_paths is not available."""
        adapter = ComfyUIFolderAdapter()
        adapter._folder_paths = None
        
        folders = adapter._discover_folders()
        assert folders == {}
    
    def test_get_all_folders(self, adapter_with_mock, temp_model_folders):
        """Test get_all_folders method."""
        # Mock the discover_folders method
        mock_folders = {
            "folder1": Folder(
                id="folder1",
                name="Test Folder",
                path="/test/path",
                model_type=ModelType.CHECKPOINT,
                model_count=5
            )
        }
        
        with patch.object(adapter_with_mock, '_discover_folders', return_value=mock_folders):
            folders = adapter_with_mock.get_all_folders()
            
            assert len(folders) == 1
            assert folders[0].id == "folder1"
            assert folders[0].name == "Test Folder"
            assert adapter_with_mock._folders_cache == mock_folders
    
    def test_get_folder_structure(self, adapter_with_mock):
        """Test get_folder_structure method."""
        mock_folders = {
            "folder1": Folder(
                id="folder1",
                name="Folder 1",
                path="/path1",
                model_type=ModelType.CHECKPOINT,
                model_count=3
            ),
            "folder2": Folder(
                id="folder2",
                name="Folder 2",
                path="/path2",
                model_type=ModelType.LORA,
                model_count=1
            )
        }
        
        with patch.object(adapter_with_mock, '_discover_folders', return_value=mock_folders):
            structure = adapter_with_mock.get_folder_structure()
            
            assert len(structure) == 2
            assert "folder1" in structure
            assert "folder2" in structure
            assert structure["folder1"].name == "Folder 1"
            assert structure["folder2"].name == "Folder 2"
    
    def test_find_by_id_with_cached_folders(self, adapter_with_mock):
        """Test find_by_id when folders are already cached."""
        test_folder = Folder(
            id="test_id",
            name="Test Folder",
            path="/test/path",
            model_type=ModelType.CHECKPOINT,
            model_count=2
        )
        
        adapter_with_mock._folders_cache = {"test_id": test_folder}
        
        found_folder = adapter_with_mock.find_by_id("test_id")
        assert found_folder == test_folder
        
        not_found = adapter_with_mock.find_by_id("non_existent")
        assert not_found is None
    
    def test_find_by_id_without_cached_folders(self, adapter_with_mock):
        """Test find_by_id when folders need to be discovered."""
        test_folder = Folder(
            id="test_id",
            name="Test Folder",
            path="/test/path",
            model_type=ModelType.CHECKPOINT,
            model_count=2
        )
        
        mock_folders = {"test_id": test_folder}
        
        with patch.object(adapter_with_mock, '_discover_folders', return_value=mock_folders):
            found_folder = adapter_with_mock.find_by_id("test_id")
            assert found_folder == test_folder
    
    def test_save_folder(self, adapter_with_mock):
        """Test save method updates cache."""
        test_folder = Folder(
            id="test_id",
            name="Test Folder",
            path="/test/path",
            model_type=ModelType.CHECKPOINT,
            model_count=2
        )
        
        adapter_with_mock.save(test_folder)
        assert adapter_with_mock._folders_cache["test_id"] == test_folder
    
    def test_delete_folder(self, adapter_with_mock):
        """Test delete method returns False (read-only adapter)."""
        result = adapter_with_mock.delete("any_id")
        assert result is False
    
    @pytest.mark.integration
    def test_integration_with_real_folder_structure(self, temp_model_folders):
        """Integration test with real folder structure."""
        # Create a mock folder_paths module
        mock_folder_paths = Mock()
        
        def mock_get_folder_paths(folder_name):
            if folder_name in temp_model_folders:
                return [temp_model_folders[folder_name]]
            return []
        
        mock_folder_paths.get_folder_paths.side_effect = mock_get_folder_paths
        
        # Create adapter with mocked folder_paths
        adapter = ComfyUIFolderAdapter()
        adapter._folder_paths = mock_folder_paths
        
        # Test complete workflow
        folders = adapter.get_all_folders()
        assert len(folders) == 3
        
        structure = adapter.get_folder_structure()
        assert len(structure) == 3
        
        # Find specific folder
        checkpoint_folder = next(f for f in folders if f.model_type == ModelType.CHECKPOINT)
        found_folder = adapter.find_by_id(checkpoint_folder.id)
        assert found_folder == checkpoint_folder
        
        # Test model counts are correct
        assert checkpoint_folder.model_count == 2
        lora_folder = next(f for f in folders if f.model_type == ModelType.LORA)
        assert lora_folder.model_count == 1
        vae_folder = next(f for f in folders if f.model_type == ModelType.VAE)
        assert vae_folder.model_count == 0