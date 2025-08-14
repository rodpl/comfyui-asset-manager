"""External model service implementing external model management operations."""

import asyncio
from typing import List, Optional, Dict, Any

from ..ports.driving.external_model_management_port import ExternalModelManagementPort
from ..ports.driven.external_model_port import ExternalModelPort, ExternalAPIError, RateLimitError, PlatformUnavailableError
from ..entities.external_model import ExternalModel, ExternalPlatform, ComfyUIModelType
from ..entities.base import ValidationError, NotFoundError


class ExternalModelService(ExternalModelManagementPort):
    """Domain service implementing external model management operations.
    
    This service contains the core business logic for external model management
    and implements the ExternalModelManagementPort interface.
    """
    
    def __init__(self, external_model_port: ExternalModelPort):
        """Initialize the external model service.
        
        Args:
            external_model_port: Port for external model data access
        """
        self._external_model_port = external_model_port
    
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
            Dictionary containing search results with metadata
            
        Raises:
            ValidationError: If search parameters are invalid
        """
        # Validate parameters
        if limit <= 0 or limit > 100:
            raise ValidationError("limit must be between 1 and 100", "limit")
        
        if offset < 0:
            raise ValidationError("offset must be non-negative", "offset")
        
        if query is None:
            query = ""
        
        if filters is None:
            filters = {}
        
        # Determine which platforms to search
        platforms_to_search = [platform] if platform else self.get_supported_platforms()
        
        all_models = []
        platforms_searched = []
        
        # Search each platform
        for search_platform in platforms_to_search:
            try:
                platform_models = await self._external_model_port.search_models(
                    platform=search_platform,
                    query=query,
                    limit=limit,
                    offset=offset,
                    filters=filters
                )
                all_models.extend(platform_models)
                platforms_searched.append(search_platform.value)
            except (ExternalAPIError, RateLimitError, PlatformUnavailableError) as e:
                # Log the error but continue with other platforms
                # In a production system, you might want to handle this differently
                continue
        
        # Sort models by relevance (download count, rating, etc.)
        sorted_models = self._sort_models_by_relevance(all_models, query)
        
        # Apply pagination to the combined results
        total_models = len(sorted_models)
        paginated_models = sorted_models[offset:offset + limit]
        
        has_more = offset + len(paginated_models) < total_models
        next_offset = offset + len(paginated_models) if has_more else None
        
        return {
            "models": paginated_models,
            "total": total_models,
            "has_more": has_more,
            "next_offset": next_offset,
            "platforms_searched": platforms_searched
        }
    
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
        if not model_id or not model_id.strip():
            raise ValidationError("model_id cannot be empty", "model_id")
        
        if not isinstance(platform, ExternalPlatform):
            raise ValidationError("platform must be a valid ExternalPlatform", "platform")
        
        try:
            model = await self._external_model_port.get_model_details(platform, model_id.strip())
            if model is None:
                raise NotFoundError("ExternalModel", f"{platform.value}:{model_id}")
            
            return model
        except (ExternalAPIError, NotFoundError):
            # Re-raise external API errors and not found errors
            raise
        except Exception as e:
            # Wrap unexpected errors
            raise ExternalAPIError(f"Failed to get model details: {str(e)}", platform.value)
    
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
        if limit <= 0 or limit > 100:
            raise ValidationError("limit must be between 1 and 100", "limit")
        
        # Determine which platforms to query
        platforms_to_query = [platform] if platform else self.get_supported_platforms()
        
        all_models = []
        
        # Get popular models from each platform
        for query_platform in platforms_to_query:
            try:
                platform_models = await self._external_model_port.get_popular_models(
                    platform=query_platform,
                    limit=limit,
                    model_type=model_type
                )
                all_models.extend(platform_models)
            except (ExternalAPIError, RateLimitError, PlatformUnavailableError):
                # Continue with other platforms if one fails
                continue
        
        # Sort by popularity metrics and return top results
        sorted_models = self._sort_models_by_popularity(all_models)
        return sorted_models[:limit]
    
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
        if limit <= 0 or limit > 100:
            raise ValidationError("limit must be between 1 and 100", "limit")
        
        # Determine which platforms to query
        platforms_to_query = [platform] if platform else self.get_supported_platforms()
        
        all_models = []
        
        # Get recent models from each platform
        for query_platform in platforms_to_query:
            try:
                platform_models = await self._external_model_port.get_recent_models(
                    platform=query_platform,
                    limit=limit,
                    model_type=model_type
                )
                all_models.extend(platform_models)
            except (ExternalAPIError, RateLimitError, PlatformUnavailableError):
                # Continue with other platforms if one fails
                continue
        
        # Sort by recency and return top results
        sorted_models = sorted(all_models, key=lambda m: m.updated_at, reverse=True)
        return sorted_models[:limit]
    
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
            Dictionary containing compatible models with metadata
            
        Raises:
            ValidationError: If parameters are invalid
        """
        if limit <= 0 or limit > 100:
            raise ValidationError("limit must be between 1 and 100", "limit")
        
        if offset < 0:
            raise ValidationError("offset must be non-negative", "offset")
        
        # Create filters for ComfyUI compatibility
        filters = {"comfyui_compatible": True}
        if model_type:
            filters["model_type"] = model_type
        
        # Use the search functionality with compatibility filters
        return await self.search_models(
            platform=platform,
            query="",
            limit=limit,
            offset=offset,
            filters=filters
        )
    
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
        if not model_id or not model_id.strip():
            raise ValidationError("model_id cannot be empty", "model_id")
        
        if not isinstance(platform, ExternalPlatform):
            raise ValidationError("platform must be a valid ExternalPlatform", "platform")
        
        try:
            return await self._external_model_port.check_model_availability(platform, model_id.strip())
        except ExternalAPIError:
            # If API call fails, assume model is unavailable
            return False
    
    def get_supported_platforms(self) -> List[ExternalPlatform]:
        """Get list of supported external platforms.
        
        Returns:
            List of supported external platforms
        """
        return self._external_model_port.get_supported_platforms()
    
    def get_platform_info(self, platform: ExternalPlatform) -> Dict[str, Any]:
        """Get information about a specific platform.
        
        Args:
            platform: The external platform to get info for
            
        Returns:
            Dictionary containing platform information
            
        Raises:
            ValidationError: If platform is invalid
        """
        if not isinstance(platform, ExternalPlatform):
            raise ValidationError("platform must be a valid ExternalPlatform", "platform")
        
        capabilities = self._external_model_port.get_platform_capabilities(platform)
        
        return {
            "name": platform.value,
            "display_name": platform.value.title(),
            "capabilities": capabilities,
            "supported_model_types": self._get_platform_model_types(platform),
            "rate_limits": capabilities.get("rate_limits", {}),
            "is_available": capabilities.get("is_available", True)
        }
    
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
        if limit <= 0 or limit > 50:
            raise ValidationError("limit must be between 1 and 50", "limit")
        
        # For now, return popular models as suggestions
        # In a more sophisticated implementation, this could use ML-based recommendations
        return await self.get_popular_models(
            platform=None,
            limit=limit,
            model_type=model_type
        )
    
    def _sort_models_by_relevance(self, models: List[ExternalModel], query: str) -> List[ExternalModel]:
        """Sort models by relevance to the search query."""
        if not query:
            # If no query, sort by popularity
            return self._sort_models_by_popularity(models)
        
        query_lower = query.lower()
        
        def relevance_score(model: ExternalModel) -> float:
            score = 0.0
            
            # Name match (highest weight)
            if query_lower in model.name.lower():
                score += 10.0
                if model.name.lower().startswith(query_lower):
                    score += 5.0
            
            # Author match
            if query_lower in model.author.lower():
                score += 3.0
            
            # Tag match
            for tag in model.get_all_tags():
                if query_lower in tag.lower():
                    score += 2.0
            
            # Description match
            if query_lower in model.get_primary_description().lower():
                score += 1.0
            
            # Boost ComfyUI compatible models
            if model.is_comfyui_compatible:
                score += 1.0
            
            # Boost by popularity
            score += min(model.download_count / 10000, 5.0)
            
            # Boost by rating
            if model.rating:
                score += model.rating
            
            return score
        
        return sorted(models, key=relevance_score, reverse=True)
    
    def _sort_models_by_popularity(self, models: List[ExternalModel]) -> List[ExternalModel]:
        """Sort models by popularity metrics."""
        def popularity_score(model: ExternalModel) -> float:
            score = 0.0
            
            # Download count (primary metric)
            score += min(model.download_count / 1000, 100.0)
            
            # Rating
            if model.rating:
                score += model.rating * 10
            
            # Boost ComfyUI compatible models
            if model.is_comfyui_compatible:
                score += 5.0
            
            # Boost recent models slightly
            days_since_update = (model.updated_at - model.created_at).days
            if days_since_update < 30:
                score += 2.0
            
            return score
        
        return sorted(models, key=popularity_score, reverse=True)
    
    def _get_platform_model_types(self, platform: ExternalPlatform) -> List[str]:
        """Get supported model types for a platform."""
        # This would typically come from platform-specific configuration
        # For now, return all ComfyUI model types
        return [model_type.value for model_type in ComfyUIModelType]