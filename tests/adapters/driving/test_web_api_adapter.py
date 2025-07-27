"""Integration tests for Web API adapter."""

import json
import pytest
from datetime import datetime
from unittest.mock import Mock, MagicMock
from aiohttp import web
from aiohttp.test_utils import AioHTTPTestCase, unittest_run_loop

from src.adapters.driving.web_api_adapter import WebAPIAdapter
from src.domain.ports.driving.model_management_port import ModelManagementPort
from src.domain.ports.driving.folder_management_port import FolderManagementPort
from src.domain.entities.model import Model, ModelType
from src.domain.entities.folder import Folder
from src.domain.entities.base import ValidationError, NotFoundError, DomainError


class TestWebAPIAdapter(AioHTTPTestCase):
    """Integration tests for the Web API adapter."""
    
    async def get_application(self):
        """Create test application with Web API adapter."""
        # Create mock domain services
        self.mock_model_management = Mock(spec=ModelManagementPort)
        self.mock_folder_management = Mock(spec=FolderManagementPort)
        
        # Create adapter
        self.adapter = WebAPIAdapter(
            model_management=self.mock_model_management,
            folder_management=self.mock_folder_management
        )
        
        # Create application and register routes
        app = web.Application()
        self.adapter.register_routes(app)
        
        return app
    
    def setUp(self):
        """Set up test fixtures."""
        super().setUp()
        
        # Sample test data
        self.sample_folder = Folder(
            id="folder-1",
            name="Checkpoints",
            path="/models/checkpoints",
            model_type=ModelType.CHECKPOINT,
            model_count=2
        )
        
        self.sample_model = Model(
            id="model-1",
            name="Test Model",
            file_path="/models/checkpoints/test_model.safetensors",
            file_size=1024000,
            created_at=datetime(2024, 1, 1, 12, 0, 0),
            modified_at=datetime(2024, 1, 2, 12, 0, 0),
            model_type=ModelType.CHECKPOINT,
            hash="abc123def456",
            folder_id="folder-1",
            thumbnail_path="/thumbnails/test_model.jpg",
            user_metadata={"tags": ["test", "checkpoint"], "rating": 4}
        )
    
    @unittest_run_loop
    async def test_get_folders_success(self):
        """Test successful folder listing."""
        # Arrange
        folders = [self.sample_folder]
        self.mock_folder_management.get_all_folders.return_value = folders
        
        # Act
        resp = await self.client.request("GET", "/asset_manager/folders")
        
        # Assert
        self.assertEqual(resp.status, 200)
        data = await resp.json()
        
        self.assertTrue(data["success"])
        self.assertEqual(data["count"], 1)
        self.assertEqual(len(data["data"]), 1)
        
        folder_data = data["data"][0]
        self.assertEqual(folder_data["id"], "folder-1")
        self.assertEqual(folder_data["name"], "Checkpoints")
        self.assertEqual(folder_data["model_type"], "checkpoint")
        
        self.mock_folder_management.get_all_folders.assert_called_once()
    
    @unittest_run_loop
    async def test_get_folders_domain_error(self):
        """Test folder listing with domain error."""
        # Arrange
        self.mock_folder_management.get_all_folders.side_effect = DomainError("Test error")
        
        # Act
        resp = await self.client.request("GET", "/asset_manager/folders")
        
        # Assert
        self.assertEqual(resp.status, 422)
        data = await resp.json()
        
        self.assertFalse(data["success"])
        self.assertEqual(data["error_type"], "domain_error")
        self.assertEqual(data["error"], "Test error")
    
    @unittest_run_loop
    async def test_get_models_in_folder_success(self):
        """Test successful model listing for a folder."""
        # Arrange
        models = [self.sample_model]
        self.mock_model_management.get_models_in_folder.return_value = models
        
        # Act
        resp = await self.client.request("GET", "/asset_manager/folders/folder-1/models")
        
        # Assert
        self.assertEqual(resp.status, 200)
        data = await resp.json()
        
        self.assertTrue(data["success"])
        self.assertEqual(data["count"], 1)
        self.assertEqual(data["folder_id"], "folder-1")
        self.assertEqual(len(data["data"]), 1)
        
        model_data = data["data"][0]
        self.assertEqual(model_data["id"], "model-1")
        self.assertEqual(model_data["name"], "Test Model")
        self.assertEqual(model_data["model_type"], "checkpoint")
        self.assertEqual(model_data["file_size"], 1024000)
        
        self.mock_model_management.get_models_in_folder.assert_called_once_with("folder-1")
    
    @unittest_run_loop
    async def test_get_models_in_folder_validation_error(self):
        """Test model listing with validation error."""
        # Arrange
        self.mock_model_management.get_models_in_folder.side_effect = ValidationError(
            "folder_id cannot be empty", "folder_id"
        )
        
        # Act
        resp = await self.client.request("GET", "/asset_manager/folders/invalid/models")
        
        # Assert
        self.assertEqual(resp.status, 400)
        data = await resp.json()
        
        self.assertFalse(data["success"])
        self.assertEqual(data["error_type"], "validation_error")
        self.assertEqual(data["field"], "folder_id")
        self.assertEqual(data["error"], "folder_id cannot be empty")
    
    @unittest_run_loop
    async def test_get_model_details_success(self):
        """Test successful model details retrieval."""
        # Arrange
        self.mock_model_management.get_model_details.return_value = self.sample_model
        
        # Act
        resp = await self.client.request("GET", "/asset_manager/models/model-1")
        
        # Assert
        self.assertEqual(resp.status, 200)
        data = await resp.json()
        
        self.assertTrue(data["success"])
        
        model_data = data["data"]
        self.assertEqual(model_data["id"], "model-1")
        self.assertEqual(model_data["name"], "Test Model")
        self.assertEqual(model_data["hash"], "abc123def456")
        self.assertEqual(model_data["user_metadata"]["rating"], 4)
        
        self.mock_model_management.get_model_details.assert_called_once_with("model-1")
    
    @unittest_run_loop
    async def test_get_model_details_not_found(self):
        """Test model details retrieval with not found error."""
        # Arrange
        self.mock_model_management.get_model_details.side_effect = NotFoundError(
            "Model", "nonexistent-model"
        )
        
        # Act
        resp = await self.client.request("GET", "/asset_manager/models/nonexistent-model")
        
        # Assert
        self.assertEqual(resp.status, 404)
        data = await resp.json()
        
        self.assertFalse(data["success"])
        self.assertEqual(data["error_type"], "not_found_error")
        self.assertEqual(data["entity_type"], "Model")
        self.assertEqual(data["identifier"], "nonexistent-model")
    
    @unittest_run_loop
    async def test_search_models_success(self):
        """Test successful model search."""
        # Arrange
        models = [self.sample_model]
        self.mock_model_management.search_models.return_value = models
        
        # Act
        resp = await self.client.request("GET", "/asset_manager/search?q=test")
        
        # Assert
        self.assertEqual(resp.status, 200)
        data = await resp.json()
        
        self.assertTrue(data["success"])
        self.assertEqual(data["count"], 1)
        self.assertEqual(data["query"], "test")
        self.assertIsNone(data["folder_id"])
        
        model_data = data["data"][0]
        self.assertEqual(model_data["id"], "model-1")
        
        self.mock_model_management.search_models.assert_called_once_with("test", None)
    
    @unittest_run_loop
    async def test_search_models_with_folder_filter(self):
        """Test model search with folder filter."""
        # Arrange
        models = [self.sample_model]
        self.mock_model_management.search_models.return_value = models
        
        # Act
        resp = await self.client.request("GET", "/asset_manager/search?q=test&folder_id=folder-1")
        
        # Assert
        self.assertEqual(resp.status, 200)
        data = await resp.json()
        
        self.assertTrue(data["success"])
        self.assertEqual(data["query"], "test")
        self.assertEqual(data["folder_id"], "folder-1")
        
        self.mock_model_management.search_models.assert_called_once_with("test", "folder-1")
    
    @unittest_run_loop
    async def test_search_models_missing_query(self):
        """Test model search without required query parameter."""
        # Act
        resp = await self.client.request("GET", "/asset_manager/search")
        
        # Assert
        self.assertEqual(resp.status, 400)
        data = await resp.json()
        
        self.assertFalse(data["success"])
        self.assertEqual(data["error_type"], "validation_error")
        self.assertEqual(data["error"], "Missing required parameter 'q'")
        
        # Should not call the domain service
        self.mock_model_management.search_models.assert_not_called()
    
    @unittest_run_loop
    async def test_search_models_validation_error(self):
        """Test model search with validation error from domain."""
        # Arrange
        self.mock_model_management.search_models.side_effect = ValidationError(
            "query cannot be empty", "query"
        )
        
        # Act
        resp = await self.client.request("GET", "/asset_manager/search?q=valid_query")
        
        # Assert
        self.assertEqual(resp.status, 400)
        data = await resp.json()
        
        self.assertFalse(data["success"])
        self.assertEqual(data["error_type"], "validation_error")
        self.assertEqual(data["field"], "query")
    
    @unittest_run_loop
    async def test_unexpected_error_handling(self):
        """Test handling of unexpected errors."""
        # Arrange
        self.mock_folder_management.get_all_folders.side_effect = RuntimeError("Unexpected error")
        
        # Act
        resp = await self.client.request("GET", "/asset_manager/folders")
        
        # Assert
        self.assertEqual(resp.status, 500)
        data = await resp.json()
        
        self.assertFalse(data["success"])
        self.assertEqual(data["error_type"], "internal_error")
        self.assertEqual(data["error"], "An unexpected error occurred")


