"""Tests for external model endpoints in web API adapter."""

import pytest
from unittest.mock import AsyncMock, MagicMock
from aiohttp import web
from aiohttp.test_utils import AioHTTPTestCase, unittest_run_loop

from src.adapters.driving.web_api_adapter import WebAPIAdapter
from src.domain.entities.external_model import ExternalModel, ExternalPlatform, ComfyUIModelType, ComfyUICompatibility
from src.domain.ports.driven.external_model_port import ExternalAPIError
from datetime import datetime


class TestWebAPIAdapterExternalModels(AioHTTPTestCase):
    """Test cases for external model endpoints in WebAPIAdapter."""
    
    async def get_application(self):
        """Create test application."""
        # Mock services
        self.mock_model_management = MagicMock()
        self.mock_folder_management = MagicMock()
        self.mock_output_management = MagicMock()
        self.mock_external_model_management = AsyncMock()
        
        # Create adapter
        self.adapter = WebAPIAdapter(
            model_management=self.mock_model_management,
            folder_management=self.mock_folder_management,
            output_management=self.mock_output_management,
            external_model_management=self.mock_external_model_management
        )
        
        # Create app and register routes
        app = web.Application()
        self.adapter.register_routes(app)
        
        return app
    
    def create_sample_external_model(self):
        """Create a sample external model for testing."""
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
    
    @unittest_run_loop
    async def test_search_external_models_success(self):
        """Test successful external model search."""
        # Arrange
        sample_model = self.create_sample_external_model()
        search_result = {
            "models": [sample_model],
            "total": 1,
            "has_more": False,
            "next_offset": None,
            "platforms_searched": ["civitai"]
        }
        self.mock_external_model_management.search_models.return_value = search_result
        
        # Act
        resp = await self.client.request("GET", "/asset_manager/external/models?query=test&limit=10")
        
        # Assert
        assert resp.status == 200
        data = await resp.json()
        assert data["success"] is True
        assert len(data["data"]["models"]) == 1
        assert data["data"]["models"][0]["id"] == "civitai:12345"
        assert data["data"]["total"] == 1
        
        self.mock_external_model_management.search_models.assert_called_once_with(
            platform=None,
            query="test",
            limit=10,
            offset=0,
            filters={}
        )
    
    @unittest_run_loop
    async def test_search_external_models_no_service(self):
        """Test external model search when service is not available."""
        # Arrange - create adapter without external model service
        adapter = WebAPIAdapter(
            model_management=self.mock_model_management,
            folder_management=self.mock_folder_management,
            output_management=self.mock_output_management,
            external_model_management=None
        )
        
        app = web.Application()
        adapter.register_routes(app)
        client = await self.get_client(app)
        
        # Act
        resp = await client.request("GET", "/asset_manager/external/models")
        
        # Assert
        assert resp.status == 503
        data = await resp.json()
        assert data["success"] is False
        assert "not available" in data["error"]
    
    @unittest_run_loop
    async def test_search_external_models_platform_specific(self):
        """Test external model search on specific platform."""
        # Arrange
        sample_model = self.create_sample_external_model()
        search_result = {
            "models": [sample_model],
            "total": 1,
            "has_more": False,
            "next_offset": None,
            "platforms_searched": ["civitai"]
        }
        self.mock_external_model_management.search_models.return_value = search_result
        
        # Act
        resp = await self.client.request("GET", "/asset_manager/external/models/civitai?query=test")
        
        # Assert
        assert resp.status == 200
        data = await resp.json()
        assert data["success"] is True
        assert data["data"]["platform"] == "civitai"
        
        self.mock_external_model_management.search_models.assert_called_once_with(
            platform=ExternalPlatform.CIVITAI,
            query="test",
            limit=20,
            offset=0,
            filters={}
        )
    
    @unittest_run_loop
    async def test_search_external_models_invalid_platform(self):
        """Test external model search with invalid platform."""
        # Act
        resp = await self.client.request("GET", "/asset_manager/external/models/invalid")
        
        # Assert
        assert resp.status == 400
        data = await resp.json()
        assert data["success"] is False
        assert "Unsupported platform" in data["error"]
    
    @unittest_run_loop
    async def test_get_external_model_details_success(self):
        """Test successful external model details retrieval."""
        # Arrange
        sample_model = self.create_sample_external_model()
        self.mock_external_model_management.get_model_details.return_value = sample_model
        
        # Act
        resp = await self.client.request("GET", "/asset_manager/external/models/civitai/12345")
        
        # Assert
        assert resp.status == 200
        data = await resp.json()
        assert data["success"] is True
        assert data["data"]["id"] == "civitai:12345"
        
        self.mock_external_model_management.get_model_details.assert_called_once_with(
            ExternalPlatform.CIVITAI, "12345"
        )
    
    @unittest_run_loop
    async def test_get_external_model_details_api_error(self):
        """Test external model details with API error."""
        # Arrange
        self.mock_external_model_management.get_model_details.side_effect = ExternalAPIError(
            "API Error", "civitai"
        )
        
        # Act
        resp = await self.client.request("GET", "/asset_manager/external/models/civitai/12345")
        
        # Assert
        assert resp.status == 502
        data = await resp.json()
        assert data["success"] is False
        assert data["error_type"] == "external_api_error"
    
    @unittest_run_loop
    async def test_get_popular_external_models(self):
        """Test getting popular external models."""
        # Arrange
        sample_model = self.create_sample_external_model()
        self.mock_external_model_management.get_popular_models.return_value = [sample_model]
        
        # Act
        resp = await self.client.request("GET", "/asset_manager/external/popular?limit=10")
        
        # Assert
        assert resp.status == 200
        data = await resp.json()
        assert data["success"] is True
        assert len(data["data"]["models"]) == 1
        assert data["data"]["count"] == 1
        
        self.mock_external_model_management.get_popular_models.assert_called_once_with(
            platform=None,
            limit=10,
            model_type=None
        )
    
    @unittest_run_loop
    async def test_get_recent_external_models(self):
        """Test getting recent external models."""
        # Arrange
        sample_model = self.create_sample_external_model()
        self.mock_external_model_management.get_recent_models.return_value = [sample_model]
        
        # Act
        resp = await self.client.request("GET", "/asset_manager/external/recent?platform=civitai")
        
        # Assert
        assert resp.status == 200
        data = await resp.json()
        assert data["success"] is True
        assert len(data["data"]["models"]) == 1
        
        self.mock_external_model_management.get_recent_models.assert_called_once_with(
            platform=ExternalPlatform.CIVITAI,
            limit=20,
            model_type=None
        )
    
    @unittest_run_loop
    async def test_get_supported_platforms(self):
        """Test getting supported platforms."""
        # Arrange
        self.mock_external_model_management.get_supported_platforms.return_value = [
            ExternalPlatform.CIVITAI,
            ExternalPlatform.HUGGINGFACE
        ]
        
        # Act
        resp = await self.client.request("GET", "/asset_manager/external/platforms")
        
        # Assert
        assert resp.status == 200
        data = await resp.json()
        assert data["success"] is True
        assert len(data["data"]["platforms"]) == 2
        assert "civitai" in data["data"]["platforms"]
        assert "huggingface" in data["data"]["platforms"]
    
    @unittest_run_loop
    async def test_get_platform_info(self):
        """Test getting platform information."""
        # Arrange
        platform_info = {
            "name": "civitai",
            "display_name": "CivitAI",
            "capabilities": {"search": True},
            "is_available": True
        }
        self.mock_external_model_management.get_platform_info.return_value = platform_info
        
        # Act
        resp = await self.client.request("GET", "/asset_manager/external/platforms/civitai/info")
        
        # Assert
        assert resp.status == 200
        data = await resp.json()
        assert data["success"] is True
        assert data["data"]["name"] == "civitai"
        assert data["data"]["is_available"] is True
        
        self.mock_external_model_management.get_platform_info.assert_called_once_with(
            ExternalPlatform.CIVITAI
        )