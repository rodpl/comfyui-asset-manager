"""HuggingFace external model adapter implementation."""

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


class HuggingFaceExternalModelAdapter(ExternalModelPort):
    """Adapter for fetching external models from HuggingFace API.
    
    This adapter implements the ExternalModelPort interface to provide
    HuggingFace-specific external model fetching capabilities.
    """
    
    BASE_URL = "https://huggingface.co/api"
    DEFAULT_TIMEOUT = 30
    RATE_LIMIT_DELAY = 0.5  # HuggingFace is more lenient
    MAX_RETRIES = 3
    
    # HuggingFace pipeline tags to ComfyUI model type mapping
    PIPELINE_TYPE_MAPPING = {
        "text-to-image": ComfyUIModelType.CHECKPOINT,
        "image-to-image": ComfyUIModelType.CHECKPOINT,
        "unconditional-image-generation": ComfyUIModelType.CHECKPOINT,
        "image-classification": ComfyUIModelType.UNKNOWN,
        "feature-extraction": ComfyUIModelType.EMBEDDING,
        "text-classification": ComfyUIModelType.UNKNOWN,
        "token-classification": ComfyUIModelType.UNKNOWN,
        "question-answering": ComfyUIModelType.UNKNOWN,
        "text-generation": ComfyUIModelType.UNKNOWN,
        "translation": ComfyUIModelType.UNKNOWN,
        "summarization": ComfyUIModelType.UNKNOWN,
        "conversational": ComfyUIModelType.UNKNOWN,
        "text2text-generation": ComfyUIModelType.UNKNOWN,
        "tabular-classification": ComfyUIModelType.UNKNOWN,
        "tabular-regression": ComfyUIModelType.UNKNOWN,
        "image-segmentation": ComfyUIModelType.UNKNOWN,
        "object-detection": ComfyUIModelType.UNKNOWN,
        "depth-estimation": ComfyUIModelType.UNKNOWN,
        "video-classification": ComfyUIModelType.UNKNOWN,
        "reinforcement-learning": ComfyUIModelType.UNKNOWN,
        "robotics": ComfyUIModelType.UNKNOWN,
        "other": ComfyUIModelType.UNKNOWN
    }
    
    # Library to model type mapping
    LIBRARY_TYPE_MAPPING = {
        "diffusers": ComfyUIModelType.CHECKPOINT,
        "transformers": ComfyUIModelType.UNKNOWN,
        "pytorch": ComfyUIModelType.UNKNOWN,
        "tensorflow": ComfyUIModelType.UNKNOWN,
        "jax": ComfyUIModelType.UNKNOWN,
        "onnx": ComfyUIModelType.UNKNOWN,
        "safetensors": ComfyUIModelType.UNKNOWN,
        "stable-baselines3": ComfyUIModelType.UNKNOWN,
        "ml-agents": ComfyUIModelType.UNKNOWN,
        "sample-factory": ComfyUIModelType.UNKNOWN,
        "peft": ComfyUIModelType.LORA,
        "adapter-transformers": ComfyUIModelType.LORA
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
        """Initialize HuggingFace external model adapter.
        
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
                        logger.debug(f"HuggingFace: Model not found (404) for URL: {url}")
                        return None
                    elif response.status == 429:
                        # Rate limited
                        retry_after = int(response.headers.get('Retry-After', 60))
                        logger.warning(f"HuggingFace: Rate limited, retry after {retry_after} seconds")
                        raise RateLimitError("huggingface", retry_after)
                    elif response.status >= 500:
                        # Server error
                        logger.warning(f"HuggingFace: Server error {response.status} for URL: {url}")
                        if attempt == self.MAX_RETRIES - 1:
                            raise PlatformUnavailableError("huggingface")
                        await asyncio.sleep(2 ** attempt)  # Exponential backoff
                        continue
                    else:
                        logger.warning(f"HuggingFace: HTTP {response.status} for URL: {url}")
                        if attempt == self.MAX_RETRIES - 1:
                            raise ExternalAPIError(f"HTTP {response.status}", "huggingface", response.status)
                        
            except (RateLimitError, PlatformUnavailableError, ExternalAPIError):
                # Re-raise our custom exceptions
                raise
            except ClientError as e:
                logger.warning(f"HuggingFace: Request failed (attempt {attempt + 1}): {e}")
                if attempt == self.MAX_RETRIES - 1:
                    raise ExternalAPIError(f"Request failed: {str(e)}", "huggingface")
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
            except Exception as e:
                logger.error(f"HuggingFace: Unexpected error: {e}")
                raise ExternalAPIError(f"Unexpected error: {str(e)}", "huggingface")
        
        raise ExternalAPIError("Max retries exceeded", "huggingface")
    
    def _parse_huggingface_model(self, data: Dict[str, Any]) -> Optional[ExternalModel]:
        """Parse HuggingFace API response into ExternalModel.
        
        Args:
            data: Raw API response data
            
        Returns:
            Parsed external model, None if parsing failed
        """
        try:
            # Extract basic model information
            model_id = data.get("id", "")
            if not model_id:
                return None
            
            # Split model ID to get author and name
            parts = model_id.split("/")
            if len(parts) >= 2:
                author = parts[0]
                name = "/".join(parts[1:])
            else:
                author = "Unknown"
                name = model_id
            
            # Extract description
            description = data.get("description", "") or f"HuggingFace model: {name}"
            
            # Extract pipeline tag and library to determine model type
            pipeline_tag = data.get("pipeline_tag", "")
            library = data.get("library_name", "")
            
            # Determine ComfyUI model type
            comfyui_model_type = ComfyUIModelType.UNKNOWN
            if pipeline_tag:
                comfyui_model_type = self.PIPELINE_TYPE_MAPPING.get(pipeline_tag, ComfyUIModelType.UNKNOWN)
            if comfyui_model_type == ComfyUIModelType.UNKNOWN and library:
                comfyui_model_type = self.LIBRARY_TYPE_MAPPING.get(library, ComfyUIModelType.UNKNOWN)
            
            # Extract tags
            tags = data.get("tags", [])
            if isinstance(tags, list):
                tags = [str(tag) for tag in tags if tag]
            else:
                tags = []
            
            # Extract stats
            download_count = data.get("downloads", 0) or 0
            likes = data.get("likes", 0) or 0
            # Convert likes to a rating (0-5 scale, very rough approximation)
            rating = min(5.0, max(0.0, likes / 100)) if likes > 0 else None
            
            # Extract dates
            created_at_str = data.get("createdAt", "")
            last_modified_str = data.get("lastModified", "")
            
            try:
                created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                created_at = datetime.now()
            
            try:
                updated_at = datetime.fromisoformat(last_modified_str.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                updated_at = created_at
            
            # Extract file information
            siblings = data.get("siblings", [])
            total_size = 0
            supported_formats = []
            
            for sibling in siblings:
                if isinstance(sibling, dict):
                    filename = sibling.get("rfilename", "")
                    size = sibling.get("size", 0) or 0
                    total_size += size
                    
                    # Determine file format
                    if filename.endswith(".safetensors"):
                        supported_formats.append("safetensors")
                    elif filename.endswith(".bin"):
                        supported_formats.append("bin")
                    elif filename.endswith(".ckpt"):
                        supported_formats.append("ckpt")
                    elif filename.endswith(".pt"):
                        supported_formats.append("pt")
            
            # Remove duplicates and prefer safetensors
            supported_formats = list(set(supported_formats))
            file_format = None
            if "safetensors" in supported_formats:
                file_format = "safetensors"
            elif supported_formats:
                file_format = supported_formats[0]
            
            # Determine base model from tags or model card
            base_model = None
            for tag in tags:
                if "stable-diffusion" in tag.lower():
                    if "xl" in tag.lower() or "sdxl" in tag.lower():
                        base_model = "SDXL"
                    elif "2" in tag:
                        base_model = "SD 2.x"
                    else:
                        base_model = "SD 1.5"
                    break
            
            # Determine ComfyUI compatibility
            is_compatible = self._is_comfyui_compatible(comfyui_model_type, file_format, library, tags)
            model_folder = self.FOLDER_MAPPING.get(comfyui_model_type) if is_compatible else None
            
            compatibility = ComfyUICompatibility(
                is_compatible=is_compatible,
                model_folder=model_folder,
                compatibility_notes=self._get_compatibility_notes(comfyui_model_type, library, tags),
                required_nodes=self._get_required_nodes(comfyui_model_type)
            )
            
            # Build metadata dictionary
            metadata = {
                "huggingface_id": model_id,
                "library": library,
                "pipeline_tag": pipeline_tag,
                "license": data.get("license", ""),
                "languages": data.get("languages", []),
                "datasets": data.get("datasets", []),
                "metrics": data.get("metrics", []),
                "likes": likes,
                "model_page_url": f"https://huggingface.co/{model_id}",
                "supported_formats": supported_formats,
                "siblings": [
                    {
                        "filename": s.get("rfilename", ""),
                        "size": s.get("size", 0)
                    }
                    for s in siblings[:10]  # Limit to first 10 files
                    if isinstance(s, dict)
                ]
            }
            
            return ExternalModel(
                id=f"huggingface:{model_id}",
                name=name,
                description=description,
                author=author,
                platform=ExternalPlatform.HUGGINGFACE,
                thumbnail_url=None,  # HuggingFace doesn't provide thumbnails in API
                tags=tags,
                download_count=download_count,
                rating=rating,
                created_at=created_at,
                updated_at=updated_at,
                metadata=metadata,
                comfyui_compatibility=compatibility,
                model_type=comfyui_model_type,
                base_model=base_model,
                file_size=total_size if total_size > 0 else None,
                file_format=file_format
            )
            
        except Exception as e:
            logger.error(f"Failed to parse HuggingFace model data: {e}")
            return None
    
    def _is_comfyui_compatible(self, model_type: ComfyUIModelType, file_format: Optional[str], 
                              library: str, tags: List[str]) -> bool:
        """Determine if a model is compatible with ComfyUI.
        
        Args:
            model_type: The ComfyUI model type
            file_format: The file format
            library: The library name
            tags: Model tags
            
        Returns:
            True if compatible with ComfyUI
        """
        # Unknown types are not compatible
        if model_type == ComfyUIModelType.UNKNOWN:
            return False
        
        # Diffusers library models are generally compatible
        if library == "diffusers":
            return True
        
        # PEFT models (LoRA) are compatible
        if library in ["peft", "adapter-transformers"]:
            return True
        
        # Check for diffusion-related tags
        diffusion_tags = ["stable-diffusion", "diffusion", "text-to-image", "image-to-image"]
        has_diffusion_tag = any(tag.lower() in " ".join(tags).lower() for tag in diffusion_tags)
        
        if has_diffusion_tag:
            return True
        
        # Prefer safetensors format
        if file_format == "safetensors":
            return True
        
        # Default to not compatible for HuggingFace unless we can confirm
        return False
    
    def _get_compatibility_notes(self, model_type: ComfyUIModelType, library: str, tags: List[str]) -> Optional[str]:
        """Get compatibility notes for a model.
        
        Args:
            model_type: The ComfyUI model type
            library: The library name
            tags: Model tags
            
        Returns:
            Compatibility notes or None
        """
        notes = []
        
        if model_type == ComfyUIModelType.UNKNOWN:
            notes.append("Model type not supported by ComfyUI")
        
        if library == "transformers":
            notes.append("May require conversion for ComfyUI compatibility")
        
        if library == "diffusers":
            notes.append("Diffusers model - may need conversion to checkpoint format")
        
        # Check for SDXL
        sdxl_tags = ["sdxl", "stable-diffusion-xl"]
        if any(tag.lower() in " ".join(tags).lower() for tag in sdxl_tags):
            notes.append("Requires SDXL-compatible workflow")
        
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
        """Search for models on HuggingFace.
        
        Args:
            platform: Must be HUGGINGFACE
            query: Search query string
            limit: Maximum number of results
            offset: Number of results to skip
            filters: Additional filters
            
        Returns:
            List of external models
            
        Raises:
            ExternalAPIError: If API request fails
        """
        if platform != ExternalPlatform.HUGGINGFACE:
            return []
        
        params = {
            "limit": min(limit, 100),  # HuggingFace max limit
            "skip": offset,
            "sort": "downloads",
            "direction": -1
        }
        
        if query:
            params["search"] = query
        
        # Apply filters
        if filters:
            if "model_type" in filters:
                # Map ComfyUI model type to HuggingFace pipeline tag
                comfyui_type = filters["model_type"]
                if comfyui_type == "checkpoint":
                    params["pipeline_tag"] = "text-to-image"
                elif comfyui_type == "lora":
                    params["library"] = "peft"
            
            if "library" in filters:
                params["library"] = filters["library"]
            
            if "pipeline_tag" in filters:
                params["pipeline_tag"] = filters["pipeline_tag"]
            
            if "sort" in filters:
                sort_mapping = {
                    "downloads": "downloads",
                    "likes": "likes",
                    "updated": "lastModified",
                    "created": "createdAt"
                }
                params["sort"] = sort_mapping.get(filters["sort"], "downloads")
            
            if "comfyui_compatible" in filters and filters["comfyui_compatible"]:
                # Filter for diffusion models
                params["pipeline_tag"] = "text-to-image"
        
        # Default to diffusion models if no specific filters
        if not filters or not any(k in filters for k in ["model_type", "library", "pipeline_tag"]):
            params["pipeline_tag"] = "text-to-image"
        
        url = f"{self.BASE_URL}/models"
        
        try:
            response_data = await self._make_request(url, params)
            if not response_data:
                return []
            
            models = []
            # HuggingFace returns a list directly
            items = response_data if isinstance(response_data, list) else []
            
            for item in items:
                model = self._parse_huggingface_model(item)
                if model:
                    models.append(model)
            
            return models
            
        except Exception as e:
            logger.error(f"Failed to search HuggingFace models: {e}")
            raise
    
    async def get_model_details(self, platform: ExternalPlatform, model_id: str) -> Optional[ExternalModel]:
        """Get detailed information about a specific model.
        
        Args:
            platform: Must be HUGGINGFACE
            model_id: HuggingFace model ID (e.g., "runwayml/stable-diffusion-v1-5")
            
        Returns:
            External model or None if not found
            
        Raises:
            ExternalAPIError: If API request fails
        """
        if platform != ExternalPlatform.HUGGINGFACE:
            return None
        
        url = f"{self.BASE_URL}/models/{model_id}"
        
        try:
            response_data = await self._make_request(url)
            if not response_data:
                return None
            
            return self._parse_huggingface_model(response_data)
            
        except Exception as e:
            logger.error(f"Failed to get HuggingFace model details: {e}")
            raise
    
    async def get_popular_models(
        self, 
        platform: ExternalPlatform, 
        limit: int = 20,
        model_type: Optional[str] = None
    ) -> List[ExternalModel]:
        """Get popular models from HuggingFace.
        
        Args:
            platform: Must be HUGGINGFACE
            limit: Maximum number of results
            model_type: Optional model type filter
            
        Returns:
            List of popular external models
        """
        if platform != ExternalPlatform.HUGGINGFACE:
            return []
        
        filters = {"sort": "downloads"}
        if model_type:
            filters["model_type"] = model_type
        
        return await self.search_models(platform, "", limit, 0, filters)
    
    async def get_recent_models(
        self, 
        platform: ExternalPlatform, 
        limit: int = 20,
        model_type: Optional[str] = None
    ) -> List[ExternalModel]:
        """Get recent models from HuggingFace.
        
        Args:
            platform: Must be HUGGINGFACE
            limit: Maximum number of results
            model_type: Optional model type filter
            
        Returns:
            List of recent external models
        """
        if platform != ExternalPlatform.HUGGINGFACE:
            return []
        
        filters = {"sort": "created"}
        if model_type:
            filters["model_type"] = model_type
        
        return await self.search_models(platform, "", limit, 0, filters)
    
    async def check_model_availability(self, platform: ExternalPlatform, model_id: str) -> bool:
        """Check if a model is available on HuggingFace.
        
        Args:
            platform: Must be HUGGINGFACE
            model_id: HuggingFace model ID
            
        Returns:
            True if model is available
        """
        if platform != ExternalPlatform.HUGGINGFACE:
            return False
        
        try:
            model = await self.get_model_details(platform, model_id)
            return model is not None
        except Exception:
            return False
    
    def get_supported_platforms(self) -> List[ExternalPlatform]:
        """Get supported platforms.
        
        Returns:
            List containing only HUGGINGFACE
        """
        return [ExternalPlatform.HUGGINGFACE]
    
    def get_platform_capabilities(self, platform: ExternalPlatform) -> Dict[str, Any]:
        """Get platform capabilities.
        
        Args:
            platform: Must be HUGGINGFACE
            
        Returns:
            Dictionary of capabilities
        """
        if platform != ExternalPlatform.HUGGINGFACE:
            return {}
        
        return {
            "search": True,
            "model_details": True,
            "popular_models": True,
            "recent_models": True,
            "model_types": list(self.PIPELINE_TYPE_MAPPING.keys()),
            "supported_formats": ["safetensors", "bin", "ckpt", "pt"],
            "libraries": list(self.LIBRARY_TYPE_MAPPING.keys()),
            "rate_limits": {
                "requests_per_second": 2.0,
                "requests_per_minute": 120
            },
            "is_available": True,
            "max_results_per_request": 100
        }
    
    async def close(self):
        """Close the HTTP session."""
        if self._session and not self._session.closed:
            await self._session.close()