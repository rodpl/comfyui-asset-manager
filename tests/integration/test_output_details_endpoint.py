"""Integration tests for output details endpoint."""

import pytest
import tempfile
import shutil
from pathlib import Path
from datetime import datetime
from PIL import Image, PngImagePlugin
import json

from src.main import get_application, reset_application
from src.domain.entities.output import Output


class TestOutputDetailsEndpoint:
    """Integration tests for output details API endpoint."""
    
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
    def app_with_temp_output(self, temp_output_dir):
        """Create application with temporary output directory."""
        # Reset application state before each test
        reset_application()
        
        # Override the ComfyUI base path to use our temp directory
        import os
        original_cwd = os.getcwd()
        
        try:
            # Change to temp directory so ComfyUI adapter finds our test output
            os.chdir(Path(temp_output_dir).parent)
            app = get_application().create_web_app()
            yield app
        finally:
            os.chdir(original_cwd)
            reset_application()
    
    @pytest.mark.integration
    async def test_get_output_details_success(self, app_with_temp_output, aiohttp_client):
        """Test successful retrieval of output details."""
        client = await aiohttp_client(app_with_temp_output)
        
        # First get all outputs to find an ID
        resp = await client.get('/asset_manager/outputs')
        assert resp.status == 200
        
        data = await resp.json()
        assert data['success'] is True
        assert len(data['data']) > 0
        
        # Get details for the first output
        output_id = data['data'][0]['id']
        resp = await client.get(f'/asset_manager/outputs/{output_id}')
        assert resp.status == 200
        
        details = await resp.json()
        assert details['success'] is True
        assert 'data' in details
        
        output_data = details['data']
        assert 'id' in output_data
        assert 'filename' in output_data
        assert 'file_path' in output_data
        assert 'file_size' in output_data
        assert 'image_width' in output_data
        assert 'image_height' in output_data
        assert 'workflow_metadata' in output_data
    
    @pytest.mark.integration
    async def test_get_output_details_with_workflow_metadata(self, app_with_temp_output, aiohttp_client):
        """Test retrieval of output details with workflow metadata."""
        client = await aiohttp_client(app_with_temp_output)
        
        # Get all outputs
        resp = await client.get('/asset_manager/outputs')
        assert resp.status == 200
        
        data = await resp.json()
        outputs = data['data']
        
        # Find output with workflow metadata (PNG file)
        png_output = None
        for output in outputs:
            if output['filename'].endswith('.png'):
                png_output = output
                break
        
        assert png_output is not None, "Should have PNG output with metadata"
        
        # Get details for PNG output
        resp = await client.get(f'/asset_manager/outputs/{png_output["id"]}')
        assert resp.status == 200
        
        details = await resp.json()
        assert details['success'] is True
        
        output_data = details['data']
        assert output_data['workflow_metadata'] is not None
        assert len(output_data['workflow_metadata']) > 0
    
    @pytest.mark.integration
    async def test_get_output_details_not_found(self, app_with_temp_output, aiohttp_client):
        """Test handling of non-existent output ID."""
        client = await aiohttp_client(app_with_temp_output)
        
        resp = await client.get('/asset_manager/outputs/nonexistent-id')
        assert resp.status == 404
        
        data = await resp.json()
        assert data['success'] is False
        assert data['error_type'] == 'not_found_error'
        assert 'nonexistent-id' in data['identifier']
    
    @pytest.mark.integration
    async def test_get_output_details_empty_id(self, app_with_temp_output, aiohttp_client):
        """Test handling of empty output ID."""
        client = await aiohttp_client(app_with_temp_output)
        
        resp = await client.get('/asset_manager/outputs/')
        # This should return 404 as it doesn't match the route pattern
        assert resp.status == 404
    
    @pytest.mark.integration
    async def test_load_workflow_success(self, app_with_temp_output, aiohttp_client):
        """Test successful workflow loading."""
        client = await aiohttp_client(app_with_temp_output)
        
        # Get outputs to find one with workflow metadata
        resp = await client.get('/asset_manager/outputs')
        assert resp.status == 200
        
        data = await resp.json()
        outputs = data['data']
        
        # Find output with workflow metadata
        workflow_output = None
        for output in outputs:
            if output.get('workflow_metadata') and output['workflow_metadata'].get('workflow'):
                workflow_output = output
                break
        
        if workflow_output:
            # Try to load workflow
            resp = await client.post(f'/asset_manager/outputs/{workflow_output["id"]}/load-workflow')
            assert resp.status == 200
            
            result = await resp.json()
            assert result['success'] is True
            assert 'message' in result
    
    @pytest.mark.integration
    async def test_load_workflow_no_metadata(self, app_with_temp_output, aiohttp_client):
        """Test workflow loading for output without workflow metadata."""
        client = await aiohttp_client(app_with_temp_output)
        
        # Get outputs to find one without workflow metadata
        resp = await client.get('/asset_manager/outputs')
        assert resp.status == 200
        
        data = await resp.json()
        outputs = data['data']
        
        # Find output without workflow metadata (JPG file)
        jpg_output = None
        for output in outputs:
            if output['filename'].endswith('.jpg'):
                jpg_output = output
                break
        
        if jpg_output:
            # Try to load workflow (should fail)
            resp = await client.post(f'/asset_manager/outputs/{jpg_output["id"]}/load-workflow')
            assert resp.status == 404
            
            result = await resp.json()
            assert result['success'] is False
            assert result['error_type'] == 'workflow_not_found'
    
    @pytest.mark.integration
    async def test_open_system_success(self, app_with_temp_output, aiohttp_client):
        """Test opening file in system viewer."""
        client = await aiohttp_client(app_with_temp_output)
        
        # Get first output
        resp = await client.get('/asset_manager/outputs')
        assert resp.status == 200
        
        data = await resp.json()
        assert len(data['data']) > 0
        
        output_id = data['data'][0]['id']
        
        # Try to open in system (may fail on CI but should not crash)
        resp = await client.post(f'/asset_manager/outputs/{output_id}/open-system')
        assert resp.status in [200, 500]  # May fail on headless systems
        
        result = await resp.json()
        # Success depends on system capabilities
        assert 'success' in result
    
    @pytest.mark.integration
    async def test_show_folder_success(self, app_with_temp_output, aiohttp_client):
        """Test showing file in folder."""
        client = await aiohttp_client(app_with_temp_output)
        
        # Get first output
        resp = await client.get('/asset_manager/outputs')
        assert resp.status == 200
        
        data = await resp.json()
        assert len(data['data']) > 0
        
        output_id = data['data'][0]['id']
        
        # Try to show in folder (may fail on CI but should not crash)
        resp = await client.post(f'/asset_manager/outputs/{output_id}/show-folder')
        assert resp.status in [200, 500]  # May fail on headless systems
        
        result = await resp.json()
        # Success depends on system capabilities
        assert 'success' in result
    
    @pytest.mark.integration
    async def test_system_operations_not_found(self, app_with_temp_output, aiohttp_client):
        """Test system operations with non-existent output ID."""
        client = await aiohttp_client(app_with_temp_output)
        
        # Test open system
        resp = await client.post('/asset_manager/outputs/nonexistent-id/open-system')
        assert resp.status == 404
        
        data = await resp.json()
        assert data['success'] is False
        assert data['error_type'] == 'not_found_error'
        
        # Test show folder
        resp = await client.post('/asset_manager/outputs/nonexistent-id/show-folder')
        assert resp.status == 404
        
        data = await resp.json()
        assert data['success'] is False
        assert data['error_type'] == 'not_found_error'