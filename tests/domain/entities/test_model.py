"""Tests for Model domain entity."""

import pytest
from datetime import datetime
from src.domain.entities import Model, ModelType, ValidationError


@pytest.fixture
def sample_datetime():
    """Fixture providing a consistent datetime for tests."""
    return datetime(2024, 1, 15, 10, 30, 0)


@pytest.fixture
def valid_model_data(sample_datetime):
    """Fixture providing valid model data for tests."""
    return {
        "id": "model-1",
        "name": "Test Model",
        "file_path": "/path/to/model.safetensors",
        "file_size": 1024,
        "created_at": sample_datetime,
        "modified_at": sample_datetime,
        "model_type": ModelType.CHECKPOINT,
        "hash": "abc123",
        "folder_id": "folder-1"
    }


@pytest.fixture
def sample_model(valid_model_data):
    """Fixture providing a sample Model instance for tests."""
    return Model(**valid_model_data)


def test_create_valid_model(sample_model):
    """Test creating a valid model."""
    assert sample_model.id == "model-1"
    assert sample_model.name == "Test Model"
    assert sample_model.model_type == ModelType.CHECKPOINT
    assert sample_model.file_name == "model.safetensors"
    assert sample_model.file_extension == ".safetensors"


def test_model_validation_empty_name(valid_model_data):
    """Test model validation with empty name."""
    valid_model_data["name"] = ""
    
    with pytest.raises(ValidationError) as exc_info:
        Model(**valid_model_data)
    
    assert exc_info.value.field == "name"


def test_model_validation_negative_file_size(valid_model_data):
    """Test model validation with negative file size."""
    valid_model_data["file_size"] = -1
    
    with pytest.raises(ValidationError) as exc_info:
        Model(**valid_model_data)
    
    assert exc_info.value.field == "file_size"


def test_add_user_tag(sample_model):
    """Test adding user tags."""
    sample_model.add_user_tag("anime")
    sample_model.add_user_tag("portrait")
    
    assert "tags" in sample_model.user_metadata
    assert "anime" in sample_model.user_metadata["tags"]
    assert "portrait" in sample_model.user_metadata["tags"]
    assert len(sample_model.user_metadata["tags"]) == 2


def test_add_duplicate_user_tag(sample_model):
    """Test adding duplicate user tags."""
    sample_model.add_user_tag("anime")
    sample_model.add_user_tag("anime")  # Duplicate
    
    assert len(sample_model.user_metadata["tags"]) == 1
    assert sample_model.user_metadata["tags"][0] == "anime"


def test_remove_user_tag(sample_model):
    """Test removing user tags."""
    sample_model.add_user_tag("anime")
    sample_model.add_user_tag("portrait")
    
    sample_model.remove_user_tag("anime")
    
    assert "portrait" in sample_model.user_metadata["tags"]
    assert "anime" not in sample_model.user_metadata["tags"]
    assert len(sample_model.user_metadata["tags"]) == 1


def test_remove_nonexistent_user_tag(sample_model):
    """Test removing a tag that doesn't exist."""
    sample_model.add_user_tag("anime")
    sample_model.remove_user_tag("nonexistent")  # Should not raise error
    
    assert len(sample_model.user_metadata["tags"]) == 1
    assert sample_model.user_metadata["tags"][0] == "anime"


def test_set_user_rating(sample_model):
    """Test setting user rating."""
    sample_model.set_user_rating(4)
    assert sample_model.user_metadata["rating"] == 4


def test_set_invalid_user_rating(sample_model):
    """Test setting invalid user rating."""
    with pytest.raises(ValidationError):
        sample_model.set_user_rating(6)  # Invalid rating (too high)
    
    with pytest.raises(ValidationError):
        sample_model.set_user_rating(0)  # Invalid rating (too low)


def test_set_user_description(sample_model):
    """Test setting user description."""
    description = "This is a great model for portraits"
    sample_model.set_user_description(description)
    
    assert sample_model.user_metadata["description"] == description


def test_set_empty_user_description(sample_model):
    """Test setting empty user description."""
    with pytest.raises(ValidationError) as exc_info:
        sample_model.set_user_description("")
    
    assert exc_info.value.field == "description"


def test_to_dict_and_from_dict(sample_model):
    """Test serialization and deserialization."""
    model_dict = sample_model.to_dict()
    reconstructed = Model.from_dict(model_dict)
    
    assert reconstructed.id == sample_model.id
    assert reconstructed.name == sample_model.name
    assert reconstructed.model_type == sample_model.model_type
    assert reconstructed.created_at == sample_model.created_at
    assert reconstructed.file_name == sample_model.file_name
    assert reconstructed.file_extension == sample_model.file_extension


def test_model_equality(valid_model_data):
    """Test model equality based on ID."""
    model1 = Model(**valid_model_data)
    model2 = Model(**valid_model_data)
    
    assert model1 == model2  # Same ID
    
    # Different ID should not be equal
    valid_model_data["id"] = "model-2"
    model3 = Model(**valid_model_data)
    
    assert model1 != model3


def test_model_properties(sample_model):
    """Test model computed properties."""
    assert sample_model.file_name == "model.safetensors"
    assert sample_model.file_extension == ".safetensors"
    
    # Test with different file extension
    sample_model.file_path = "/path/to/model.ckpt"
    assert sample_model.file_name == "model.ckpt"
    assert sample_model.file_extension == ".ckpt"