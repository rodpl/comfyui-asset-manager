"""Unit tests for MetadataService."""

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from src.domain.services.metadata_service import MetadataService
from src.domain.entities.model import Model, ModelType
from src.domain.entities.external_metadata import ExternalMetadata, CivitAIMetadata, HuggingFaceMetadata
from src.domain.entities.base import ValidationError


@pytest.fixture
def mock_civitai_port():
    """Mock CivitAI metadata port for testing."""
    return Mock()


@pytest.fixture
def mock_huggingface_port():
    """Mock HuggingFace metadata port for testing."""
    return Mock()


@pytest.fixture
def mock_cache_port():
    """Mock cache port for testing."""
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
def sample_civitai_metadata():
    """Sample CivitAI metadata for testing."""
    return CivitAIMetadata(
        model_id=12345,
        name="Test Model",
        description="A test model from CivitAI",
        tags=["test", "civitai"],
        download_count=100,
        rating=4.5,
        creator="TestCreator"
    )


@pytest.fixture
def sample_huggingface_metadata():
    """Sample HuggingFace metadata for testing."""
    return HuggingFaceMetadata(
        model_id="test/model",
        description="A test model from HuggingFace",
        tags=["test", "huggingface"],
        downloads=200,
        likes=50,
        library="diffusers"
    )


@pytest.fixture
def sample_external_metadata(sample_civitai_metadata, sample_huggingface_metadata):
    """Sample external metadata combining both sources."""
    return ExternalMetadata(
        model_hash="abc123",
        civitai=sample_civitai_metadata,
        huggingface=sample_huggingface_metadata,
        cached_at=datetime.now()
    )


