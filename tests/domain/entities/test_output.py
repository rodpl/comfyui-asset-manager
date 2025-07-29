"""Tests for Output domain entity."""

import pytest
from datetime import datetime
from src.domain.entities.output import Output, ImageDimensions, FileInfo
from src.domain.entities.base import ValidationError


class TestImageDimensions:
    """Test cases for ImageDimensions value object."""
    
    def test_valid_dimensions(self):
        """Test creating valid image dimensions."""
        dimensions = ImageDimensions(width=1920, height=1080)
        
        assert dimensions.width == 1920
        assert dimensions.height == 1080
        assert dimensions.aspect_ratio == pytest.approx(1.777, rel=1e-3)
    
    def test_square_dimensions(self):
        """Test square image dimensions."""
        dimensions = ImageDimensions(width=512, height=512)
        
        assert dimensions.width == 512
        assert dimensions.height == 512
        assert dimensions.aspect_ratio == 1.0
    
    def test_invalid_width(self):
        """Test validation of invalid width."""
        with pytest.raises(ValidationError) as exc_info:
            ImageDimensions(width=0, height=1080)
        
        assert "width must be positive" in str(exc_info.value)
        assert exc_info.value.field == "width"
    
    def test_invalid_height(self):
        """Test validation of invalid height."""
        with pytest.raises(ValidationError) as exc_info:
            ImageDimensions(width=1920, height=-1)
        
        assert "height must be positive" in str(exc_info.value)
        assert exc_info.value.field == "height"
    
    def test_aspect_ratio_zero_height(self):
        """Test aspect ratio calculation with zero height (edge case)."""
        # This should not happen due to validation, but test the property logic
        # We'll create the object directly bypassing validation for this test
        dimensions = object.__new__(ImageDimensions)
        object.__setattr__(dimensions, 'width', 1920)
        object.__setattr__(dimensions, 'height', 0)
        
        assert dimensions.aspect_ratio == 1.0


class TestFileInfo:
    """Test cases for FileInfo value object."""
    
    def test_valid_file_info(self):
        """Test creating valid file info."""
        created_at = datetime(2024, 1, 1, 12, 0, 0)
        modified_at = datetime(2024, 1, 1, 12, 30, 0)
        
        file_info = FileInfo(
            size=1024000,
            format="png",
            created_at=created_at,
            modified_at=modified_at
        )
        
        assert file_info.size == 1024000
        assert file_info.format == "png"
        assert file_info.created_at == created_at
        assert file_info.modified_at == modified_at
    
    def test_size_formatted_bytes(self):
        """Test formatted size for bytes."""
        file_info = FileInfo(
            size=512,
            format="png",
            created_at=datetime.now(),
            modified_at=datetime.now()
        )
        
        assert file_info.size_formatted == "512.0 B"
    
    def test_size_formatted_kb(self):
        """Test formatted size for kilobytes."""
        file_info = FileInfo(
            size=1536,  # 1.5 KB
            format="png",
            created_at=datetime.now(),
            modified_at=datetime.now()
        )
        
        assert file_info.size_formatted == "1.5 KB"
    
    def test_size_formatted_mb(self):
        """Test formatted size for megabytes."""
        file_info = FileInfo(
            size=2097152,  # 2 MB
            format="png",
            created_at=datetime.now(),
            modified_at=datetime.now()
        )
        
        assert file_info.size_formatted == "2.0 MB"
    
    def test_invalid_size(self):
        """Test validation of invalid size."""
        with pytest.raises(ValidationError) as exc_info:
            FileInfo(
                size=0,
                format="png",
                created_at=datetime.now(),
                modified_at=datetime.now()
            )
        
        assert "size must be positive" in str(exc_info.value)
        assert exc_info.value.field == "size"
    
    def test_invalid_format(self):
        """Test validation of invalid format."""
        with pytest.raises(ValidationError) as exc_info:
            FileInfo(
                size=1024,
                format="",
                created_at=datetime.now(),
                modified_at=datetime.now()
            )
        
        assert "format cannot be empty" in str(exc_info.value)
        assert exc_info.value.field == "format"


