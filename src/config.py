"""Configuration management for the asset manager application."""

import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class ExternalAPIConfig:
    """Configuration for external API services."""
    civitai_enabled: bool = True
    civitai_timeout: int = 30
    huggingface_enabled: bool = True
    huggingface_api_token: Optional[str] = None
    huggingface_timeout: int = 30


@dataclass
class CacheConfig:
    """Configuration for caching."""
    enabled: bool = True
    cache_dir: str = ".cache/asset_manager"
    default_ttl: int = 3600  # 1 hour
    cleanup_interval: int = 86400  # 24 hours


@dataclass
class ApplicationConfig:
    """Main application configuration."""
    external_apis: ExternalAPIConfig
    cache: CacheConfig
    debug: bool = False
    log_level: str = "INFO"


def load_config() -> ApplicationConfig:
    """Load configuration from environment variables and defaults.
    
    Returns:
        Application configuration object
    """
    # External API configuration
    external_apis = ExternalAPIConfig(
        civitai_enabled=_get_bool_env("CIVITAI_ENABLED", True),
        civitai_timeout=_get_int_env("CIVITAI_TIMEOUT", 30),
        huggingface_enabled=_get_bool_env("HUGGINGFACE_ENABLED", True),
        huggingface_api_token=os.getenv("HUGGINGFACE_API_TOKEN"),
        huggingface_timeout=_get_int_env("HUGGINGFACE_TIMEOUT", 30)
    )
    
    # Cache configuration
    cache = CacheConfig(
        enabled=_get_bool_env("CACHE_ENABLED", True),
        cache_dir=os.getenv("CACHE_DIR", ".cache/asset_manager"),
        default_ttl=_get_int_env("CACHE_DEFAULT_TTL", 3600),
        cleanup_interval=_get_int_env("CACHE_CLEANUP_INTERVAL", 86400)
    )
    
    # Main application configuration
    return ApplicationConfig(
        external_apis=external_apis,
        cache=cache,
        debug=_get_bool_env("DEBUG", False),
        log_level=os.getenv("LOG_LEVEL", "INFO")
    )


def _get_bool_env(key: str, default: bool) -> bool:
    """Get boolean value from environment variable.
    
    Args:
        key: Environment variable key
        default: Default value if not found
        
    Returns:
        Boolean value
    """
    value = os.getenv(key)
    if value is None:
        return default
    
    return value.lower() in ("true", "1", "yes", "on")


def _get_int_env(key: str, default: int) -> int:
    """Get integer value from environment variable.
    
    Args:
        key: Environment variable key
        default: Default value if not found
        
    Returns:
        Integer value
    """
    value = os.getenv(key)
    if value is None:
        return default
    
    try:
        return int(value)
    except ValueError:
        return default