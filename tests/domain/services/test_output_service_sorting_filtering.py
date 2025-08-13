"""Tests for OutputService sorting and filtering functionality."""

import pytest
from unittest.mock import MagicMock
from datetime import datetime, timedelta
from typing import List

from src.domain.services.output_service import OutputService
from src.domain.entities.output import Output
from src.domain.entities.base import ValidationError


class TestOutputServiceSortingFiltering:
    """Test class for OutputService sorting and filtering functionality."""
    
    @pytest.fixture
    def mock_repository(self):
        """Create a mock output repository."""
        return MagicMock()
    
    @pytest.fixture
    def service(self, mock_repository):
        """Create an OutputService instance with mocked repository."""
        return OutputService(mock_repository, cache_ttl_seconds=60)
    
    @pytest.fixture
    def sample_outputs(self):
        """Create sample outputs for testing."""
        now = datetime.now()
        return [
            Output(
                id="output1",
                filename="image_a.png",
                file_path="/path/to/image_a.png",
                file_size=1024,
                created_at=now - timedelta(days=2),
                modified_at=now - timedelta(days=2),
                image_width=512,
                image_height=512,
                file_format="png"
            ),
            Output(
                id="output2",
                filename="image_b.jpg",
                file_path="/path/to/image_b.jpg",
                file_size=2048,
                created_at=now - timedelta(days=1),
                modified_at=now - timedelta(days=1),
                image_width=1024,
                image_height=1024,
                file_format="jpg"
            ),
            Output(
                id="output3",
                filename="image_c.webp",
                file_path="/path/to/image_c.webp",
                file_size=512,
                created_at=now,
                modified_at=now,
                image_width=256,
                image_height=256,
                file_format="webp"
            )
        ]
    
    def test_sort_outputs_by_date_ascending(self, service, sample_outputs):
        """Test sorting outputs by date in ascending order."""
        sorted_outputs = service.sort_outputs(sample_outputs, "date", ascending=True)
        
        assert len(sorted_outputs) == 3
        assert sorted_outputs[0].filename == "image_a.png"  # Oldest
        assert sorted_outputs[1].filename == "image_b.jpg"
        assert sorted_outputs[2].filename == "image_c.webp"  # Newest
    
    def test_sort_outputs_by_date_descending(self, service, sample_outputs):
        """Test sorting outputs by date in descending order."""
        sorted_outputs = service.sort_outputs(sample_outputs, "date", ascending=False)
        
        assert len(sorted_outputs) == 3
        assert sorted_outputs[0].filename == "image_c.webp"  # Newest
        assert sorted_outputs[1].filename == "image_b.jpg"
        assert sorted_outputs[2].filename == "image_a.png"  # Oldest
    
    def test_sort_outputs_by_name_ascending(self, service, sample_outputs):
        """Test sorting outputs by name in ascending order."""
        sorted_outputs = service.sort_outputs(sample_outputs, "name", ascending=True)
        
        assert len(sorted_outputs) == 3
        assert sorted_outputs[0].filename == "image_a.png"
        assert sorted_outputs[1].filename == "image_b.jpg"
        assert sorted_outputs[2].filename == "image_c.webp"
    
    def test_sort_outputs_by_name_descending(self, service, sample_outputs):
        """Test sorting outputs by name in descending order."""
        sorted_outputs = service.sort_outputs(sample_outputs, "name", ascending=False)
        
        assert len(sorted_outputs) == 3
        assert sorted_outputs[0].filename == "image_c.webp"
        assert sorted_outputs[1].filename == "image_b.jpg"
        assert sorted_outputs[2].filename == "image_a.png"
    
    def test_sort_outputs_by_size_ascending(self, service, sample_outputs):
        """Test sorting outputs by size in ascending order."""
        sorted_outputs = service.sort_outputs(sample_outputs, "size", ascending=True)
        
        assert len(sorted_outputs) == 3
        assert sorted_outputs[0].file_size == 512   # Smallest
        assert sorted_outputs[1].file_size == 1024
        assert sorted_outputs[2].file_size == 2048  # Largest
    
    def test_sort_outputs_by_size_descending(self, service, sample_outputs):
        """Test sorting outputs by size in descending order."""
        sorted_outputs = service.sort_outputs(sample_outputs, "size", ascending=False)
        
        assert len(sorted_outputs) == 3
        assert sorted_outputs[0].file_size == 2048  # Largest
        assert sorted_outputs[1].file_size == 1024
        assert sorted_outputs[2].file_size == 512   # Smallest
    
    def test_sort_outputs_invalid_sort_by(self, service, sample_outputs):
        """Test sorting with invalid sort_by parameter."""
        with pytest.raises(ValidationError) as exc_info:
            service.sort_outputs(sample_outputs, "invalid", ascending=True)
        
        assert "sort_by must be one of" in str(exc_info.value)
        assert exc_info.value.field == "sort_by"
    
    def test_sort_outputs_empty_sort_by(self, service, sample_outputs):
        """Test sorting with empty sort_by parameter."""
        with pytest.raises(ValidationError) as exc_info:
            service.sort_outputs(sample_outputs, "", ascending=True)
        
        assert "sort_by cannot be empty" in str(exc_info.value)
        assert exc_info.value.field == "sort_by"
    
    def test_sort_outputs_none_sort_by(self, service, sample_outputs):
        """Test sorting with None sort_by parameter."""
        with pytest.raises(ValidationError) as exc_info:
            service.sort_outputs(sample_outputs, None, ascending=True)
        
        assert "sort_by cannot be empty" in str(exc_info.value)
        assert exc_info.value.field == "sort_by"
    
    def test_sort_outputs_invalid_outputs_type(self, service):
        """Test sorting with invalid outputs parameter type."""
        with pytest.raises(ValidationError) as exc_info:
            service.sort_outputs("not a list", "date", ascending=True)
        
        assert "outputs must be a list" in str(exc_info.value)
        assert exc_info.value.field == "outputs"
    
    def test_sort_outputs_empty_list(self, service):
        """Test sorting with empty outputs list."""
        sorted_outputs = service.sort_outputs([], "date", ascending=True)
        assert sorted_outputs == []
    
    def test_get_outputs_by_format_png(self, service, mock_repository, sample_outputs):
        """Test filtering outputs by PNG format."""
        png_outputs = [output for output in sample_outputs if output.file_format == "png"]
        mock_repository.get_outputs_by_format.return_value = png_outputs
        
        result = service.get_outputs_by_format("png")
        
        assert len(result) == 1
        assert result[0].file_format == "png"
        mock_repository.get_outputs_by_format.assert_called_once_with("png")
    
    def test_get_outputs_by_format_jpg(self, service, mock_repository, sample_outputs):
        """Test filtering outputs by JPG format."""
        jpg_outputs = [output for output in sample_outputs if output.file_format == "jpg"]
        mock_repository.get_outputs_by_format.return_value = jpg_outputs
        
        result = service.get_outputs_by_format("jpg")
        
        assert len(result) == 1
        assert result[0].file_format == "jpg"
        mock_repository.get_outputs_by_format.assert_called_once_with("jpg")
    
    def test_get_outputs_by_format_case_insensitive(self, service, mock_repository, sample_outputs):
        """Test filtering outputs by format is case insensitive."""
        png_outputs = [output for output in sample_outputs if output.file_format == "png"]
        mock_repository.get_outputs_by_format.return_value = png_outputs
        
        result = service.get_outputs_by_format("PNG")
        
        assert len(result) == 1
        assert result[0].file_format == "png"
        mock_repository.get_outputs_by_format.assert_called_once_with("png")
    
    def test_get_outputs_by_format_invalid_format(self, service):
        """Test filtering with invalid file format."""
        with pytest.raises(ValidationError) as exc_info:
            service.get_outputs_by_format("invalid")
        
        assert "file_format must be one of" in str(exc_info.value)
        assert exc_info.value.field == "file_format"
    
    def test_get_outputs_by_format_empty_format(self, service):
        """Test filtering with empty file format."""
        with pytest.raises(ValidationError) as exc_info:
            service.get_outputs_by_format("")
        
        assert "file_format cannot be empty" in str(exc_info.value)
        assert exc_info.value.field == "file_format"
    
    def test_get_outputs_by_date_range_valid(self, service, mock_repository, sample_outputs):
        """Test filtering outputs by valid date range."""
        start_date = datetime.now() - timedelta(days=3)
        end_date = datetime.now()
        
        mock_repository.get_outputs_by_date_range.return_value = sample_outputs
        
        result = service.get_outputs_by_date_range(start_date, end_date)
        
        assert len(result) == 3
        mock_repository.get_outputs_by_date_range.assert_called_once_with(start_date, end_date)
    
    def test_get_outputs_by_date_range_invalid_start_date(self, service):
        """Test filtering with invalid start_date type."""
        with pytest.raises(ValidationError) as exc_info:
            service.get_outputs_by_date_range("not a date", datetime.now())
        
        assert "start_date must be a datetime" in str(exc_info.value)
        assert exc_info.value.field == "start_date"
    
    def test_get_outputs_by_date_range_invalid_end_date(self, service):
        """Test filtering with invalid end_date type."""
        with pytest.raises(ValidationError) as exc_info:
            service.get_outputs_by_date_range(datetime.now(), "not a date")
        
        assert "end_date must be a datetime" in str(exc_info.value)
        assert exc_info.value.field == "end_date"
    
    def test_get_outputs_by_date_range_start_after_end(self, service):
        """Test filtering with start_date after end_date."""
        start_date = datetime.now()
        end_date = datetime.now() - timedelta(days=1)
        
        with pytest.raises(ValidationError) as exc_info:
            service.get_outputs_by_date_range(start_date, end_date)
        
        assert "start_date cannot be after end_date" in str(exc_info.value)
        assert exc_info.value.field == "date_range"


