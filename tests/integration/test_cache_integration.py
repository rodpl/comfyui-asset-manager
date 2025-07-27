"""Integration tests for cache adapter with domain services."""

import tempfile
import time
from datetime import datetime
from unittest.mock import Mock

import pytest

from src.adapters.driven.file_cache_adapter import FileCacheAdapter
from src.domain.entities.external_metadata import ExternalMetadata, CivitAIMetadata
from src.domain.entities.model import Model, ModelType
from src.domain.services.metadata_service import MetadataService


@pytest.fixture
def temp_cache_dir():
    """Create a temporary directory for cache testing."""
    with tempfile.TemporaryDirectory() as temp_dir:
        yield temp_dir


@pytest.fixture
def cache_adapter(temp_cache_dir):
    """Create a FileCacheAdapter instance with temporary directory."""
    return FileCacheAdapter(cache_dir=temp_cache_dir)


@pytest.fixture
def sample_model():
    """Create a sample model for testing."""
    return Model(
        id="test-model-1",
        name="Test Model",
        file_path="/path/to/model.safetensors",
        file_size=1024,
        created_at=datetime.now(),
        modified_at=datetime.now(),
        model_type=ModelType.CHECKPOINT,
        hash="abc123def456",
        folder_id="checkpoints"
    )


@pytest.fixture
def sample_external_metadata():
    """Create sample external metadata."""
    civitai_metadata = CivitAIMetadata(
        model_id=12345,
        name="Test Model",
        description="A test model",
        tags=["test", "model"],
        images=["image1.jpg"],
        download_count=1000,
        rating=4.5,
        creator="TestCreator"
    )
    
    return ExternalMetadata(
        model_hash="abc123def456",
        civitai=civitai_metadata,
        huggingface=None,
        cached_at=datetime.now()
    )


