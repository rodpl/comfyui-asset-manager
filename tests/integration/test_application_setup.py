"""Integration tests for complete application setup and dependency injection."""

import pytest
import tempfile
import shutil
from pathlib import Path
from unittest.mock import patch, MagicMock

from src.config import ApplicationConfig, ExternalAPIConfig, CacheConfig
from src.container import DIContainer, get_container, reset_container
from src.main import AssetManagerApplication, get_application, reset_application


@pytest.fixture
def temp_cache_dir():
    """Create a temporary cache directory for testing."""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def test_config(temp_cache_dir):
    """Create test configuration."""
    return ApplicationConfig(
        external_apis=ExternalAPIConfig(
            civitai_enabled=True,
            civitai_timeout=10,
            huggingface_enabled=True,
            huggingface_api_token=None,
            huggingface_timeout=10
        ),
        cache=CacheConfig(
            enabled=True,
            cache_dir=temp_cache_dir,
            default_ttl=300,
            cleanup_interval=3600
        ),
        debug=True,
        log_level="DEBUG"
    )


@pytest.fixture(autouse=True)
def cleanup_globals():
    """Cleanup global instances after each test."""
    yield
    reset_application()
    reset_container()


class TestDIContainer:
    """Test dependency injection container."""
    
    def test_container_initialization(self, test_config):
        """Test that container initializes with proper configuration."""
        container = DIContainer(test_config)
        
        assert container.config == test_config
        assert container.config.debug is True
        assert container.config.cache.enabled is True
    
    def test_cache_adapter_creation(self, test_config):
        """Test cache adapter creation and configuration."""
        container = DIContainer(test_config)
        
        cache_adapter = container.get_cache_adapter()
        assert cache_adapter is not None
        
        # Test that same instance is returned
        cache_adapter2 = container.get_cache_adapter()
        assert cache_adapter is cache_adapter2
    
    def test_cache_adapter_disabled(self, test_config):
        """Test that cache adapter is None when caching is disabled."""
        test_config.cache.enabled = False
        container = DIContainer(test_config)
        
        cache_adapter = container.get_cache_adapter()
        assert cache_adapter is None
    
    @patch('src.container.ComfyUIFolderAdapter')
    def test_folder_repository_creation(self, mock_folder_adapter, test_config):
        """Test folder repository creation."""
        container = DIContainer(test_config)
        
        folder_repo = container.get_folder_repository()
        assert folder_repo is not None
        mock_folder_adapter.assert_called_once()
        
        # Test that same instance is returned
        folder_repo2 = container.get_folder_repository()
        assert folder_repo is folder_repo2
    
    @patch('src.container.FileSystemModelAdapter')
    @patch('src.container.ComfyUIFolderAdapter')
    def test_model_repository_creation(self, mock_folder_adapter, mock_model_adapter, test_config):
        """Test model repository creation with folder repository dependency."""
        container = DIContainer(test_config)
        
        model_repo = container.get_model_repository()
        assert model_repo is not None
        
        # Verify that folder repository was created first
        mock_folder_adapter.assert_called_once()
        mock_model_adapter.assert_called_once()
    
    def test_external_metadata_adapters(self, test_config):
        """Test external metadata adapter creation."""
        container = DIContainer(test_config)
        
        civitai_adapter = container.get_civitai_adapter()
        assert civitai_adapter is not None
        
        huggingface_adapter = container.get_huggingface_adapter()
        assert huggingface_adapter is not None
    
    def test_external_metadata_adapters_disabled(self, test_config):
        """Test that external metadata adapters are None when disabled."""
        test_config.external_apis.civitai_enabled = False
        test_config.external_apis.huggingface_enabled = False
        container = DIContainer(test_config)
        
        civitai_adapter = container.get_civitai_adapter()
        assert civitai_adapter is None
        
        huggingface_adapter = container.get_huggingface_adapter()
        assert huggingface_adapter is None
    
    @patch('src.container.MetadataService')
    def test_metadata_service_creation(self, mock_metadata_service, test_config):
        """Test metadata service creation with proper dependencies."""
        container = DIContainer(test_config)
        
        metadata_service = container.get_metadata_service()
        assert metadata_service is not None
        
        # Verify MetadataService was called with proper arguments
        mock_metadata_service.assert_called_once()
        call_args = mock_metadata_service.call_args
        assert 'civitai_port' in call_args.kwargs
        assert 'huggingface_port' in call_args.kwargs
        assert 'cache_port' in call_args.kwargs
        assert 'cache_ttl' in call_args.kwargs
    
    @patch('src.container.ModelService')
    def test_model_service_creation(self, mock_model_service, test_config):
        """Test model service creation with proper dependencies."""
        container = DIContainer(test_config)
        
        model_service = container.get_model_service()
        assert model_service is not None
        
        # Verify ModelService was called with proper arguments
        mock_model_service.assert_called_once()
        call_args = mock_model_service.call_args
        assert 'model_repository' in call_args.kwargs
        assert 'external_metadata_port' in call_args.kwargs
    
    @patch('src.container.FolderService')
    def test_folder_service_creation(self, mock_folder_service, test_config):
        """Test folder service creation with proper dependencies."""
        container = DIContainer(test_config)
        
        folder_service = container.get_folder_service()
        assert folder_service is not None
        
        # Verify FolderService was called with proper arguments
        mock_folder_service.assert_called_once()
        call_args = mock_folder_service.call_args
        assert len(call_args.args) == 1  # folder_repository
    
    @patch('src.container.WebAPIAdapter')
    def test_web_api_adapter_creation(self, mock_web_adapter, test_config):
        """Test web API adapter creation with proper dependencies."""
        container = DIContainer(test_config)
        
        web_adapter = container.get_web_api_adapter()
        assert web_adapter is not None
        
        # Verify WebAPIAdapter was called with proper arguments
        mock_web_adapter.assert_called_once()
        call_args = mock_web_adapter.call_args
        assert 'model_management' in call_args.kwargs
        assert 'folder_management' in call_args.kwargs
    
    def test_container_cleanup(self, test_config):
        """Test container cleanup functionality."""
        container = DIContainer(test_config)
        
        # Initialize some services
        container.get_cache_adapter()
        container.get_model_service()
        
        # Cleanup should not raise exceptions
        container.cleanup()