class TestMetadataService:
    """Test cases for MetadataService."""
    
    def test_init_minimal(self):
        """Test service initialization with minimal parameters."""
        service = MetadataService()
        assert service._civitai_port is None
        assert service._huggingface_port is None
        assert service._cache_port is None
        assert service._cache_ttl == 3600
    
    def test_init_full(self, mock_civitai_port, mock_huggingface_port, mock_cache_port):
        """Test service initialization with all parameters."""
        service = MetadataService(
            civitai_port=mock_civitai_port,
            huggingface_port=mock_huggingface_port,
            cache_port=mock_cache_port,
            cache_ttl=7200
        )
        assert service._civitai_port == mock_civitai_port
        assert service._huggingface_port == mock_huggingface_port
        assert service._cache_port == mock_cache_port
        assert service._cache_ttl == 7200
    
    def test_enrich_metadata_none_model(self):
        """Test enrich_metadata with None model raises ValidationError."""
        service = MetadataService()
        
        with pytest.raises(ValidationError) as exc_info:
            service.enrich_metadata(None)
        
        assert exc_info.value.field == "model"
    
    def test_enrich_metadata_no_hash(self, sample_model):
        """Test enrich_metadata with model that has no hash."""
        sample_model.hash = ""
        service = MetadataService()
        
        result = service.enrich_metadata(sample_model)
        
        assert result is None
    
    def test_enrich_metadata_no_ports(self, sample_model):
        """Test enrich_metadata with no external ports configured."""
        service = MetadataService()
        
        result = service.enrich_metadata(sample_model)
        
        assert result is None
    
    def test_enrich_metadata_cached_result(self, sample_model, sample_external_metadata, mock_cache_port):
        """Test enrich_metadata returns cached result when available."""
        mock_cache_port.get.return_value = sample_external_metadata.to_dict()
        service = MetadataService(cache_port=mock_cache_port)
        
        result = service.enrich_metadata(sample_model)
        
        assert result is not None
        assert result.model_hash == sample_external_metadata.model_hash
        mock_cache_port.get.assert_called_once_with("metadata:abc123")
    
    def test_enrich_metadata_expired_cache(self, sample_model, sample_external_metadata, mock_cache_port):
        """Test enrich_metadata handles expired cache correctly."""
        # Create expired metadata
        expired_metadata = ExternalMetadata(
            model_hash="abc123",
            civitai=sample_external_metadata.civitai,
            cached_at=datetime.now() - timedelta(hours=2)  # Expired (default TTL is 1 hour)
        )
        
        mock_cache_port.get.return_value = expired_metadata.to_dict()
        service = MetadataService(cache_port=mock_cache_port)
        
        result = service.enrich_metadata(sample_model)
        
        # Should delete expired cache and return None (no external ports)
        assert result is None
        mock_cache_port.delete.assert_called_once_with("metadata:abc123")
    
    def test_enrich_metadata_civitai_only(self, sample_model, sample_civitai_metadata, 
                                        mock_civitai_port, mock_cache_port):
        """Test enrich_metadata with CivitAI metadata only."""
        civitai_external = ExternalMetadata(
            model_hash="abc123",
            civitai=sample_civitai_metadata
        )
        mock_civitai_port.fetch_metadata.return_value = civitai_external
        mock_cache_port.get.return_value = None
        
        service = MetadataService(civitai_port=mock_civitai_port, cache_port=mock_cache_port)
        
        result = service.enrich_metadata(sample_model)
        
        assert result is not None
        assert result.civitai == sample_civitai_metadata
        assert result.huggingface is None
        mock_cache_port.set.assert_called_once()
    
    def test_enrich_metadata_huggingface_only(self, sample_model, sample_huggingface_metadata,
                                            mock_huggingface_port, mock_cache_port):
        """Test enrich_metadata with HuggingFace metadata only."""
        hf_external = ExternalMetadata(
            model_hash="abc123",
            huggingface=sample_huggingface_metadata
        )
        mock_huggingface_port.fetch_metadata.return_value = hf_external
        mock_huggingface_port.fetch_huggingface_metadata = Mock(return_value=None)
        mock_cache_port.get.return_value = None
        
        service = MetadataService(huggingface_port=mock_huggingface_port, cache_port=mock_cache_port)
        
        result = service.enrich_metadata(sample_model)
        
        assert result is not None
        assert result.huggingface == sample_huggingface_metadata
        assert result.civitai is None
        mock_cache_port.set.assert_called_once()
    
    def test_enrich_metadata_both_sources(self, sample_model, sample_civitai_metadata,
                                        sample_huggingface_metadata, mock_civitai_port,
                                        mock_huggingface_port, mock_cache_port):
        """Test enrich_metadata with both CivitAI and HuggingFace metadata."""
        civitai_external = ExternalMetadata(
            model_hash="abc123",
            civitai=sample_civitai_metadata
        )
        hf_external = ExternalMetadata(
            model_hash="abc123",
            huggingface=sample_huggingface_metadata
        )
        
        mock_civitai_port.fetch_metadata.return_value = civitai_external
        mock_huggingface_port.fetch_metadata.return_value = hf_external
        mock_huggingface_port.fetch_huggingface_metadata = Mock(return_value=None)
        mock_cache_port.get.return_value = None
        
        service = MetadataService(
            civitai_port=mock_civitai_port,
            huggingface_port=mock_huggingface_port,
            cache_port=mock_cache_port
        )
        
        result = service.enrich_metadata(sample_model)
        
        assert result is not None
        assert result.civitai == sample_civitai_metadata
        assert result.huggingface == sample_huggingface_metadata
        mock_cache_port.set.assert_called_once()
    
    def test_enrich_metadata_external_service_failure(self, sample_model, mock_civitai_port):
        """Test enrich_metadata handles external service failures gracefully."""
        mock_civitai_port.fetch_metadata.side_effect = Exception("API Error")
        service = MetadataService(civitai_port=mock_civitai_port)
        
        result = service.enrich_metadata(sample_model)
        
        # Should return None when all external services fail
        assert result is None
    
    def test_enrich_metadata_specific_civitai_method(self, sample_model, sample_civitai_metadata,
                                                   mock_civitai_port, mock_cache_port):
        """Test enrich_metadata uses specific CivitAI method when available."""
        mock_civitai_port.fetch_metadata.return_value = None
        mock_civitai_port.fetch_civitai_metadata = Mock(return_value=sample_civitai_metadata)
        mock_cache_port.get.return_value = None
        
        service = MetadataService(civitai_port=mock_civitai_port, cache_port=mock_cache_port)
        
        result = service.enrich_metadata(sample_model)
        
        assert result is not None
        assert result.civitai == sample_civitai_metadata
        mock_civitai_port.fetch_civitai_metadata.assert_called_once_with("abc123")
    
    def test_enrich_metadata_specific_huggingface_method(self, sample_model, sample_huggingface_metadata,
                                                       mock_huggingface_port, mock_cache_port):
        """Test enrich_metadata uses specific HuggingFace method when available."""
        mock_huggingface_port.fetch_metadata.return_value = None
        mock_huggingface_port.fetch_huggingface_metadata = Mock(return_value=sample_huggingface_metadata)
        mock_cache_port.get.return_value = None
        
        service = MetadataService(huggingface_port=mock_huggingface_port, cache_port=mock_cache_port)
        
        result = service.enrich_metadata(sample_model)
        
        assert result is not None
        assert result.huggingface == sample_huggingface_metadata
        mock_huggingface_port.fetch_huggingface_metadata.assert_called_once_with("Test Model")
    
    def test_get_cached_metadata_empty_hash(self):
        """Test get_cached_metadata with empty hash raises ValidationError."""
        service = MetadataService()
        
        with pytest.raises(ValidationError) as exc_info:
            service.get_cached_metadata("")
        
        assert exc_info.value.field == "model_hash"
    
    def test_get_cached_metadata_success(self, sample_external_metadata, mock_cache_port):
        """Test successful cached metadata retrieval."""
        mock_cache_port.get.return_value = sample_external_metadata.to_dict()
        service = MetadataService(cache_port=mock_cache_port)
        
        result = service.get_cached_metadata("abc123")
        
        assert result is not None
        assert result.model_hash == "abc123"
        mock_cache_port.get.assert_called_once_with("metadata:abc123")
    
    def test_get_cached_metadata_not_found(self, mock_cache_port):
        """Test get_cached_metadata when no cached data exists."""
        mock_cache_port.get.return_value = None
        service = MetadataService(cache_port=mock_cache_port)
        
        result = service.get_cached_metadata("abc123")
        
        assert result is None
    
    def test_get_cached_metadata_no_cache_port(self):
        """Test get_cached_metadata without cache port."""
        service = MetadataService()
        
        result = service.get_cached_metadata("abc123")
        
        assert result is None
    
    def test_clear_cache_success(self, mock_cache_port):
        """Test successful cache clearing."""
        service = MetadataService(cache_port=mock_cache_port)
        
        service.clear_cache()
        
        mock_cache_port.clear.assert_called_once()
    
    def test_clear_cache_no_cache_port(self):
        """Test clear_cache without cache port."""
        service = MetadataService()
        
        # Should not raise an exception
        service.clear_cache()
    
    def test_clear_cache_failure(self, mock_cache_port):
        """Test clear_cache handles failures gracefully."""
        mock_cache_port.clear.side_effect = Exception("Cache error")
        service = MetadataService(cache_port=mock_cache_port)
        
        # Should not raise an exception
        service.clear_cache()
    
    def test_invalidate_model_cache_empty_hash(self):
        """Test invalidate_model_cache with empty hash raises ValidationError."""
        service = MetadataService()
        
        with pytest.raises(ValidationError) as exc_info:
            service.invalidate_model_cache("")
        
        assert exc_info.value.field == "model_hash"
    
    def test_invalidate_model_cache_success(self, mock_cache_port):
        """Test successful model cache invalidation."""
        service = MetadataService(cache_port=mock_cache_port)
        
        service.invalidate_model_cache("abc123")
        
        mock_cache_port.delete.assert_called_once_with("metadata:abc123")
    
    def test_invalidate_model_cache_no_cache_port(self):
        """Test invalidate_model_cache without cache port."""
        service = MetadataService()
        
        # Should not raise an exception
        service.invalidate_model_cache("abc123")
    
    def test_invalidate_model_cache_failure(self, mock_cache_port):
        """Test invalidate_model_cache handles failures gracefully."""
        mock_cache_port.delete.side_effect = Exception("Cache error")
        service = MetadataService(cache_port=mock_cache_port)
        
        # Should not raise an exception
        service.invalidate_model_cache("abc123")
    
    def test_property_has_civitai_support(self, mock_civitai_port):
        """Test has_civitai_support property."""
        service_without = MetadataService()
        service_with = MetadataService(civitai_port=mock_civitai_port)
        
        assert not service_without.has_civitai_support
        assert service_with.has_civitai_support
    
    def test_property_has_huggingface_support(self, mock_huggingface_port):
        """Test has_huggingface_support property."""
        service_without = MetadataService()
        service_with = MetadataService(huggingface_port=mock_huggingface_port)
        
        assert not service_without.has_huggingface_support
        assert service_with.has_huggingface_support
    
    def test_property_has_cache_support(self, mock_cache_port):
        """Test has_cache_support property."""
        service_without = MetadataService()
        service_with = MetadataService(cache_port=mock_cache_port)
        
        assert not service_without.has_cache_support
        assert service_with.has_cache_support
    
    def test_cache_key_generation(self):
        """Test cache key generation."""
        service = MetadataService()
        
        cache_key = service._get_cache_key("abc123")
        
        assert cache_key == "metadata:abc123"
    
    def test_cache_metadata_no_cache_port(self, sample_external_metadata):
        """Test _cache_metadata without cache port."""
        service = MetadataService()
        
        # Should not raise an exception
        service._cache_metadata("abc123", sample_external_metadata)
    
    def test_cache_metadata_failure(self, sample_external_metadata, mock_cache_port):
        """Test _cache_metadata handles failures gracefully."""
        mock_cache_port.set.side_effect = Exception("Cache error")
        service = MetadataService(cache_port=mock_cache_port)
        
        # Should not raise an exception
        service._cache_metadata("abc123", sample_external_metadata)