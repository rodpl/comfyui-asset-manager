"""CivitAI metadata adapter implementation."""

import asyncio
import hashlib
import logging
from typing import Optional, Dict, Any
from datetime import datetime

import aiohttp
from aiohttp import ClientTimeout, ClientError

from ...domain.ports.driven.external_metadata_port import ExternalMetadataPort
from ...domain.entities.external_metadata import ExternalMetadata, CivitAIMetadata


logger = logging.getLogger(__name__)


class CivitAIMetadataAdapter(ExternalMetadataPort):
    """Adapter for fetching metadata from CivitAI API.
    
    This adapter implements the ExternalMetadataPort interface to provide
    CivitAI-specific metadata fetching capabilities.
    """
    
    BASE_URL = "https://civitai.com/api/v1"
    DEFAULT_TIMEOUT = 30
    RATE_LIMIT_DELAY = 1.0  # Seconds between requests
    MAX_RETRIES = 3
    
    def __init__(self, timeout: int = DEFAULT_TIMEOUT):
        """Initialize CivitAI metadata adapter.
        
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
                        # Rate limited, wait longer
                        retry_after = int(response.headers.get('Retry-After', 60))
                        logger.warning(f"CivitAI: Rate limited, waiting {retry_after} seconds")
                        await asyncio.sleep(retry_after)
                        continue
                    else:
                        logger.warning(f"CivitAI: HTTP {response.status} for URL: {url}")
                        if attempt == self.MAX_RETRIES - 1:
                            return None
                        
            except ClientError as e:
                logger.warning(f"CivitAI: Request failed (attempt {attempt + 1}): {e}")
                if attempt == self.MAX_RETRIES - 1:
                    return None
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
            
            except Exception as e:
                logger.error(f"CivitAI: Unexpected error: {e}")
                return None
        
        return None
    
    def _parse_civitai_response(self, data: Dict[str, Any]) -> Optional[CivitAIMetadata]:
        """Parse CivitAI API response into CivitAIMetadata.
        
        Args:
            data: Raw API response data
            
        Returns:
            Parsed CivitAI metadata, None if parsing failed
        """
        try:
            # Extract model information
            model_id = data.get("id", 0)
            name = data.get("name", "")
            description = data.get("description", "")
            
            # Extract tags
            tags = []
            if "tags" in data:
                tags = [tag.get("name", "") for tag in data["tags"] if tag.get("name")]
            
            # Extract images
            images = []
            if "images" in data:
                images = [img.get("url", "") for img in data["images"] if img.get("url")]
            
            # Extract stats
            stats = data.get("stats", {})
            download_count = stats.get("downloadCount", 0)
            rating = stats.get("rating", 0.0)
            
            # Extract creator info
            creator_info = data.get("creator", {})
            creator = creator_info.get("username", "")
            
            # Extract version info (use first version if available)
            version_name = ""
            base_model = ""
            if "modelVersions" in data and data["modelVersions"]:
                first_version = data["modelVersions"][0]
                version_name = first_version.get("name", "")
                base_model = first_version.get("baseModel", "")
            
            return CivitAIMetadata(
                model_id=model_id,
                name=name,
                description=description,
                tags=tags,
                images=images,
                download_count=download_count,
                rating=rating,
                creator=creator,
                version_name=version_name,
                base_model=base_model
            )
            
        except Exception as e:
            logger.error(f"CivitAI: Failed to parse response: {e}")
            return None
    
    async def fetch_metadata(self, identifier: str) -> Optional[ExternalMetadata]:
        """Fetch metadata using model hash as identifier.
        
        Args:
            identifier: Model hash to lookup
            
        Returns:
            External metadata with CivitAI data, None if not found
        """
        civitai_metadata = await self.fetch_civitai_metadata(identifier)
        if civitai_metadata:
            return ExternalMetadata(
                model_hash=identifier,
                civitai=civitai_metadata,
                cached_at=datetime.now()
            )
        return None
    
    async def fetch_civitai_metadata(self, model_hash: str) -> Optional[CivitAIMetadata]:
        """Fetch metadata from CivitAI using model hash.
        
        Args:
            model_hash: SHA256 hash of the model file
            
        Returns:
            CivitAI metadata if found, None otherwise
        """
        if not model_hash:
            logger.warning("CivitAI: Empty model hash provided")
            return None
        
        # CivitAI API endpoint for hash-based lookup
        url = f"{self.BASE_URL}/model-versions/by-hash/{model_hash}"
        
        logger.debug(f"CivitAI: Fetching metadata for hash: {model_hash}")
        
        try:
            response_data = await self._make_request(url)
            if response_data:
                # Get the full model data using model ID
                model_id = response_data.get("modelId")
                if model_id:
                    model_url = f"{self.BASE_URL}/models/{model_id}"
                    model_data = await self._make_request(model_url)
                    if model_data:
                        return self._parse_civitai_response(model_data)
                
                logger.debug(f"CivitAI: No model ID found in response for hash: {model_hash}")
            else:
                logger.debug(f"CivitAI: No data returned for hash: {model_hash}")
                
        except Exception as e:
            logger.error(f"CivitAI: Error fetching metadata for hash {model_hash}: {e}")
        
        return None
    
    async def fetch_huggingface_metadata(self, model_name: str) -> Optional[Any]:
        """Not implemented for CivitAI adapter.
        
        Args:
            model_name: Model name (not used)
            
        Returns:
            None (not implemented)
        """
        return None
    
    async def close(self) -> None:
        """Close HTTP session."""
        if self._session and not self._session.closed:
            await self._session.close()
    
    async def __aenter__(self):
        """Async context manager entry."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()