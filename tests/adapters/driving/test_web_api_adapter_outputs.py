"""Tests for WebAPIAdapter output endpoints."""

import pytest
import json
from datetime import datetime
from unittest.mock import MagicMock, patch
from aiohttp import web
from aiohttp.test_utils import AioHTTPTestCase, unittest_run_loop

from src.adapters.driving.web_api_adapter import WebAPIAdapter
from src.domain.entities.output import Output
from src.domain.entities.base import ValidationError, NotFoundError


class TestWebAPIAdapterOutputs(AioHTTPTestCase):
    """Test cases for WebAPIAdapter output endpoints."""
    
    async def get_application(self):
        """Create test application with mocked services."""
        # Create mock services
        self.mock_model_management = MagicMock()
        self.mock_folder_management = MagicMock()
        self.mock_output_management = MagicMock()
        
        # Create adapter
        self.adapter = WebAPIAdapter(
            model_management=self.mock_model_management,
            folder_management=self.mock_folder_management,
            output_management=self.mock_output_management
        )
        
        # Create app and register routes
        app = web.Application()
        self.adapter.register_routes(app)
        
        return app
    
    def create_sample_output(self, output_id="test_output_1"):
        """Create a sample output for testing."""
        return Output(
            id=output_id,
            filename="test_image.png",
            file_path="/path/to/test_image.png",
            file_size=1024000,
            created_at=datetime(2024, 1, 15, 10, 30, 0),
            modified_at=datetime(2024, 1, 15, 10, 30, 0),
            image_width=1024,
            image_height=768,
            file_format="png",
            thumbnail_path="/path/to/thumbnails/test_image_thumb.jpg",
            workflow_metadata={
                "model": "test_model.safetensors",
                "seed": 12345,
                "steps": 20
            }
        )
    
    @unittest_run_loop
    async def test_get_outputs_success(self):
        """Test successful retrieval of outputs."""
        # Setup mock
        sample_outputs = [
            self.create_sample_output("output_1"),
            self.create_sample_output("output_2")
        ]
        self.mock_output_management.get_all_outputs.return_value = sample_outputs
        self.mock_output_management.sort_outputs.return_value = sample_outputs
        
        # Make request
        resp = await self.client.request("GET", "/asset_manager/outputs")
        
        # Verify response
        assert resp.status == 200
        data = await resp.json()
        
        assert data["success"] is True
        assert data["count"] == 2
        assert len(data["data"]) == 2
        
        # Verify output data structure
        output_data = data["data"][0]
        assert "id" in output_data
        assert "filename" in output_data
        assert "file_path" in output_data
        assert "file_size" in output_data
        assert "created_at" in output_data
        assert "workflow_metadata" in output_data
        
        # Verify service calls
        self.mock_output_management.get_all_outputs.assert_called_once()
        self.mock_output_management.sort_outputs.assert_called_once()
    
    @unittest_run_loop
    async def test_get_outputs_with_format_filter(self):
        """Test getting outputs with format filter."""
        # Setup mock
        sample_outputs = [self.create_sample_output()]
        self.mock_output_management.get_outputs_by_format.return_value = sample_outputs
        self.mock_output_management.sort_outputs.return_value = sample_outputs
        
        # Make request with format filter
        resp = await self.client.request("GET", "/asset_manager/outputs?format=png")
        
        # Verify response
        assert resp.status == 200
        data = await resp.json()
        
        assert data["success"] is True
        assert data["filters"]["format"] == "png"
        
        # Verify service call
        self.mock_output_management.get_outputs_by_format.assert_called_once_with("png")
    
    @unittest_run_loop
    async def test_get_outputs_with_date_range_filter(self):
        """Test getting outputs with date range filter."""
        # Setup mock
        sample_outputs = [self.create_sample_output()]
        self.mock_output_management.get_outputs_by_date_range.return_value = sample_outputs
        self.mock_output_management.sort_outputs.return_value = sample_outputs
        
        # Make request with date range filter
        start_date = "2024-01-01T00:00:00"
        end_date = "2024-01-31T23:59:59"
        resp = await self.client.request(
            "GET", 
            f"/asset_manager/outputs?start_date={start_date}&end_date={end_date}"
        )
        
        # Verify response
        assert resp.status == 200
        data = await resp.json()
        
        assert data["success"] is True
        assert data["filters"]["start_date"] == start_date
        assert data["filters"]["end_date"] == end_date
        
        # Verify service call
        self.mock_output_management.get_outputs_by_date_range.assert_called_once()
    
    @unittest_run_loop
    async def test_get_outputs_with_invalid_date_format(self):
        """Test getting outputs with invalid date format."""
        # Make request with invalid date format
        resp = await self.client.request(
            "GET", 
            "/asset_manager/outputs?start_date=invalid-date&end_date=2024-01-31"
        )
        
        # Verify error response
        assert resp.status == 400
        data = await resp.json()
        
        assert data["success"] is False
        assert "Invalid date format" in data["error"]
        assert data["error_type"] == "validation_error"
    
    @unittest_run_loop
    async def test_get_outputs_with_sorting(self):
        """Test getting outputs with custom sorting."""
        # Setup mock
        sample_outputs = [self.create_sample_output()]
        self.mock_output_management.get_all_outputs.return_value = sample_outputs
        self.mock_output_management.sort_outputs.return_value = sample_outputs
        
        # Make request with sorting parameters
        resp = await self.client.request(
            "GET", 
            "/asset_manager/outputs?sort_by=name&ascending=true"
        )
        
        # Verify response
        assert resp.status == 200
        data = await resp.json()
        
        assert data["success"] is True
        assert data["filters"]["sort_by"] == "name"
        assert data["filters"]["ascending"] is True
        
        # Verify service call
        self.mock_output_management.sort_outputs.assert_called_once_with(
            sample_outputs, "name", True
        )
    
    @unittest_run_loop
    async def test_get_outputs_validation_error(self):
        """Test get outputs with validation error."""
        # Setup mock to raise validation error
        self.mock_output_management.get_all_outputs.side_effect = ValidationError(
            "Invalid output directory", "output_directory"
        )
        
        # Make request
        resp = await self.client.request("GET", "/asset_manager/outputs")
        
        # Verify error response
        assert resp.status == 400
        data = await resp.json()
        
        assert data["success"] is False
        assert data["error"] == "Invalid output directory"
        assert data["error_type"] == "validation_error"
        assert data["field"] == "output_directory"
    
    @unittest_run_loop
    async def test_get_output_details_success(self):
        """Test successful retrieval of output details."""
        # Setup mock
        sample_output = self.create_sample_output()
        self.mock_output_management.get_output_details.return_value = sample_output
        
        # Make request
        resp = await self.client.request("GET", "/asset_manager/outputs/test_output_1")
        
        # Verify response
        assert resp.status == 200
        data = await resp.json()
        
        assert data["success"] is True
        assert data["data"]["id"] == "test_output_1"
        assert data["data"]["filename"] == "test_image.png"
        
        # Verify service call
        self.mock_output_management.get_output_details.assert_called_once_with("test_output_1")
    
    @unittest_run_loop
    async def test_get_output_details_not_found(self):
        """Test get output details with not found error."""
        # Setup mock to raise not found error
        self.mock_output_management.get_output_details.side_effect = NotFoundError(
            "Output", "nonexistent_id"
        )
        
        # Make request
        resp = await self.client.request("GET", "/asset_manager/outputs/nonexistent_id")
        
        # Verify error response
        assert resp.status == 404
        data = await resp.json()
        
        assert data["success"] is False
        assert data["error_type"] == "not_found_error"
        assert data["entity_type"] == "Output"
        assert data["identifier"] == "nonexistent_id"
    
    @unittest_run_loop
    async def test_refresh_outputs_success(self):
        """Test successful refresh of outputs."""
        # Setup mock
        sample_outputs = [
            self.create_sample_output("output_1"),
            self.create_sample_output("output_2")
        ]
        self.mock_output_management.refresh_outputs.return_value = sample_outputs
        
        # Make request
        resp = await self.client.request("POST", "/asset_manager/outputs/refresh")
        
        # Verify response
        assert resp.status == 200
        data = await resp.json()
        
        assert data["success"] is True
        assert data["count"] == 2
        assert len(data["data"]) == 2
        assert "message" in data
        assert "rescanned" in data["message"]
        
        # Verify service call
        self.mock_output_management.refresh_outputs.assert_called_once()
    
    @unittest_run_loop
    async def test_refresh_outputs_validation_error(self):
        """Test refresh outputs with validation error."""
        # Setup mock to raise validation error
        self.mock_output_management.refresh_outputs.side_effect = ValidationError(
            "Output directory not accessible", "output_directory"
        )
        
        # Make request
        resp = await self.client.request("POST", "/asset_manager/outputs/refresh")
        
        # Verify error response
        assert resp.status == 400
        data = await resp.json()
        
        assert data["success"] is False
        assert data["error"] == "Output directory not accessible"
        assert data["error_type"] == "validation_error"
    
    @unittest_run_loop
    async def test_get_outputs_unexpected_error(self):
        """Test get outputs with unexpected error."""
        # Setup mock to raise unexpected error
        self.mock_output_management.get_all_outputs.side_effect = Exception("Unexpected error")
        
        # Make request
        resp = await self.client.request("GET", "/asset_manager/outputs")
        
        # Verify error response
        assert resp.status == 500
        data = await resp.json()
        
        assert data["success"] is False
        assert data["error"] == "An unexpected error occurred"
        assert data["error_type"] == "internal_error"
    
    @unittest_run_loop
    async def test_output_endpoints_registered(self):
        """Test that output endpoints are properly registered."""
        # Test that all output endpoints exist
        endpoints_to_test = [
            ("GET", "/asset_manager/outputs"),
            ("GET", "/asset_manager/outputs/test_id"),
            ("POST", "/asset_manager/outputs/refresh")
        ]
        
        for method, path in endpoints_to_test:
            # Setup mock to avoid actual processing
            if "refresh" in path:
                self.mock_output_management.refresh_outputs.return_value = []
            elif "outputs/test_id" in path:
                self.mock_output_management.get_output_details.return_value = self.create_sample_output()
            else:
                self.mock_output_management.get_all_outputs.return_value = []
                self.mock_output_management.sort_outputs.return_value = []
            
            # Make request
            resp = await self.client.request(method, path)
            
            # Should not return 404 (endpoint exists)
            assert resp.status != 404, f"Endpoint {method} {path} not found"
    
    @unittest_run_loop
    async def test_get_outputs_response_structure(self):
        """Test that get outputs response has correct structure."""
        # Setup mock
        sample_output = self.create_sample_output()
        self.mock_output_management.get_all_outputs.return_value = [sample_output]
        self.mock_output_management.sort_outputs.return_value = [sample_output]
        
        # Make request
        resp = await self.client.request("GET", "/asset_manager/outputs")
        
        # Verify response structure
        assert resp.status == 200
        data = await resp.json()
        
        # Check top-level structure
        required_fields = ["success", "data", "count", "filters"]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        # Check output data structure
        output_data = data["data"][0]
        required_output_fields = [
            "id", "filename", "file_path", "file_size", "created_at", 
            "modified_at", "image_width", "image_height", "file_format"
        ]
        for field in required_output_fields:
            assert field in output_data, f"Missing output field: {field}"
        
        # Check optional fields
        optional_fields = ["thumbnail_path", "workflow_metadata"]
        for field in optional_fields:
            # Should be present (may be None)
            assert field in output_data, f"Missing optional field: {field}"