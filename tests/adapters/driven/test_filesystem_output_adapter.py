"""Tests for FilesystemOutputAdapter."""

import pytest
import tempfile
import shutil
from pathlib import Path
from datetime import datetime
from unittest.mock import patch, MagicMock
from PIL import Image, PngImagePlugin
import json

from src.adapters.driven.filesystem_output_adapter import FilesystemOutputAdapter
from src.domain.entities.output import Output


class TestFilesystemOutputAdapter:
    """Test cases for FilesystemOutputAdapter."""
    
    @pytest.fixture
    def temp_output_dir(self):
        """Create a temporary output directory for testing."""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir)
    
    @pytest.fixture
    def temp_thumbnail_dir(self):
        """Create a temporary thumbnail directory for testing."""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir)
    
    @pytest.fixture
    def adapter(self, temp_output_dir, temp_thumbnail_dir):
        """Create FilesystemOutputAdapter instance for testing."""
        return FilesystemOutputAdapter(temp_output_dir, temp_thumbnail_dir)
    
    @pytest.fixture
    def sample_image_path(self, temp_output_dir):
        """Create a sample image file for testing."""
        image_path = Path(temp_output_dir) / "test_image.png"
        
        # Create a simple test image
        img = Image.new('RGB', (512, 512), color='red')
        img.save(image_path, 'PNG')
        
        return str(image_path)
    
    @pytest.fixture
    def sample_image_with_metadata(self, temp_output_dir):
        """Create a sample image with ComfyUI metadata for testing."""
        image_path = Path(temp_output_dir) / "test_with_metadata.png"
        
        # Create test image with metadata
        img = Image.new('RGB', (1024, 768), color='blue')
        
        # Add ComfyUI metadata
        pnginfo = PngImagePlugin.PngInfo()
        workflow_data = {
            "1": {
                "class_type": "CheckpointLoaderSimple",
                "inputs": {"ckpt_name": "test_model.safetensors"}
            },
            "2": {
                "class_type": "KSampler",
                "inputs": {
                    "seed": 12345,
                    "steps": 20,
                    "cfg": 7.5,
                    "sampler_name": "euler",
                    "scheduler": "normal"
                }
            }
        }
        pnginfo.add_text("workflow", json.dumps(workflow_data))
        pnginfo.add_text("prompt", json.dumps(workflow_data))
        
        img.save(image_path, 'PNG', pnginfo=pnginfo)
        
        return str(image_path)
    
    def test_init_creates_directories(self, temp_output_dir):
        """Test that adapter creates necessary directories."""
        thumbnail_dir = str(Path(temp_output_dir) / "thumbnails")
        
        # Remove directories to test creation
        shutil.rmtree(temp_output_dir)
        
        adapter = FilesystemOutputAdapter(temp_output_dir, thumbnail_dir)
        
        assert Path(temp_output_dir).exists()
        assert Path(thumbnail_dir).exists()
    
    def test_scan_empty_directory(self, adapter):
        """Test scanning an empty output directory."""
        outputs = adapter.scan_output_directory()
        assert outputs == []
    
    def test_scan_directory_with_images(self, adapter, sample_image_path):
        """Test scanning directory with image files."""
        outputs = adapter.scan_output_directory()
        
        assert len(outputs) == 1
        output = outputs[0]
        
        assert isinstance(output, Output)
        assert output.filename == "test_image.png"
        assert output.file_path == sample_image_path
        assert output.image_width == 512
        assert output.image_height == 512
        assert output.file_format == "png"
        assert output.file_size > 0
        assert isinstance(output.created_at, datetime)
        assert isinstance(output.modified_at, datetime)
    
    def test_scan_directory_ignores_non_images(self, adapter, temp_output_dir):
        """Test that scanning ignores non-image files."""
        # Create non-image files
        text_file = Path(temp_output_dir) / "readme.txt"
        text_file.write_text("This is not an image")
        
        json_file = Path(temp_output_dir) / "config.json"
        json_file.write_text('{"key": "value"}')
        
        outputs = adapter.scan_output_directory()
        assert outputs == []
    
    def test_scan_directory_handles_corrupted_files(self, adapter, temp_output_dir):
        """Test that scanning handles corrupted image files gracefully."""
        # Create a file with image extension but invalid content
        fake_image = Path(temp_output_dir) / "corrupted.png"
        fake_image.write_text("This is not a valid PNG file")
        
        # Should not raise exception and return empty list
        outputs = adapter.scan_output_directory()
        assert outputs == []
    
    def test_scan_nonexistent_directory(self, temp_thumbnail_dir):
        """Test scanning a non-existent directory raises IOError."""
        nonexistent_dir = "/path/that/does/not/exist"
        adapter = FilesystemOutputAdapter(nonexistent_dir, temp_thumbnail_dir)
        
        with pytest.raises(IOError, match="Output directory does not exist"):
            adapter.scan_output_directory()
    
    def test_get_output_by_id(self, adapter, sample_image_path):
        """Test getting output by ID."""
        # First scan to populate outputs
        outputs = adapter.scan_output_directory()
        assert len(outputs) == 1
        
        output_id = outputs[0].id
        found_output = adapter.get_output_by_id(output_id)
        
        assert found_output is not None
        assert found_output.id == output_id
        assert found_output.filename == "test_image.png"
    
    def test_get_output_by_nonexistent_id(self, adapter):
        """Test getting output by non-existent ID returns None."""
        found_output = adapter.get_output_by_id("nonexistent_id")
        assert found_output is None
    
    def test_get_outputs_by_format(self, adapter, temp_output_dir):
        """Test filtering outputs by file format."""
        # Create images with different formats
        png_path = Path(temp_output_dir) / "test.png"
        jpg_path = Path(temp_output_dir) / "test.jpg"
        
        Image.new('RGB', (100, 100), color='red').save(png_path, 'PNG')
        Image.new('RGB', (100, 100), color='blue').save(jpg_path, 'JPEG')
        
        # Test PNG filter
        png_outputs = adapter.get_outputs_by_format('png')
        assert len(png_outputs) == 1
        assert png_outputs[0].file_format == 'png'
        
        # Test JPG filter
        jpg_outputs = adapter.get_outputs_by_format('jpg')
        assert len(jpg_outputs) == 1
        assert jpg_outputs[0].file_format == 'jpeg'  # PIL normalizes to 'jpeg'
    
    def test_get_outputs_by_date_range(self, adapter, sample_image_path):
        """Test filtering outputs by date range."""
        # Get the file's creation time
        file_path = Path(sample_image_path)
        file_stat = file_path.stat()
        file_created = datetime.fromtimestamp(file_stat.st_ctime)
        
        # Test date range that includes the file
        start_date = file_created.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = file_created.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        outputs = adapter.get_outputs_by_date_range(start_date, end_date)
        assert len(outputs) == 1
        
        # Test date range that excludes the file
        future_start = datetime(2030, 1, 1)
        future_end = datetime(2030, 12, 31)
        
        outputs = adapter.get_outputs_by_date_range(future_start, future_end)
        assert len(outputs) == 0
    
    def test_generate_thumbnail(self, adapter, sample_image_path):
        """Test thumbnail generation."""
        # Create output object
        outputs = adapter.scan_output_directory()
        output = outputs[0]
        
        thumbnail_path = adapter.generate_thumbnail(output)
        
        assert thumbnail_path is not None
        assert Path(thumbnail_path).exists()
        assert Path(thumbnail_path).suffix == '.jpg'
        
        # Verify thumbnail is smaller than original
        with Image.open(thumbnail_path) as thumb:
            assert thumb.size[0] <= 256
            assert thumb.size[1] <= 256
    
    def test_generate_thumbnail_for_nonexistent_file(self, adapter):
        """Test thumbnail generation for non-existent file."""
        fake_output = Output(
            id="fake_id",
            filename="nonexistent.png",
            file_path="/path/to/nonexistent.png",
            file_size=1000,
            created_at=datetime.now(),
            modified_at=datetime.now(),
            image_width=512,
            image_height=512,
            file_format="png"
        )
        
        thumbnail_path = adapter.generate_thumbnail(fake_output)
        assert thumbnail_path is None
    
    def test_extract_workflow_metadata_from_png(self, adapter, sample_image_with_metadata):
        """Test extracting workflow metadata from PNG file."""
        outputs = adapter.scan_output_directory()
        output = next(o for o in outputs if o.filename == "test_with_metadata.png")
        
        metadata = adapter.extract_workflow_metadata(output)
        
        assert metadata is not None
        assert 'workflow' in metadata
        assert 'prompt' in metadata
        
        # Check extracted parameters
        assert 'model' in metadata
        assert metadata['model'] == 'test_model.safetensors'
        assert 'seed' in metadata
        assert metadata['seed'] == 12345
        assert 'steps' in metadata
        assert metadata['steps'] == 20
    
    def test_extract_workflow_metadata_from_non_png(self, adapter, temp_output_dir):
        """Test that metadata extraction returns None for non-PNG files."""
        # Create a JPEG file
        jpg_path = Path(temp_output_dir) / "test.jpg"
        Image.new('RGB', (100, 100), color='red').save(jpg_path, 'JPEG')
        
        outputs = adapter.scan_output_directory()
        jpg_output = next(o for o in outputs if o.file_format == 'jpeg')
        
        metadata = adapter.extract_workflow_metadata(jpg_output)
        assert metadata is None
    
    def test_extract_workflow_metadata_from_png_without_metadata(self, adapter, sample_image_path):
        """Test extracting metadata from PNG without ComfyUI metadata."""
        outputs = adapter.scan_output_directory()
        output = outputs[0]
        
        metadata = adapter.extract_workflow_metadata(output)
        assert metadata is None
    
    def test_generate_output_id_consistency(self, adapter):
        """Test that output ID generation is consistent."""
        file_path = "/path/to/test.png"
        
        id1 = adapter._generate_output_id(file_path)
        id2 = adapter._generate_output_id(file_path)
        
        assert id1 == id2
        assert len(id1) == 16  # SHA-256 truncated to 16 chars
    
    def test_generate_output_id_uniqueness(self, adapter):
        """Test that different file paths generate different IDs."""
        path1 = "/path/to/test1.png"
        path2 = "/path/to/test2.png"
        
        id1 = adapter._generate_output_id(path1)
        id2 = adapter._generate_output_id(path2)
        
        assert id1 != id2
    
    @patch('src.adapters.driven.filesystem_output_adapter.Image.open')
    def test_create_output_from_file_handles_image_errors(self, mock_open, adapter, temp_output_dir):
        """Test that _create_output_from_file handles image processing errors gracefully."""
        # Create a file
        test_file = Path(temp_output_dir) / "test.png"
        test_file.write_text("fake image data")
        
        # Mock Image.open to raise an exception
        mock_open.side_effect = Exception("Cannot identify image file")
        
        result = adapter._create_output_from_file(test_file)
        assert result is None
    
    def test_supported_extensions(self, adapter, temp_output_dir):
        """Test that adapter supports expected image extensions."""
        supported_formats = [
            ('test.png', 'PNG'),
            ('test.jpg', 'JPEG'),
            ('test.jpeg', 'JPEG'),
            ('test.webp', 'WebP')
        ]
        
        for filename, pil_format in supported_formats:
            file_path = Path(temp_output_dir) / filename
            try:
                Image.new('RGB', (100, 100), color='red').save(file_path, pil_format)
            except Exception:
                # Skip formats not supported by PIL in test environment
                continue
        
        outputs = adapter.scan_output_directory()
        
        # Should find at least PNG and JPEG files
        assert len(outputs) >= 2
        
        found_formats = {output.file_format for output in outputs}
        assert 'png' in found_formats
        assert 'jpeg' in found_formats
    
    @patch('subprocess.run')
    def test_open_file_in_system_success(self, mock_subprocess, adapter, sample_image_path):
        """Test successfully opening file in system viewer."""
        mock_subprocess.return_value = None  # subprocess.run returns None on success
        
        outputs = adapter.scan_output_directory()
        output = outputs[0]
        
        result = adapter.open_file_in_system(output)
        
        assert result is True
        mock_subprocess.assert_called_once()
        
        # Check that the correct command was called based on platform
        call_args = mock_subprocess.call_args[0][0]
        assert sample_image_path in str(call_args)
    
    @patch('subprocess.run')
    def test_open_file_in_system_failure(self, mock_subprocess, adapter, sample_image_path):
        """Test handling failure when opening file in system viewer."""
        mock_subprocess.side_effect = Exception("Command failed")
        
        outputs = adapter.scan_output_directory()
        output = outputs[0]
        
        result = adapter.open_file_in_system(output)
        
        assert result is False
    
    def test_open_file_in_system_nonexistent_file(self, adapter):
        """Test opening non-existent file in system viewer."""
        fake_output = Output(
            id="fake_id",
            filename="nonexistent.png",
            file_path="/path/to/nonexistent.png",
            file_size=1000,
            created_at=datetime.now(),
            modified_at=datetime.now(),
            image_width=512,
            image_height=512,
            file_format="png"
        )
        
        result = adapter.open_file_in_system(fake_output)
        assert result is False
    
    @patch('subprocess.run')
    def test_show_file_in_folder_success(self, mock_subprocess, adapter, sample_image_path):
        """Test successfully showing file in folder."""
        mock_subprocess.return_value = None  # subprocess.run returns None on success
        
        outputs = adapter.scan_output_directory()
        output = outputs[0]
        
        result = adapter.show_file_in_folder(output)
        
        assert result is True
        mock_subprocess.assert_called_once()
        
        # Check that the correct command was called
        call_args = mock_subprocess.call_args[0][0]
        # Should contain either the file path or its parent directory
        assert sample_image_path in str(call_args) or str(Path(sample_image_path).parent) in str(call_args)
    
    @patch('subprocess.run')
    def test_show_file_in_folder_failure(self, mock_subprocess, adapter, sample_image_path):
        """Test handling failure when showing file in folder."""
        mock_subprocess.side_effect = Exception("Command failed")
        
        outputs = adapter.scan_output_directory()
        output = outputs[0]
        
        result = adapter.show_file_in_folder(output)
        
        assert result is False
    
    def test_show_file_in_folder_nonexistent_file(self, adapter):
        """Test showing non-existent file in folder."""
        fake_output = Output(
            id="fake_id",
            filename="nonexistent.png",
            file_path="/path/to/nonexistent.png",
            file_size=1000,
            created_at=datetime.now(),
            modified_at=datetime.now(),
            image_width=512,
            image_height=512,
            file_format="png"
        )
        
        result = adapter.show_file_in_folder(fake_output)
        assert result is False
    
    @patch('sys.platform', 'win32')
    @patch('subprocess.run')
    def test_open_file_in_system_windows(self, mock_subprocess, adapter, sample_image_path):
        """Test opening file in system viewer on Windows."""
        outputs = adapter.scan_output_directory()
        output = outputs[0]
        
        adapter.open_file_in_system(output)
        
        call_args = mock_subprocess.call_args[0][0]
        assert call_args[0] == "start"
        assert sample_image_path in str(call_args)
    
    @patch('sys.platform', 'darwin')
    @patch('subprocess.run')
    def test_open_file_in_system_macos(self, mock_subprocess, adapter, sample_image_path):
        """Test opening file in system viewer on macOS."""
        outputs = adapter.scan_output_directory()
        output = outputs[0]
        
        adapter.open_file_in_system(output)
        
        call_args = mock_subprocess.call_args[0][0]
        assert call_args[0] == "open"
        assert sample_image_path in str(call_args)
    
    @patch('sys.platform', 'linux')
    @patch('subprocess.run')
    def test_open_file_in_system_linux(self, mock_subprocess, adapter, sample_image_path):
        """Test opening file in system viewer on Linux."""
        outputs = adapter.scan_output_directory()
        output = outputs[0]
        
        adapter.open_file_in_system(output)
        
        call_args = mock_subprocess.call_args[0][0]
        assert call_args[0] == "xdg-open"
        assert sample_image_path in str(call_args)
    
    @patch('sys.platform', 'win32')
    @patch('subprocess.run')
    def test_show_file_in_folder_windows(self, mock_subprocess, adapter, sample_image_path):
        """Test showing file in folder on Windows."""
        outputs = adapter.scan_output_directory()
        output = outputs[0]
        
        adapter.show_file_in_folder(output)
        
        call_args = mock_subprocess.call_args[0][0]
        assert call_args[0] == "explorer"
        assert "/select," in call_args
        assert sample_image_path in str(call_args)
    
    @patch('sys.platform', 'darwin')
    @patch('subprocess.run')
    def test_show_file_in_folder_macos(self, mock_subprocess, adapter, sample_image_path):
        """Test showing file in folder on macOS."""
        outputs = adapter.scan_output_directory()
        output = outputs[0]
        
        adapter.show_file_in_folder(output)
        
        call_args = mock_subprocess.call_args[0][0]
        assert call_args[0] == "open"
        assert "-R" in call_args
        assert sample_image_path in str(call_args)
    
    @patch('sys.platform', 'linux')
    @patch('subprocess.run')
    def test_show_file_in_folder_linux(self, mock_subprocess, adapter, sample_image_path):
        """Test showing file in folder on Linux."""
        outputs = adapter.scan_output_directory()
        output = outputs[0]
        
        adapter.show_file_in_folder(output)
        
        call_args = mock_subprocess.call_args[0][0]
        assert call_args[0] == "xdg-open"
        # On Linux, we open the parent directory
        assert str(Path(sample_image_path).parent) in str(call_args)
    
    def test_load_workflow_to_comfyui_with_metadata(self, adapter, sample_image_with_metadata):
        """Test loading workflow when metadata is available."""
        outputs = adapter.scan_output_directory()
        output = next(o for o in outputs if o.filename == "test_with_metadata.png")
        
        result = adapter.load_workflow_to_comfyui(output)
        
        # Base implementation just checks if workflow metadata exists
        assert result is True
    
    def test_load_workflow_to_comfyui_without_metadata(self, adapter, sample_image_path):
        """Test loading workflow when no metadata is available."""
        outputs = adapter.scan_output_directory()
        output = outputs[0]
        
        result = adapter.load_workflow_to_comfyui(output)
        
        # Should return False when no workflow metadata exists
        assert result is False