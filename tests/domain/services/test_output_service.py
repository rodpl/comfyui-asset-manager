"""Tests for OutputService domain service."""

import pytest
from datetime import datetime
from unittest.mock import Mock, MagicMock

from src.domain.services.output_service import OutputService
from src.domain.entities.output import Output
from src.domain.entities.base import ValidationError, NotFoundError


class TestOutputService:
    """Test cases for OutputService."""
    
    @pytest.fixture
    def mock_output_repository(self):
        """Fixture providing a mock output repository."""
        return Mock()
    
    @pytest.fixture
    def output_service(self, mock_output_repository):
        """Fixture providing an OutputService instance."""
        return OutputService(mock_output_repository)
    
    @pytest.fixture
    def sample_output(self):
        """Fixture providing a sample output."""
        return Output(
            id="output-1",
            filename="test_image.png",
            file_path="/path/to/test_image.png",
            file_size=1024000,
            created_at=datetime(2024, 1, 1, 12, 0, 0),
            modified_at=datetime(2024, 1, 1, 12, 30, 0),
            image_width=1920,
            image_height=1080,
            file_format="png"
        )
    
    def test_get_all_outputs_success(self, output_service, mock_output_repository, sample_output):
        """Test successful retrieval of all outputs."""
        mock_output_repository.scan_output_directory.return_value = [sample_output]
        mock_output_repository.generate_thumbnail.return_value = None
        mock_output_repository.extract_workflow_metadata.return_value = None
        
        outputs = output_service.get_all_outputs()
        
        assert len(outputs) == 1
        assert outputs[0] == sample_output
        mock_output_repository.scan_output_directory.assert_called_once()
    
    def test_get_all_outputs_with_enrichment(self, output_service, mock_output_repository, sample_output):
        """Test retrieval of outputs with enrichment."""
        mock_output_repository.scan_output_directory.return_value = [sample_output]
        mock_output_repository.generate_thumbnail.return_value = "/path/to/thumbnail.jpg"
        mock_output_repository.extract_workflow_metadata.return_value = {"workflow_id": "test"}
        
        outputs = output_service.get_all_outputs()
        
        assert len(outputs) == 1
        enriched_output = outputs[0]
        assert enriched_output.thumbnail_path == "/path/to/thumbnail.jpg"
        assert enriched_output.workflow_metadata == {"workflow_id": "test"}
    
    def test_get_all_outputs_io_error(self, output_service, mock_output_repository):
        """Test handling of IO error during directory scan."""
        mock_output_repository.scan_output_directory.side_effect = IOError("Directory not accessible")
        
        with pytest.raises(ValidationError) as exc_info:
            output_service.get_all_outputs()
        
        assert "Failed to access output directory" in str(exc_info.value)
        assert exc_info.value.field == "output_directory"
    
    def test_get_output_details_success(self, output_service, mock_output_repository, sample_output):
        """Test successful retrieval of output details."""
        mock_output_repository.get_output_by_id.return_value = sample_output
        mock_output_repository.generate_thumbnail.return_value = None
        mock_output_repository.extract_workflow_metadata.return_value = None
        
        output = output_service.get_output_details("output-1")
        
        assert output == sample_output
        mock_output_repository.get_output_by_id.assert_called_once_with("output-1")
    
    def test_get_output_details_not_found(self, output_service, mock_output_repository):
        """Test handling of output not found."""
        mock_output_repository.get_output_by_id.return_value = None
        
        with pytest.raises(NotFoundError) as exc_info:
            output_service.get_output_details("nonexistent-id")
        
        assert exc_info.value.entity_type == "Output"
        assert exc_info.value.identifier == "nonexistent-id"
    
    def test_get_output_details_empty_id(self, output_service, mock_output_repository):
        """Test validation of empty output ID."""
        with pytest.raises(ValidationError) as exc_info:
            output_service.get_output_details("")
        
        assert "output_id cannot be empty" in str(exc_info.value)
        assert exc_info.value.field == "output_id"
    
    def test_refresh_outputs(self, output_service, mock_output_repository, sample_output):
        """Test refreshing outputs."""
        mock_output_repository.scan_output_directory.return_value = [sample_output]
        mock_output_repository.generate_thumbnail.return_value = None
        mock_output_repository.extract_workflow_metadata.return_value = None
        
        outputs = output_service.refresh_outputs()
        
        assert len(outputs) == 1
        assert outputs[0] == sample_output
        mock_output_repository.scan_output_directory.assert_called_once()
    
    def test_get_outputs_by_date_range_success(self, output_service, mock_output_repository, sample_output):
        """Test successful retrieval of outputs by date range."""
        start_date = datetime(2024, 1, 1, 0, 0, 0)
        end_date = datetime(2024, 1, 2, 0, 0, 0)
        
        mock_output_repository.get_outputs_by_date_range.return_value = [sample_output]
        mock_output_repository.generate_thumbnail.return_value = None
        mock_output_repository.extract_workflow_metadata.return_value = None
        
        outputs = output_service.get_outputs_by_date_range(start_date, end_date)
        
        assert len(outputs) == 1
        assert outputs[0] == sample_output
        mock_output_repository.get_outputs_by_date_range.assert_called_once_with(start_date, end_date)
    
    def test_get_outputs_by_date_range_invalid_dates(self, output_service, mock_output_repository):
        """Test validation of invalid date range."""
        start_date = datetime(2024, 1, 2, 0, 0, 0)
        end_date = datetime(2024, 1, 1, 0, 0, 0)  # End before start
        
        with pytest.raises(ValidationError) as exc_info:
            output_service.get_outputs_by_date_range(start_date, end_date)
        
        assert "start_date cannot be after end_date" in str(exc_info.value)
        assert exc_info.value.field == "date_range"
    
    def test_get_outputs_by_format_success(self, output_service, mock_output_repository, sample_output):
        """Test successful retrieval of outputs by format."""
        mock_output_repository.get_outputs_by_format.return_value = [sample_output]
        mock_output_repository.generate_thumbnail.return_value = None
        mock_output_repository.extract_workflow_metadata.return_value = None
        
        outputs = output_service.get_outputs_by_format("png")
        
        assert len(outputs) == 1
        assert outputs[0] == sample_output
        mock_output_repository.get_outputs_by_format.assert_called_once_with("png")
    
    def test_get_outputs_by_format_invalid_format(self, output_service, mock_output_repository):
        """Test validation of invalid file format."""
        with pytest.raises(ValidationError) as exc_info:
            output_service.get_outputs_by_format("bmp")
        
        assert "file_format must be one of" in str(exc_info.value)
        assert exc_info.value.field == "file_format"
    
    def test_get_outputs_by_format_empty_format(self, output_service, mock_output_repository):
        """Test validation of empty file format."""
        with pytest.raises(ValidationError) as exc_info:
            output_service.get_outputs_by_format("")
        
        assert "file_format cannot be empty" in str(exc_info.value)
        assert exc_info.value.field == "file_format"
    
    def test_sort_outputs_by_date(self, output_service, mock_output_repository):
        """Test sorting outputs by date."""
        output1 = Output(
            id="output-1",
            filename="first.png",
            file_path="/path/to/first.png",
            file_size=1024,
            created_at=datetime(2024, 1, 1, 12, 0, 0),
            modified_at=datetime(2024, 1, 1, 12, 0, 0),
            image_width=512,
            image_height=512,
            file_format="png"
        )
        
        output2 = Output(
            id="output-2",
            filename="second.png",
            file_path="/path/to/second.png",
            file_size=2048,
            created_at=datetime(2024, 1, 2, 12, 0, 0),
            modified_at=datetime(2024, 1, 2, 12, 0, 0),
            image_width=512,
            image_height=512,
            file_format="png"
        )
        
        outputs = [output2, output1]  # Unsorted
        
        # Sort ascending by date
        sorted_outputs = output_service.sort_outputs(outputs, "date", ascending=True)
        assert sorted_outputs[0] == output1
        assert sorted_outputs[1] == output2
        
        # Sort descending by date
        sorted_outputs = output_service.sort_outputs(outputs, "date", ascending=False)
        assert sorted_outputs[0] == output2
        assert sorted_outputs[1] == output1
    
    def test_sort_outputs_by_name(self, output_service, mock_output_repository):
        """Test sorting outputs by name."""
        output1 = Output(
            id="output-1",
            filename="apple.png",
            file_path="/path/to/apple.png",
            file_size=1024,
            created_at=datetime(2024, 1, 1, 12, 0, 0),
            modified_at=datetime(2024, 1, 1, 12, 0, 0),
            image_width=512,
            image_height=512,
            file_format="png"
        )
        
        output2 = Output(
            id="output-2",
            filename="banana.png",
            file_path="/path/to/banana.png",
            file_size=2048,
            created_at=datetime(2024, 1, 1, 12, 0, 0),
            modified_at=datetime(2024, 1, 1, 12, 0, 0),
            image_width=512,
            image_height=512,
            file_format="png"
        )
        
        outputs = [output2, output1]  # Unsorted
        
        sorted_outputs = output_service.sort_outputs(outputs, "name", ascending=True)
        assert sorted_outputs[0] == output1  # apple comes before banana
        assert sorted_outputs[1] == output2
    
    def test_sort_outputs_by_size(self, output_service, mock_output_repository):
        """Test sorting outputs by size."""
        output1 = Output(
            id="output-1",
            filename="small.png",
            file_path="/path/to/small.png",
            file_size=1024,
            created_at=datetime(2024, 1, 1, 12, 0, 0),
            modified_at=datetime(2024, 1, 1, 12, 0, 0),
            image_width=512,
            image_height=512,
            file_format="png"
        )
        
        output2 = Output(
            id="output-2",
            filename="large.png",
            file_path="/path/to/large.png",
            file_size=2048,
            created_at=datetime(2024, 1, 1, 12, 0, 0),
            modified_at=datetime(2024, 1, 1, 12, 0, 0),
            image_width=512,
            image_height=512,
            file_format="png"
        )
        
        outputs = [output2, output1]  # Unsorted
        
        sorted_outputs = output_service.sort_outputs(outputs, "size", ascending=True)
        assert sorted_outputs[0] == output1  # smaller file first
        assert sorted_outputs[1] == output2
    
    def test_sort_outputs_invalid_sort_by(self, output_service, mock_output_repository):
        """Test validation of invalid sort criteria."""
        with pytest.raises(ValidationError) as exc_info:
            output_service.sort_outputs([], "invalid", ascending=True)
        
        assert "sort_by must be one of" in str(exc_info.value)
        assert exc_info.value.field == "sort_by"
    
    def test_sort_outputs_invalid_input(self, output_service, mock_output_repository):
        """Test validation of invalid outputs input."""
        with pytest.raises(ValidationError) as exc_info:
            output_service.sort_outputs("not a list", "date", ascending=True)
        
        assert "outputs must be a list" in str(exc_info.value)
        assert exc_info.value.field == "outputs"    

    def test_load_workflow_success(self, output_service, mock_output_repository, sample_output):
        """Test successful workflow loading."""
        mock_output_repository.get_output_by_id.return_value = sample_output
        mock_output_repository.load_workflow_to_comfyui.return_value = True
        
        result = output_service.load_workflow("output-1")
        
        assert result is True
        mock_output_repository.get_output_by_id.assert_called_once_with("output-1")
        mock_output_repository.load_workflow_to_comfyui.assert_called_once_with(sample_output)
    
    def test_load_workflow_not_found(self, output_service, mock_output_repository):
        """Test workflow loading for non-existent output."""
        mock_output_repository.get_output_by_id.return_value = None
        
        with pytest.raises(NotFoundError) as exc_info:
            output_service.load_workflow("nonexistent-id")
        
        assert exc_info.value.identifier == "nonexistent-id"
        mock_output_repository.get_output_by_id.assert_called_once_with("nonexistent-id")
    
    def test_load_workflow_empty_id(self, output_service, mock_output_repository):
        """Test validation of empty output ID for workflow loading."""
        with pytest.raises(ValidationError) as exc_info:
            output_service.load_workflow("")
        
        assert exc_info.value.field == "output_id"
    
    def test_load_workflow_failure(self, output_service, mock_output_repository, sample_output):
        """Test workflow loading failure."""
        mock_output_repository.get_output_by_id.return_value = sample_output
        mock_output_repository.load_workflow_to_comfyui.return_value = False
        
        result = output_service.load_workflow("output-1")
        
        assert result is False
        mock_output_repository.load_workflow_to_comfyui.assert_called_once_with(sample_output)
    
    def test_open_in_system_viewer_success(self, output_service, mock_output_repository, sample_output):
        """Test successful opening in system viewer."""
        mock_output_repository.get_output_by_id.return_value = sample_output
        mock_output_repository.open_file_in_system.return_value = True
        
        result = output_service.open_in_system_viewer("output-1")
        
        assert result is True
        mock_output_repository.get_output_by_id.assert_called_once_with("output-1")
        mock_output_repository.open_file_in_system.assert_called_once_with(sample_output)
    
    def test_open_in_system_viewer_not_found(self, output_service, mock_output_repository):
        """Test opening in system viewer for non-existent output."""
        mock_output_repository.get_output_by_id.return_value = None
        
        with pytest.raises(NotFoundError) as exc_info:
            output_service.open_in_system_viewer("nonexistent-id")
        
        assert exc_info.value.identifier == "nonexistent-id"
    
    def test_open_in_system_viewer_failure(self, output_service, mock_output_repository, sample_output):
        """Test system viewer opening failure."""
        mock_output_repository.get_output_by_id.return_value = sample_output
        mock_output_repository.open_file_in_system.return_value = False
        
        result = output_service.open_in_system_viewer("output-1")
        
        assert result is False
    
    def test_show_in_folder_success(self, output_service, mock_output_repository, sample_output):
        """Test successful showing in folder."""
        mock_output_repository.get_output_by_id.return_value = sample_output
        mock_output_repository.show_file_in_folder.return_value = True
        
        result = output_service.show_in_folder("output-1")
        
        assert result is True
        mock_output_repository.get_output_by_id.assert_called_once_with("output-1")
        mock_output_repository.show_file_in_folder.assert_called_once_with(sample_output)
    
    def test_show_in_folder_not_found(self, output_service, mock_output_repository):
        """Test showing in folder for non-existent output."""
        mock_output_repository.get_output_by_id.return_value = None
        
        with pytest.raises(NotFoundError) as exc_info:
            output_service.show_in_folder("nonexistent-id")
        
        assert exc_info.value.identifier == "nonexistent-id"
    
    def test_show_in_folder_failure(self, output_service, mock_output_repository, sample_output):
        """Test folder showing failure."""
        mock_output_repository.get_output_by_id.return_value = sample_output
        mock_output_repository.show_file_in_folder.return_value = False
        
        result = output_service.show_in_folder("output-1")
        
        assert result is False