class TestOutput:
    """Test cases for Output domain entity."""
    
    @pytest.fixture
    def valid_output_data(self):
        """Fixture providing valid output data."""
        return {
            "id": "output-1",
            "filename": "test_image.png",
            "file_path": "/path/to/test_image.png",
            "file_size": 1024000,
            "created_at": datetime(2024, 1, 1, 12, 0, 0),
            "modified_at": datetime(2024, 1, 1, 12, 30, 0),
            "image_width": 1920,
            "image_height": 1080,
            "file_format": "png"
        }
    
    def test_valid_output(self, valid_output_data):
        """Test creating a valid output."""
        output = Output(**valid_output_data)
        
        assert output.id == "output-1"
        assert output.filename == "test_image.png"
        assert output.file_path == "/path/to/test_image.png"
        assert output.file_size == 1024000
        assert output.image_width == 1920
        assert output.image_height == 1080
        assert output.file_format == "png"
        assert output.thumbnail_path is None
        assert output.workflow_metadata == {}
    
    def test_output_with_optional_fields(self, valid_output_data):
        """Test creating output with optional fields."""
        valid_output_data.update({
            "thumbnail_path": "/path/to/thumbnail.jpg",
            "workflow_metadata": {"workflow_id": "test-workflow"}
        })
        
        output = Output(**valid_output_data)
        
        assert output.thumbnail_path == "/path/to/thumbnail.jpg"
        assert output.workflow_metadata == {"workflow_id": "test-workflow"}
    
    def test_file_name_property(self, valid_output_data):
        """Test file_name property."""
        output = Output(**valid_output_data)
        assert output.file_name == "test_image.png"
    
    def test_file_extension_property(self, valid_output_data):
        """Test file_extension property."""
        output = Output(**valid_output_data)
        assert output.file_extension == ".png"
    
    def test_dimensions_property(self, valid_output_data):
        """Test dimensions property."""
        output = Output(**valid_output_data)
        dimensions = output.dimensions
        
        assert isinstance(dimensions, ImageDimensions)
        assert dimensions.width == 1920
        assert dimensions.height == 1080
    
    def test_file_info_property(self, valid_output_data):
        """Test file_info property."""
        output = Output(**valid_output_data)
        file_info = output.file_info
        
        assert isinstance(file_info, FileInfo)
        assert file_info.size == 1024000
        assert file_info.format == "png"
    
    def test_invalid_filename(self, valid_output_data):
        """Test validation of invalid filename."""
        valid_output_data["filename"] = ""
        
        with pytest.raises(ValidationError) as exc_info:
            Output(**valid_output_data)
        
        assert "filename cannot be empty" in str(exc_info.value)
        assert exc_info.value.field == "filename"
    
    def test_invalid_file_format(self, valid_output_data):
        """Test validation of invalid file format."""
        valid_output_data["file_format"] = "bmp"
        
        with pytest.raises(ValidationError) as exc_info:
            Output(**valid_output_data)
        
        assert "file_format must be one of" in str(exc_info.value)
        assert exc_info.value.field == "file_format"
    
    def test_invalid_image_dimensions(self, valid_output_data):
        """Test validation of invalid image dimensions."""
        valid_output_data["image_width"] = 0
        
        with pytest.raises(ValidationError) as exc_info:
            Output(**valid_output_data)
        
        assert "image_width must be positive" in str(exc_info.value)
        assert exc_info.value.field == "image_width"
    
    def test_to_dict(self, valid_output_data):
        """Test converting output to dictionary."""
        output = Output(**valid_output_data)
        output_dict = output.to_dict()
        
        assert output_dict["id"] == "output-1"
        assert output_dict["filename"] == "test_image.png"
        assert output_dict["file_name"] == "test_image.png"
        assert output_dict["file_extension"] == ".png"
        assert output_dict["created_at"] == "2024-01-01T12:00:00"
        assert output_dict["workflow_metadata"] == {}
    
    def test_from_dict(self, valid_output_data):
        """Test creating output from dictionary."""
        # Convert datetime objects to ISO strings for the dict
        output_dict = {
            "id": "output-1",
            "filename": "test_image.png",
            "file_path": "/path/to/test_image.png",
            "file_size": 1024000,
            "created_at": "2024-01-01T12:00:00",
            "modified_at": "2024-01-01T12:30:00",
            "image_width": 1920,
            "image_height": 1080,
            "file_format": "png"
        }
        
        output = Output.from_dict(output_dict)
        
        assert output.id == "output-1"
        assert output.filename == "test_image.png"
        assert output.created_at == datetime(2024, 1, 1, 12, 0, 0)
        assert output.modified_at == datetime(2024, 1, 1, 12, 30, 0)
    
    def test_entity_equality(self, valid_output_data):
        """Test entity equality based on ID."""
        output1 = Output(**valid_output_data)
        output2 = Output(**valid_output_data)
        
        assert output1 == output2
    
    def test_entity_inequality(self, valid_output_data):
        """Test entity inequality with different IDs."""
        output1 = Output(**valid_output_data)
        
        valid_output_data["id"] = "output-2"
        output2 = Output(**valid_output_data)
        
        assert output1 != output2