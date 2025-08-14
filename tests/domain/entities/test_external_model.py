"""Tests for external model domain entity."""

import pytest
from datetime import datetime
from src.domain.entities.external_model import (
    ExternalModel,
    ExternalPlatform,
    ComfyUIModelType,
    ComfyUICompatibility
)
from src.domain.entities.base import ValidationError


class TestComfyUICompatibility:
    """Test cases for ComfyUICompatibility value object."""
    
    def test_create_valid_compatibility(self):
        """Test creating a valid compatibility object."""
        compatibility = ComfyUICompatibility(
            is_compatible=True,
            model_folder="checkpoints",
            compatibility_notes="Works well with ComfyUI",
            required_nodes=["CheckpointLoaderSimple"]
        )
        
        assert compatibility.is_compatible is True
        assert compatibility.model_folder == "checkpoints"
        assert compatibility.compatibility_notes == "Works well with ComfyUI"
        assert compatibility.required_nodes == ["CheckpointLoaderSimple"]
    
    def test_create_minimal_compatibility(self):
        """Test creating compatibility with minimal required fields."""
        compatibility = ComfyUICompatibility(is_compatible=False)
        
        assert compatibility.is_compatible is False
        assert compatibility.model_folder is None
        assert compatibility.compatibility_notes is None
        assert compatibility.required_nodes == []
    
    def test_invalid_is_compatible_type(self):
        """Test validation fails for invalid is_compatible type."""
        with pytest.raises(ValidationError) as exc_info:
            ComfyUICompatibility(is_compatible="true")
        
        assert "is_compatible must be a boolean" in str(exc_info.value)
        assert exc_info.value.field == "is_compatible"
    
    def test_empty_model_folder(self):
        """Test validation fails for empty model folder."""
        with pytest.raises(ValidationError) as exc_info:
            ComfyUICompatibility(is_compatible=True, model_folder="")
        
        assert "model_folder cannot be empty" in str(exc_info.value)
        assert exc_info.value.field == "model_folder"
    
    def test_empty_compatibility_notes(self):
        """Test validation fails for empty compatibility notes."""
        with pytest.raises(ValidationError) as exc_info:
            ComfyUICompatibility(is_compatible=True, compatibility_notes="")
        
        assert "compatibility_notes cannot be empty" in str(exc_info.value)
        assert exc_info.value.field == "compatibility_notes"
    
    def test_invalid_required_nodes_type(self):
        """Test validation fails for invalid required_nodes type."""
        with pytest.raises(ValidationError) as exc_info:
            ComfyUICompatibility(is_compatible=True, required_nodes="node1,node2")
        
        assert "required_nodes must be a list" in str(exc_info.value)
        assert exc_info.value.field == "required_nodes"
    
    def test_empty_required_node(self):
        """Test validation fails for empty required node."""
        with pytest.raises(ValidationError) as exc_info:
            ComfyUICompatibility(is_compatible=True, required_nodes=["ValidNode", ""])
        
        assert "each required node must be a non-empty string" in str(exc_info.value)
        assert exc_info.value.field == "required_nodes"


