"""Tests for model service metadata management functionality."""

import pytest
from unittest.mock import Mock, MagicMock
from datetime import datetime

from src.domain.services.model_service import ModelService
from src.domain.entities.model import Model, ModelType
from src.domain.entities.base import ValidationError, NotFoundError


@pytest.fixture
def mock_model_repository():
    """Mock model repository for testing."""
    return Mock()


@pytest.fixture
def mock_external_metadata_port():
    """Mock external metadata port for testing."""
    return Mock()


@pytest.fixture
def model_service(mock_model_repository, mock_external_metadata_port):
    """Create model service with mocked dependencies."""
    return ModelService(mock_model_repository, mock_external_metadata_port)


@pytest.fixture
def sample_model():
    """Create a sample model for testing."""
    return Model(
        id="test-model-1",
        name="Test Model",
        file_path="/path/to/model.safetensors",
        file_size=1024,
        created_at=datetime.now(),
        modified_at=datetime.now(),
        model_type=ModelType.CHECKPOINT,
        hash="abc123",
        folder_id="test-folder",
        user_metadata={"tags": ["existing"], "description": "Original description", "rating": 3}
    )


class TestUpdateModelMetadata:
    """Test cases for update_model_metadata method."""
    
    def test_update_model_metadata_success(self, model_service, mock_model_repository, sample_model):
        """Test successful metadata update."""
        # Arrange
        mock_model_repository.find_by_id.return_value = sample_model
        mock_model_repository.save.return_value = None
        
        metadata_update = {
            "tags": ["new", "tags"],
            "description": "New description",
            "rating": 5
        }
        
        # Act
        result = model_service.update_model_metadata("test-model-1", metadata_update)
        
        # Assert
        assert result.user_metadata["tags"] == ["new", "tags"]
        assert result.user_metadata["description"] == "New description"
        assert result.user_metadata["rating"] == 5
        mock_model_repository.save.assert_called_once()
    
    def test_update_model_metadata_partial_update(self, model_service, mock_model_repository, sample_model):
        """Test partial metadata update (only tags)."""
        # Arrange
        mock_model_repository.find_by_id.return_value = sample_model
        mock_model_repository.save.return_value = None
        
        metadata_update = {"tags": ["updated", "tags"]}
        
        # Act
        result = model_service.update_model_metadata("test-model-1", metadata_update)
        
        # Assert
        assert result.user_metadata["tags"] == ["updated", "tags"]
        assert result.user_metadata["description"] == "Original description"  # Unchanged
        assert result.user_metadata["rating"] == 3  # Unchanged
        mock_model_repository.save.assert_called_once()
    
    def test_update_model_metadata_clear_values(self, model_service, mock_model_repository, sample_model):
        """Test clearing metadata values by setting to None."""
        # Arrange
        mock_model_repository.find_by_id.return_value = sample_model
        mock_model_repository.save.return_value = None
        
        metadata_update = {
            "description": None,
            "rating": None
        }
        
        # Act
        result = model_service.update_model_metadata("test-model-1", metadata_update)
        
        # Assert
        assert "description" not in result.user_metadata
        assert "rating" not in result.user_metadata
        assert result.user_metadata["tags"] == ["existing"]  # Unchanged
        mock_model_repository.save.assert_called_once()
    
    def test_update_model_metadata_empty_model_id(self, model_service):
        """Test update with empty model ID."""
        with pytest.raises(ValidationError) as exc_info:
            model_service.update_model_metadata("", {"tags": ["test"]})
        
        assert exc_info.value.field == "model_id"
        assert "cannot be empty" in exc_info.value.message
    
    def test_update_model_metadata_invalid_metadata_type(self, model_service):
        """Test update with invalid metadata type."""
        with pytest.raises(ValidationError) as exc_info:
            model_service.update_model_metadata("test-model-1", "invalid")
        
        assert exc_info.value.field == "metadata"
        assert "must be a dictionary" in exc_info.value.message
    
    def test_update_model_metadata_model_not_found(self, model_service, mock_model_repository):
        """Test update when model is not found."""
        # Arrange
        mock_model_repository.find_by_id.return_value = None
        
        # Act & Assert
        with pytest.raises(NotFoundError) as exc_info:
            model_service.update_model_metadata("nonexistent", {"tags": ["test"]})
        
        assert exc_info.value.entity_type == "Model"
        assert exc_info.value.identifier == "nonexistent"
    
    def test_update_model_metadata_invalid_tags_type(self, model_service, mock_model_repository, sample_model):
        """Test update with invalid tags type."""
        # Arrange
        mock_model_repository.find_by_id.return_value = sample_model
        
        # Act & Assert
        with pytest.raises(ValidationError) as exc_info:
            model_service.update_model_metadata("test-model-1", {"tags": "invalid"})
        
        assert exc_info.value.field == "tags"
        assert "must be a list" in exc_info.value.message
    
    def test_update_model_metadata_invalid_tag_content(self, model_service, mock_model_repository, sample_model):
        """Test update with invalid tag content."""
        # Arrange
        mock_model_repository.find_by_id.return_value = sample_model
        
        # Act & Assert
        with pytest.raises(ValidationError) as exc_info:
            model_service.update_model_metadata("test-model-1", {"tags": ["valid", "", "also-valid"]})
        
        assert exc_info.value.field == "tags"
        assert "non-empty string" in exc_info.value.message
    
    def test_update_model_metadata_invalid_description_type(self, model_service, mock_model_repository, sample_model):
        """Test update with invalid description type."""
        # Arrange
        mock_model_repository.find_by_id.return_value = sample_model
        
        # Act & Assert
        with pytest.raises(ValidationError) as exc_info:
            model_service.update_model_metadata("test-model-1", {"description": 123})
        
        assert exc_info.value.field == "description"
        assert "must be a string" in exc_info.value.message
    
    def test_update_model_metadata_invalid_rating_type(self, model_service, mock_model_repository, sample_model):
        """Test update with invalid rating type."""
        # Arrange
        mock_model_repository.find_by_id.return_value = sample_model
        
        # Act & Assert
        with pytest.raises(ValidationError) as exc_info:
            model_service.update_model_metadata("test-model-1", {"rating": "invalid"})
        
        assert exc_info.value.field == "rating"
        assert "must be an integer between 1 and 5" in exc_info.value.message
    
    def test_update_model_metadata_invalid_rating_range(self, model_service, mock_model_repository, sample_model):
        """Test update with rating out of valid range."""
        # Arrange
        mock_model_repository.find_by_id.return_value = sample_model
        
        # Act & Assert
        with pytest.raises(ValidationError) as exc_info:
            model_service.update_model_metadata("test-model-1", {"rating": 6})
        
        assert exc_info.value.field == "rating"
        assert "must be an integer between 1 and 5" in exc_info.value.message