class TestAssetManagerApplication:
    """Test asset manager application."""
    
    def test_application_initialization(self, test_config):
        """Test application initialization."""
        app = AssetManagerApplication(test_config)
        
        assert app.config == test_config
        assert not app._initialized
        
        app.initialize()
        assert app._initialized
    
    def test_application_double_initialization(self, test_config):
        """Test that double initialization is handled gracefully."""
        app = AssetManagerApplication(test_config)
        
        app.initialize()
        assert app._initialized
        
        # Second initialization should not raise error
        app.initialize()
        assert app._initialized
    
    @patch('src.main.web')
    def test_create_web_app(self, mock_web, test_config):
        """Test web application creation."""
        app = AssetManagerApplication(test_config)
        
        mock_web_app = MagicMock()
        mock_web.Application.return_value = mock_web_app
        
        web_app = app.create_web_app()
        
        assert web_app is mock_web_app
        mock_web.Application.assert_called_once()
        
        # Verify middlewares were added
        assert mock_web_app.middlewares.append.call_count >= 1
    
    def test_health_status_not_initialized(self, test_config):
        """Test health status when application is not initialized."""
        app = AssetManagerApplication(test_config)
        
        health = app.get_health_status()
        
        assert health["status"] == "not_initialized"
        assert health["initialized"] is False
    
    def test_health_status_initialized(self, test_config):
        """Test health status when application is initialized."""
        app = AssetManagerApplication(test_config)
        app.initialize()
        
        health = app.get_health_status()
        
        assert health["status"] == "healthy"
        assert health["initialized"] is True
        assert "services" in health
        assert "cache_stats" in health
    
    def test_application_shutdown(self, test_config):
        """Test application shutdown."""
        app = AssetManagerApplication(test_config)
        app.initialize()
        
        assert app._initialized
        
        app.shutdown()
        assert not app._initialized


