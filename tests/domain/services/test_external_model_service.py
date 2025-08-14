"""Tests for external model service."""

import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime
from src.domain.services.external_model_service import ExternalModelService
from src.domain.ports.driven.external_model_port import (
    ExternalModelPort, 
    ExternalAPIError, 
    RateLimitError, 
    PlatformUnavailableError
)
from src.domain.entities.external_model import (
    ExternalModel,
    ExternalPlatform,
    ComfyUIModelType,
    ComfyUICompatibility
)
from src.domain.entities.base import ValidationError, NotFoundError


class TestExternalModelService:
    """Test cases for ExternalModelService."""
    
    @pytest.fixture
    def mock_external_model_port(self):
        """Fixture providing a mock external model port."""
        return AsyncMock(spec=ExternalModelPort)
    
    @pytest.fixture
    def external_model_service(self, mock_external_model_port):
        """Fixture providing an external model service with mocked dependencies."""
        return ExternalModelService(mock_external_model_port)
    
    @pytest.fixture
    def sample_external_model(self):
        """Fixture providing a sample external model."""
        compatibility = ComfyUICompatibility(
            is_compatible=True,
            model_folder="checkpoints",
            compatibility_notes="Compatible with ComfyUI"
        )
        
        return ExternalModel(
            id="civitai:12345",
            name="Test Model",
            description="A test model",
            author="TestAuthor",
            platform=ExternalPlatform.CIVITAI,
            thumbnail_url="https://example.com/thumb.jpg",
            tags=["test", "model"],
            download_count=1000,
            rating=4.5,
            created_at=datetime(2023, 1, 1),
            updated_at=datetime(2023, 1, 2),
            metadata={"civitai_id": 12345},
            comfyui_compatibility=compatibility,
            model_type=ComfyUIModelType.CHECKPOINT
        )
    
    async def test_search_models_single_platform(self, external_model_service, mock_external_model_port, sample_external_model):
        """Test searching models on a single platform."""
        # Arrange
        mock_external_model_port.search_models.return_value = [sample_external_model]
        mock_external_model_port.get_supported_platforms.return_value = [ExternalPlatform.CIVITAI]
        
        # Act
        result = await external_model_service.search_models(
            platform=ExternalPlatform.CIVITAI,
            query="test",
            limit=10,
            offset=0
        )
        
        # Assert
        assert len(result["models"]) == 1
        assert result["models"][0].id == "civitai:12345"
        assert result["total"] == 1
        assert result["has_more"] is False
        assert result["next_offset"] is None
        assert "civitai" in result["platforms_searched"]
        
        mock_external_model_port.search_models.assert_called_once_with(
            platform=ExternalPlatform.CIVITAI,
            query="test",
            limit=10,
            offset=0,
            filters={}
        )
    
    async def test_search_models_all_platforms(self, external_model_service, mock_external_model_port, sample_external_model):
        """Test searching models across all platforms."""
        # Arrange
        mock_external_model_port.search_models.return_value = [sample_external_model]
        mock_external_model_port.get_supported_platforms.return_value = [
            ExternalPlatform.CIVITAI, 
            ExternalPlatform.HUGGINGFACE
        ]
        
        # Act
        result = await external_model_service.search_models(
            platform=None,
            query="test",
            limit=10,
            offset=0
        )
        
        # Assert
        assert len(result["models"]) == 2  # One from each platform
        assert result["total"] == 2
        assert len(result["platforms_searched"]) == 2
        
        # Should be called once for each platform
        assert mock_external_model_port.search_models.call_count == 2
    
    async def test_search_models_invalid_limit(self, external_model_service):
        """Test search models with invalid limit."""
        with pytest.raises(ValidationError) as exc_info:
            await external_model_service.search_models(limit=0)
        
        assert "limit must be between 1 and 100" in str(exc_info.value)
        assert exc_info.value.field == "limit"
    
    async def test_search_models_invalid_offset(self, external_model_service):
        """Test search models with invalid offset."""
        with pytest.raises(ValidationError) as exc_info:
            await external_model_service.search_models(offset=-1)
        
        assert "offset must be non-negative" in str(exc_info.value)
        assert exc_info.value.field == "offset"
    
    async def test_get_model_details_success(self, external_model_service, mock_external_model_port, sample_external_model):
        """Test getting model details successfully."""
        # Arrange
        mock_external_model_port.get_model_details.return_value = sample_external_model
        
        # Act
        result = await external_model_service.get_model_details(
            ExternalPlatform.CIVITAI, 
            "12345"
        )
        
        # Assert
        assert result.id == "civitai:12345"
        assert result.name == "Test Model"
        
        mock_external_model_port.get_model_details.assert_called_once_with(
            ExternalPlatform.CIVITAI, 
            "12345"
        )
    
    async def test_get_model_details_not_found(self, external_model_service, mock_external_model_port):
        """Test getting model details when model is not found."""
        # Arrange
        mock_external_model_port.get_model_details.return_value = None
        
        # Act & Assert
        with pytest.raises(NotFoundError) as exc_info:
            await external_model_service.get_model_details(
                ExternalPlatform.CIVITAI, 
                "nonexistent"
            )
        
        assert "ExternalModel" in str(exc_info.value)
        assert "civitai:nonexistent" in str(exc_info.value)
    
    async def test_get_model_details_empty_model_id(self, external_model_service):
        """Test getting model details with empty model ID."""
        with pytest.raises(ValidationError) as exc_info:
            await external_model_service.get_model_details(
                ExternalPlatform.CIVITAI, 
                ""
            )
        
        assert "model_id cannot be empty" in str(exc_info.value)
        assert exc_info.value.field == "model_id"
    
    async def test_get_popular_models(self, external_model_service, mock_external_model_port, sample_external_model):
        """Test getting popular models."""
        # Arrange
        mock_external_model_port.get_popular_models.return_value = [sample_external_model]
        mock_external_model_port.get_supported_platforms.return_value = [ExternalPlatform.CIVITAI]
        
        # Act
        result = await external_model_service.get_popular_models(
            platform=ExternalPlatform.CIVITAI,
            limit=10,
            model_type="checkpoint"
        )
        
        # Assert
        assert len(result) == 1
        assert result[0].id == "civitai:12345"
        
        mock_external_model_port.get_popular_models.assert_called_once_with(
            platform=ExternalPlatform.CIVITAI,
            limit=10,
            model_type="checkpoint"
        )
    
    async def test_get_recent_models(self, external_model_service, mock_external_model_port, sample_external_model):
        """Test getting recent models."""
        # Arrange
        mock_external_model_port.get_recent_models.return_value = [sample_external_model]
        mock_external_model_port.get_supported_platforms.return_value = [ExternalPlatform.CIVITAI]
        
        # Act
        result = await external_model_service.get_recent_models(
            platform=ExternalPlatform.CIVITAI,
            limit=10
        )
        
        # Assert
        assert len(result) == 1
        assert result[0].id == "civitai:12345"
        
        mock_external_model_port.get_recent_models.assert_called_once_with(
            platform=ExternalPlatform.CIVITAI,
            limit=10,
            model_type=None
        )
    
    async def test_check_model_availability(self, external_model_service, mock_external_model_port):
        """Test checking model availability."""
        # Arrange
        mock_external_model_port.check_model_availability.return_value = True
        
        # Act
        result = await external_model_service.check_model_availability(
            ExternalPlatform.CIVITAI,
            "12345"
        )
        
        # Assert
        assert result is True
        
        mock_external_model_port.check_model_availability.assert_called_once_with(
            ExternalPlatform.CIVITAI,
            "12345"
        )
    
    async def test_check_model_availability_api_error(self, external_model_service, mock_external_model_port):
        """Test checking model availability when API fails."""
        # Arrange
        mock_external_model_port.check_model_availability.side_effect = ExternalAPIError(
            "API Error", "civitai"
        )
        
        # Act
        result = await external_model_service.check_model_availability(
            ExternalPlatform.CIVITAI,
            "12345"
        )
        
        # Assert - Should return False when API fails
        assert result is False
    
    def test_get_supported_platforms(self, external_model_service, mock_external_model_port):
        """Test getting supported platforms."""
        # Arrange
        expected_platforms = [ExternalPlatform.CIVITAI, ExternalPlatform.HUGGINGFACE]
        mock_external_model_port.get_supported_platforms.return_value = expected_platforms
        
        # Act
        result = external_model_service.get_supported_platforms()
        
        # Assert
        assert result == expected_platforms
        mock_external_model_port.get_supported_platforms.assert_called_once()
    
    def test_get_platform_info(self, external_model_service, mock_external_model_port):
        """Test getting platform information."""
        # Arrange
        mock_capabilities = {
            "rate_limits": {"requests_per_minute": 60},
            "is_available": True
        }
        mock_external_model_port.get_platform_capabilities.return_value = mock_capabilities
        
        # Act
        result = external_model_service.get_platform_info(ExternalPlatform.CIVITAI)
        
        # Assert
        assert result["name"] == "civitai"
        assert result["display_name"] == "Civitai"
        assert result["capabilities"] == mock_capabilities
        assert result["is_available"] is True
        assert isinstance(result["supported_model_types"], list)
        
        mock_external_model_port.get_platform_capabilities.assert_called_once_with(
            ExternalPlatform.CIVITAI
        )