class TestExternalModel:
    """Test cases for ExternalModel entity."""
    
    @pytest.fixture
    def valid_compatibility(self):
        """Fixture providing valid compatibility data."""
        return ComfyUICompatibility(
            is_compatible=True,
            model_folder="checkpoints",
            compatibility_notes="Compatible with ComfyUI",
            required_nodes=["CheckpointLoaderSimple"]
        )
    
    @pytest.fixture
    def valid_external_model_data(self, valid_compatibility):
        """Fixture providing valid external model data."""
        return {
            "id": "civitai:12345",
            "name": "Test Model",
            "description": "A test model for unit testing",
            "author": "TestAuthor",
            "platform": ExternalPlatform.CIVITAI,
            "thumbnail_url": "https://example.com/thumbnail.jpg",
            "tags": ["test", "model"],
            "download_count": 1000,
            "rating": 4.5,
            "created_at": datetime(2023, 1, 1, 12, 0, 0),
            "updated_at": datetime(2023, 1, 2, 12, 0, 0),
            "metadata": {"civitai_id": 12345},
            "comfyui_compatibility": valid_compatibility,
            "model_type": ComfyUIModelType.CHECKPOINT,
            "base_model": "SD1.5",
            "file_size": 2048000000,
            "file_format": "safetensors"
        }
    
    def test_create_valid_external_model(self, valid_external_model_data):
        """Test creating a valid external model."""
        model = ExternalModel(**valid_external_model_data)
        
        assert model.id == "civitai:12345"
        assert model.name == "Test Model"
        assert model.description == "A test model for unit testing"
        assert model.author == "TestAuthor"
        assert model.platform == ExternalPlatform.CIVITAI
        assert model.thumbnail_url == "https://example.com/thumbnail.jpg"
        assert model.tags == ["test", "model"]
        assert model.download_count == 1000
        assert model.rating == 4.5
        assert model.model_type == ComfyUIModelType.CHECKPOINT
        assert model.base_model == "SD1.5"
        assert model.file_size == 2048000000
        assert model.file_format == "safetensors"
    
    def test_create_minimal_external_model(self, valid_compatibility):
        """Test creating external model with minimal required fields."""
        model = ExternalModel(
            id="hf:test-model",
            name="Minimal Model",
            description="Minimal test model",
            author="MinimalAuthor",
            platform=ExternalPlatform.HUGGINGFACE,
            thumbnail_url=None,
            tags=[],
            download_count=0,
            rating=None,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            metadata={},
            comfyui_compatibility=valid_compatibility
        )
        
        assert model.id == "hf:test-model"
        assert model.name == "Minimal Model"
        assert model.thumbnail_url is None
        assert model.tags == []
        assert model.rating is None
        assert model.model_type is None
        assert model.base_model is None
        assert model.file_size is None
        assert model.file_format is None
    
    def test_empty_name_validation(self, valid_external_model_data):
        """Test validation fails for empty name."""
        valid_external_model_data["name"] = ""
        
        with pytest.raises(ValidationError) as exc_info:
            ExternalModel(**valid_external_model_data)
        
        assert "name cannot be empty" in str(exc_info.value)
        assert exc_info.value.field == "name"
    
    def test_empty_description_validation(self, valid_external_model_data):
        """Test validation fails for empty description."""
        valid_external_model_data["description"] = ""
        
        with pytest.raises(ValidationError) as exc_info:
            ExternalModel(**valid_external_model_data)
        
        assert "description cannot be empty" in str(exc_info.value)
        assert exc_info.value.field == "description"
    
    def test_empty_author_validation(self, valid_external_model_data):
        """Test validation fails for empty author."""
        valid_external_model_data["author"] = ""
        
        with pytest.raises(ValidationError) as exc_info:
            ExternalModel(**valid_external_model_data)
        
        assert "author cannot be empty" in str(exc_info.value)
        assert exc_info.value.field == "author"
    
    def test_invalid_platform_validation(self, valid_external_model_data):
        """Test validation fails for invalid platform."""
        valid_external_model_data["platform"] = "invalid_platform"
        
        with pytest.raises(ValidationError) as exc_info:
            ExternalModel(**valid_external_model_data)
        
        assert "platform must be a valid ExternalPlatform" in str(exc_info.value)
        assert exc_info.value.field == "platform"
    
    def test_empty_thumbnail_url_validation(self, valid_external_model_data):
        """Test validation fails for empty thumbnail URL."""
        valid_external_model_data["thumbnail_url"] = ""
        
        with pytest.raises(ValidationError) as exc_info:
            ExternalModel(**valid_external_model_data)
        
        assert "thumbnail_url cannot be empty" in str(exc_info.value)
        assert exc_info.value.field == "thumbnail_url"
    
    def test_invalid_tags_type_validation(self, valid_external_model_data):
        """Test validation fails for invalid tags type."""
        valid_external_model_data["tags"] = "tag1,tag2"
        
        with pytest.raises(ValidationError) as exc_info:
            ExternalModel(**valid_external_model_data)
        
        assert "tags must be a list" in str(exc_info.value)
        assert exc_info.value.field == "tags"
    
    def test_empty_tag_validation(self, valid_external_model_data):
        """Test validation fails for empty tag."""
        valid_external_model_data["tags"] = ["valid_tag", ""]
        
        with pytest.raises(ValidationError) as exc_info:
            ExternalModel(**valid_external_model_data)
        
        assert "each tag must be a non-empty string" in str(exc_info.value)
        assert exc_info.value.field == "tags"
    
    def test_negative_download_count_validation(self, valid_external_model_data):
        """Test validation fails for negative download count."""
        valid_external_model_data["download_count"] = -1
        
        with pytest.raises(ValidationError) as exc_info:
            ExternalModel(**valid_external_model_data)
        
        assert "download_count must be non-negative" in str(exc_info.value)
        assert exc_info.value.field == "download_count"
    
    def test_invalid_rating_range_validation(self, valid_external_model_data):
        """Test validation fails for rating outside valid range."""
        valid_external_model_data["rating"] = 6.0
        
        with pytest.raises(ValidationError) as exc_info:
            ExternalModel(**valid_external_model_data)
        
        assert "rating must be a number between 0 and 5" in str(exc_info.value)
        assert exc_info.value.field == "rating"
    
    def test_invalid_metadata_type_validation(self, valid_external_model_data):
        """Test validation fails for invalid metadata type."""
        valid_external_model_data["metadata"] = "not_a_dict"
        
        with pytest.raises(ValidationError) as exc_info:
            ExternalModel(**valid_external_model_data)
        
        assert "metadata must be a dictionary" in str(exc_info.value)
        assert exc_info.value.field == "metadata"
    
    def test_invalid_model_type_validation(self, valid_external_model_data):
        """Test validation fails for invalid model type."""
        valid_external_model_data["model_type"] = "invalid_type"
        
        with pytest.raises(ValidationError) as exc_info:
            ExternalModel(**valid_external_model_data)
        
        assert "model_type must be a valid ComfyUIModelType" in str(exc_info.value)
        assert exc_info.value.field == "model_type"
    
    def test_negative_file_size_validation(self, valid_external_model_data):
        """Test validation fails for negative file size."""
        valid_external_model_data["file_size"] = -1
        
        with pytest.raises(ValidationError) as exc_info:
            ExternalModel(**valid_external_model_data)
        
        assert "file_size must be positive" in str(exc_info.value)
        assert exc_info.value.field == "file_size"
    
    def test_properties(self, valid_external_model_data):
        """Test computed properties of external model."""
        model = ExternalModel(**valid_external_model_data)
        
        assert model.is_comfyui_compatible is True
        assert model.comfyui_model_folder == "checkpoints"
        assert model.platform_name == "civitai"
        assert model.model_type_name == "checkpoint"
    
    def test_get_all_tags(self, valid_external_model_data):
        """Test getting all tags including platform-specific ones."""
        valid_external_model_data["metadata"] = {"tags": ["platform_tag1", "platform_tag2"]}
        model = ExternalModel(**valid_external_model_data)
        
        all_tags = model.get_all_tags()
        assert "test" in all_tags
        assert "model" in all_tags
        assert "platform_tag1" in all_tags
        assert "platform_tag2" in all_tags
        assert len(set(all_tags)) == len(all_tags)  # No duplicates
    
    def test_get_primary_description(self, valid_external_model_data):
        """Test getting primary description."""
        # Test with platform-specific description
        valid_external_model_data["metadata"] = {"description": "Platform-specific description"}
        model = ExternalModel(**valid_external_model_data)
        
        assert model.get_primary_description() == "Platform-specific description"
        
        # Test fallback to main description
        valid_external_model_data["metadata"] = {}
        model = ExternalModel(**valid_external_model_data)
        
        assert model.get_primary_description() == "A test model for unit testing"
    
    def test_to_dict(self, valid_external_model_data):
        """Test converting external model to dictionary."""
        model = ExternalModel(**valid_external_model_data)
        model_dict = model.to_dict()
        
        assert model_dict["id"] == "civitai:12345"
        assert model_dict["name"] == "Test Model"
        assert model_dict["platform"] == "civitai"
        assert model_dict["model_type"] == "checkpoint"
        assert model_dict["is_comfyui_compatible"] is True
        assert model_dict["comfyui_model_folder"] == "checkpoints"
        assert "comfyui_compatibility" in model_dict
        assert isinstance(model_dict["all_tags"], list)
    
    def test_from_dict(self, valid_external_model_data):
        """Test creating external model from dictionary."""
        model = ExternalModel(**valid_external_model_data)
        model_dict = model.to_dict()
        
        # Create new model from dictionary
        new_model = ExternalModel.from_dict(model_dict)
        
        assert new_model.id == model.id
        assert new_model.name == model.name
        assert new_model.platform == model.platform
        assert new_model.model_type == model.model_type
        assert new_model.is_comfyui_compatible == model.is_comfyui_compatible