class TestOutputServiceCaching:
    """Test class for OutputService caching functionality."""
    
    @pytest.fixture
    def mock_repository(self):
        """Create a mock output repository."""
        return MagicMock()
    
    @pytest.fixture
    def service(self, mock_repository):
        """Create an OutputService instance with short cache TTL for testing."""
        return OutputService(mock_repository, cache_ttl_seconds=1)
    
    @pytest.fixture
    def sample_outputs(self):
        """Create sample outputs for testing."""
        now = datetime.now()
        return [
            Output(
                id="output1",
                filename="image_a.png",
                file_path="/path/to/image_a.png",
                file_size=1024,
                created_at=now,
                modified_at=now,
                image_width=512,
                image_height=512,
                file_format="png"
            )
        ]
    
    def test_get_all_outputs_caches_results(self, service, mock_repository, sample_outputs):
        """Test that get_all_outputs caches results."""
        mock_repository.scan_output_directory.return_value = sample_outputs
        
        # First call should hit repository
        result1 = service.get_all_outputs()
        assert len(result1) == 1
        assert mock_repository.scan_output_directory.call_count == 1
        
        # Second call should use cache
        result2 = service.get_all_outputs()
        assert len(result2) == 1
        assert mock_repository.scan_output_directory.call_count == 1  # Still 1
        
        # Results should be identical
        assert result1[0].id == result2[0].id
    
    def test_get_outputs_by_format_caches_results(self, service, mock_repository, sample_outputs):
        """Test that get_outputs_by_format caches results."""
        mock_repository.get_outputs_by_format.return_value = sample_outputs
        
        # First call should hit repository
        result1 = service.get_outputs_by_format("png")
        assert len(result1) == 1
        assert mock_repository.get_outputs_by_format.call_count == 1
        
        # Second call should use cache
        result2 = service.get_outputs_by_format("png")
        assert len(result2) == 1
        assert mock_repository.get_outputs_by_format.call_count == 1  # Still 1
    
    def test_get_outputs_by_date_range_caches_results(self, service, mock_repository, sample_outputs):
        """Test that get_outputs_by_date_range caches results."""
        start_date = datetime.now() - timedelta(days=1)
        end_date = datetime.now()
        
        mock_repository.get_outputs_by_date_range.return_value = sample_outputs
        
        # First call should hit repository
        result1 = service.get_outputs_by_date_range(start_date, end_date)
        assert len(result1) == 1
        assert mock_repository.get_outputs_by_date_range.call_count == 1
        
        # Second call should use cache
        result2 = service.get_outputs_by_date_range(start_date, end_date)
        assert len(result2) == 1
        assert mock_repository.get_outputs_by_date_range.call_count == 1  # Still 1
    
    def test_refresh_outputs_clears_cache(self, service, mock_repository, sample_outputs):
        """Test that refresh_outputs clears cache."""
        mock_repository.scan_output_directory.return_value = sample_outputs
        
        # First call to populate cache
        service.get_all_outputs()
        assert mock_repository.scan_output_directory.call_count == 1
        
        # Refresh should clear cache and call repository again
        service.refresh_outputs()
        assert mock_repository.scan_output_directory.call_count == 2
        
        # Next call should use new cache
        service.get_all_outputs()
        assert mock_repository.scan_output_directory.call_count == 2  # Still 2
    
    def test_cache_expiration(self, service, mock_repository, sample_outputs):
        """Test that cache entries expire after TTL."""
        import time
        
        mock_repository.scan_output_directory.return_value = sample_outputs
        
        # First call should hit repository
        result1 = service.get_all_outputs()
        assert len(result1) == 1
        assert mock_repository.scan_output_directory.call_count == 1
        
        # Wait for cache to expire (TTL is 1 second)
        time.sleep(1.1)
        
        # Next call should hit repository again due to expiration
        result2 = service.get_all_outputs()
        assert len(result2) == 1
        assert mock_repository.scan_output_directory.call_count == 2
    
    def test_different_cache_keys(self, service, mock_repository, sample_outputs):
        """Test that different operations use different cache keys."""
        mock_repository.scan_output_directory.return_value = sample_outputs
        mock_repository.get_outputs_by_format.return_value = sample_outputs
        
        # Call different methods
        service.get_all_outputs()
        service.get_outputs_by_format("png")
        
        # Both should hit their respective repositories
        assert mock_repository.scan_output_directory.call_count == 1
        assert mock_repository.get_outputs_by_format.call_count == 1
        
        # Calling same methods again should use cache
        service.get_all_outputs()
        service.get_outputs_by_format("png")
        
        # Repository call counts should remain the same
        assert mock_repository.scan_output_directory.call_count == 1
        assert mock_repository.get_outputs_by_format.call_count == 1