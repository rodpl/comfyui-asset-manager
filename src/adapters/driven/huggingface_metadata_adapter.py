"""HuggingFace metadata adapter implementation."""

import asyncio
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

import aiohttp
from aiohttp import ClientTimeout, ClientError

from ...domain.ports.driven.external_metadata_port import ExternalMetadataPort
from ...domain.entities.external_metadata import ExternalMetadata, HuggingFaceMetadata


logger = logging.getLogger(__name__)


class HuggingFaceMetadataAdapter(ExternalMetadataPort):
    """Adapter for fetching metadata from HuggingFace API.
    
    This adapter implements the ExternalMetadataPort interface to provide
    HuggingFace-specific metadata fetching capabilities.
    """
    
    BASE_URL = "https://huggingface.co/api"
    DEFAULT_TIMEOUT = 30
    RATE_LIMIT_DELAY = 0.5  # Seconds between requests (HuggingFace is more lenient)
    MAX_RETRIES = 3
    
    def __init__(self, api_token: Optional[str] = None, timeout: int = DEFAULT_TIMEOUT):
        """Initialize HuggingFace metadata adapter.
        
        Args:
            api_token: Optional HuggingFace API token for authenticated requests
            timeout: HTTP request timeout in seconds
        """
        self._timeout = ClientTimeout(total=timeout)
        self._api_token = api_token
        self._last_request_time = 0.0
        self._session: Optional[aiohttp.ClientSession] = None
    
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create HTTP session."""
        if self._session is None or self._session.closed:
            headers = {
                "User-Agent": "ComfyUI-Asset-Manager/1.0",
                "Accept": "application/json"
            }
            
            # Add authorization header if API token is provided
            if self._api_token:
                headers["Authorization"] = f"Bearer {self._api_token}"
            
            self._session = aiohttp.ClientSession(
                timeout=self._timeout,
                headers=headers
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
                        logger.debug(f"HuggingFace: Model not found (404) for URL: {url}")
                        return None
                    elif response.status == 429:
                        # Rate limited, wait longer
                        retry_after = int(response.headers.get('Retry-After', 60))
                        logger.warning(f"HuggingFace: Rate limited, waiting {retry_after} seconds")
                        await asyncio.sleep(retry_after)
                        continue
                    elif response.status == 401:
                        logger.error("HuggingFace: Unauthorized - check API token")
                        return None
                    else:
                        logger.warning(f"HuggingFace: HTTP {response.status} for URL: {url}")
                        if attempt == self.MAX_RETRIES - 1:
                            return None
                        
            except ClientError as e:
                logger.warning(f"HuggingFace: Request failed (attempt {attempt + 1}): {e}")
                if attempt == self.MAX_RETRIES - 1:
                    return None
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
            
            except Exception as e:
                logger.error(f"HuggingFace: Unexpected error: {e}")
                return None
        
        return None
    
    def _parse_huggingface_response(self, data: Dict[str, Any]) -> Optional[HuggingFaceMetadata]:
        """Parse HuggingFace API response into HuggingFaceMetadata.
        
        Args:
            data: Raw API response data
            
        Returns:
            Parsed HuggingFace metadata, None if parsing failed
        """
        try:
            # Extract model information
            model_id = data.get("id", "")
            if not model_id:
                logger.warning("HuggingFace: No model ID in response")
                return None
            
            # Extract description (can be in multiple fields)
            description = ""
            if "description" in data and data["description"]:
                description = data["description"]
            elif "cardData" in data and data["cardData"] and "description" in data["cardData"]:
                description = data["cardData"]["description"]
            
            # If still no description, use a default
            if not description:
                description = f"Model {model_id} from HuggingFace"
            
            # Extract tags
            tags = []
            if "tags" in data and isinstance(data["tags"], list):
                tags = [str(tag) for tag in data["tags"] if tag]
            
            # Extract stats
            downloads = 0
            likes = 0
            if "downloads" in data:
                try:
                    downloads = int(data["downloads"]) if data["downloads"] else 0
                except (ValueError, TypeError):
                    downloads = 0
            if "likes" in data:
                try:
                    likes = int(data["likes"]) if data["likes"] else 0
                except (ValueError, TypeError):
                    likes = 0
            
            # Extract library and pipeline info
            library = ""
            pipeline_tag = ""
            if "library_name" in data:
                library = str(data["library_name"])
            if "pipeline_tag" in data:
                pipeline_tag = str(data["pipeline_tag"])
            
            # Extract license
            license_info = ""
            if "cardData" in data and data["cardData"] and "license" in data["cardData"]:
                license_info = str(data["cardData"]["license"])
            
            return HuggingFaceMetadata(
                model_id=model_id,
                description=description,
                tags=tags,
                downloads=downloads,
                likes=likes,
                library=library,
                pipeline_tag=pipeline_tag,
                license=license_info
            )
            
        except Exception as e:
            logger.error(f"HuggingFace: Failed to parse response: {e}")
            return None
    
    def _extract_model_name_from_identifier(self, identifier: str) -> str:
        """Extract model name from various identifier formats.
        
        Args:
            identifier: Could be full model name, filename, or path
            
        Returns:
            Cleaned model name for HuggingFace API
        """
        name = identifier.strip()
        
        # Check if it looks like a file path (has file extension)
        has_file_extension = any(name.lower().endswith(ext) for ext in ['.safetensors', '.ckpt', '.pt', '.pth', '.bin'])
        
        # Remove path components if it looks like a file path
        if has_file_extension and '/' in name:
            name = name.split('/')[-1]
        
        # Remove file extensions
        for ext in ['.safetensors', '.ckpt', '.pt', '.pth', '.bin']:
            if name.lower().endswith(ext):
                name = name[:-len(ext)]
                break
        
        return name
    
    async def fetch_metadata(self, identifier: str) -> Optional[ExternalMetadata]:
        """Fetch metadata using model name as identifier.
        
        Args:
            identifier: Model name or filename to lookup
            
        Returns:
            External metadata with HuggingFace data, None if not found
        """
        huggingface_metadata = await self.fetch_huggingface_metadata(identifier)
        if huggingface_metadata:
            return ExternalMetadata(
                model_hash=identifier,  # Use identifier as hash for HuggingFace
                huggingface=huggingface_metadata,
                cached_at=datetime.now()
            )
        return None
    
    async def fetch_civitai_metadata(self, model_hash: str) -> Optional[Any]:
        """Not implemented for HuggingFace adapter.
        
        Args:
            model_hash: Model hash (not used)
            
        Returns:
            None (not implemented)
        """
        return None
    
    async def fetch_huggingface_metadata(self, model_name: str) -> Optional[HuggingFaceMetadata]:
        """Fetch metadata from HuggingFace using model name.
        
        Args:
            model_name: Name of the model to lookup
            
        Returns:
            HuggingFace metadata if found, None otherwise
        """
        if not model_name:
            logger.warning("HuggingFace: Empty model name provided")
            return None
        
        # Clean the model name
        clean_name = self._extract_model_name_from_identifier(model_name)
        
        # Try different search strategies
        search_terms = [
            model_name,  # Original name
            clean_name,  # Cleaned name
        ]
        
        # If the name looks like it might be a HuggingFace model ID (contains '/'), try it directly
        if '/' in model_name and not model_name.endswith(('.safetensors', '.ckpt', '.pt', '.pth', '.bin')):
            search_terms.insert(0, model_name)
        
        for search_term in search_terms:
            logger.debug(f"HuggingFace: Trying search term: {search_term}")
            
            # First try direct model lookup if it looks like a model ID
            if '/' in search_term:
                result = await self._fetch_by_model_id(search_term)
                if result:
                    return result
            
            # Then try search API
            result = await self._search_models(search_term)
            if result:
                return result
        
        logger.debug(f"HuggingFace: No metadata found for model: {model_name}")
        return None
    
    async def _fetch_by_model_id(self, model_id: str) -> Optional[HuggingFaceMetadata]:
        """Fetch model metadata by direct model ID.
        
        Args:
            model_id: HuggingFace model ID (e.g., "runwayml/stable-diffusion-v1-5")
            
        Returns:
            HuggingFace metadata if found, None otherwise
        """
        url = f"{self.BASE_URL}/models/{model_id}"
        
        try:
            response_data = await self._make_request(url)
            if response_data:
                return self._parse_huggingface_response(response_data)
        except Exception as e:
            logger.debug(f"HuggingFace: Error fetching model by ID {model_id}: {e}")
        
        return None
    
    async def _search_models(self, query: str, limit: int = 5) -> Optional[HuggingFaceMetadata]:
        """Search for models using HuggingFace search API.
        
        Args:
            query: Search query
            limit: Maximum number of results to check
            
        Returns:
            HuggingFace metadata for best match, None if not found
        """
        url = f"{self.BASE_URL}/models"
        params = {
            "search": query,
            "limit": limit,
            "sort": "downloads",  # Sort by popularity
            "direction": -1
        }
        
        try:
            response_data = await self._make_request(url, params=params)
            if response_data and isinstance(response_data, list) and len(response_data) > 0:
                # Return metadata for the first (most popular) result
                best_match = response_data[0]
                return self._parse_huggingface_response(best_match)
        except Exception as e:
            logger.debug(f"HuggingFace: Error searching for models with query {query}: {e}")
        
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