@pytest.mark.integration
class TestWebAPIAdapterIntegration:
    """Integration tests for Web API adapter with real domain services."""
    
    def test_adapter_initialization(self):
        """Test that adapter can be initialized with domain services."""
        # Arrange
        mock_model_management = Mock(spec=ModelManagementPort)
        mock_folder_management = Mock(spec=FolderManagementPort)
        
        # Act
        adapter = WebAPIAdapter(
            model_management=mock_model_management,
            folder_management=mock_folder_management
        )
        
        # Assert
        assert adapter._model_management is mock_model_management
        assert adapter._folder_management is mock_folder_management
    
    def test_route_registration(self):
        """Test that all routes are properly registered."""
        # Arrange
        mock_model_management = Mock(spec=ModelManagementPort)
        mock_folder_management = Mock(spec=FolderManagementPort)
        adapter = WebAPIAdapter(mock_model_management, mock_folder_management)
        
        app = web.Application()
        
        # Act
        adapter.register_routes(app)
        
        # Assert
        routes = [route.resource.canonical for route in app.router.routes()]
        expected_routes = [
            "/asset_manager/folders",
            "/asset_manager/folders/{folder_id}/models",
            "/asset_manager/models/{model_id}",
            "/asset_manager/search"
        ]
        
        for expected_route in expected_routes:
            assert expected_route in routes
    
    def test_all_endpoints_have_correct_prefix(self):
        """Test that all endpoints use the /asset_manager prefix."""
        # Arrange
        mock_model_management = Mock(spec=ModelManagementPort)
        mock_folder_management = Mock(spec=FolderManagementPort)
        adapter = WebAPIAdapter(mock_model_management, mock_folder_management)
        
        app = web.Application()
        adapter.register_routes(app)
        
        # Act & Assert
        for route in app.router.routes():
            route_path = route.resource.canonical
            assert route_path.startswith("/asset_manager/"), f"Route {route_path} doesn't have correct prefix"