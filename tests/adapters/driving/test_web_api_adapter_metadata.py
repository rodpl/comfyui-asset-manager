"""Tests for web API adapter metadata management endpoints."""

import json
import pytest
from unittest.mock import Mock, AsyncMock
from aiohttp import web
from aiohttp.test_utils import make_mocked_request

from src.adapters.driving.web_api_adapter import WebAPIAdapter
from src.domain.entities.model import Model, ModelType
from src.domain.entities.base import ValidationError, NotFoundError
from datetime import datetime


@pytest.fixture
def mock_model_management():
    """Mock model management port for testing."""
    return Mock()


@pytest.fixture
def mock_folder_management():
    """Mock folder management port for testing."""
    return Mock()


@pytest.fixture
def web_api_adapter(mock_model_management, mock_folder_management):
    """Create web API adapter with mocked dependencies."""
    return WebAPIAdapter(mock_model_management, mock_folder_management)


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
        user_metadata={"tags": ["test"], "description": "Test description", "rating": 4}
    )


class TestUpdateModelMetadata:
    """Test cases for update_model_metadata endpoint."""
    
    @pytest.mark.asyncio
    async def test_update_model_metadata_success(self, web_api_adapter, mock_model_management, sample_model):
        """Test successful metadata update."""
        # Arrange
        mock_model_management.update_model_metadata.return_value = sample_model
        
        metadata = {"tags": ["updated"], "description": "Updated description", "rating": 5}
        request = make_mocked_request(
            'PUT', 
            '/asset_manager/models/test-model-1/metadata',
            match_info={'model_id': 'test-model-1'}
        )
        request.json = AsyncMock(return_value=metadata)
        
        # Act
        response = await web_api_adapter.update_model_metadata(request)
        
        # Assert
        assert response.status == 200
        response_data = json.loads(response.text)
        assert response_data["success"] is True
        assert "data" in response_data
        mock_model_management.update_model_metadata.assert_called_once_with("test-model-1", metadata)
    
    @pytest.mark.asyncio
    async def test_update_model_metadata_invalid_json(self, web_api_adapter):
        """Test update with invalid JSON in request body."""
        # Arrange
        request = make_mocked_request(
            'PUT', 
            '/asset_manager/models/test-model-1/metadata',
            match_info={'model_id': 'test-model-1'}
        )
        request.json = AsyncMock(side_effect=json.JSONDecodeError("Invalid JSON", "", 0))
        
        # Act
        response = await web_api_adapter.update_model_metadata(request)
        
        # Assert
        assert response.status == 400
        response_data = json.loads(response.text)
        assert response_data["success"] is False
        assert "Invalid JSON" in response_data["error"]
        assert response_data["error_type"] == "validation_error"
    
    @pytest.mark.asyncio
    async def test_update_model_metadata_validation_error(self, web_api_adapter, mock_model_management):
        """Test update with validation error."""
        # Arrange
        mock_model_management.update_model_metadata.side_effect = ValidationError(
            "Invalid rating", "rating"
        )
        
        metadata = {"rating": 10}
        request = make_mocked_request(
            'PUT', 
            '/asset_manager/models/test-model-1/metadata',
            match_info={'model_id': 'test-model-1'}
        )
        request.json = AsyncMock(return_value=metadata)
        
        # Act
        response = await web_api_adapter.update_model_metadata(request)
        
        # Assert
        assert response.status == 400
        response_data = json.loads(response.text)
        assert response_data["success"] is False
        assert response_data["error"] == "Invalid rating"
        assert response_data["error_type"] == "validation_error"
        assert response_data["field"] == "rating"
    
    @pytest.mark.asyncio
    async def test_update_model_metadata_not_found(self, web_api_adapter, mock_model_management):
        """Test update when model is not found."""
        # Arrange
        mock_model_management.update_model_metadata.side_effect = NotFoundError(
            "Model", "nonexistent"
        )
        
        metadata = {"tags": ["test"]}
        request = make_mocked_request(
            'PUT', 
            '/asset_manager/models/nonexistent/metadata',
            match_info={'model_id': 'nonexistent'}
        )
        request.json = AsyncMock(return_value=metadata)
        
        # Act
        response = await web_api_adapter.update_model_metadata(request)
        
        # Assert
        assert response.status == 404
        response_data = json.loads(response.text)
        assert response_data["success"] is False
        assert response_data["error_type"] == "not_found_error"
        assert response_data["entity_type"] == "Model"
        assert response_data["identifier"] == "nonexistent"