class TestCacheIntegration:
    """Integration tests for cache adapter with domain services."""
    
    def test_metadata_service_with_cache_adapter(self, cache_adapter, sample_model, sample_external_metadata):
        """Test MetadataService using FileCacheAdapter for caching."""
        # Create mock external metadata ports
        mock_civitai_port = Mock()
        mock_civitai_port.fetch_metadata.return_value = sample_external_metadata
        
        # Create metadata service with cache adapter
        metadata_service = MetadataService(
            civitai_port=mock_civitai_port,
            huggingface_port=None,
            cache_port=cache_adapter,
            cache_ttl=3600  # 1 hour
        )
        
        # First call should fetch from external source and cache
        result1 = metadata_service.enrich_metadata(sample_model)
        
        assert result1 is not None
        assert result1.civitai is not None
        assert result1.civitai.name == "Test Model"
        assert mock_civitai_port.fetch_metadata.call_count == 1
        
        # Second call should use cached data
        result2 = metadata_service.enrich_metadata(sample_model)
        
        assert result2 is not None
        assert result2.civitai is not None
        assert result2.civitai.name == "Test Model"
        # Should not call external port again
        assert mock_civitai_port.fetch_metadata.call_count == 1
        
        # Verify data is the same
        assert result1.model_hash == result2.model_hash
        assert result1.civitai.model_id == result2.civitai.model_id
    
    def test_cache_expiration_with_metadata_service(self, cache_adapter, sample_model):
        """Test that expired cache entries are handled correctly."""
        # Create mock external metadata port
        mock_civitai_port = Mock()
        civitai_metadata = CivitAIMetadata(
            model_id=12345,
            name="Test Model",
            description="A test model",
            tags=["test"],
            images=[],
            download_count=100,
            rating=4.0,
            creator="TestCreator"
        )
        external_metadata = ExternalMetadata(
            model_hash="abc123def456",
            civitai=civitai_metadata,
            huggingface=None,
            cached_at=datetime.now()
        )
        mock_civitai_port.fetch_metadata.return_value = external_metadata
        
        # Create metadata service with very short TTL
        metadata_service = MetadataService(
            civitai_port=mock_civitai_port,
            huggingface_port=None,
            cache_port=cache_adapter,
            cache_ttl=1  # 1 second TTL
        )
        
        # First call should fetch and cache
        result1 = metadata_service.enrich_metadata(sample_model)
        assert result1 is not None
        assert mock_civitai_port.fetch_metadata.call_count == 1
        
        # Wait for cache to expire
        time.sleep(1.1)
        
        # Second call should fetch again due to expiration
        result2 = metadata_service.enrich_metadata(sample_model)
        assert result2 is not None
        assert mock_civitai_port.fetch_metadata.call_count == 2
    
    def test_cache_persistence_across_service_instances(self, cache_adapter, sample_model):
        """Test that cache persists across different service instances."""
        # Create mock external metadata port
        mock_civitai_port = Mock()
        civitai_metadata = CivitAIMetadata(
            model_id=12345,
            name="Test Model",
            description="A test model",
            tags=["test"],
            images=[],
            download_count=100,
            rating=4.0,
            creator="TestCreator"
        )
        external_metadata = ExternalMetadata(
            model_hash="abc123def456",
            civitai=civitai_metadata,
            huggingface=None,
            cached_at=datetime.now()
        )
        mock_civitai_port.fetch_metadata.return_value = external_metadata
        
        # First service instance
        service1 = MetadataService(
            civitai_port=mock_civitai_port,
            cache_port=cache_adapter,
            cache_ttl=3600
        )
        
        # Fetch and cache data
        result1 = service1.enrich_metadata(sample_model)
        assert result1 is not None
        assert mock_civitai_port.fetch_metadata.call_count == 1
        
        # Second service instance with same cache adapter
        service2 = MetadataService(
            civitai_port=mock_civitai_port,
            cache_port=cache_adapter,
            cache_ttl=3600
        )
        
        # Should use cached data from first instance
        result2 = service2.enrich_metadata(sample_model)
        assert result2 is not None
        # Should not call external port again
        assert mock_civitai_port.fetch_metadata.call_count == 1
        
        # Results should be equivalent
        assert result1.model_hash == result2.model_hash
        assert result1.civitai.model_id == result2.civitai.model_id
    
    def test_cache_error_handling_in_service(self, sample_model):
        """Test that cache errors don't break the metadata service."""
        # Create a mock cache that always raises errors
        mock_cache = Mock()
        mock_cache.get.side_effect = Exception("Cache error")
        mock_cache.set.side_effect = Exception("Cache error")
        
        # Create mock external metadata port
        mock_civitai_port = Mock()
        civitai_metadata = CivitAIMetadata(
            model_id=12345,
            name="Test Model",
            description="A test model",
            tags=["test"],
            images=[],
            download_count=100,
            rating=4.0,
            creator="TestCreator"
        )
        external_metadata = ExternalMetadata(
            model_hash="abc123def456",
            civitai=civitai_metadata,
            huggingface=None,
            cached_at=datetime.now()
        )
        mock_civitai_port.fetch_metadata.return_value = external_metadata
        
        # Create metadata service with failing cache
        metadata_service = MetadataService(
            civitai_port=mock_civitai_port,
            cache_port=mock_cache,
            cache_ttl=3600
        )
        
        # Should still work despite cache errors
        result = metadata_service.enrich_metadata(sample_model)
        assert result is not None
        assert result.civitai is not None
        assert result.civitai.name == "Test Model"
        
        # Should have tried to use cache
        assert mock_cache.get.called
        assert mock_cache.set.called
    
    def test_get_cached_metadata_direct(self, cache_adapter, sample_external_metadata):
        """Test direct cache access through MetadataService."""
        # Create metadata service
        metadata_service = MetadataService(
            cache_port=cache_adapter,
            cache_ttl=3600
        )
        
        # Initially no cached data
        result = metadata_service.get_cached_metadata("abc123def456")
        assert result is None
        
        # Cache some data directly through the adapter
        cache_key = "metadata:abc123def456"
        cache_adapter.set(cache_key, sample_external_metadata.to_dict(), ttl=3600)
        
        # Should now retrieve cached data
        result = metadata_service.get_cached_metadata("abc123def456")
        assert result is not None
        assert result.model_hash == "abc123def456"
        assert result.civitai is not None
        assert result.civitai.name == "Test Model"
    
    def test_clear_cache_functionality(self, cache_adapter, sample_model):
        """Test cache clearing functionality."""
        # Create mock external metadata port
        mock_civitai_port = Mock()
        civitai_metadata = CivitAIMetadata(
            model_id=12345,
            name="Test Model",
            description="A test model",
            tags=["test"],
            images=[],
            download_count=100,
            rating=4.0,
            creator="TestCreator"
        )
        external_metadata = ExternalMetadata(
            model_hash="abc123def456",
            civitai=civitai_metadata,
            huggingface=None,
            cached_at=datetime.now()
        )
        mock_civitai_port.fetch_metadata.return_value = external_metadata
        
        # Create metadata service
        metadata_service = MetadataService(
            civitai_port=mock_civitai_port,
            cache_port=cache_adapter,
            cache_ttl=3600
        )
        
        # Fetch and cache data
        result1 = metadata_service.enrich_metadata(sample_model)
        assert result1 is not None
        assert mock_civitai_port.fetch_metadata.call_count == 1
        
        # Clear cache
        metadata_service.clear_cache()
        
        # Next call should fetch again
        result2 = metadata_service.enrich_metadata(sample_model)
        assert result2 is not None
        assert mock_civitai_port.fetch_metadata.call_count == 2
    
    def test_cache_support_properties(self, cache_adapter):
        """Test cache support property."""
        # Service with cache
        service_with_cache = MetadataService(cache_port=cache_adapter)
        assert service_with_cache.has_cache_support is True
        
        # Service without cache
        service_without_cache = MetadataService()
        assert service_without_cache.has_cache_support is False