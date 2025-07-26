"""Cache driven port (secondary interface)."""

from abc import ABC, abstractmethod
from typing import Any, Optional


class CachePort(ABC):
    """Secondary port for caching services.
    
    This port defines what the application needs for caching functionality.
    It is implemented by driven adapters and used by domain services.
    """
    
    @abstractmethod
    def get(self, key: str) -> Optional[Any]:
        """Get a value from the cache.
        
        Args:
            key: The cache key to retrieve
            
        Returns:
            The cached value if found, None otherwise
        """
        pass
    
    @abstractmethod
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set a value in the cache.
        
        Args:
            key: The cache key to set
            value: The value to cache
            ttl: Time to live in seconds (None for no expiration)
        """
        pass
    
    @abstractmethod
    def delete(self, key: str) -> bool:
        """Delete a value from the cache.
        
        Args:
            key: The cache key to delete
            
        Returns:
            True if key was deleted, False if not found
        """
        pass
    
    @abstractmethod
    def clear(self) -> None:
        """Clear all values from the cache."""
        pass
    
    @abstractmethod
    def exists(self, key: str) -> bool:
        """Check if a key exists in the cache.
        
        Args:
            key: The cache key to check
            
        Returns:
            True if key exists, False otherwise
        """
        pass