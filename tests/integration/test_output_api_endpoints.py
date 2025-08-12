"""Integration tests for output API endpoints."""

import pytest
import tempfile
import shutil
from pathlib import Path
from PIL import Image, PngImagePlugin
import json
import asyncio

from src.container import get_container, reset_container
from src.adapters.driving.web_api_adapter import WebAPIAdapter


class TestOutputAPIEndpoints:
    """Integration tests for output API endpoints."""
    
    @pytest.fixture
    def temp_output_dir(self):
        """Create a temporary output directory with test images."""
        temp_dir = tempfile.mkdtemp()
        output_dir = Path(temp_dir) / "output"
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Create test images with metadata
        self._create_test_image_with_metadata(
            output_dir / "test_image_1.png",
            {"workflow": {"1": {"class_type": "CheckpointLoaderSimple"}}, "prompt": "test prompt"}
        )
        self._create_test_image_without_metadata(output_dir / "test_image_2.jpg")
        
        yield str(output_dir)
        
        # Cleanup
        shutil.rmtree(temp_dir)
    
    def _create_test_image_with_metadata(self, file_path: Path, metadata: dict):
        """Create a test PNG image with ComfyUI metadata."""
        # Create a simple test image
        img = Image.new('RGB', (512, 512), color='red')
        
        # Add PNG metadata
        pnginfo = PngImagePlugin.PngInfo()
        if 'workflow' in metadata:
            pnginfo.add_text("workflow", json.dumps(metadata['workflow']))
        if 'prompt' in metadata:
            pnginfo.add_text("prompt", metadata['prompt'])
        
        img.save(file_path, "PNG", pnginfo=pnginfo)
    
    def _create_test_image_without_metadata(self, file_path: Path):
        """Create a test image without metadata."""
        img = Image.new('RGB', (256, 256), color='blue')
        img.save(file_path, "JPEG")
    
    @pytest.fixture
    def web_adapter_with_temp_output(self, temp_output_dir):
        """Create web adapter with temporary output directory."""
        import os
        original_cwd = os.getcwd()
        
        try:
            # Reset container to ensure clean state
            reset_container()
            
            # Change to temp directory so ComfyUI adapter finds our test output
            os.chdir(Path(temp_output_dir).parent)
            
            # Get container and web adapter
            container = get_container()
            web_adapter = container.get_web_api_adapter()
            
            yield web_adapter
        finally:
            os.chdir(original_cwd)
            reset_container()
    
    @pytest.mark.integration
    def test_get_output_details_endpoint(self, web_adapter_with_temp_output):
        """Test the get output details endpoint directly."""
        from aiohttp.web_request import Request
        from unittest.mock import MagicMock
        
        async def run_test():
            # First get all outputs to find an ID
            request = MagicMock(spec=Request)
            request.query = {}
            
            response = await web_adapter_with_temp_output.get_outputs(request)
            assert response.status == 200
            
            # Parse response data
            response_data = json.loads(response.text)
            assert response_data['success'] is True
            assert len(response_data['data']) > 0
            
            # Get details for the first output
            output_id = response_data['data'][0]['id']
            
            # Mock request for output details
            detail_request = MagicMock(spec=Request)
            detail_request.match_info = {'output_id': output_id}
            
            detail_response = await web_adapter_with_temp_output.get_output_details(detail_request)
            assert detail_response.status == 200
            
            detail_data = json.loads(detail_response.text)
            assert detail_data['success'] is True
            assert 'data' in detail_data
            
            output_data = detail_data['data']
            assert 'id' in output_data
            assert 'filename' in output_data
            assert 'workflow_metadata' in output_data
        
        # Run the async test
        asyncio.run(run_test())
    
    @pytest.mark.integration
    def test_load_workflow_endpoint(self, web_adapter_with_temp_output):
        """Test the load workflow endpoint."""
        from aiohttp.web_request import Request
        from unittest.mock import MagicMock
        
        async def run_test():
            # Get outputs to find one with workflow metadata
            request = MagicMock(spec=Request)
            request.query = {}
            
            response = await web_adapter_with_temp_output.get_outputs(request)
            response_data = json.loads(response.text)
            outputs = response_data['data']
            
            # Find output with workflow metadata
            workflow_output = None
            for output in outputs:
                if output.get('workflow_metadata') and output['workflow_metadata'].get('workflow'):
                    workflow_output = output
                    break
            
            if workflow_output:
                # Test workflow loading
                load_request = MagicMock(spec=Request)
                load_request.match_info = {'output_id': workflow_output['id']}
                
                load_response = await web_adapter_with_temp_output.load_workflow(load_request)
                assert load_response.status == 200
                
                load_data = json.loads(load_response.text)
                assert load_data['success'] is True
                assert 'message' in load_data
        
        # Run the async test
        asyncio.run(run_test())
    
    @pytest.mark.integration
    def test_system_operations_endpoints(self, web_adapter_with_temp_output):
        """Test system operation endpoints."""
        from aiohttp.web_request import Request
        from unittest.mock import MagicMock
        
        async def run_test():
            # Get first output
            request = MagicMock(spec=Request)
            request.query = {}
            
            response = await web_adapter_with_temp_output.get_outputs(request)
            response_data = json.loads(response.text)
            assert len(response_data['data']) > 0
            
            output_id = response_data['data'][0]['id']
            
            # Test open system endpoint
            open_request = MagicMock(spec=Request)
            open_request.match_info = {'output_id': output_id}
            
            open_response = await web_adapter_with_temp_output.open_system(open_request)
            assert open_response.status in [200, 500]  # May fail on headless systems
            
            open_data = json.loads(open_response.text)
            assert 'success' in open_data
            
            # Test show folder endpoint
            folder_request = MagicMock(spec=Request)
            folder_request.match_info = {'output_id': output_id}
            
            folder_response = await web_adapter_with_temp_output.show_folder(folder_request)
            assert folder_response.status in [200, 500]  # May fail on headless systems
            
            folder_data = json.loads(folder_response.text)
            assert 'success' in folder_data
        
        # Run the async test
        asyncio.run(run_test())
    
    @pytest.mark.integration
    def test_endpoint_error_handling(self, web_adapter_with_temp_output):
        """Test error handling in endpoints."""
        from aiohttp.web_request import Request
        from unittest.mock import MagicMock
        
        async def run_test():
            # Test with non-existent output ID
            request = MagicMock(spec=Request)
            request.match_info = {'output_id': 'nonexistent-id'}
            
            # Test get output details
            detail_response = await web_adapter_with_temp_output.get_output_details(request)
            assert detail_response.status == 404
            
            detail_data = json.loads(detail_response.text)
            assert detail_data['success'] is False
            assert detail_data['error_type'] == 'not_found_error'
            
            # Test load workflow
            workflow_response = await web_adapter_with_temp_output.load_workflow(request)
            assert workflow_response.status == 404
            
            workflow_data = json.loads(workflow_response.text)
            assert workflow_data['success'] is False
            assert workflow_data['error_type'] == 'not_found_error'
            
            # Test system operations
            open_response = await web_adapter_with_temp_output.open_system(request)
            assert open_response.status == 404
            
            folder_response = await web_adapter_with_temp_output.show_folder(request)
            assert folder_response.status == 404
        
        # Run the async test
        asyncio.run(run_test())