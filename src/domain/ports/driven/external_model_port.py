"""External model driven port (secondary interface)."""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any

from ...entities.external_model import ExternalModel, ExternalPlatform


class ExternalModelPort(ABC):
    """Secondary port for external model data access.
    
    This port defines what the application needs for external model access.
    It is implemented by driven adapters and used by domain services.
    """
    
    @abstractmethod
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
        pass
    
    @abstractmethod
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
        pass
    
    @abstractmethod
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
        pass
    
    @abstractmethod
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
        pass
    
    @abstractmethod
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
        pass
    
    @abstractmethod
    def get_supported_platforms(self) -> List[ExternalPlatform]:
        """Get list of supported external platforms.
        
        Returns:
            List of supported external platforms
        """
        pass
    
    @abstractmethod
    def get_platform_capabilities(self, platform: ExternalPlatform) -> Dict[str, Any]:
        """Get capabilities and limitations of a specific platform.
        
        Args:
            platform: The external platform to query
            
        Returns:
            Dictionary containing platform capabilities and limitations
        """
        pass


class ExternalAPIError(Exception):
    """Exception raised when external API operations fail."""
    
    def __init__(self, message: str, platform: str, status_code: Optional[int] = None):
        super().__init__(message)
        self.platform = platform
        self.status_code = status_code
        self.message = message


class RateLimitError(ExternalAPIError):
    """Exception raised when external API rate limit is exceeded."""
    
    def __init__(self, platform: str, retry_after: Optional[int] = None):
        message = f"Rate limit exceeded for {platform}"
        if retry_after:
            message += f". Retry after {retry_after} seconds"
        super().__init__(message, platform, 429)
        self.retry_after = retry_after


class PlatformUnavailableError(ExternalAPIError):
    """Exception raised when external platform is unavailable."""
    
    def __init__(self, platform: str):
        message = f"Platform {platform} is currently unavailable"
        super().__init__(message, platform, 503)