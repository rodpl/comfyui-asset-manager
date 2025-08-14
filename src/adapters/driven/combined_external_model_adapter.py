"""Combined external model adapter that delegates to platform-specific adapters."""

import logging
from typing import List, Optional, Dict, Any

from ...domain.ports.driven.external_model_port import (
    ExternalModelPort, 
    ExternalAPIError, 
    RateLimitError, 
    PlatformUnavailableError
)
from ...domain.entities.external_model import ExternalModel, ExternalPlatform
from .civitai_external_model_adapter import CivitAIExternalModelAdapter
from .huggingface_external_model_adapter import HuggingFaceExternalModelAdapter


logger = logging.getLogger(__name__)


class CombinedExternalModelAdapter(ExternalModelPort):
    """Combined adapter that delegates to platform-specific adapters.
    
    This adapter implements the ExternalModelPort interface and routes
    requests to the appropriate platform-specific adapter.
    """
    
    def __init__(self, timeout: int = 30):
        """Initialize combined external model adapter.
        
        Args:
            timeout: HTTP request timeout in seconds
        """
        self._civitai_adapter = CivitAIExternalModelAdapter(timeout)
        self._huggingface_adapter = HuggingFaceExternalModelAdapter(timeout)
        
        self._adapters = {
            ExternalPlatform.CIVITAI: self._civitai_adapter,
            ExternalPlatform.HUGGINGFACE: self._huggingface_adapter
        }
    
    def _get_adapter(self, platform: ExternalPlatform) -> Optional[ExternalModelPort]:
        """Get the appropriate adapter for a platform.
        
        Args:
            platform: The external platform
            
        Returns:
            Platform-specific adapter or None if not supported
        """
        return self._adapters.get(platform)
    
    async def search_models(
        self, 
        platform: ExternalPlatform, 
        query: str = "", 
        limit: int = 20, 
        offset: int = 0,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[ExternalModel]:
        """Search for models on an external platform.
        
        Args:
            platform: The external platform to search on
            query: Search query string (optional)
            limit: Maximum number of results to return
            offset: Number of results to skip for pagination
            filters: Platform-specific filters (optional)
            
        Returns:
            List of external models matching the search criteria
            
        Raises:
            ValidationError: If search parameters are invalid
            ExternalAPIError: If external API call fails
        """
        adapter = self._get_adapter(platform)
        if not adapter:
            logger.warning(f"No adapter available for platform: {platform}")
            return []
        
        try:
            return await adapter.search_models(platform, query, limit, offset, filters)
        except Exception as e:
            logger.error(f"Search failed for platform {platform}: {e}")
            raise
    
    async def get_model_details(self, platform: ExternalPlatform, model_id: str) -> Optional[ExternalModel]:
        """Get detailed information about a specific model from an external platform.
        
        Args:
            platform: The external platform to query
            model_id: The platform-specific ID of the model
            
        Returns:
            External model with detailed information, or None if not found
            
        Raises:
            ValidationError: If model_id is invalid
            ExternalAPIError: If external API call fails
        """
        adapter = self._get_adapter(platform)
        if not adapter:
            logger.warning(f"No adapter available for platform: {platform}")
            return None
        
        try:
            return await adapter.get_model_details(platform, model_id)
        except Exception as e:
            logger.error(f"Get model details failed for platform {platform}: {e}")
            raise
    
    async def get_popular_models(
        self, 
        platform: ExternalPlatform, 
        limit: int = 20,
        model_type: Optional[str] = None
    ) -> List[ExternalModel]:
        """Get popular/trending models from an external platform.
        
        Args:
            platform: The external platform to query
            limit: Maximum number of results to return
            model_type: Optional model type filter
            
        Returns:
            List of popular external models
            
        Raises:
            ExternalAPIError: If external API call fails
        """
        adapter = self._get_adapter(platform)
        if not adapter:
            logger.warning(f"No adapter available for platform: {platform}")
            return []
        
        try:
            return await adapter.get_popular_models(platform, limit, model_type)
        except Exception as e:
            logger.error(f"Get popular models failed for platform {platform}: {e}")
            raise
    
    async def get_recent_models(
        self, 
        platform: ExternalPlatform, 
        limit: int = 20,
        model_type: Optional[str] = None
    ) -> List[ExternalModel]:
        """Get recently published models from an external platform.
        
        Args:
            platform: The external platform to query
            limit: Maximum number of results to return
            model_type: Optional model type filter
            
        Returns:
            List of recent external models
            
        Raises:
            ExternalAPIError: If external API call fails
        """
        adapter = self._get_adapter(platform)
        if not adapter:
            logger.warning(f"No adapter available for platform: {platform}")
            return []
        
        try:
            return await adapter.get_recent_models(platform, limit, model_type)
        except Exception as e:
            logger.error(f"Get recent models failed for platform {platform}: {e}")
            raise
    
    async def check_model_availability(self, platform: ExternalPlatform, model_id: str) -> bool:
        """Check if a model is still available on the external platform.
        
        Args:
            platform: The external platform to check
            model_id: The platform-specific ID of the model
            
        Returns:
            True if model is available, False otherwise
            
        Raises:
            ValidationError: If model_id is invalid
        """
        adapter = self._get_adapter(platform)
        if not adapter:
            logger.warning(f"No adapter available for platform: {platform}")
            return False
        
        try:
            return await adapter.check_model_availability(platform, model_id)
        except Exception as e:
            logger.error(f"Check model availability failed for platform {platform}: {e}")
            return False
    
    def get_supported_platforms(self) -> List[ExternalPlatform]:
        """Get list of supported external platforms.
        
        Returns:
            List of supported external platforms
        """
        return list(self._adapters.keys())
    
    def get_platform_capabilities(self, platform: ExternalPlatform) -> Dict[str, Any]:
        """Get capabilities and limitations of a specific platform.
        
        Args:
            platform: The external platform to query
            
        Returns:
            Dictionary containing platform capabilities and limitations
        """
        adapter = self._get_adapter(platform)
        if not adapter:
            logger.warning(f"No adapter available for platform: {platform}")
            return {}
        
        try:
            return adapter.get_platform_capabilities(platform)
        except Exception as e:
            logger.error(f"Get platform capabilities failed for platform {platform}: {e}")
            return {}
    
    async def close(self):
        """Close all HTTP sessions."""
        try:
            await self._civitai_adapter.close()
        except Exception as e:
            logger.error(f"Error closing CivitAI adapter: {e}")
        
        try:
            await self._huggingface_adapter.close()
        except Exception as e:
            logger.error(f"Error closing HuggingFace adapter: {e}")