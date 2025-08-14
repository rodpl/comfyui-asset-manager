"""Tests for HuggingFace external model adapter."""

import pytest
from unittest.mock import AsyncMock, patch
from datetime import datetime

from src.adapters.driven.huggingface_external_model_adapter import HuggingFaceExternalModelAdapter
from src.domain.entities.external_model import ExternalPlatform, ComfyUIModelType
from src.domain.ports.driven.external_model_port import ExternalAPIError


class TestHuggingFaceExternalModelAdapter:
    """Test cases for HuggingFaceExternalModelAdapter."""
    
    @pytest.fixture
    def adapter(self):
        """Fixture providing a HuggingFace adapter."""
        return HuggingFaceExternalModelAdapter(timeout=10)
    
    @pytest.fixture
    def sample_huggingface_response(self):
        """Fixture providing sample HuggingFace API response."""
        return [
            {
                "id": "runwayml/stable-diffusion-v1-5",
                "description": "Stable Diffusion model trained on 512x512 images",
                "pipeline_tag": "text-to-image",
                "library_name": "diffusers",
                "tags": ["stable-diffusion", "text-to-image", "diffusion"],
                "downloads": 50000,
                "likes": 1000,
                "createdAt": "2023-01-01T12:00:00Z",
                "lastModified": "2023-01-02T12:00:00Z",
                "license": "creativeml-openrail-m",
                "siblings": [
                    {
                        "rfilename": "model.safetensors",
                        "size": 4000000000
                    },
                    {
                        "rfilename": "config.json",
                        "size": 1024
                    }
                ]
            }
        ]
    
    @pytest.mark.asyncio
    async def test_search_models_success(self, adapter, sample_huggingface_response):
        """Test successful model search."""
        with patch.object(adapter, '_make_request', new_callable=AsyncMock) as mock_request:
            mock_request.return_value = sample_huggingface_response
            
            models = await adapter.search_models(
                ExternalPlatform.HUGGINGFACE,
                query="stable-diffusion",
                limit=10,
                offset=0
            )
            
            assert len(models) == 1
            model = models[0]
            assert model.id == "huggingface:runwayml/stable-diffusion-v1-5"
            assert model.name == "stable-diffusion-v1-5"
            assert model.author == "runwayml"
            assert model.platform == ExternalPlatform.HUGGINGFACE
            assert model.model_type == ComfyUIModelType.CHECKPOINT
            assert model.download_count == 50000
            assert model.is_comfyui_compatible is True
            assert model.comfyui_model_folder == "checkpoints"
            
            mock_request.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_search_models_wrong_platform(self, adapter):
        """Test search with wrong platform returns empty list."""
        models = await adapter.search_models(
            ExternalPlatform.CIVITAI,
            query="test"
        )
        
        assert models == []
    
    @pytest.mark.asyncio
    async def test_get_model_details_success(self, adapter, sample_huggingface_response):
        """Test successful model details retrieval."""
        model_data = sample_huggingface_response[0]
        
        with patch.object(adapter, '_make_request', new_callable=AsyncMock) as mock_request:
            mock_request.return_value = model_data
            
            model = await adapter.get_model_details(
                ExternalPlatform.HUGGINGFACE, 
                "runwayml/stable-diffusion-v1-5"
            )
            
            assert model is not None
            assert model.id == "huggingface:runwayml/stable-diffusion-v1-5"
            assert model.name == "stable-diffusion-v1-5"
            assert model.author == "runwayml"
            
            mock_request.assert_called_once_with(
                "https://huggingface.co/api/models/runwayml/stable-diffusion-v1-5"
            )
    
    @pytest.mark.asyncio
    async def test_get_model_details_not_found(self, adapter):
        """Test model details when model not found."""
        with patch.object(adapter, '_make_request', new_callable=AsyncMock) as mock_request:
            mock_request.return_value = None
            
            model = await adapter.get_model_details(
                ExternalPlatform.HUGGINGFACE, 
                "nonexistent/model"
            )
            
            assert model is None
    
    @pytest.mark.asyncio
    async def test_get_model_details_wrong_platform(self, adapter):
        """Test model details with wrong platform returns None."""
        model = await adapter.get_model_details(ExternalPlatform.CIVITAI, "test/model")
        
        assert model is None
    
    @pytest.mark.asyncio
    async def test_get_popular_models(self, adapter):
        """Test getting popular models."""
        with patch.object(adapter, 'search_models', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = []
            
            models = await adapter.get_popular_models(
                ExternalPlatform.HUGGINGFACE,
                limit=10,
                model_type="checkpoint"
            )
            
            mock_search.assert_called_once_with(
                ExternalPlatform.HUGGINGFACE,
                "",
                10,
                0,
                {"sort": "downloads", "model_type": "checkpoint"}
            )
    
    @pytest.mark.asyncio
    async def test_get_recent_models(self, adapter):
        """Test getting recent models."""
        with patch.object(adapter, 'search_models', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = []
            
            models = await adapter.get_recent_models(
                ExternalPlatform.HUGGINGFACE,
                limit=10
            )
            
            mock_search.assert_called_once_with(
                ExternalPlatform.HUGGINGFACE,
                "",
                10,
                0,
                {"sort": "created"}
            )
    
    def test_get_supported_platforms(self, adapter):
        """Test getting supported platforms."""
        platforms = adapter.get_supported_platforms()
        
        assert platforms == [ExternalPlatform.HUGGINGFACE]
    
    def test_get_platform_capabilities(self, adapter):
        """Test getting platform capabilities."""
        capabilities = adapter.get_platform_capabilities(ExternalPlatform.HUGGINGFACE)
        
        assert capabilities["search"] is True
        assert capabilities["model_details"] is True
        assert capabilities["popular_models"] is True
        assert capabilities["recent_models"] is True
        assert "model_types" in capabilities
        assert "supported_formats" in capabilities
        assert "libraries" in capabilities
        assert "rate_limits" in capabilities
        assert capabilities["is_available"] is True
    
    def test_get_platform_capabilities_wrong_platform(self, adapter):
        """Test getting capabilities for wrong platform returns empty dict."""
        capabilities = adapter.get_platform_capabilities(ExternalPlatform.CIVITAI)
        
        assert capabilities == {}
    
    def test_pipeline_type_mapping(self, adapter):
        """Test pipeline type mapping."""
        assert adapter.PIPELINE_TYPE_MAPPING["text-to-image"] == ComfyUIModelType.CHECKPOINT
        assert adapter.PIPELINE_TYPE_MAPPING["image-to-image"] == ComfyUIModelType.CHECKPOINT
        assert adapter.PIPELINE_TYPE_MAPPING["feature-extraction"] == ComfyUIModelType.EMBEDDING
        assert adapter.PIPELINE_TYPE_MAPPING["other"] == ComfyUIModelType.UNKNOWN
    
    def test_library_type_mapping(self, adapter):
        """Test library type mapping."""
        assert adapter.LIBRARY_TYPE_MAPPING["diffusers"] == ComfyUIModelType.CHECKPOINT
        assert adapter.LIBRARY_TYPE_MAPPING["peft"] == ComfyUIModelType.LORA
        assert adapter.LIBRARY_TYPE_MAPPING["transformers"] == ComfyUIModelType.UNKNOWN
    
    def test_is_comfyui_compatible(self, adapter):
        """Test ComfyUI compatibility detection."""
        # Unknown type should not be compatible
        assert adapter._is_comfyui_compatible(
            ComfyUIModelType.UNKNOWN, "safetensors", "transformers", []
        ) is False
        
        # Diffusers library should be compatible
        assert adapter._is_comfyui_compatible(
            ComfyUIModelType.CHECKPOINT, "safetensors", "diffusers", []
        ) is True
        
        # PEFT library should be compatible
        assert adapter._is_comfyui_compatible(
            ComfyUIModelType.LORA, "safetensors", "peft", []
        ) is True
        
        # Diffusion tags should be compatible
        assert adapter._is_comfyui_compatible(
            ComfyUIModelType.CHECKPOINT, "safetensors", "pytorch", ["stable-diffusion"]
        ) is True
        
        # Safetensors format should be compatible
        assert adapter._is_comfyui_compatible(
            ComfyUIModelType.CHECKPOINT, "safetensors", "pytorch", []
        ) is True
        
        # Default should not be compatible for HuggingFace
        assert adapter._is_comfyui_compatible(
            ComfyUIModelType.CHECKPOINT, "bin", "transformers", []
        ) is False
    
    def test_get_compatibility_notes(self, adapter):
        """Test compatibility notes generation."""
        # Unknown type
        notes = adapter._get_compatibility_notes(ComfyUIModelType.UNKNOWN, "transformers", [])
        assert "not supported by ComfyUI" in notes
        
        # Transformers library
        notes = adapter._get_compatibility_notes(ComfyUIModelType.CHECKPOINT, "transformers", [])
        assert "conversion" in notes
        
        # Diffusers library
        notes = adapter._get_compatibility_notes(ComfyUIModelType.CHECKPOINT, "diffusers", [])
        assert "conversion" in notes
        
        # SDXL tags
        notes = adapter._get_compatibility_notes(ComfyUIModelType.CHECKPOINT, "diffusers", ["sdxl"])
        assert "SDXL-compatible workflow" in notes
    
    def test_get_required_nodes(self, adapter):
        """Test required nodes mapping."""
        assert adapter._get_required_nodes(ComfyUIModelType.CHECKPOINT) == ["CheckpointLoaderSimple"]
        assert adapter._get_required_nodes(ComfyUIModelType.LORA) == ["LoraLoader"]
        assert adapter._get_required_nodes(ComfyUIModelType.VAE) == ["VAELoader"]
        assert adapter._get_required_nodes(ComfyUIModelType.UNKNOWN) == []