"""Metadata service for external metadata enrichment."""

from typing import Optional, List
from datetime import datetime, timedelta
import logging

from ..ports.driven.external_metadata_port import ExternalMetadataPort
from ..ports.driven.cache_port import CachePort
from ..entities.external_metadata import ExternalMetadata, CivitAIMetadata, HuggingFaceMetadata
from ..entities.model import Model
from ..entities.base import ValidationError


logger = logging.getLogger(__name__)


class MetadataService:
    """Service for enriching models with external metadata.
    
    This service handles fetching metadata from external sources like CivitAI
    and HuggingFace, with caching for performance optimization and graceful
    fallback when external services are unavailable.
    """
    
    def __init__(
        self,
        civitai_port: Optional[ExternalMetadataPort] = None,
        huggingface_port: Optional[ExternalMetadataPort] = None,
        cache_port: Optional[CachePort] = None,
        cache_ttl: int = 3600  # 1 hour default TTL
    ):
        """Initialize the metadata service.
        
        Args:
            civitai_port: Optional port for CivitAI metadata access
            huggingface_port: Optional port for HuggingFace metadata access
            cache_port: Optional port for caching functionality
            cache_ttl: Cache time-to-live in seconds (default: 1 hour)
        """
        self._civitai_port = civitai_port
        self._huggingface_port = huggingface_port
        self._cache_port = cache_port
        self._cache_ttl = cache_ttl
    
    def enrich_metadata(self, model: Model) -> Optional[ExternalMetadata]:
        """Enrich model with external metadata from available sources.
        
        Args:
            model: The model to enrich with external metadata
            
        Returns:
            External metadata if found, None otherwise
            
        Raises:
            ValidationError: If model is invalid
        """
        if model is None:
            raise ValidationError("model cannot be None", "model")
        
        if not model.hash:
            logger.debug(f"Model {model.id} has no hash, skipping metadata enrichment")
            return None
        
        # Try to get from cache first
        cached_metadata = self._get_cached_metadata(model.hash)
        if cached_metadata:
            logger.debug(f"Using cached metadata for model {model.id}")
            return cached_metadata
        
        # Fetch from external sources
        civitai_metadata = self._fetch_civitai_metadata(model)
        huggingface_metadata = self._fetch_huggingface_metadata(model)
        
        # If we have any metadata, create ExternalMetadata object
        if civitai_metadata or huggingface_metadata:
            external_metadata = ExternalMetadata(
                model_hash=model.hash,
                civitai=civitai_metadata,
                huggingface=huggingface_metadata,
                cached_at=datetime.now()
            )
            
            # Cache the result
            self._cache_metadata(model.hash, external_metadata)
            
            logger.info(f"Successfully enriched metadata for model {model.id}")
            return external_metadata
        
        logger.debug(f"No external metadata found for model {model.id}")
        return None
    
    def get_cached_metadata(self, model_hash: str) -> Optional[ExternalMetadata]:
        """Get cached metadata for a model hash.
        
        Args:
            model_hash: The model hash to lookup
            
        Returns:
            Cached external metadata if found, None otherwise
            
        Raises:
            ValidationError: If model_hash is invalid
        """
        if not model_hash or not model_hash.strip():
            raise ValidationError("model_hash cannot be empty", "model_hash")
        
        return self._get_cached_metadata(model_hash.strip())
    
    def clear_cache(self) -> None:
        """Clear all cached metadata."""
        if self._cache_port:
            try:
                # Clear all metadata cache entries
                # Since we don't have a way to clear by prefix, we'll clear the entire cache
                self._cache_port.clear()
                logger.info("Metadata cache cleared")
            except Exception as e:
                logger.warning(f"Failed to clear metadata cache: {e}")
    
    def invalidate_model_cache(self, model_hash: str) -> None:
        """Invalidate cached metadata for a specific model.
        
        Args:
            model_hash: The model hash to invalidate
            
        Raises:
            ValidationError: If model_hash is invalid
        """
        if not model_hash or not model_hash.strip():
            raise ValidationError("model_hash cannot be empty", "model_hash")
        
        if self._cache_port:
            try:
                cache_key = self._get_cache_key(model_hash.strip())
                self._cache_port.delete(cache_key)
                logger.debug(f"Invalidated cache for model hash {model_hash}")
            except Exception as e:
                logger.warning(f"Failed to invalidate cache for model hash {model_hash}: {e}")
    
    def _fetch_civitai_metadata(self, model: Model) -> Optional[CivitAIMetadata]:
        """Fetch metadata from CivitAI.
        
        Args:
            model: The model to fetch metadata for
            
        Returns:
            CivitAI metadata if found, None otherwise
        """
        if not self._civitai_port:
            return None
        
        try:
            logger.debug(f"Fetching CivitAI metadata for model {model.id}")
            external_metadata = self._civitai_port.fetch_metadata(model.hash)
            if external_metadata and external_metadata.civitai:
                return external_metadata.civitai
            
            # Try the specific CivitAI method if available
            if hasattr(self._civitai_port, 'fetch_civitai_metadata'):
                return self._civitai_port.fetch_civitai_metadata(model.hash)
                
        except Exception as e:
            logger.warning(f"Failed to fetch CivitAI metadata for model {model.id}: {e}")
        
        return None
    
    def _fetch_huggingface_metadata(self, model: Model) -> Optional[HuggingFaceMetadata]:
        """Fetch metadata from HuggingFace.
        
        Args:
            model: The model to fetch metadata for
            
        Returns:
            HuggingFace metadata if found, None otherwise
        """
        if not self._huggingface_port:
            return None
        
        try:
            logger.debug(f"Fetching HuggingFace metadata for model {model.id}")
            
            # Try using model name first (more likely to work for HuggingFace)
            model_identifier = model.name
            
            # Try the specific HuggingFace method if available
            if hasattr(self._huggingface_port, 'fetch_huggingface_metadata'):
                hf_metadata = self._huggingface_port.fetch_huggingface_metadata(model_identifier)
                if hf_metadata:
                    return hf_metadata
            
            # Fall back to generic fetch_metadata
            external_metadata = self._huggingface_port.fetch_metadata(model_identifier)
            if external_metadata and external_metadata.huggingface:
                return external_metadata.huggingface
                
        except Exception as e:
            logger.warning(f"Failed to fetch HuggingFace metadata for model {model.id}: {e}")
        
        return None
    
    def _get_cached_metadata(self, model_hash: str) -> Optional[ExternalMetadata]:
        """Get cached metadata for a model hash.
        
        Args:
            model_hash: The model hash to lookup
            
        Returns:
            Cached external metadata if found and not expired, None otherwise
        """
        if not self._cache_port:
            return None
        
        try:
            cache_key = self._get_cache_key(model_hash)
            cached_data = self._cache_port.get(cache_key)
            
            if cached_data:
                # Check if cached data is still valid
                if isinstance(cached_data, dict):
                    external_metadata = ExternalMetadata.from_dict(cached_data)
                    
                    # Check if cache is expired (if cached_at is available)
                    if external_metadata.cached_at:
                        cache_age = datetime.now() - external_metadata.cached_at
                        if cache_age.total_seconds() > self._cache_ttl:
                            logger.debug(f"Cache expired for model hash {model_hash}")
                            self._cache_port.delete(cache_key)
                            return None
                    
                    return external_metadata
                
        except Exception as e:
            logger.warning(f"Failed to get cached metadata for model hash {model_hash}: {e}")
        
        return None
    
    def _cache_metadata(self, model_hash: str, metadata: ExternalMetadata) -> None:
        """Cache external metadata for a model hash.
        
        Args:
            model_hash: The model hash to cache metadata for
            metadata: The external metadata to cache
        """
        if not self._cache_port:
            return
        
        try:
            cache_key = self._get_cache_key(model_hash)
            cache_data = metadata.to_dict()
            self._cache_port.set(cache_key, cache_data, self._cache_ttl)
            logger.debug(f"Cached metadata for model hash {model_hash}")
        except Exception as e:
            logger.warning(f"Failed to cache metadata for model hash {model_hash}: {e}")
    
    def _get_cache_key(self, model_hash: str) -> str:
        """Generate cache key for a model hash.
        
        Args:
            model_hash: The model hash
            
        Returns:
            Cache key string
        """
        return f"metadata:{model_hash}"
    
    @property
    def has_civitai_support(self) -> bool:
        """Check if CivitAI metadata support is available."""
        return self._civitai_port is not None
    
    @property
    def has_huggingface_support(self) -> bool:
        """Check if HuggingFace metadata support is available."""
        return self._huggingface_port is not None
    
    @property
    def has_cache_support(self) -> bool:
        """Check if caching support is available."""
        return self._cache_port is not None