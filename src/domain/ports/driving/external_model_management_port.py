"""External model management driving port (primary interface)."""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any

from ...entities.external_model import ExternalModel, ExternalPlatform


class ExternalModelManagementPort(ABC):
    """Primary port for external model management operations.
    
    This port defines what the application can do with external models.
    It is implemented by domain services and used by driving adapters.
    """
    
    @abstractmethod
    async def search_models(
        self, 
        platform: Optional[ExternalPlatform] = None,
        query: str = "", 
        limit: int = 20, 
        offset: int = 0,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Search for models across external platforms.
        
        Args:
            platform: Optional specific platform to search (searches all if None)
            query: Search query string (optional)
            limit: Maximum number of results to return
            offset: Number of results to skip for pagination
            filters: Platform-specific filters (optional)
            
        Returns:
            Dictionary containing search results with metadata:
            {
                "models": List[ExternalModel],
                "total": int,
                "has_more": bool,
                "next_offset": Optional[int],
                "platforms_searched": List[str]
            }
            
        Raises:
            ValidationError: If search parameters are invalid
        """
        pass
    
    @abstractmethod
    async def get_model_details(self, platform: ExternalPlatform, model_id: str) -> ExternalModel:
        """Get detailed information about a specific external model.
        
        Args:
            platform: The external platform to query
            model_id: The platform-specific ID of the model
            
        Returns:
            External model with detailed information
            
        Raises:
            ValidationError: If model_id is invalid
            NotFoundError: If model is not found
            ExternalAPIError: If external API call fails
        """
        pass
    
    @abstractmethod
    async def get_popular_models(
        self, 
        platform: Optional[ExternalPlatform] = None,
        limit: int = 20,
        model_type: Optional[str] = None
    ) -> List[ExternalModel]:
        """Get popular/trending models from external platforms.
        
        Args:
            platform: Optional specific platform to query (queries all if None)
            limit: Maximum number of results to return
            model_type: Optional model type filter
            
        Returns:
            List of popular external models
            
        Raises:
            ExternalAPIError: If external API calls fail
        """
        pass
    
    @abstractmethod
    async def get_recent_models(
        self, 
        platform: Optional[ExternalPlatform] = None,
        limit: int = 20,
        model_type: Optional[str] = None
    ) -> List[ExternalModel]:
        """Get recently published models from external platforms.
        
        Args:
            platform: Optional specific platform to query (queries all if None)
            limit: Maximum number of results to return
            model_type: Optional model type filter
            
        Returns:
            List of recent external models
            
        Raises:
            ExternalAPIError: If external API calls fail
        """
        pass
    
    @abstractmethod
    async def get_comfyui_compatible_models(
        self, 
        platform: Optional[ExternalPlatform] = None,
        model_type: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Get models that are compatible with ComfyUI.
        
        Args:
            platform: Optional specific platform to query (queries all if None)
            model_type: Optional ComfyUI model type filter
            limit: Maximum number of results to return
            offset: Number of results to skip for pagination
            
        Returns:
            Dictionary containing compatible models with metadata:
            {
                "models": List[ExternalModel],
                "total": int,
                "has_more": bool,
                "next_offset": Optional[int],
                "platforms_searched": List[str]
            }
            
        Raises:
            ValidationError: If parameters are invalid
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
    def get_platform_info(self, platform: ExternalPlatform) -> Dict[str, Any]:
        """Get information about a specific platform.
        
        Args:
            platform: The external platform to get info for
            
        Returns:
            Dictionary containing platform information:
            {
                "name": str,
                "display_name": str,
                "capabilities": Dict[str, Any],
                "supported_model_types": List[str],
                "rate_limits": Dict[str, Any],
                "is_available": bool
            }
            
        Raises:
            ValidationError: If platform is invalid
        """
        pass
    
    @abstractmethod
    async def get_model_suggestions(
        self, 
        based_on_model: Optional[str] = None,
        model_type: Optional[str] = None,
        limit: int = 10
    ) -> List[ExternalModel]:
        """Get model suggestions based on criteria.
        
        Args:
            based_on_model: Optional model name/hash to base suggestions on
            model_type: Optional model type to filter suggestions
            limit: Maximum number of suggestions to return
            
        Returns:
            List of suggested external models
            
        Raises:
            ValidationError: If parameters are invalid
        """
        pass