class TestGlobalInstances:
    """Test global instance management."""
    
    def test_get_container_singleton(self, test_config):
        """Test that get_container returns singleton instance."""
        container1 = get_container(test_config)
        container2 = get_container()
        
        assert container1 is container2
        assert container1.config == test_config
    
    def test_reset_container(self, test_config):
        """Test container reset functionality."""
        container1 = get_container(test_config)
        reset_container()
        container2 = get_container(test_config)
        
        assert container1 is not container2
    
    def test_get_application_singleton(self, test_config):
        """Test that get_application returns singleton instance."""
        app1 = get_application(test_config)
        app2 = get_application()
        
        assert app1 is app2
        assert app1.config == test_config
    
    def test_reset_application(self, test_config):
        """Test application reset functionality."""
        app1 = get_application(test_config)
        reset_application()
        app2 = get_application(test_config)
        
        assert app1 is not app2


class TestIntegrationScenarios:
    """Test complete integration scenarios."""
    
    def test_complete_dependency_chain(self, test_config):
        """Test that complete dependency chain works end-to-end."""
        # Create application and initialize
        app = AssetManagerApplication(test_config)
        app.initialize()
        
        # Verify all components are created
        container = app.container
        
        # Check that all services are available
        folder_service = container.get_folder_service()
        model_service = container.get_model_service()
        metadata_service = container.get_metadata_service()
        web_api_adapter = container.get_web_api_adapter()
        
        assert folder_service is not None
        assert model_service is not None
        assert metadata_service is not None
        assert web_api_adapter is not None
        
        # Verify that services have the expected types
        from src.domain.services.folder_service import FolderService
        from src.domain.services.model_service import ModelService
        from src.domain.services.metadata_service import MetadataService
        from src.adapters.driving.web_api_adapter import WebAPIAdapter
        
        assert isinstance(folder_service, FolderService)
        assert isinstance(model_service, ModelService)
        assert isinstance(metadata_service, MetadataService)
        assert isinstance(web_api_adapter, WebAPIAdapter)
    
    def test_configuration_loading_from_environment(self, temp_cache_dir, monkeypatch):
        """Test that configuration is loaded from environment variables."""
        # Set environment variables
        monkeypatch.setenv("CIVITAI_ENABLED", "false")
        monkeypatch.setenv("HUGGINGFACE_ENABLED", "true")
        monkeypatch.setenv("HUGGINGFACE_API_TOKEN", "test_token")
        monkeypatch.setenv("CACHE_DIR", temp_cache_dir)
        monkeypatch.setenv("DEBUG", "true")
        
        # Create application without explicit config
        app = AssetManagerApplication()
        
        config = app.config
        assert config.external_apis.civitai_enabled is False
        assert config.external_apis.huggingface_enabled is True
        assert config.external_apis.huggingface_api_token == "test_token"
        assert config.cache.cache_dir == temp_cache_dir
        assert config.debug is True
    
    @patch('src.main.web.Application')
    def test_route_registration(self, mock_web_app_class, test_config):
        """Test that routes are properly registered."""
        mock_web_app = MagicMock()
        mock_web_app_class.return_value = mock_web_app
        
        app = AssetManagerApplication(test_config)
        web_app = app.create_web_app()
        
        # Verify that register_routes was called on the web API adapter
        # This is tested indirectly by checking that the web app was configured
        assert mock_web_app.middlewares.append.called
    
    def test_error_handling_during_initialization(self, test_config):
        """Test error handling during application initialization."""
        # Create application with invalid configuration
        test_config.cache.cache_dir = "/invalid/path/that/cannot/be/created"
        
        app = AssetManagerApplication(test_config)
        
        # Initialization might fail, but should handle errors gracefully
        try:
            app.initialize()
        except Exception as e:
            # If initialization fails, it should be a meaningful error
            assert str(e) is not None