"""CivitAI external model adapter implementation."""

import asyncio
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

import aiohttp
from aiohttp import ClientTimeout, ClientError

from ...domain.ports.driven.external_model_port import (
    ExternalModelPort, 
    ExternalAPIError, 
    RateLimitError, 
    PlatformUnavailableError
)
from ...domain.entities.external_model import (
    ExternalModel,
    ExternalPlatform,
    ComfyUIModelType,
    ComfyUICompatibility
)


logger = logging.getLogger(__name__)


class CivitAIExternalModelAdapter(ExternalModelPort):
    """Adapter for fetching external models from CivitAI API.
    
    This adapter implements the ExternalModelPort interface to provide
    CivitAI-specific external model fetching capabilities.
    """
    
    BASE_URL = "https://civitai.com/api/v1"
    DEFAULT_TIMEOUT = 30
    RATE_LIMIT_DELAY = 1.0  # Seconds between requests
    MAX_RETRIES = 3
    
    # CivitAI to ComfyUI model type mapping
    MODEL_TYPE_MAPPING = {
        "Checkpoint": ComfyUIModelType.CHECKPOINT,
        "LORA": ComfyUIModelType.LORA,
        "LoCon": ComfyUIModelType.LORA,
        "TextualInversion": ComfyUIModelType.EMBEDDING,
        "Hypernetwork": ComfyUIModelType.EMBEDDING,
        "AestheticGradient": ComfyUIModelType.EMBEDDING,
        "VAE": ComfyUIModelType.VAE,
        "ControlNet": ComfyUIModelType.CONTROLNET,
        "Upscaler": ComfyUIModelType.UPSCALER,
        "MotionModule": ComfyUIModelType.UNKNOWN,
        "Poses": ComfyUIModelType.UNKNOWN,
        "Wildcards": ComfyUIModelType.UNKNOWN,
        "Other": ComfyUIModelType.UNKNOWN
    }
    
    # ComfyUI model folder mapping
    FOLDER_MAPPING = {
        ComfyUIModelType.CHECKPOINT: "checkpoints",
        ComfyUIModelType.LORA: "loras",
        ComfyUIModelType.VAE: "vae",
        ComfyUIModelType.EMBEDDING: "embeddings",
        ComfyUIModelType.CONTROLNET: "controlnet",
        ComfyUIModelType.UPSCALER: "upscale_models"
    }
    
    def __init__(self, timeout: int = DEFAULT_TIMEOUT):
        """Initialize CivitAI external model adapter.
        
        Args:
            timeout: HTTP request timeout in seconds
        """
        self._timeout = ClientTimeout(total=timeout)
        self._last_request_time = 0.0
        self._session: Optional[aiohttp.ClientSession] = None
    
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create HTTP session."""
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                timeout=self._timeout,
                headers={
                    "User-Agent": "ComfyUI-Asset-Manager/1.0",
                    "Accept": "application/json"
                }
            )
        return self._session    

    async def _rate_limit(self) -> None:
        """Apply rate limiting between requests."""
        current_time = asyncio.get_event_loop().time()
        time_since_last = current_time - self._last_request_time
        
        if time_since_last < self.RATE_LIMIT_DELAY:
            await asyncio.sleep(self.RATE_LIMIT_DELAY - time_since_last)
        
        self._last_request_time = asyncio.get_event_loop().time()
    
    async def _make_request(self, url: str, params: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """Make HTTP request with error handling and retries.
        
        Args:
            url: Request URL
            params: Query parameters
            
        Returns:
            Response data as dictionary, None if failed
            
        Raises:
            ExternalAPIError: If API request fails
            RateLimitError: If rate limit is exceeded
            PlatformUnavailableError: If platform is unavailable
        """
        session = await self._get_session()
        
        for attempt in range(self.MAX_RETRIES):
            try:
                await self._rate_limit()
                
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        return await response.json()
                    elif response.status == 404:
                        logger.debug(f"CivitAI: Model not found (404) for URL: {url}")
                        return None
                    elif response.status == 429:
                        # Rate limited
                        retry_after = int(response.headers.get('Retry-After', 60))
                        logger.warning(f"CivitAI: Rate limited, retry after {retry_after} seconds")
                        raise RateLimitError("civitai", retry_after)
                    elif response.status >= 500:
                        # Server error
                        logger.warning(f"CivitAI: Server error {response.status} for URL: {url}")
                        if attempt == self.MAX_RETRIES - 1:
                            raise PlatformUnavailableError("civitai")
                        await asyncio.sleep(2 ** attempt)  # Exponential backoff
                        continue
                    else:
                        logger.warning(f"CivitAI: HTTP {response.status} for URL: {url}")
                        if attempt == self.MAX_RETRIES - 1:
                            raise ExternalAPIError(f"HTTP {response.status}", "civitai", response.status)
                        
            except (RateLimitError, PlatformUnavailableError, ExternalAPIError):
                # Re-raise our custom exceptions
                raise
            except ClientError as e:
                logger.warning(f"CivitAI: Request failed (attempt {attempt + 1}): {e}")
                if attempt == self.MAX_RETRIES - 1:
                    raise ExternalAPIError(f"Request failed: {str(e)}", "civitai")
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
            except Exception as e:
                logger.error(f"CivitAI: Unexpected error: {e}")
                raise ExternalAPIError(f"Unexpected error: {str(e)}", "civitai")
        
        raise ExternalAPIError("Max retries exceeded", "civitai")
    
    def _parse_civitai_model(self, data: Dict[str, Any]) -> Optional[ExternalModel]:
        """Parse CivitAI API response into ExternalModel.
        
        Args:
            data: Raw API response data
            
        Returns:
            Parsed external model, None if parsing failed
        """
        try:
            # Extract basic model information
            model_id = str(data.get("id", ""))
            name = data.get("name", "")
            description = data.get("description", "")
            
            # Extract creator information
            creator = data.get("creator", {})
            author = creator.get("username", "Unknown") if creator else "Unknown"
            
            # Extract model type and map to ComfyUI type
            model_type_str = data.get("type", "Other")
            comfyui_model_type = self.MODEL_TYPE_MAPPING.get(model_type_str, ComfyUIModelType.UNKNOWN)
            
            # Extract tags
            tags = [tag.get("name", "") for tag in data.get("tags", []) if tag.get("name")]
            
            # Extract stats
            download_count = data.get("stats", {}).get("downloadCount", 0)
            rating = data.get("stats", {}).get("rating")
            
            # Extract dates
            created_at_str = data.get("createdAt", "")
            updated_at_str = data.get("updatedAt", "")
            
            try:
                created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                created_at = datetime.now()
            
            try:
                updated_at = datetime.fromisoformat(updated_at_str.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                updated_at = created_at
            
            # Extract thumbnail
            images = data.get("modelVersions", [{}])[0].get("images", [])
            thumbnail_url = images[0].get("url") if images else None
            
            # Extract file information from latest version
            versions = data.get("modelVersions", [])
            latest_version = versions[0] if versions else {}
            files = latest_version.get("files", [])
            
            # Find the primary model file
            primary_file = None
            for file in files:
                if file.get("primary", False):
                    primary_file = file
                    break
            
            if not primary_file and files:
                primary_file = files[0]  # Fallback to first file
            
            file_size = primary_file.get("sizeKB", 0) * 1024 if primary_file else None
            file_format = None
            if primary_file:
                file_name = primary_file.get("name", "")
                if file_name.endswith(".safetensors"):
                    file_format = "safetensors"
                elif file_name.endswith(".ckpt"):
                    file_format = "ckpt"
                elif file_name.endswith(".pt"):
                    file_format = "pt"
                elif file_name.endswith(".bin"):
                    file_format = "bin"
            
            # Extract base model information
            base_model = latest_version.get("baseModel", "")
            
            # Determine ComfyUI compatibility
            is_compatible = self._is_comfyui_compatible(comfyui_model_type, file_format, base_model)
            model_folder = self.FOLDER_MAPPING.get(comfyui_model_type) if is_compatible else None
            
            compatibility = ComfyUICompatibility(
                is_compatible=is_compatible,
                model_folder=model_folder,
                compatibility_notes=self._get_compatibility_notes(comfyui_model_type, file_format, base_model),
                required_nodes=self._get_required_nodes(comfyui_model_type)
            )
            
            # Build metadata dictionary
            metadata = {
                "civitai_id": model_id,
                "model_type": model_type_str,
                "base_model": base_model,
                "nsfw": data.get("nsfw", False),
                "allow_commercial_use": data.get("allowCommercialUse", "None"),
                "favorite_count": data.get("stats", {}).get("favoriteCount", 0),
                "comment_count": data.get("stats", {}).get("commentCount", 0),
                "model_page_url": f"https://civitai.com/models/{model_id}",
                "download_url": primary_file.get("downloadUrl") if primary_file else None,
                "versions": [
                    {
                        "id": version.get("id"),
                        "name": version.get("name"),
                        "base_model": version.get("baseModel"),
                        "files": [
                            {
                                "name": f.get("name"),
                                "size_kb": f.get("sizeKB"),
                                "type": f.get("type"),
                                "format": f.get("metadata", {}).get("format"),
                                "download_url": f.get("downloadUrl")
                            }
                            for f in version.get("files", [])
                        ]
                    }
                    for version in versions[:3]  # Limit to first 3 versions
                ]
            }
            
            return ExternalModel(
                id=f"civitai:{model_id}",
                name=name,
                description=description,
                author=author,
                platform=ExternalPlatform.CIVITAI,
                thumbnail_url=thumbnail_url,
                tags=tags,
                download_count=download_count,
                rating=rating,
                created_at=created_at,
                updated_at=updated_at,
                metadata=metadata,
                comfyui_compatibility=compatibility,
                model_type=comfyui_model_type,
                base_model=base_model if base_model else None,
                file_size=file_size,
                file_format=file_format
            )
            
        except Exception as e:
            logger.error(f"Failed to parse CivitAI model data: {e}")
            return None
    
    def _is_comfyui_compatible(self, model_type: ComfyUIModelType, file_format: Optional[str], base_model: str) -> bool:
        """Determine if a model is compatible with ComfyUI.
        
        Args:
            model_type: The ComfyUI model type
            file_format: The file format
            base_model: The base model
            
        Returns:
            True if compatible with ComfyUI
        """
        # Unknown types are not compatible
        if model_type == ComfyUIModelType.UNKNOWN:
            return False
        
        # Prefer safetensors format
        if file_format == "safetensors":
            return True
        
        # Accept other common formats for certain types
        if file_format in ["ckpt", "pt", "bin"]:
            return model_type in [
                ComfyUIModelType.CHECKPOINT,
                ComfyUIModelType.LORA,
                ComfyUIModelType.VAE,
                ComfyUIModelType.EMBEDDING
            ]
        
        # Default to compatible if we can't determine format
        return True
    
    def _get_compatibility_notes(self, model_type: ComfyUIModelType, file_format: Optional[str], base_model: str) -> Optional[str]:
        """Get compatibility notes for a model.
        
        Args:
            model_type: The ComfyUI model type
            file_format: The file format
            base_model: The base model
            
        Returns:
            Compatibility notes or None
        """
        notes = []
        
        if model_type == ComfyUIModelType.UNKNOWN:
            notes.append("Model type not supported by ComfyUI")
        
        if file_format == "ckpt":
            notes.append("Consider using safetensors version for better security")
        
        if base_model and "SDXL" in base_model:
            notes.append("Requires SDXL-compatible workflow")
        elif base_model and "SD 2" in base_model:
            notes.append("Requires SD 2.x-compatible workflow")
        
        return "; ".join(notes) if notes else None
    
    def _get_required_nodes(self, model_type: ComfyUIModelType) -> List[str]:
        """Get required ComfyUI nodes for a model type.
        
        Args:
            model_type: The ComfyUI model type
            
        Returns:
            List of required node names
        """
        node_mapping = {
            ComfyUIModelType.CHECKPOINT: ["CheckpointLoaderSimple"],
            ComfyUIModelType.LORA: ["LoraLoader"],
            ComfyUIModelType.VAE: ["VAELoader"],
            ComfyUIModelType.EMBEDDING: ["CLIPTextEncode"],
            ComfyUIModelType.CONTROLNET: ["ControlNetLoader"],
            ComfyUIModelType.UPSCALER: ["UpscaleModelLoader"]
        }
        
        return node_mapping.get(model_type, [])
    
    async def search_models(
        self, 
        platform: ExternalPlatform, 
        query: str = "", 
        limit: int = 20, 
        offset: int = 0,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[ExternalModel]:
        """Search for models on CivitAI.
        
        Args:
            platform: Must be CIVITAI
            query: Search query string
            limit: Maximum number of results
            offset: Number of results to skip
            filters: Additional filters
            
        Returns:
            List of external models
            
        Raises:
            ExternalAPIError: If API request fails
        """
        if platform != ExternalPlatform.CIVITAI:
            return []
        
        params = {
            "limit": min(limit, 100),  # CivitAI max limit
            "page": (offset // limit) + 1,
            "sort": "Highest Rated",
            "period": "AllTime"
        }
        
        if query:
            params["query"] = query
        
        # Apply filters
        if filters:
            if "model_type" in filters:
                # Map ComfyUI model type to CivitAI type
                comfyui_type = filters["model_type"]
                civitai_types = [k for k, v in self.MODEL_TYPE_MAPPING.items() if v.value == comfyui_type]
                if civitai_types:
                    params["types"] = civitai_types
            
            if "base_model" in filters:
                params["baseModels"] = [filters["base_model"]]
            
            if "sort" in filters:
                params["sort"] = filters["sort"]
            
            if "nsfw" in filters:
                params["nsfw"] = filters["nsfw"]
            
            if "comfyui_compatible" in filters and filters["comfyui_compatible"]:
                # Filter for ComfyUI-compatible types
                compatible_types = [k for k, v in self.MODEL_TYPE_MAPPING.items() 
                                  if v != ComfyUIModelType.UNKNOWN]
                params["types"] = compatible_types
        
        url = f"{self.BASE_URL}/models"
        
        try:
            response_data = await self._make_request(url, params)
            if not response_data:
                return []
            
            models = []
            for item in response_data.get("items", []):
                model = self._parse_civitai_model(item)
                if model:
                    models.append(model)
            
            return models
            
        except Exception as e:
            logger.error(f"Failed to search CivitAI models: {e}")
            raise
    
    async def get_model_details(self, platform: ExternalPlatform, model_id: str) -> Optional[ExternalModel]:
        """Get detailed information about a specific model.
        
        Args:
            platform: Must be CIVITAI
            model_id: CivitAI model ID
            
        Returns:
            External model or None if not found
            
        Raises:
            ExternalAPIError: If API request fails
        """
        if platform != ExternalPlatform.CIVITAI:
            return None
        
        url = f"{self.BASE_URL}/models/{model_id}"
        
        try:
            response_data = await self._make_request(url)
            if not response_data:
                return None
            
            return self._parse_civitai_model(response_data)
            
        except Exception as e:
            logger.error(f"Failed to get CivitAI model details: {e}")
            raise
    
    async def get_popular_models(
        self, 
        platform: ExternalPlatform, 
        limit: int = 20,
        model_type: Optional[str] = None
    ) -> List[ExternalModel]:
        """Get popular models from CivitAI.
        
        Args:
            platform: Must be CIVITAI
            limit: Maximum number of results
            model_type: Optional model type filter
            
        Returns:
            List of popular external models
        """
        if platform != ExternalPlatform.CIVITAI:
            return []
        
        filters = {"sort": "Highest Rated"}
        if model_type:
            filters["model_type"] = model_type
        
        return await self.search_models(platform, "", limit, 0, filters)
    
    async def get_recent_models(
        self, 
        platform: ExternalPlatform, 
        limit: int = 20,
        model_type: Optional[str] = None
    ) -> List[ExternalModel]:
        """Get recent models from CivitAI.
        
        Args:
            platform: Must be CIVITAI
            limit: Maximum number of results
            model_type: Optional model type filter
            
        Returns:
            List of recent external models
        """
        if platform != ExternalPlatform.CIVITAI:
            return []
        
        filters = {"sort": "Newest"}
        if model_type:
            filters["model_type"] = model_type
        
        return await self.search_models(platform, "", limit, 0, filters)
    
    async def check_model_availability(self, platform: ExternalPlatform, model_id: str) -> bool:
        """Check if a model is available on CivitAI.
        
        Args:
            platform: Must be CIVITAI
            model_id: CivitAI model ID
            
        Returns:
            True if model is available
        """
        if platform != ExternalPlatform.CIVITAI:
            return False
        
        try:
            model = await self.get_model_details(platform, model_id)
            return model is not None
        except Exception:
            return False
    
    def get_supported_platforms(self) -> List[ExternalPlatform]:
        """Get supported platforms.
        
        Returns:
            List containing only CIVITAI
        """
        return [ExternalPlatform.CIVITAI]
    
    def get_platform_capabilities(self, platform: ExternalPlatform) -> Dict[str, Any]:
        """Get platform capabilities.
        
        Args:
            platform: Must be CIVITAI
            
        Returns:
            Dictionary of capabilities
        """
        if platform != ExternalPlatform.CIVITAI:
            return {}
        
        return {
            "search": True,
            "model_details": True,
            "popular_models": True,
            "recent_models": True,
            "model_types": list(self.MODEL_TYPE_MAPPING.keys()),
            "supported_formats": ["safetensors", "ckpt", "pt", "bin"],
            "rate_limits": {
                "requests_per_second": 1.0,
                "requests_per_minute": 60
            },
            "is_available": True,
            "max_results_per_request": 100
        }
    
    async def close(self):
        """Close the HTTP session."""
        if self._session and not self._session.closed:
            await self._session.close()