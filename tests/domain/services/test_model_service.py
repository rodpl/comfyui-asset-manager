"""Unit tests for ModelService."""

import pytest
from datetime import datetime
from unittest.mock import Mock, MagicMock

from src.domain.services.model_service import ModelService
from src.domain.entities.model import Model, ModelType
from src.domain.entities.external_metadata import ExternalMetadata, CivitAIMetadata
from src.domain.entities.base import ValidationError, NotFoundError


@pytest.fixture
def mock_model_repository():
    """Mock model repository for testing."""
    return Mock()


@pytest.fixture
def mock_external_metadata_port():
    """Mock external metadata port for testing."""
    return Mock()


@pytest.fixture
def sample_model():
    """Sample model for testing."""
    return Model(
        id="model-1",
        name="Test Model",
        file_path="/path/to/model.safetensors",
        file_size=1024,
        created_at=datetime(2024, 1, 1, 12, 0, 0),
        modified_at=datetime(2024, 1, 1, 12, 0, 0),
        model_type=ModelType.CHECKPOINT,
        hash="abc123",
        folder_id="folder-1"
    )


@pytest.fixture
def sample_external_metadata():
    """Sample external metadata for testing."""
    civitai_metadata = CivitAIMetadata(
        model_id=12345,
        name="Test Model",
        description="A test model",
        tags=["test", "model"],
        download_count=100,
        rating=4.5,
        creator="TestCreator"
    )
    return ExternalMetadata(
        model_hash="abc123",
        civitai=civitai_metadata
    )


