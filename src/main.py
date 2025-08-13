"""Main application module for the asset manager.

This module provides the main entry point for the asset manager application
and handles the wiring of all dependencies using the dependency injection container.
"""

import logging
from typing import Optional
from aiohttp import web

from .container import get_container, reset_container, DIContainer
from .config import ApplicationConfig


logger = logging.getLogger(__name__)


class AssetManagerApplication:
    """Main application class for the asset manager.
    
    This class encapsulates the entire application and provides methods
    for initialization, startup, and shutdown.
    """
    
    def __init__(self, config: Optional[ApplicationConfig] = None):
        """Initialize the asset manager application.
        
        Args:
            config: Optional application configuration
        """
        self._container = get_container(config)
        self._web_app: Optional[web.Application] = None
        self._initialized = False
    
    @property
    def container(self) -> DIContainer:
        """Get the dependency injection container."""
        return self._container
    
    @property
    def config(self) -> ApplicationConfig:
        """Get the application configuration."""
        return self._container.config
    
    def initialize(self) -> None:
        """Initialize the application and all its components."""
        if self._initialized:
            logger.warning("Application already initialized")
            return
        
        logger.info("Initializing asset manager application")
        
        try:
            # Initialize core services to ensure they're properly configured
            folder_service = self._container.get_folder_service()
            model_service = self._container.get_model_service()
            metadata_service = self._container.get_metadata_service()
            output_service = self._container.get_output_service()
            
            logger.info("Core services initialized successfully")
            
            # Initialize web API adapter
            web_api_adapter = self._container.get_web_api_adapter()
            logger.info("Web API adapter initialized successfully")
            
            self._initialized = True
            logger.info("Asset manager application initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize application: {e}")
            raise
    
    def register_routes(self, app: web.Application) -> None:
        """Register API routes with an aiohttp application.
        
        Args:
            app: The aiohttp application to register routes with
        """
        if not self._initialized:
            self.initialize()
        
        logger.info("Registering API routes")
        
        try:
            web_api_adapter = self._container.get_web_api_adapter()
            web_api_adapter.register_routes(app)
            
            logger.info("API routes registered successfully")
            
        except Exception as e:
            logger.error(f"Failed to register routes: {e}")
            raise
    
    def create_web_app(self) -> web.Application:
        """Create and configure a standalone web application.
        
        Returns:
            Configured aiohttp web application
        """
        if not self._initialized:
            self.initialize()
        
        logger.info("Creating standalone web application")
        
        app = web.Application()
        self.register_routes(app)
        
        # Add middleware for error handling and logging
        @web.middleware
        async def error_middleware(request, handler):
            return await self._error_middleware(request, handler)
        
        app.middlewares.append(error_middleware)
        
        if self.config.debug:
            @web.middleware
            async def logging_middleware(request, handler):
                return await self._logging_middleware(request, handler)
            
            app.middlewares.append(logging_middleware)
        
        self._web_app = app
        return app
    
    async def _error_middleware(self, request: web.Request, handler) -> web.Response:
        """Middleware for handling errors and providing consistent error responses."""
        try:
            return await handler(request)
        except web.HTTPException:
            # Re-raise HTTP exceptions (they're handled properly by aiohttp)
            raise
        except Exception as e:
            logger.error(f"Unhandled error in request {request.method} {request.path}: {e}")
            
            # Return a generic error response
            return web.json_response({
                "success": False,
                "error": "An internal server error occurred",
                "error_type": "internal_error"
            }, status=500)
    
    async def _logging_middleware(self, request: web.Request, handler) -> web.Response:
        """Middleware for logging requests in debug mode."""
        start_time = request.loop.time()
        
        try:
            response = await handler(request)
            process_time = request.loop.time() - start_time
            
            logger.debug(
                f"{request.method} {request.path} -> {response.status} "
                f"({process_time:.3f}s)"
            )
            
            return response
        
        except Exception as e:
            process_time = request.loop.time() - start_time
            logger.debug(
                f"{request.method} {request.path} -> ERROR: {e} "
                f"({process_time:.3f}s)"
            )
            raise
    
    def get_health_status(self) -> dict:
        """Get application health status.
        
        Returns:
            Dictionary with health status information
        """
        if not self._initialized:
            return {
                "status": "not_initialized",
                "initialized": False,
                "services": {}
            }
        
        try:
            # Check core services
            folder_service = self._container.get_folder_service()
            model_service = self._container.get_model_service()
            metadata_service = self._container.get_metadata_service()
            output_service = self._container.get_output_service()
            
            # Get cache statistics if caching is enabled
            cache_stats = {}
            cache_adapter = self._container.get_cache_adapter()
            if cache_adapter:
                cache_stats = cache_adapter.get_cache_stats()
            
            return {
                "status": "healthy",
                "initialized": True,
                "services": {
                    "folder_service": "available",
                    "model_service": "available",
                    "metadata_service": "available",
                    "output_service": "available",
                    "civitai_enabled": self.config.external_apis.civitai_enabled,
                    "huggingface_enabled": self.config.external_apis.huggingface_enabled,
                    "cache_enabled": self.config.cache.enabled
                },
                "cache_stats": cache_stats
            }
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                "status": "unhealthy",
                "initialized": True,
                "error": str(e),
                "services": {}
            }
    
    def shutdown(self) -> None:
        """Shutdown the application and cleanup resources."""
        logger.info("Shutting down asset manager application")
        
        try:
            # Cleanup the container
            self._container.cleanup()
            
            # Reset the global container
            reset_container()
            
            self._initialized = False
            logger.info("Asset manager application shutdown completed")
            
        except Exception as e:
            logger.error(f"Error during application shutdown: {e}")


