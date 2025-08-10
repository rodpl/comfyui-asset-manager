"""Integration tests for output functionality."""

import pytest
import tempfile
import shutil
from pathlib import Path
from PIL import Image
import json

from src.adapters.driven.comfyui_output_adapter import ComfyUIOutputAdapter
from src.domain.services.output_service import OutputService


class TestOutputIntegration:
    """Integration tests for output functionality."""
    
    @pytest.fixture
    def temp_comfyui_dir(self):
        """Create a temporary ComfyUI directory structure."""
        temp_dir = tempfile.mkdtemp()
        comfyui_dir = Path(temp_dir) / "ComfyUI"
        comfyui_dir.mkdir()
        
        # Create ComfyUI indicator files
        (comfyui_dir / "main.py").write_text("# ComfyUI main file")
        (comfyui_dir / "nodes.py").write_text("# ComfyUI nodes")
        (comfyui_dir / "execution.py").write_text("# ComfyUI execution")
        (comfyui_dir / "folder_paths.py").write_text("# ComfyUI folder paths")
        (comfyui_dir / "custom_nodes").mkdir()
        (comfyui_dir / "models").mkdir()
        (comfyui_dir / "output").mkdir()
        
        yield str(comfyui_dir)
        shutil.rmtree(temp_dir)
    
    @pytest.fixture
    def output_adapter(self, temp_comfyui_dir):
        """Create output adapter for testing."""
        return ComfyUIOutputAdapter(temp_comfyui_dir)
    
    @pytest.fixture
    def output_service(self, output_adapter):
        """Create output service for testing."""
        return OutputService(output_adapter)
    
    def test_end_to_end_output_scanning(self, output_service, temp_comfyui_dir):
        """Test end-to-end output scanning functionality."""
        # Create test images in output directory
        output_dir = Path(temp_comfyui_dir) / "output"
        
        # Create a simple PNG image
        img1_path = output_dir / "test1.png"
        img1 = Image.new('RGB', (512, 512), color='red')
        img1.save(img1_path, 'PNG')
        
        # Create a JPEG image
        img2_path = output_dir / "test2.jpg"
        img2 = Image.new('RGB', (1024, 768), color='blue')
        img2.save(img2_path, 'JPEG')
        
        # Test service functionality
        outputs = output_service.get_all_outputs()
        
        assert len(outputs) == 2
        
        # Check that outputs have correct properties
        png_output = next((o for o in outputs if o.file_format == 'png'), None)
        jpg_output = next((o for o in outputs if o.file_format == 'jpeg'), None)
        
        assert png_output is not None
        assert jpg_output is not None
        
        assert png_output.image_width == 512
        assert png_output.image_height == 512
        assert jpg_output.image_width == 1024
        assert jpg_output.image_height == 768
    
    def test_output_service_sorting(self, output_service, temp_comfyui_dir):
        """Test output service sorting functionality."""
        # Create test images with different names
        output_dir = Path(temp_comfyui_dir) / "output"
        
        img_a = output_dir / "a_image.png"
        img_z = output_dir / "z_image.png"
        
        Image.new('RGB', (100, 100), color='red').save(img_a, 'PNG')
        Image.new('RGB', (200, 200), color='blue').save(img_z, 'PNG')
        
        # Get outputs
        outputs = output_service.get_all_outputs()
        
        # Test name sorting
        sorted_asc = output_service.sort_outputs(outputs, 'name', ascending=True)
        sorted_desc = output_service.sort_outputs(outputs, 'name', ascending=False)
        
        assert sorted_asc[0].filename == 'a_image.png'
        assert sorted_asc[1].filename == 'z_image.png'
        assert sorted_desc[0].filename == 'z_image.png'
        assert sorted_desc[1].filename == 'a_image.png'
        
        # Test size sorting
        sorted_by_size = output_service.sort_outputs(outputs, 'size', ascending=True)
        assert sorted_by_size[0].file_size <= sorted_by_size[1].file_size
    
    def test_output_service_filtering(self, output_service, temp_comfyui_dir):
        """Test output service filtering functionality."""
        # Create test images with different formats
        output_dir = Path(temp_comfyui_dir) / "output"
        
        png_path = output_dir / "test.png"
        jpg_path = output_dir / "test.jpg"
        
        Image.new('RGB', (100, 100), color='red').save(png_path, 'PNG')
        Image.new('RGB', (100, 100), color='blue').save(jpg_path, 'JPEG')
        
        # Test format filtering
        png_outputs = output_service.get_outputs_by_format('png')
        jpg_outputs = output_service.get_outputs_by_format('jpeg')
        
        assert len(png_outputs) == 1
        assert len(jpg_outputs) == 1
        assert png_outputs[0].file_format == 'png'
        assert jpg_outputs[0].file_format == 'jpeg'
    
    def test_output_details_retrieval(self, output_service, temp_comfyui_dir):
        """Test retrieving detailed output information."""
        # Create test image
        output_dir = Path(temp_comfyui_dir) / "output"
        img_path = output_dir / "detail_test.png"
        
        Image.new('RGB', (800, 600), color='green').save(img_path, 'PNG')
        
        # Get outputs and retrieve details
        outputs = output_service.get_all_outputs()
        assert len(outputs) == 1
        
        output_id = outputs[0].id
        detailed_output = output_service.get_output_details(output_id)
        
        assert detailed_output.id == output_id
        assert detailed_output.filename == 'detail_test.png'
        assert detailed_output.image_width == 800
        assert detailed_output.image_height == 600
    
    def test_refresh_outputs(self, output_service, temp_comfyui_dir):
        """Test refreshing outputs after adding new files."""
        output_dir = Path(temp_comfyui_dir) / "output"
        
        # Initially no outputs
        outputs = output_service.get_all_outputs()
        assert len(outputs) == 0
        
        # Add an image
        img_path = output_dir / "new_image.png"
        Image.new('RGB', (400, 300), color='yellow').save(img_path, 'PNG')
        
        # Refresh and check
        refreshed_outputs = output_service.refresh_outputs()
        assert len(refreshed_outputs) == 1
        assert refreshed_outputs[0].filename == 'new_image.png'