class TestModelService:
    """Test cases for ModelService."""
    
    def test_init_with_repository_only(self, mock_model_repository):
        """Test service initialization with repository only."""
        service = ModelService(mock_model_repository)
        assert service._model_repository == mock_model_repository
        assert service._external_metadata_port is None
    
    def test_init_with_repository_and_metadata_port(self, mock_model_repository, mock_external_metadata_port):
        """Test service initialization with both repository and metadata port."""
        service = ModelService(mock_model_repository, mock_external_metadata_port)
        assert service._model_repository == mock_model_repository
        assert service._external_metadata_port == mock_external_metadata_port
    
    def test_get_models_in_folder_success(self, mock_model_repository, sample_model):
        """Test successful retrieval of models in folder."""
        mock_model_repository.find_all_in_folder.return_value = [sample_model]
        service = ModelService(mock_model_repository)
        
        result = service.get_models_in_folder("folder-1")
        
        assert result == [sample_model]
        mock_model_repository.find_all_in_folder.assert_called_once_with("folder-1")
    
    def test_get_models_in_folder_empty_folder_id(self, mock_model_repository):
        """Test get_models_in_folder with empty folder_id raises ValidationError."""
        service = ModelService(mock_model_repository)
        
        with pytest.raises(ValidationError) as exc_info:
            service.get_models_in_folder("")
        
        assert exc_info.value.field == "folder_id"
        assert "cannot be empty" in exc_info.value.message
    
    def test_get_models_in_folder_whitespace_folder_id(self, mock_model_repository):
        """Test get_models_in_folder with whitespace folder_id raises ValidationError."""
        service = ModelService(mock_model_repository)
        
        with pytest.raises(ValidationError) as exc_info:
            service.get_models_in_folder("   ")
        
        assert exc_info.value.field == "folder_id"
    
    def test_get_models_in_folder_strips_whitespace(self, mock_model_repository, sample_model):
        """Test get_models_in_folder strips whitespace from folder_id."""
        mock_model_repository.find_all_in_folder.return_value = [sample_model]
        service = ModelService(mock_model_repository)
        
        service.get_models_in_folder("  folder-1  ")
        
        mock_model_repository.find_all_in_folder.assert_called_once_with("folder-1")
    
    def test_get_model_details_success(self, mock_model_repository, sample_model):
        """Test successful retrieval of model details."""
        mock_model_repository.find_by_id.return_value = sample_model
        service = ModelService(mock_model_repository)
        
        result = service.get_model_details("model-1")
        
        assert result == sample_model
        mock_model_repository.find_by_id.assert_called_once_with("model-1")
    
    def test_get_model_details_not_found(self, mock_model_repository):
        """Test get_model_details when model is not found."""
        mock_model_repository.find_by_id.return_value = None
        service = ModelService(mock_model_repository)
        
        with pytest.raises(NotFoundError) as exc_info:
            service.get_model_details("nonexistent")
        
        assert exc_info.value.entity_type == "Model"
        assert exc_info.value.identifier == "nonexistent"
    
    def test_get_model_details_empty_model_id(self, mock_model_repository):
        """Test get_model_details with empty model_id raises ValidationError."""
        service = ModelService(mock_model_repository)
        
        with pytest.raises(ValidationError) as exc_info:
            service.get_model_details("")
        
        assert exc_info.value.field == "model_id"
    
    def test_get_model_details_with_enrichment(self, mock_model_repository, mock_external_metadata_port, 
                                             sample_model, sample_external_metadata):
        """Test get_model_details with metadata enrichment."""
        mock_model_repository.find_by_id.return_value = sample_model
        mock_external_metadata_port.fetch_metadata.return_value = sample_external_metadata
        service = ModelService(mock_model_repository, mock_external_metadata_port)
        
        result = service.get_model_details("model-1")
        
        # Should have external metadata in user_metadata
        assert "external_metadata" in result.user_metadata
        assert result.user_metadata["external_metadata"] == sample_external_metadata.to_dict()
        
        # Should have merged tags
        assert "tags" in result.user_metadata
        assert "test" in result.user_metadata["tags"]
        assert "model" in result.user_metadata["tags"]
    
    def test_get_model_details_enrichment_fails_gracefully(self, mock_model_repository, 
                                                         mock_external_metadata_port, sample_model):
        """Test get_model_details falls back gracefully when enrichment fails."""
        mock_model_repository.find_by_id.return_value = sample_model
        mock_external_metadata_port.fetch_metadata.side_effect = Exception("API Error")
        service = ModelService(mock_model_repository, mock_external_metadata_port)
        
        result = service.get_model_details("model-1")
        
        # Should return original model when enrichment fails
        assert result == sample_model
    
    def test_search_models_success(self, mock_model_repository, sample_model):
        """Test successful model search."""
        mock_model_repository.search.return_value = [sample_model]
        service = ModelService(mock_model_repository)
        
        result = service.search_models("test query")
        
        assert result == [sample_model]
        mock_model_repository.search.assert_called_once_with("test query", None)
    
    def test_search_models_with_folder_filter(self, mock_model_repository, sample_model):
        """Test model search with folder filter."""
        mock_model_repository.search.return_value = [sample_model]
        service = ModelService(mock_model_repository)
        
        result = service.search_models("test query", "folder-1")
        
        assert result == [sample_model]
        mock_model_repository.search.assert_called_once_with("test query", "folder-1")
    
    def test_search_models_empty_query(self, mock_model_repository):
        """Test search_models with empty query raises ValidationError."""
        service = ModelService(mock_model_repository)
        
        with pytest.raises(ValidationError) as exc_info:
            service.search_models("")
        
        assert exc_info.value.field == "query"
    
    def test_search_models_empty_folder_id(self, mock_model_repository):
        """Test search_models with empty folder_id raises ValidationError."""
        service = ModelService(mock_model_repository)
        
        with pytest.raises(ValidationError) as exc_info:
            service.search_models("test", "")
        
        assert exc_info.value.field == "folder_id"
    
    def test_search_models_strips_whitespace(self, mock_model_repository, sample_model):
        """Test search_models strips whitespace from parameters."""
        mock_model_repository.search.return_value = [sample_model]
        service = ModelService(mock_model_repository)
        
        service.search_models("  test query  ", "  folder-1  ")
        
        mock_model_repository.search.assert_called_once_with("test query", "folder-1")
    
    def test_enrich_model_metadata_success(self, mock_model_repository, mock_external_metadata_port,
                                         sample_model, sample_external_metadata):
        """Test successful model metadata enrichment."""
        mock_external_metadata_port.fetch_metadata.return_value = sample_external_metadata
        service = ModelService(mock_model_repository, mock_external_metadata_port)
        
        result = service.enrich_model_metadata(sample_model)
        
        # Should have external metadata
        assert "external_metadata" in result.user_metadata
        assert result.user_metadata["external_metadata"] == sample_external_metadata.to_dict()
        
        # Should have tags from external metadata
        assert "tags" in result.user_metadata
        assert "test" in result.user_metadata["tags"]
        assert "model" in result.user_metadata["tags"]
        
        # Should have description from external metadata
        assert result.user_metadata["description"] == "A test model"
    
    def test_enrich_model_metadata_no_external_port(self, mock_model_repository, sample_model):
        """Test enrich_model_metadata without external metadata port."""
        service = ModelService(mock_model_repository)
        
        result = service.enrich_model_metadata(sample_model)
        
        # Should return original model unchanged
        assert result == sample_model
    
    def test_enrich_model_metadata_no_external_data(self, mock_model_repository, mock_external_metadata_port,
                                                   sample_model):
        """Test enrich_model_metadata when no external data is found."""
        mock_external_metadata_port.fetch_metadata.return_value = None
        service = ModelService(mock_model_repository, mock_external_metadata_port)
        
        result = service.enrich_model_metadata(sample_model)
        
        # Should return original model unchanged
        assert result == sample_model
    
    def test_enrich_model_metadata_none_model(self, mock_model_repository):
        """Test enrich_model_metadata with None model raises ValidationError."""
        service = ModelService(mock_model_repository)
        
        with pytest.raises(ValidationError) as exc_info:
            service.enrich_model_metadata(None)
        
        assert exc_info.value.field == "model"
    
    def test_enrich_model_metadata_preserves_existing_tags(self, mock_model_repository, 
                                                          mock_external_metadata_port,
                                                          sample_model, sample_external_metadata):
        """Test that enrichment preserves existing user tags."""
        # Add existing tags to the model
        sample_model.user_metadata["tags"] = ["existing", "user_tag"]
        
        mock_external_metadata_port.fetch_metadata.return_value = sample_external_metadata
        service = ModelService(mock_model_repository, mock_external_metadata_port)
        
        result = service.enrich_model_metadata(sample_model)
        
        # Should have both existing and external tags
        tags = result.user_metadata["tags"]
        assert "existing" in tags
        assert "user_tag" in tags
        assert "test" in tags
        assert "model" in tags
    
    def test_enrich_model_metadata_preserves_existing_description(self, mock_model_repository,
                                                                mock_external_metadata_port,
                                                                sample_model, sample_external_metadata):
        """Test that enrichment preserves existing user description."""
        # Add existing description to the model
        sample_model.user_metadata["description"] = "Existing user description"
        
        mock_external_metadata_port.fetch_metadata.return_value = sample_external_metadata
        service = ModelService(mock_model_repository, mock_external_metadata_port)
        
        result = service.enrich_model_metadata(sample_model)
        
        # Should keep existing description, not overwrite with external
        assert result.user_metadata["description"] == "Existing user description"
    
    def test_enrich_model_metadata_fails_gracefully(self, mock_model_repository, mock_external_metadata_port,
                                                   sample_model):
        """Test that enrichment fails gracefully when external service throws exception."""
        mock_external_metadata_port.fetch_metadata.side_effect = Exception("API Error")
        service = ModelService(mock_model_repository, mock_external_metadata_port)
        
        result = service.enrich_model_metadata(sample_model)
        
        # Should return original model when enrichment fails
        assert result == sample_model