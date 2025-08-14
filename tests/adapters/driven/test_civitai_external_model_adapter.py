"""Tests for CivitAI external model adapter."""

import pytest
from unittest.mock import AsyncMock, patch
from datetime import datetime
from aiohttp import ClientError

from src.adapters.driven.civitai_external_model_adapter import CivitAIExternalModelAdapter
from src.domain.entities.external_model import ExternalPlatform, ComfyUIModelType
from src.domain.ports.driven.external_model_port import ExternalAPIError, RateLimitError, PlatformUnavailableError


class TestCivitAIExternalModelAdapter:
    """Test cases for CivitAIExternalModelAdapter."""
    
    @pytest.fixture
    def adapter(self):
        """Fixture providing a CivitAI adapter."""
        return CivitAIExternalModelAdapter(timeout=10)
    
    @pytest.fixture
    def sample_civitai_response(self):
        """Fixture providing sample CivitAI API response."""
        return {
            "items": [
                {
                    "id": 12345,
                    "name": "Test Model",
                    "description": "A test model for unit testing",
                    "type": "Checkpoint",
                    "creator": {"username": "TestCreator"},
                    "tags": [{"name": "test"}, {"name": "model"}],
                    "stats": {
                        "downloadCount": 1000,
                        "rating": 4.5,
                        "favoriteCount": 100,
                        "commentCount": 50
                    },
                    "createdAt": "2023-01-01T12:00:00Z",
                    "updatedAt": "2023-01-02T12:00:00Z",
                    "nsfw": False,
                    "allowCommercialUse": "Sell",
                    "modelVersions": [
                        {
                            "id": 67890,
                            "name": "v1.0",
                            "baseModel": "SD 1.5",
                            "images": [{"url": "https://example.com/thumb.jpg"}],
                            "files": [
                                {
                                    "name": "test_model.safetensors",
                                    "sizeKB": 2048000,
                                    "type": "Model",
                                    "primary": True,
                                    "downloadUrl": "https://example.com/download",
                                    "metadata": {"format": "SafeTensor"}
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    
    @pytest.mark.asyncio
    async def test_search_models_success(self, adapter, sample_civitai_response):
        """Test successful model search."""
        with patch.object(adapter, '_make_request', new_callable=AsyncMock) as mock_request:
            mock_request.return_value = sample_civitai_response
            
            models = await adapter.search_models(
                ExternalPlatform.CIVITAI,
                query="test",
                limit=10,
                offset=0
            )
            
            assert len(models) == 1
            model = models[0]
            assert model.id == "civitai:12345"
            assert model.name == "Test Model"
            assert model.author == "TestCreator"
            assert model.platform == ExternalPlatform.CIVITAI
            assert model.model_type == ComfyUIModelType.CHECKPOINT
            assert model.download_count == 1000
            assert model.rating == 4.5
            assert model.is_comfyui_compatible is True
            assert model.comfyui_model_folder == "checkpoints"
            
            mock_request.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_search_models_wrong_platform(self, adapter):
        """Test search with wrong platform returns empty list."""
        models = await adapter.search_models(
            ExternalPlatform.HUGGINGFACE,
            query="test"
        )
        
        assert models == []
    
    @pytest.mark.asyncio
    async def test_get_model_details_success(self, adapter, sample_civitai_response):
        """Test successful model details retrieval."""
        model_data = sample_civitai_response["items"][0]
        
        with patch.object(adapter, '_make_request', new_callable=AsyncMock) as mock_request:
            mock_request.return_value = model_data
            
            model = await adapter.get_model_details(ExternalPlatform.CIVITAI, "12345")
            
            assert model is not None
            assert model.id == "civitai:12345"
            assert model.name == "Test Model"
            assert model.author == "TestCreator"
            
            mock_request.assert_called_once_with(
                "https://civitai.com/api/v1/models/12345"
            )
    
    @pytest.mark.asyncio
    async def test_get_model_details_not_found(self, adapter):
        """Test model details when model not found."""
        with patch.object(adapter, '_make_request', new_callable=AsyncMock) as mock_request:
            mock_request.return_value = None
            
            model = await adapter.get_model_details(ExternalPlatform.CIVITAI, "nonexistent")
            
            assert model is None
    
    @pytest.mark.asyncio
    async def test_get_model_details_wrong_platform(self, adapter):
        """Test model details with wrong platform returns None."""
        model = await adapter.get_model_details(ExternalPlatform.HUGGINGFACE, "12345")
        
        assert model is None
    
    @pytest.mark.asyncio
    async def test_get_popular_models(self, adapter, sample_civitai_response):
        """Test getting popular models."""
        with patch.object(adapter, 'search_models', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = []
            
            models = await adapter.get_popular_models(
                ExternalPlatform.CIVITAI,
                limit=10,
                model_type="checkpoint"
            )
            
            mock_search.assert_called_once_with(
                ExternalPlatform.CIVITAI,
                "",
                10,
                0,
                {"sort": "Highest Rated", "model_type": "checkpoint"}
            )
    
    @pytest.mark.asyncio
    async def test_get_recent_models(self, adapter):
        """Test getting recent models."""
        with patch.object(adapter, 'search_models', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = []
            
            models = await adapter.get_recent_models(
                ExternalPlatform.CIVITAI,
                limit=10
            )
            
            mock_search.assert_called_once_with(
                ExternalPlatform.CIVITAI,
                "",
                10,
                0,
                {"sort": "Newest"}
            )
    
    @pytest.mark.asyncio
    async def test_check_model_availability_true(self, adapter):
        """Test model availability check returns True."""
        with patch.object(adapter, 'get_model_details', new_callable=AsyncMock) as mock_details:
            mock_details.return_value = AsyncMock()  # Non-None model
            
            available = await adapter.check_model_availability(ExternalPlatform.CIVITAI, "12345")
            
            assert available is True
    
    @pytest.mark.asyncio
    async def test_check_model_availability_false(self, adapter):
        """Test model availability check returns False."""
        with patch.object(adapter, 'get_model_details', new_callable=AsyncMock) as mock_details:
            mock_details.return_value = None
            
            available = await adapter.check_model_availability(ExternalPlatform.CIVITAI, "12345")
            
            assert available is False
    
    @pytest.mark.asyncio
    async def test_check_model_availability_exception(self, adapter):
        """Test model availability check with exception returns False."""
        with patch.object(adapter, 'get_model_details', new_callable=AsyncMock) as mock_details:
            mock_details.side_effect = ExternalAPIError("API Error", "civitai")
            
            available = await adapter.check_model_availability(ExternalPlatform.CIVITAI, "12345")
            
            assert available is False
    
    def test_get_supported_platforms(self, adapter):
        """Test getting supported platforms."""
        platforms = adapter.get_supported_platforms()
        
        assert platforms == [ExternalPlatform.CIVITAI]
    
    def test_get_platform_capabilities(self, adapter):
        """Test getting platform capabilities."""
        capabilities = adapter.get_platform_capabilities(ExternalPlatform.CIVITAI)
        
        assert capabilities["search"] is True
        assert capabilities["model_details"] is True
        assert capabilities["popular_models"] is True
        assert capabilities["recent_models"] is True
        assert "model_types" in capabilities
        assert "supported_formats" in capabilities
        assert "rate_limits" in capabilities
        assert capabilities["is_available"] is True
    
    def test_get_platform_capabilities_wrong_platform(self, adapter):
        """Test getting capabilities for wrong platform returns empty dict."""
        capabilities = adapter.get_platform_capabilities(ExternalPlatform.HUGGINGFACE)
        
        assert capabilities == {}
    
    def test_model_type_mapping(self, adapter):
        """Test model type mapping."""
        assert adapter.MODEL_TYPE_MAPPING["Checkpoint"] == ComfyUIModelType.CHECKPOINT
        assert adapter.MODEL_TYPE_MAPPING["LORA"] == ComfyUIModelType.LORA
        assert adapter.MODEL_TYPE_MAPPING["VAE"] == ComfyUIModelType.VAE
        assert adapter.MODEL_TYPE_MAPPING["Other"] == ComfyUIModelType.UNKNOWN
    
    def test_folder_mapping(self, adapter):
        """Test folder mapping."""
        assert adapter.FOLDER_MAPPING[ComfyUIModelType.CHECKPOINT] == "checkpoints"
        assert adapter.FOLDER_MAPPING[ComfyUIModelType.LORA] == "loras"
        assert adapter.FOLDER_MAPPING[ComfyUIModelType.VAE] == "vae"
    
    def test_is_comfyui_compatible(self, adapter):
        """Test ComfyUI compatibility detection."""
        # Unknown type should not be compatible
        assert adapter._is_comfyui_compatible(ComfyUIModelType.UNKNOWN, "safetensors", "SD 1.5") is False
        
        # Safetensors should be compatible
        assert adapter._is_comfyui_compatible(ComfyUIModelType.CHECKPOINT, "safetensors", "SD 1.5") is True
        
        # CKPT should be compatible for certain types
        assert adapter._is_comfyui_compatible(ComfyUIModelType.CHECKPOINT, "ckpt", "SD 1.5") is True
        
        # Default should be compatible
        assert adapter._is_comfyui_compatible(ComfyUIModelType.CHECKPOINT, None, "SD 1.5") is True
    
    def test_get_compatibility_notes(self, adapter):
        """Test compatibility notes generation."""
        # Unknown type
        notes = adapter._get_compatibility_notes(ComfyUIModelType.UNKNOWN, "safetensors", "SD 1.5")
        assert "not supported by ComfyUI" in notes
        
        # CKPT format
        notes = adapter._get_compatibility_notes(ComfyUIModelType.CHECKPOINT, "ckpt", "SD 1.5")
        assert "safetensors" in notes
        
        # SDXL model
        notes = adapter._get_compatibility_notes(ComfyUIModelType.CHECKPOINT, "safetensors", "SDXL")
        assert "SDXL-compatible workflow" in notes
    
    def test_get_required_nodes(self, adapter):
        """Test required nodes mapping."""
        assert adapter._get_required_nodes(ComfyUIModelType.CHECKPOINT) == ["CheckpointLoaderSimple"]
        assert adapter._get_required_nodes(ComfyUIModelType.LORA) == ["LoraLoader"]
        assert adapter._get_required_nodes(ComfyUIModelType.VAE) == ["VAELoader"]
        assert adapter._get_required_nodes(ComfyUIModelType.UNKNOWN) == []