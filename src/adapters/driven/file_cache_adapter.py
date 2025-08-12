"""File-based cache adapter implementation."""

import json
import os
import time
from pathlib import Path
from typing import Any, Optional

from src.domain.ports.driven.cache_port import CachePort
from src.utils import logger


class FileCacheAdapter(CachePort):
    """File-based cache adapter implementing CachePort.
    
    This adapter provides persistent caching using the file system.
    Each cache entry is stored as a JSON file with metadata including TTL.
    """
    
    def __init__(self, cache_dir: str = ".cache/asset_manager"):
        """Initialize the file cache adapter.
        
        Args:
            cache_dir: Directory to store cache files
        """
        self._cache_dir = Path(cache_dir)
        self._cache_dir.mkdir(parents=True, exist_ok=True)
    
    def get(self, key: str) -> Optional[Any]:
        """Get a value from the cache.
        
        Args:
            key: The cache key to retrieve
            
        Returns:
            The cached value if found and not expired, None otherwise
        """
        cache_file = self._get_cache_file_path(key)
        
        try:
            if not cache_file.exists():
                return None
        except OSError:
            # Permission error or other filesystem issue
            return None
        
        try:
            with open(cache_file, 'r', encoding='utf-8') as f:
                cache_data = json.load(f)
            
            # Check if entry has expired
            if self._is_expired(cache_data):
                self._delete_cache_file(cache_file)
                return None
            
            return cache_data['value']
        
        except (json.JSONDecodeError, KeyError, OSError):
            # If file is corrupted or unreadable, try to remove it
            self._delete_cache_file(cache_file)
            return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set a value in the cache.
        
        Args:
            key: The cache key to set
            value: The value to cache
            ttl: Time to live in seconds (None for no expiration)
        """
        cache_file = self._get_cache_file_path(key)
        
        # Prepare cache data with metadata
        cache_data = {
            'value': value,
            'created_at': time.time(),
            'ttl': ttl
        }
        
        try:
            # Ensure parent directory exists
            cache_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(cache_file, 'w', encoding='utf-8') as f:
                json.dump(cache_data, f, indent=2, default=str)
        
        except (OSError, TypeError) as e:
            # Log error but don't raise - cache failures shouldn't break the app
            logger.warn(f"Failed to write cache file {cache_file}: {e}")
    
    def delete(self, key: str) -> bool:
        """Delete a value from the cache.
        
        Args:
            key: The cache key to delete
            
        Returns:
            True if key was deleted, False if not found
        """
        cache_file = self._get_cache_file_path(key)
        
        if cache_file.exists():
            return self._delete_cache_file(cache_file)
        
        return False
    
    def clear(self) -> None:
        """Clear all values from the cache."""
        if not self._cache_dir.exists():
            return
        
        try:
            for cache_file in self._cache_dir.rglob("*.json"):
                self._delete_cache_file(cache_file)
        except OSError as e:
            logger.warn(f"Failed to clear cache directory {self._cache_dir}: {e}")
    
    def exists(self, key: str) -> bool:
        """Check if a key exists in the cache.
        
        Args:
            key: The cache key to check
            
        Returns:
            True if key exists and is not expired, False otherwise
        """
        cache_file = self._get_cache_file_path(key)
        
        try:
            if not cache_file.exists():
                return False
        except OSError:
            # Permission error or other filesystem issue
            return False
        
        try:
            with open(cache_file, 'r', encoding='utf-8') as f:
                cache_data = json.load(f)
            
            # Check if entry has expired
            if self._is_expired(cache_data):
                self._delete_cache_file(cache_file)
                return False
            
            return True
        
        except (json.JSONDecodeError, KeyError, OSError):
            # If file is corrupted or unreadable, consider it non-existent
            self._delete_cache_file(cache_file)
            return False
    
    def cleanup_expired(self) -> int:
        """Clean up expired cache entries.
        
        Returns:
            Number of expired entries removed
        """
        if not self._cache_dir.exists():
            return 0
        
        removed_count = 0
        
        try:
            for cache_file in self._cache_dir.rglob("*.json"):
                try:
                    with open(cache_file, 'r', encoding='utf-8') as f:
                        cache_data = json.load(f)
                    
                    if self._is_expired(cache_data):
                        if self._delete_cache_file(cache_file):
                            removed_count += 1
                
                except (json.JSONDecodeError, KeyError, OSError):
                    # Remove corrupted files
                    if self._delete_cache_file(cache_file):
                        removed_count += 1
        
        except OSError as e:
            logger.warn(f"Failed to cleanup cache directory {self._cache_dir}: {e}")
        
        return removed_count
    
    def get_cache_stats(self) -> dict:
        """Get cache statistics.
        
        Returns:
            Dictionary with cache statistics
        """
        if not self._cache_dir.exists():
            return {
                'total_entries': 0,
                'expired_entries': 0,
                'cache_size_bytes': 0
            }
        
        total_entries = 0
        expired_entries = 0
        cache_size_bytes = 0
        
        try:
            for cache_file in self._cache_dir.rglob("*.json"):
                try:
                    cache_size_bytes += cache_file.stat().st_size
                    total_entries += 1
                    
                    with open(cache_file, 'r', encoding='utf-8') as f:
                        cache_data = json.load(f)
                    
                    if self._is_expired(cache_data):
                        expired_entries += 1
                
                except (json.JSONDecodeError, KeyError, OSError):
                    # Count corrupted files as expired
                    expired_entries += 1
        
        except OSError:
            pass
        
        return {
            'total_entries': total_entries,
            'expired_entries': expired_entries,
            'cache_size_bytes': cache_size_bytes
        }
    
    def _get_cache_file_path(self, key: str) -> Path:
        """Get the file path for a cache key.
        
        Args:
            key: The cache key
            
        Returns:
            Path to the cache file
        """
        # Sanitize key to be filesystem-safe
        safe_key = self._sanitize_key(key)
        return self._cache_dir / f"{safe_key}.json"
    
    def _sanitize_key(self, key: str) -> str:
        """Sanitize a cache key to be filesystem-safe.
        
        Args:
            key: The original cache key
            
        Returns:
            Sanitized key safe for filesystem use
        """
        # Replace problematic characters with underscores
        safe_chars = []
        for char in key:
            if char.isalnum() or char in '-_.':
                safe_chars.append(char)
            else:
                safe_chars.append('_')
        
        safe_key = ''.join(safe_chars)
        
        # Ensure key isn't too long for filesystem
        if len(safe_key) > 200:
            # Use hash for very long keys
            import hashlib
            hash_suffix = hashlib.md5(key.encode()).hexdigest()[:8]
            safe_key = safe_key[:190] + '_' + hash_suffix
        
        return safe_key
    
    def _is_expired(self, cache_data: dict) -> bool:
        """Check if cache data has expired.
        
        Args:
            cache_data: The cache data dictionary
            
        Returns:
            True if expired, False otherwise
        """
        ttl = cache_data.get('ttl')
        if ttl is None:
            return False  # No expiration
        
        created_at = cache_data.get('created_at', 0)
        return time.time() > (created_at + ttl)
    
    def _delete_cache_file(self, cache_file: Path) -> bool:
        """Delete a cache file.
        
        Args:
            cache_file: Path to the cache file
            
        Returns:
            True if file was deleted, False otherwise
        """
        try:
            cache_file.unlink()
            return True
        except OSError:
            return False