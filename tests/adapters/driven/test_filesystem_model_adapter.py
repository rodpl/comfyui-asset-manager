"""Tests for FileSystemModelAdapter."""

import hashlib
import os
import tempfile
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
import uuid
import pytest

from src.adapters.driven.filesystem_model_adapter import FileSystemModelAdapter
from src.domain.entities.model import Model, ModelType
from src.domain.entities.folder import Folder


class TestFileSystemModelAdapter:
    """Test cases for FileSystemModelAdapter."""
    
    @pytest.fixture
    def mock_folder_repository(self):
        """Mock folder repository."""
        mock_repo = Mock()
        return mock_repo
    
    @pytest.fixture
    def adapter(self, mock_folder_repository):
        """Create adapter with mocked folder repository."""
        return FileSystemModelAdapter(mock_folder_repository)
    
    @pytest.fixture
    def sample_folder(self):
        """Create a sample folder for testing."""
        return Folder(
            id="test_folder_id",
            name="Test Checkpoints",
            path="/test/checkpoints",
            model_type=ModelType.CHECKPOINT,
            model_count=0
        )
    
    @pytest.fixture
    def temp_model_files(self):
        """Create temporary model files for testing."""
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Create checkpoint folder with model files
            checkpoint_dir = temp_path / "checkpoints"
            checkpoint_dir.mkdir()
            
            # Create model files with different extensions
            model1_path = checkpoint_dir / "model1.safetensors"
            model2_path = checkpoint_dir / "model2.ckpt"
            model3_path = checkpoint_dir / "model3.pt"
            
            # Write some content to files
            model1_path.write_bytes(b"fake safetensors content")
            model2_path.write_bytes(b"fake ckpt content")
            model3_path.write_bytes(b"fake pt content")
            
            # Create a thumbnail for model1
            thumbnail_path = checkpoint_dir / "model1.png"
            thumbnail_path.write_bytes(b"fake png content")
            
            # Create a non-model file
            readme_path = checkpoint_dir / "readme.txt"
            readme_path.write_text("This is a readme file")
            
            # Create lora folder with one model
            lora_dir = temp_path / "loras"
            lora_dir.mkdir()
            lora_model_path = lora_dir / "lora1.safetensors"
            lora_model_path.write_bytes(b"fake lora content")
            
            yield {
                "checkpoint_dir": str(checkpoint_dir),
                "lora_dir": str(lora_dir),
                "model_files": {
                    "model1": str(model1_path),
                    "model2": str(model2_path),
                    "model3": str(model3_path),
                    "lora1": str(lora_model_path)
                },
                "thumbnail": str(thumbnail_path),
                "readme": str(readme_path)
            }
    
    def test_initialization(self, mock_folder_repository):
        """Test adapter initialization."""
        adapter = FileSystemModelAdapter(mock_folder_repository)
        
        assert adapter._folder_repository == mock_folder_repository
        assert adapter._models_cache == {}
        assert adapter._cache_timestamp is None
        assert adapter._cache_ttl_seconds == 300
    
    def test_supported_extensions(self, adapter):
        """Test supported file extensions."""
        extensions = adapter._supported_extensions
        expected = {'.safetensors', '.ckpt', '.pt', '.pth', '.bin'}
        assert extensions == expected
    
    def test_cache_validity(self, adapter):
        """Test cache validity checking."""
        # Initially cache is invalid
        assert not adapter._is_cache_valid()
        
        # Set timestamp to now - cache should be valid
        adapter._cache_timestamp = datetime.now()
        assert adapter._is_cache_valid()
        
        # Set timestamp to old time - cache should be invalid
        adapter._cache_timestamp = datetime.now() - timedelta(seconds=400)
        assert not adapter._is_cache_valid()
    
    def test_cache_invalidation(self, adapter):
        """Test cache invalidation."""
        # Set up cache
        adapter._models_cache = {"test": "model"}
        adapter._cache_timestamp = datetime.now()
        
        # Invalidate cache
        adapter._invalidate_cache()
        
        assert adapter._models_cache == {}
        assert adapter._cache_timestamp is None
    
    def test_generate_model_hash_success(self, adapter, temp_model_files):
        """Test successful model hash generation."""
        model_path = temp_model_files["model_files"]["model1"]
        
        hash_result = adapter._generate_model_hash(model_path)
        
        # Should return a valid SHA256 hash
        assert len(hash_result) == 64
        assert all(c in '0123456789abcdef' for c in hash_result)
        
        # Same file should produce same hash
        hash_result2 = adapter._generate_model_hash(model_path)
        assert hash_result == hash_result2
    
    def test_generate_model_hash_file_error(self, adapter):
        """Test model hash generation with file read error."""
        non_existent_path = "/non/existent/file.safetensors"
        
        hash_result = adapter._generate_model_hash(non_existent_path)
        
        # Should return a fallback hash
        assert len(hash_result) == 64
        assert all(c in '0123456789abcdef' for c in hash_result)
    
    def test_find_thumbnail_path_found(self, adapter, temp_model_files):
        """Test finding thumbnail when it exists."""
        model_path = temp_model_files["model_files"]["model1"]
        
        thumbnail_path = adapter._find_thumbnail_path(model_path)
        
        assert thumbnail_path is not None
        assert thumbnail_path.endswith("model1.png")
        assert os.path.exists(thumbnail_path)
    
    def test_find_thumbnail_path_not_found(self, adapter, temp_model_files):
        """Test finding thumbnail when it doesn't exist."""
        model_path = temp_model_files["model_files"]["model2"]
        
        thumbnail_path = adapter._find_thumbnail_path(model_path)
        
        assert thumbnail_path is None
    
    def test_extract_model_metadata_success(self, adapter, temp_model_files, sample_folder):
        """Test successful model metadata extraction."""
        model_path = temp_model_files["model_files"]["model1"]
        sample_folder.path = temp_model_files["checkpoint_dir"]
        
        model = adapter._extract_model_metadata(model_path, sample_folder)
        
        assert model is not None
        assert model.name == "model1"
        assert model.file_path == str(Path(model_path).absolute())
        assert model.file_size > 0
        assert isinstance(model.created_at, datetime)
        assert isinstance(model.modified_at, datetime)
        assert model.model_type == ModelType.CHECKPOINT
        assert len(model.hash) == 64
        assert model.folder_id == sample_folder.id
        assert model.thumbnail_path is not None
    
    def test_extract_model_metadata_unsupported_extension(self, adapter, temp_model_files, sample_folder):
        """Test metadata extraction with unsupported file extension."""
        readme_path = temp_model_files["readme"]
        
        model = adapter._extract_model_metadata(readme_path, sample_folder)
        
        assert model is None
    
    def test_extract_model_metadata_non_existent_file(self, adapter, sample_folder):
        """Test metadata extraction with non-existent file."""
        non_existent_path = "/non/existent/file.safetensors"
        
        model = adapter._extract_model_metadata(non_existent_path, sample_folder)
        
        assert model is None
    
    def test_scan_folder_for_models(self, adapter, temp_model_files, sample_folder):
        """Test scanning folder for models."""
        sample_folder.path = temp_model_files["checkpoint_dir"]
        
        models = adapter._scan_folder_for_models(sample_folder)
        
        # Should find 3 model files (model1.safetensors, model2.ckpt, model3.pt)
        assert len(models) == 3
        
        model_names = {model.name for model in models}
        assert model_names == {"model1", "model2", "model3"}
        
        # All models should have the correct folder_id
        for model in models:
            assert model.folder_id == sample_folder.id
            assert model.model_type == ModelType.CHECKPOINT
    
    def test_scan_folder_for_models_non_existent_folder(self, adapter, sample_folder):
        """Test scanning non-existent folder."""
        sample_folder.path = "/non/existent/folder"
        
        models = adapter._scan_folder_for_models(sample_folder)
        
        assert models == []
    
    def test_refresh_models_cache(self, adapter, temp_model_files, mock_folder_repository):
        """Test refreshing models cache."""
        # Set up folders
        checkpoint_folder = Folder(
            id="checkpoint_folder",
            name="Checkpoints",
            path=temp_model_files["checkpoint_dir"],
            model_type=ModelType.CHECKPOINT,
            model_count=0
        )
        
        lora_folder = Folder(
            id="lora_folder",
            name="LoRAs",
            path=temp_model_files["lora_dir"],
            model_type=ModelType.LORA,
            model_count=0
        )
        
        mock_folder_repository.get_all_folders.return_value = [checkpoint_folder, lora_folder]
        
        # Refresh cache
        adapter._refresh_models_cache()
        
        # Should have cached models from both folders
        assert len(adapter._models_cache) == 4  # 3 checkpoint + 1 lora
        assert adapter._cache_timestamp is not None
        
        # Check model types
        checkpoint_models = [m for m in adapter._models_cache.values() if m.model_type == ModelType.CHECKPOINT]
        lora_models = [m for m in adapter._models_cache.values() if m.model_type == ModelType.LORA]
        
        assert len(checkpoint_models) == 3
        assert len(lora_models) == 1
    
    def test_find_all_in_folder(self, adapter, temp_model_files, mock_folder_repository):
        """Test finding all models in a specific folder."""
        # Set up test data
        checkpoint_folder = Folder(
            id="checkpoint_folder",
            name="Checkpoints",
            path=temp_model_files["checkpoint_dir"],
            model_type=ModelType.CHECKPOINT,
            model_count=0
        )
        
        mock_folder_repository.get_all_folders.return_value = [checkpoint_folder]
        
        # Find models in folder
        models = adapter.find_all_in_folder("checkpoint_folder")
        
        assert len(models) == 3
        for model in models:
            assert model.folder_id == "checkpoint_folder"
            assert model.model_type == ModelType.CHECKPOINT
    
    def test_find_by_id(self, adapter, temp_model_files, mock_folder_repository):
        """Test finding model by ID."""
        # Set up test data
        checkpoint_folder = Folder(
            id="checkpoint_folder",
            name="Checkpoints",
            path=temp_model_files["checkpoint_dir"],
            model_type=ModelType.CHECKPOINT,
            model_count=0
        )
        
        mock_folder_repository.get_all_folders.return_value = [checkpoint_folder]
        
        # First, get all models to populate cache
        models = adapter.find_all_in_folder("checkpoint_folder")
        test_model = models[0]
        
        # Find by ID
        found_model = adapter.find_by_id(test_model.id)
        
        assert found_model is not None
        assert found_model.id == test_model.id
        assert found_model.name == test_model.name
        
        # Test non-existent ID
        not_found = adapter.find_by_id("non_existent_id")
        assert not_found is None
    
    def test_search_empty_query(self, adapter, temp_model_files, mock_folder_repository):
        """Test search with empty query."""
        # Set up test data
        checkpoint_folder = Folder(
            id="checkpoint_folder",
            name="Checkpoints",
            path=temp_model_files["checkpoint_dir"],
            model_type=ModelType.CHECKPOINT,
            model_count=0
        )
        
        mock_folder_repository.get_all_folders.return_value = [checkpoint_folder]
        
        # Search with empty query
        results = adapter.search("")
        
        # Should return all models
        assert len(results) == 3
    
    def test_search_by_name(self, adapter, temp_model_files, mock_folder_repository):
        """Test search by model name."""
        # Set up test data
        checkpoint_folder = Folder(
            id="checkpoint_folder",
            name="Checkpoints",
            path=temp_model_files["checkpoint_dir"],
            model_type=ModelType.CHECKPOINT,
            model_count=0
        )
        
        mock_folder_repository.get_all_folders.return_value = [checkpoint_folder]
        
        # Search for specific model
        results = adapter.search("model1")
        
        assert len(results) == 1
        assert results[0].name == "model1"
        
        # Search with partial name
        results = adapter.search("model")
        
        assert len(results) == 3  # All models contain "model"
    
    def test_search_with_folder_filter(self, adapter, temp_model_files, mock_folder_repository):
        """Test search with folder filter."""
        # Set up test data
        checkpoint_folder = Folder(
            id="checkpoint_folder",
            name="Checkpoints",
            path=temp_model_files["checkpoint_dir"],
            model_type=ModelType.CHECKPOINT,
            model_count=0
        )
        
        lora_folder = Folder(
            id="lora_folder",
            name="LoRAs",
            path=temp_model_files["lora_dir"],
            model_type=ModelType.LORA,
            model_count=0
        )
        
        mock_folder_repository.get_all_folders.return_value = [checkpoint_folder, lora_folder]
        
        # Search in specific folder
        results = adapter.search("", folder_id="checkpoint_folder")
        
        assert len(results) == 3
        for model in results:
            assert model.folder_id == "checkpoint_folder"
        
        # Search in lora folder
        results = adapter.search("", folder_id="lora_folder")
        
        assert len(results) == 1
        assert results[0].folder_id == "lora_folder"
    
    def test_search_by_user_metadata(self, adapter, temp_model_files, mock_folder_repository):
        """Test search by user metadata (tags and description)."""
        # Set up test data
        checkpoint_folder = Folder(
            id="checkpoint_folder",
            name="Checkpoints",
            path=temp_model_files["checkpoint_dir"],
            model_type=ModelType.CHECKPOINT,
            model_count=0
        )
        
        mock_folder_repository.get_all_folders.return_value = [checkpoint_folder]
        
        # Get models and add user metadata
        models = adapter.find_all_in_folder("checkpoint_folder")
        test_model = models[0]
        test_model.add_user_tag("anime")
        test_model.add_user_tag("realistic")
        test_model.set_user_description("A great model for portraits")
        
        # Update cache
        adapter._models_cache[test_model.id] = test_model
        
        # Search by tag
        results = adapter.search("anime")
        assert len(results) == 1
        assert results[0].id == test_model.id
        
        # Search by description
        results = adapter.search("portraits")
        assert len(results) == 1
        assert results[0].id == test_model.id
        
        # Search by non-existent tag
        results = adapter.search("nonexistent")
        assert len(results) == 0
    
    def test_save_model(self, adapter):
        """Test saving model to cache."""
        test_model = Model(
            id="test_id",
            name="Test Model",
            file_path="/test/path.safetensors",
            file_size=1024,
            created_at=datetime.now(),
            modified_at=datetime.now(),
            model_type=ModelType.CHECKPOINT,
            hash="test_hash",
            folder_id="test_folder"
        )
        
        adapter.save(test_model)
        
        assert adapter._models_cache["test_id"] == test_model
    
    def test_delete_model(self, adapter):
        """Test deleting model from cache."""
        test_model = Model(
            id="test_id",
            name="Test Model",
            file_path="/test/path.safetensors",
            file_size=1024,
            created_at=datetime.now(),
            modified_at=datetime.now(),
            model_type=ModelType.CHECKPOINT,
            hash="test_hash",
            folder_id="test_folder"
        )
        
        # Add to cache
        adapter._models_cache["test_id"] = test_model
        
        # Delete existing model
        result = adapter.delete("test_id")
        assert result is True
        assert "test_id" not in adapter._models_cache
        
        # Delete non-existent model
        result = adapter.delete("non_existent")
        assert result is False
    
    def test_get_all_models(self, adapter, temp_model_files, mock_folder_repository):
        """Test getting all models."""
        # Set up test data
        checkpoint_folder = Folder(
            id="checkpoint_folder",
            name="Checkpoints",
            path=temp_model_files["checkpoint_dir"],
            model_type=ModelType.CHECKPOINT,
            model_count=0
        )
        
        lora_folder = Folder(
            id="lora_folder",
            name="LoRAs",
            path=temp_model_files["lora_dir"],
            model_type=ModelType.LORA,
            model_count=0
        )
        
        mock_folder_repository.get_all_folders.return_value = [checkpoint_folder, lora_folder]
        
        # Get all models
        models = adapter.get_all_models()
        
        assert len(models) == 4  # 3 checkpoint + 1 lora
        
        model_types = {model.model_type for model in models}
        assert ModelType.CHECKPOINT in model_types
        assert ModelType.LORA in model_types
    
    def test_get_models_by_type(self, adapter, temp_model_files, mock_folder_repository):
        """Test getting models by type."""
        # Set up test data
        checkpoint_folder = Folder(
            id="checkpoint_folder",
            name="Checkpoints",
            path=temp_model_files["checkpoint_dir"],
            model_type=ModelType.CHECKPOINT,
            model_count=0
        )
        
        lora_folder = Folder(
            id="lora_folder",
            name="LoRAs",
            path=temp_model_files["lora_dir"],
            model_type=ModelType.LORA,
            model_count=0
        )
        
        mock_folder_repository.get_all_folders.return_value = [checkpoint_folder, lora_folder]
        
        # Get checkpoint models
        checkpoint_models = adapter.get_models_by_type(ModelType.CHECKPOINT)
        assert len(checkpoint_models) == 3
        for model in checkpoint_models:
            assert model.model_type == ModelType.CHECKPOINT
        
        # Get lora models
        lora_models = adapter.get_models_by_type(ModelType.LORA)
        assert len(lora_models) == 1
        for model in lora_models:
            assert model.model_type == ModelType.LORA
        
        # Get models of type that doesn't exist
        vae_models = adapter.get_models_by_type(ModelType.VAE)
        assert len(vae_models) == 0
    
    def test_cache_behavior_with_multiple_calls(self, adapter, temp_model_files, mock_folder_repository):
        """Test that cache is used efficiently across multiple calls."""
        # Set up test data
        checkpoint_folder = Folder(
            id="checkpoint_folder",
            name="Checkpoints",
            path=temp_model_files["checkpoint_dir"],
            model_type=ModelType.CHECKPOINT,
            model_count=0
        )
        
        mock_folder_repository.get_all_folders.return_value = [checkpoint_folder]
        
        # First call should populate cache
        models1 = adapter.find_all_in_folder("checkpoint_folder")
        call_count_1 = mock_folder_repository.get_all_folders.call_count
        
        # Second call should use cache
        models2 = adapter.find_all_in_folder("checkpoint_folder")
        call_count_2 = mock_folder_repository.get_all_folders.call_count
        
        # Should not have called folder repository again
        assert call_count_2 == call_count_1
        assert len(models1) == len(models2) == 3
    
    @pytest.mark.integration
    def test_integration_with_real_files(self, temp_model_files):
        """Integration test with real file system."""
        # Create real folder repository mock that returns actual folders
        mock_folder_repo = Mock()
        
        checkpoint_folder = Folder(
            id="checkpoint_folder",
            name="Checkpoints",
            path=temp_model_files["checkpoint_dir"],
            model_type=ModelType.CHECKPOINT,
            model_count=0
        )
        
        lora_folder = Folder(
            id="lora_folder",
            name="LoRAs",
            path=temp_model_files["lora_dir"],
            model_type=ModelType.LORA,
            model_count=0
        )
        
        mock_folder_repo.get_all_folders.return_value = [checkpoint_folder, lora_folder]
        
        # Create adapter
        adapter = FileSystemModelAdapter(mock_folder_repo)
        
        # Test complete workflow
        all_models = adapter.get_all_models()
        assert len(all_models) == 4
        
        # Test search functionality
        search_results = adapter.search("model1")
        assert len(search_results) == 1
        assert search_results[0].name == "model1"
        
        # Test folder filtering
        checkpoint_models = adapter.find_all_in_folder("checkpoint_folder")
        assert len(checkpoint_models) == 3
        
        lora_models = adapter.find_all_in_folder("lora_folder")
        assert len(lora_models) == 1
        
        # Test model details
        test_model = checkpoint_models[0]
        assert test_model.file_size > 0
        assert test_model.hash is not None
        assert len(test_model.hash) == 64
        assert test_model.model_type == ModelType.CHECKPOINT
        
        # Test finding by ID
        found_model = adapter.find_by_id(test_model.id)
        assert found_model == test_model