class TestBulkUpdateMetadata:
    """Test cases for bulk_update_metadata endpoint."""
    
    @pytest.mark.asyncio
    async def test_bulk_update_metadata_success(self, web_api_adapter, mock_model_management):
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
        
        mock_model_management.bulk_update_metadata.return_value = [model1, model2]
        
        request_body = {
            "model_ids": ["model-1", "model-2"],
            "metadata": {"tags": ["bulk"], "rating": 4}
        }
        request = make_mocked_request('POST', '/asset_manager/models/bulk-metadata')
        request.json = AsyncMock(return_value=request_body)
        
        # Act
        response = await web_api_adapter.bulk_update_metadata(request)
        
        # Assert
        assert response.status == 200
        response_data = json.loads(response.text)
        assert response_data["success"] is True
        assert "data" in response_data
        assert response_data["count"] == 2
        mock_model_management.bulk_update_metadata.assert_called_once_with(
            ["model-1", "model-2"], {"tags": ["bulk"], "rating": 4}
        )
    
    @pytest.mark.asyncio
    async def test_bulk_update_metadata_invalid_json(self, web_api_adapter):
        """Test bulk update with invalid JSON."""
        # Arrange
        request = make_mocked_request('POST', '/asset_manager/models/bulk-metadata')
        request.json = AsyncMock(side_effect=json.JSONDecodeError("Invalid JSON", "", 0))
        
        # Act
        response = await web_api_adapter.bulk_update_metadata(request)
        
        # Assert
        assert response.status == 400
        response_data = json.loads(response.text)
        assert response_data["success"] is False
        assert "Invalid JSON" in response_data["error"]
    
    @pytest.mark.asyncio
    async def test_bulk_update_metadata_missing_model_ids(self, web_api_adapter):
        """Test bulk update with missing model_ids field."""
        # Arrange
        request_body = {"metadata": {"tags": ["test"]}}
        request = make_mocked_request('POST', '/asset_manager/models/bulk-metadata')
        request.json = AsyncMock(return_value=request_body)
        
        # Act
        response = await web_api_adapter.bulk_update_metadata(request)
        
        # Assert
        assert response.status == 400
        response_data = json.loads(response.text)
        assert response_data["success"] is False
        assert "Missing required field 'model_ids'" in response_data["error"]
    
    @pytest.mark.asyncio
    async def test_bulk_update_metadata_missing_metadata(self, web_api_adapter):
        """Test bulk update with missing metadata field."""
        # Arrange
        request_body = {"model_ids": ["model-1"]}
        request = make_mocked_request('POST', '/asset_manager/models/bulk-metadata')
        request.json = AsyncMock(return_value=request_body)
        
        # Act
        response = await web_api_adapter.bulk_update_metadata(request)
        
        # Assert
        assert response.status == 400
        response_data = json.loads(response.text)
        assert response_data["success"] is False
        assert "Missing required field 'metadata'" in response_data["error"]
    
    @pytest.mark.asyncio
    async def test_bulk_update_metadata_validation_error(self, web_api_adapter, mock_model_management):
        """Test bulk update with validation error."""
        # Arrange
        mock_model_management.bulk_update_metadata.side_effect = ValidationError(
            "Invalid model IDs", "model_ids"
        )
        
        request_body = {
            "model_ids": [],
            "metadata": {"tags": ["test"]}
        }
        request = make_mocked_request('POST', '/asset_manager/models/bulk-metadata')
        request.json = AsyncMock(return_value=request_body)
        
        # Act
        response = await web_api_adapter.bulk_update_metadata(request)
        
        # Assert
        assert response.status == 400
        response_data = json.loads(response.text)
        assert response_data["success"] is False
        assert response_data["error"] == "Invalid model IDs"
        assert response_data["error_type"] == "validation_error"


class TestGetAllUserTags:
    """Test cases for get_all_user_tags endpoint."""
    
    @pytest.mark.asyncio
    async def test_get_all_user_tags_success(self, web_api_adapter, mock_model_management):
        """Test successful retrieval of all user tags."""
        # Arrange
        expected_tags = ["character", "style", "anime", "realistic"]
        mock_model_management.get_all_user_tags.return_value = expected_tags
        
        request = make_mocked_request('GET', '/asset_manager/tags')
        
        # Act
        response = await web_api_adapter.get_all_user_tags(request)
        
        # Assert
        assert response.status == 200
        response_data = json.loads(response.text)
        assert response_data["success"] is True
        assert response_data["data"] == expected_tags
        assert response_data["count"] == 4
        mock_model_management.get_all_user_tags.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_all_user_tags_empty(self, web_api_adapter, mock_model_management):
        """Test retrieval when no user tags exist."""
        # Arrange
        mock_model_management.get_all_user_tags.return_value = []
        
        request = make_mocked_request('GET', '/asset_manager/tags')
        
        # Act
        response = await web_api_adapter.get_all_user_tags(request)
        
        # Assert
        assert response.status == 200
        response_data = json.loads(response.text)
        assert response_data["success"] is True
        assert response_data["data"] == []
        assert response_data["count"] == 0
    
    @pytest.mark.asyncio
    async def test_get_all_user_tags_unexpected_error(self, web_api_adapter, mock_model_management):
        """Test handling of unexpected errors."""
        # Arrange
        mock_model_management.get_all_user_tags.side_effect = Exception("Database error")
        
        request = make_mocked_request('GET', '/asset_manager/tags')
        
        # Act
        response = await web_api_adapter.get_all_user_tags(request)
        
        # Assert
        assert response.status == 500
        response_data = json.loads(response.text)
        assert response_data["success"] is False
        assert response_data["error"] == "An unexpected error occurred"
        assert response_data["error_type"] == "internal_error"