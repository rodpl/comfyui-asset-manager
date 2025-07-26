"""Tests for Model domain entity."""

import pytest
from datetime import datetime
from src.domain.entities import Model, ModelType, ValidationError


class TestModel:
    """Test cases for Model entity."""
    
    def test_create_valid_model(self):
        """Test creating a valid model."""
        model = Model(
            id="model-1",
            name="Test Model",
            file_path="/path/to/model.safetensors",
            file_size=1024,
            created_at=datetime.now(),
            modified_at=datetime.now(),
            model_type=ModelType.CHECKPOINT,
            hash="abc123",
            folder_id="folder-1"
        )
        
        assert model.id == "model-1"
        assert model.name == "Test Model"
        assert model.model_type == ModelType.CHECKPOINT
        assert model.file_name == "model.safetensors"
        assert model.file_extension == ".safetensors"
    
    def test_model_validation_empty_name(self):
        """Test model validation with empty name."""
        with pytest.raises(ValidationError) as exc_info:
            Model(
                id="model-1",
                name="",
                file_path="/path/to/model.safetensors",
                file_size=1024,
                created_at=datetime.now(),
                modified_at=datetime.now(),
                model_type=ModelType.CHECKPOINT,
                hash="abc123",
                folder_id="folder-1"
            )
        
        assert exc_info.value.field == "name"
    
    def test_model_validation_negative_file_size(self):
        """Test model validation with negative file size."""
        with pytest.raises(ValidationError) as exc_info:
            Model(
                id="model-1",
                name="Test Model",
                file_path="/path/to/model.safetensors",
                file_size=-1,
                created_at=datetime.now(),
                modified_at=datetime.now(),
                model_type=ModelType.CHECKPOINT,
                hash="abc123",
                folder_id="folder-1"
            )
        
        assert exc_info.value.field == "file_size"
    
    def test_add_user_tag(self):
        """Test adding user tags."""
        model = Model(
            id="model-1",
            name="Test Model",
            file_path="/path/to/model.safetensors",
            file_size=1024,
            created_at=datetime.now(),
            modified_at=datetime.now(),
            model_type=ModelType.CHECKPOINT,
            hash="abc123",
            folder_id="folder-1"
        )
        
        model.add_user_tag("anime")
        model.add_user_tag("portrait")
        
        assert "tags" in model.user_metadata
        assert "anime" in model.user_metadata["tags"]
        assert "portrait" in model.user_metadata["tags"]
        assert len(model.user_metadata["tags"]) == 2
    
    def test_set_user_rating(self):
        """Test setting user rating."""
        model = Model(
            id="model-1",
            name="Test Model",
            file_path="/path/to/model.safetensors",
            file_size=1024,
            created_at=datetime.now(),
            modified_at=datetime.now(),
            model_type=ModelType.CHECKPOINT,
            hash="abc123",
            folder_id="folder-1"
        )
        
        model.set_user_rating(4)
        assert model.user_metadata["rating"] == 4
        
        with pytest.raises(ValidationError):
            model.set_user_rating(6)  # Invalid rating
    
    def test_to_dict_and_from_dict(self):
        """Test serialization and deserialization."""
        now = datetime.now()
        model = Model(
            id="model-1",
            name="Test Model",
            file_path="/path/to/model.safetensors",
            file_size=1024,
            created_at=now,
            modified_at=now,
            model_type=ModelType.CHECKPOINT,
            hash="abc123",
            folder_id="folder-1"
        )
        
        model_dict = model.to_dict()
        reconstructed = Model.from_dict(model_dict)
        
        assert reconstructed.id == model.id
        assert reconstructed.name == model.name
        assert reconstructed.model_type == model.model_type
        assert reconstructed.created_at == model.created_at