class TestBulkUpdateMetadata:
    """Test cases for bulk_update_metadata method."""
    
    def test_bulk_update_metadata_success(self, model_service, mock_model_repository):
        """Test successful bulk metadata update."""
        # Arrange
        model1 = Model(
            id="model-1", name="Model 1", file_path="/path/1", file_size=1024,
            created_at=datetime.now(), modified_at=datetime.now(),
            model_type=ModelType.CHECKPOINT, hash="hash1", folder_id="folder1"
        )
        model2 = Model(
            id="model-2", name="Model 2", file_path="/path/2", file_size=2048,
            created_at=datetime.now(), modified_at=datetime.now(),
            model_type=ModelType.LORA, hash="hash2", folder_id="folder1"
        )
        
        mock_model_repository.find_by_id.side_effect = lambda id: model1 if id == "model-1" else model2
        mock_model_repository.save.return_value = None
        
        metadata_update = {"tags": ["bulk", "update"], "rating": 4}
        
        # Act
        result = model_service.bulk_update_metadata(["model-1", "model-2"], metadata_update)
        
        # Assert
        assert len(result) == 2
        assert all(model.user_metadata["tags"] == ["bulk", "update"] for model in result)
        assert all(model.user_metadata["rating"] == 4 for model in result)
        assert mock_model_repository.save.call_count == 2
    
    def test_bulk_update_metadata_empty_model_ids(self, model_service):
        """Test bulk update with empty model IDs list."""
        with pytest.raises(ValidationError) as exc_info:
            model_service.bulk_update_metadata([], {"tags": ["test"]})
        
        assert exc_info.value.field == "model_ids"
        assert "non-empty list" in exc_info.value.message
    
    def test_bulk_update_metadata_invalid_model_ids_type(self, model_service):
        """Test bulk update with invalid model IDs type."""
        with pytest.raises(ValidationError) as exc_info:
            model_service.bulk_update_metadata("invalid", {"tags": ["test"]})
        
        assert exc_info.value.field == "model_ids"
        assert "must be a non-empty list" in exc_info.value.message
    
    def test_bulk_update_metadata_partial_failure(self, model_service, mock_model_repository):
        """Test bulk update with some models not found."""
        # Arrange
        model1 = Model(
            id="model-1", name="Model 1", file_path="/path/1", file_size=1024,
            created_at=datetime.now(), modified_at=datetime.now(),
            model_type=ModelType.CHECKPOINT, hash="hash1", folder_id="folder1"
        )
        
        def mock_find_by_id(id):
            if id == "model-1":
                return model1
            else:
                return None
        
        mock_model_repository.find_by_id.side_effect = mock_find_by_id
        mock_model_repository.save.return_value = None
        
        metadata_update = {"tags": ["bulk", "update"]}
        
        # Act
        result = model_service.bulk_update_metadata(["model-1", "nonexistent"], metadata_update)
        
        # Assert
        assert len(result) == 1  # Only successful update
        assert result[0].id == "model-1"
        assert result[0].user_metadata["tags"] == ["bulk", "update"]
        mock_model_repository.save.assert_called_once()


class TestGetAllUserTags:
    """Test cases for get_all_user_tags method."""
    
    def test_get_all_user_tags_success(self, model_service, mock_model_repository):
        """Test successful retrieval of all user tags."""
        # Arrange
        expected_tags = ["character", "style", "anime", "realistic"]
        mock_model_repository.get_all_user_tags.return_value = expected_tags
        
        # Act
        result = model_service.get_all_user_tags()
        
        # Assert
        assert result == expected_tags
        mock_model_repository.get_all_user_tags.assert_called_once()
    
    def test_get_all_user_tags_empty(self, model_service, mock_model_repository):
        """Test retrieval when no user tags exist."""
        # Arrange
        mock_model_repository.get_all_user_tags.return_value = []
        
        # Act
        result = model_service.get_all_user_tags()
        
        # Assert
        assert result == []
        mock_model_repository.get_all_user_tags.assert_called_once()