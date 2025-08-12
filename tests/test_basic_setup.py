"""Basic setup tests to verify the implementation works."""

import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime

from src.domain.entities.output import Output
from src.domain.services.output_service import OutputService


class TestBasicSetup:
    """Basic tests to verify the implementation works."""
    
    def test_output_entity_creation(self):
        """Test that Output entity can be created successfully."""
        output = Output(
            id="test_id",
            filename="test.png",
            file_path="/path/to/test.png",
            file_size=1024,
            created_at=datetime.now(),
            modified_at=datetime.now(),
            image_width=512,
            image_height=512,
            file_format="png"
        )
        
        assert output.id == "test_id"
        assert output.filename == "test.png"
        assert output.file_format == "png"
        assert output.image_width == 512
        assert output.image_height == 512
    
    def test_output_service_with_mock_repository(self):
        """Test that OutputService works with a mock repository."""
        # Create mock repository
        mock_repository = MagicMock()
        
        # Create sample output
        sample_output = Output(
            id="mock_id",
            filename="mock.png",
            file_path="/mock/path.png",
            file_size=2048,
            created_at=datetime.now(),
            modified_at=datetime.now(),
            image_width=1024,
            image_height=768,
            file_format="png"
        )
        
        # Configure mock
        mock_repository.scan_output_directory.return_value = [sample_output]
        mock_repository.generate_thumbnail.return_value = "/mock/thumb.jpg"
        mock_repository.extract_workflow_metadata.return_value = {"test": "metadata"}
        
        # Create service
        service = OutputService(mock_repository)
        
        # Test get_all_outputs
        outputs = service.get_all_outputs()
        assert len(outputs) == 1
        assert outputs[0].id == "mock_id"
        
        # Verify repository was called
        mock_repository.scan_output_directory.assert_called_once()
    
    def test_output_service_sorting(self):
        """Test output service sorting functionality."""
        mock_repository = MagicMock()
        service = OutputService(mock_repository)
        
        # Create test outputs with different properties
        output1 = Output(
            id="id1", filename="a.png", file_path="/a.png", file_size=1000,
            created_at=datetime(2024, 1, 1), modified_at=datetime(2024, 1, 1),
            image_width=100, image_height=100, file_format="png"
        )
        output2 = Output(
            id="id2", filename="z.png", file_path="/z.png", file_size=2000,
            created_at=datetime(2024, 1, 2), modified_at=datetime(2024, 1, 2),
            image_width=200, image_height=200, file_format="png"
        )
        
        outputs = [output2, output1]  # Unsorted
        
        # Test name sorting
        sorted_by_name = service.sort_outputs(outputs, 'name', ascending=True)
        assert sorted_by_name[0].filename == 'a.png'
        assert sorted_by_name[1].filename == 'z.png'
        
        # Test size sorting
        sorted_by_size = service.sort_outputs(outputs, 'size', ascending=True)
        assert sorted_by_size[0].file_size == 1000
        assert sorted_by_size[1].file_size == 2000
        
        # Test date sorting
        sorted_by_date = service.sort_outputs(outputs, 'date', ascending=True)
        assert sorted_by_date[0].created_at == datetime(2024, 1, 1)
        assert sorted_by_date[1].created_at == datetime(2024, 1, 2)
    
    def test_output_to_dict_conversion(self):
        """Test that Output entity can be converted to dictionary."""
        output = Output(
            id="dict_test",
            filename="dict_test.png",
            file_path="/path/to/dict_test.png",
            file_size=4096,
            created_at=datetime(2024, 1, 15, 10, 30, 0),
            modified_at=datetime(2024, 1, 15, 10, 30, 0),
            image_width=800,
            image_height=600,
            file_format="png",
            thumbnail_path="/path/to/thumb.jpg",
            workflow_metadata={"seed": 12345}
        )
        
        output_dict = output.to_dict()
        
        assert output_dict["id"] == "dict_test"
        assert output_dict["filename"] == "dict_test.png"
        assert output_dict["file_size"] == 4096
        assert output_dict["image_width"] == 800
        assert output_dict["image_height"] == 600
        assert output_dict["thumbnail_path"] == "/path/to/thumb.jpg"
        assert output_dict["workflow_metadata"]["seed"] == 12345
        assert "created_at" in output_dict
        assert "modified_at" in output_dict
    
    def test_output_validation(self):
        """Test that Output entity validates input data."""
        from src.domain.entities.base import ValidationError
        
        # Test invalid file format
        with pytest.raises(ValidationError):
            Output(
                id="invalid_format",
                filename="test.txt",  # Invalid extension
                file_path="/path/to/test.txt",
                file_size=1024,
                created_at=datetime.now(),
                modified_at=datetime.now(),
                image_width=512,
                image_height=512,
                file_format="txt"  # Invalid format
            )
        
        # Test invalid dimensions
        with pytest.raises(ValidationError):
            Output(
                id="invalid_dimensions",
                filename="test.png",
                file_path="/path/to/test.png",
                file_size=1024,
                created_at=datetime.now(),
                modified_at=datetime.now(),
                image_width=0,  # Invalid width
                image_height=512,
                file_format="png"
            )
    
    def test_container_integration(self):
        """Test that the dependency injection container can create output service."""
        from src.container import DIContainer
        from src.config import ApplicationConfig
        
        # Create test config
        config = ApplicationConfig()
        
        # Create container
        container = DIContainer(config)
        
        # Test that output service can be created
        output_service = container.get_output_service()
        assert output_service is not None
        
        # Test that output repository can be created
        output_repository = container.get_output_repository()
        assert output_repository is not None