"""Integration tests for ComfyUI integration."""

import pytest
from unittest.mock import MagicMock, patch
from aiohttp import web

from src.main import register_with_comfyui, get_application, reset_application
from src.config import ApplicationConfig, ExternalAPIConfig, CacheConfig


@pytest.fixture
def test_config():
    """Create test configuration."""
    return ApplicationConfig(
        external_apis=ExternalAPIConfig(
            civitai_enabled=False,  # Disable external APIs for testing
            huggingface_enabled=False
        ),
        cache=CacheConfig(
            enabled=False  # Disable cache for testing
        ),
        debug=True,
        log_level="DEBUG"
    )


@pytest.fixture(autouse=True)
def cleanup_globals():
    """Cleanup global instances after each test."""
    yield
    reset_application()


class TestComfyUIIntegration:
    """Test ComfyUI integration functionality."""
    
    def test_register_with_comfyui(self, test_config):
        """Test that the asset manager can be registered with ComfyUI."""
        # Create a mock ComfyUI app
        mock_app = MagicMock(spec=web.Application)
        mock_router = MagicMock()
        mock_app.router = mock_router
        
        # Register with ComfyUI
        register_with_comfyui(mock_app)
        
        # Verify that routes were added
        assert mock_router.add_get.called
        
        # Check that health endpoint was added
        health_calls = [call for call in mock_router.add_get.call_args_list 
                       if '/asset_manager/health' in str(call)]
        assert len(health_calls) > 0
    
    def test_health_endpoint_response(self, test_config):
        """Test that health endpoint returns proper response."""
        # Create application with test config
        app = get_application(test_config)
        app.initialize()
        
        # Get health status
        health_status = app.get_health_status()
        
        # Verify health status structure
        assert "status" in health_status
        assert "initialized" in health_status
        assert "services" in health_status
        
        # Should be healthy when initialized
        assert health_status["status"] == "healthy"
        assert health_status["initialized"] is True
    
    @patch('src.main.logger')
    def test_registration_error_handling(self, mock_logger, test_config):
        """Test error handling during ComfyUI registration."""
        # Create a mock ComfyUI app that raises an error
        mock_app = MagicMock(spec=web.Application)
        mock_app.router.add_get.side_effect = Exception("Test error")
        
        # Registration should raise the error
        with pytest.raises(Exception, match="Test error"):
            register_with_comfyui(mock_app)
        
        # Verify error was logged
        mock_logger.error.assert_called()
    
    def test_application_can_create_standalone_web_app(self, test_config):
        """Test that application can create a standalone web app."""
        app = get_application(test_config)
        
        with patch('src.main.web.Application') as mock_web_app_class:
            mock_web_app = MagicMock()
            mock_web_app_class.return_value = mock_web_app
            
            web_app = app.create_web_app()
            
            # Verify web app was created and configured
            mock_web_app_class.assert_called_once()
            assert web_app is mock_web_app
            
            # Verify middlewares were added
            assert mock_web_app.middlewares.append.called
    
    def test_configuration_from_environment(self, monkeypatch):
        """Test that configuration can be loaded from environment variables."""
        # Set environment variables
        monkeypatch.setenv("CIVITAI_ENABLED", "true")
        monkeypatch.setenv("HUGGINGFACE_ENABLED", "false")
        monkeypatch.setenv("CACHE_ENABLED", "true")
        monkeypatch.setenv("DEBUG", "false")
        monkeypatch.setenv("LOG_LEVEL", "WARNING")
        
        # Create application without explicit config
        app = get_application()
        
        config = app.config
        assert config.external_apis.civitai_enabled is True
        assert config.external_apis.huggingface_enabled is False
        assert config.cache.enabled is True
        assert config.debug is False
        assert config.log_level == "WARNING"