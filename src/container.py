"""Dependency injection container for the asset manager application."""

import logging
from typing import Optional

from .config import ApplicationConfig, load_config

# Domain services
from .domain.services.model_service import ModelService
from .domain.services.folder_service import FolderService
from .domain.services.metadata_service import MetadataService
from .domain.services.output_service import OutputService

# Driving adapters
from .adapters.driving.web_api_adapter import WebAPIAdapter

# Driven adapters
from .adapters.driven.comfyui_folder_adapter import ComfyUIFolderAdapter
from .adapters.driven.filesystem_model_adapter import FileSystemModelAdapter
from .adapters.driven.civitai_metadata_adapter import CivitAIMetadataAdapter
from .adapters.driven.huggingface_metadata_adapter import HuggingFaceMetadataAdapter
from .adapters.driven.file_cache_adapter import FileCacheAdapter
from .adapters.driven.comfyui_output_adapter import ComfyUIOutputAdapter


logger = logging.getLogger(__name__)


class DIContainer:
    """Dependency injection container for the asset manager application.
    
    This container follows the hexagonal architecture pattern and wires
    all dependencies according to the dependency inversion principle.
    """
    
    def __init__(self, config: Optional[ApplicationConfig] = None):
        """Initialize the dependency injection container.
        
        Args:
            config: Application configuration (loads from environment if None)
        """
        self._config = config or load_config()
        self._setup_logging()
        
        # Initialize adapters and services
        self._cache_adapter: Optional[FileCacheAdapter] = None
        self._folder_repository: Optional[ComfyUIFolderAdapter] = None
        self._model_repository: Optional[FileSystemModelAdapter] = None
        self._output_repository: Optional[ComfyUIOutputAdapter] = None
        self._civitai_adapter: Optional[CivitAIMetadataAdapter] = None
        self._huggingface_adapter: Optional[HuggingFaceMetadataAdapter] = None
        
        self._metadata_service: Optional[MetadataService] = None
        self._model_service: Optional[ModelService] = None
        self._folder_service: Optional[FolderService] = None
        self._output_service: Optional[OutputService] = None
        
        self._web_api_adapter: Optional[WebAPIAdapter] = None
    
    def _setup_logging(self) -> None:
        """Setup logging configuration."""
        logging.basicConfig(
            level=getattr(logging, self._config.log_level.upper()),
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        if self._config.debug:
            logging.getLogger().setLevel(logging.DEBUG)
    
    @property
    def config(self) -> ApplicationConfig:
        """Get application configuration."""
        return self._config
    
    # Driven adapters (infrastructure)
    
    def get_cache_adapter(self) -> Optional[FileCacheAdapter]:
        """Get cache adapter instance.
        
        Returns:
            Cache adapter if caching is enabled, None otherwise
        """
        if not self._config.cache.enabled:
            return None
        
        if self._cache_adapter is None:
            logger.info("Initializing file cache adapter")
            self._cache_adapter = FileCacheAdapter(
                cache_dir=self._config.cache.cache_dir
            )
        
        return self._cache_adapter
    
    def get_folder_repository(self) -> ComfyUIFolderAdapter:
        """Get folder repository adapter instance.
        
        Returns:
            ComfyUI folder adapter
        """
        if self._folder_repository is None:
            logger.info("Initializing ComfyUI folder adapter")
            self._folder_repository = ComfyUIFolderAdapter()
        
        return self._folder_repository
    
    def get_model_repository(self) -> FileSystemModelAdapter:
        """Get model repository adapter instance.
        
        Returns:
            File system model adapter
        """
        if self._model_repository is None:
            logger.info("Initializing file system model adapter")
            folder_repository = self.get_folder_repository()
            self._model_repository = FileSystemModelAdapter(folder_repository)
        
        return self._model_repository
    
    def get_civitai_adapter(self) -> Optional[CivitAIMetadataAdapter]:
        """Get CivitAI metadata adapter instance.
        
        Returns:
            CivitAI adapter if enabled, None otherwise
        """
        if not self._config.external_apis.civitai_enabled:
            return None
        
        if self._civitai_adapter is None:
            logger.info("Initializing CivitAI metadata adapter")
            self._civitai_adapter = CivitAIMetadataAdapter(
                timeout=self._config.external_apis.civitai_timeout
            )
        
        return self._civitai_adapter
    
    def get_huggingface_adapter(self) -> Optional[HuggingFaceMetadataAdapter]:
        """Get HuggingFace metadata adapter instance.
        
        Returns:
            HuggingFace adapter if enabled, None otherwise
        """
        if not self._config.external_apis.huggingface_enabled:
            return None
        
        if self._huggingface_adapter is None:
            logger.info("Initializing HuggingFace metadata adapter")
            self._huggingface_adapter = HuggingFaceMetadataAdapter(
                api_token=self._config.external_apis.huggingface_api_token,
                timeout=self._config.external_apis.huggingface_timeout
            )
        
        return self._huggingface_adapter
    
    def get_output_repository(self) -> ComfyUIOutputAdapter:
        """Get output repository adapter instance.
        
        Returns:
            ComfyUI output adapter
        """
        if self._output_repository is None:
            logger.info("Initializing ComfyUI output adapter")
            self._output_repository = ComfyUIOutputAdapter()
        
        return self._output_repository
    
    # Domain services
    
    def get_metadata_service(self) -> MetadataService:
        """Get metadata service instance.
        
        Returns:
            Metadata service with configured adapters
        """
        if self._metadata_service is None:
            logger.info("Initializing metadata service")
            self._metadata_service = MetadataService(
                civitai_port=self.get_civitai_adapter(),
                huggingface_port=self.get_huggingface_adapter(),
                cache_port=self.get_cache_adapter(),
                cache_ttl=self._config.cache.default_ttl
            )
        
        return self._metadata_service
    
    def get_model_service(self) -> ModelService:
        """Get model service instance.
        
        Returns:
            Model service with configured dependencies
        """
        if self._model_service is None:
            logger.info("Initializing model service")
            model_repository = self.get_model_repository()
            
            # Create a combined external metadata port that tries both services
            external_metadata_port = self._create_combined_metadata_port()
            
            self._model_service = ModelService(
                model_repository=model_repository,
                external_metadata_port=external_metadata_port
            )
        
        return self._model_service
    
    def get_folder_service(self) -> FolderService:
        """Get folder service instance.
        
        Returns:
            Folder service with configured dependencies
        """
        if self._folder_service is None:
            logger.info("Initializing folder service")
            folder_repository = self.get_folder_repository()
            self._folder_service = FolderService(folder_repository)
        
        return self._folder_service
    
    def get_output_service(self) -> OutputService:
        """Get output service instance.
        
        Returns:
            Output service with configured dependencies
        """
        if self._output_service is None:
            logger.info("Initializing output service")
            output_repository = self.get_output_repository()
            self._output_service = OutputService(output_repository)
        
        return self._output_service
    
    # Driving adapters
    
    def get_web_api_adapter(self) -> WebAPIAdapter:
        """Get web API adapter instance.
        
        Returns:
            Web API adapter with configured services
        """
        if self._web_api_adapter is None:
            logger.info("Initializing web API adapter")
            model_service = self.get_model_service()
            folder_service = self.get_folder_service()
            output_service = self.get_output_service()
            
            self._web_api_adapter = WebAPIAdapter(
                model_management=model_service,
                folder_management=folder_service,
                output_management=output_service
            )
        
        return self._web_api_adapter
    
    def _create_combined_metadata_port(self):
        """Create a combined external metadata port that tries multiple services.
        
        Returns:
            Combined metadata port or None if no services are available
        """
        civitai_adapter = self.get_civitai_adapter()
        huggingface_adapter = self.get_huggingface_adapter()
        
        if not civitai_adapter and not huggingface_adapter:
            return None
        
        # For now, return the first available adapter
        # In a more sophisticated implementation, we could create a composite adapter
        return civitai_adapter or huggingface_adapter
    
    def cleanup(self) -> None:
        """Cleanup resources and close connections."""
        logger.info("Cleaning up dependency injection container")
        
        # Cleanup cache if needed
        if self._cache_adapter and self._config.cache.enabled:
            try:
                expired_count = self._cache_adapter.cleanup_expired()
                if expired_count > 0:
                    logger.info(f"Cleaned up {expired_count} expired cache entries")
            except Exception as e:
                logger.warning(f"Failed to cleanup cache: {e}")
        
        # Note: HTTP sessions in metadata adapters should be closed by their async context managers
        logger.info("Dependency injection container cleanup completed")


# Global container instance
_container: Optional[DIContainer] = None


def get_container(config: Optional[ApplicationConfig] = None) -> DIContainer:
    """Get the global dependency injection container instance.
    
    Args:
        config: Optional configuration (only used on first call)
        
    Returns:
        Global container instance
    """
    global _container
    
    if _container is None:
        _container = DIContainer(config)
        logger.info("Created global dependency injection container")
    
    return _container


def reset_container() -> None:
    """Reset the global container (mainly for testing)."""
    global _container
    
    if _container:
        _container.cleanup()
    
    _container = None
    logger.info("Reset global dependency injection container")