# Global application instance
_app: Optional[AssetManagerApplication] = None


def get_application(config: Optional[ApplicationConfig] = None) -> AssetManagerApplication:
    """Get the global application instance.
    
    Args:
        config: Optional configuration (only used on first call)
        
    Returns:
        Global application instance
    """
    global _app
    
    if _app is None:
        _app = AssetManagerApplication(config)
        logger.info("Created global asset manager application")
    
    return _app


def reset_application() -> None:
    """Reset the global application (mainly for testing)."""
    global _app
    
    if _app:
        _app.shutdown()
    
    _app = None
    logger.info("Reset global asset manager application")


def register_with_comfyui(comfyui_app: web.Application) -> None:
    """Register the asset manager with ComfyUI's web application.
    
    Args:
        comfyui_app: ComfyUI's aiohttp application
    """
    logger.info("Registering asset manager with ComfyUI")
    
    try:
        app = get_application()
        app.register_routes(comfyui_app)
        
        # Add a health check endpoint
        async def health_check(request: web.Request) -> web.Response:
            health_status = app.get_health_status()
            status_code = 200 if health_status["status"] == "healthy" else 503
            return web.json_response(health_status, status=status_code)
        
        comfyui_app.router.add_get('/asset_manager/health', health_check)
        
        logger.info("Asset manager registered with ComfyUI successfully")
        
    except Exception as e:
        logger.error(f"Failed to register asset manager with ComfyUI: {e}")
        raise


if __name__ == "__main__":
    # For standalone testing
    import asyncio
    from aiohttp import web
    
    async def main():
        app_instance = get_application()
        web_app = app_instance.create_web_app()
        
        # Add health check endpoint
        async def health_check(request: web.Request) -> web.Response:
            health_status = app_instance.get_health_status()
            status_code = 200 if health_status["status"] == "healthy" else 503
            return web.json_response(health_status, status=status_code)
        
        web_app.router.add_get('/health', health_check)
        
        runner = web.AppRunner(web_app)
        await runner.setup()
        
        site = web.TCPSite(runner, 'localhost', 8080)
        await site.start()
        
        from src.utils import logger
        logger.info("Asset manager running on http://localhost:8080")
        logger.info("Health check: http://localhost:8080/health")
        logger.info("API endpoints: http://localhost:8080/asset_manager/")
        
        try:
            await asyncio.Future()  # Run forever
        except KeyboardInterrupt:
            from src.utils import logger
            logger.info("Shutting down...")
        finally:
            await runner.cleanup()
            app_instance.shutdown()
    
    asyncio.run(main())