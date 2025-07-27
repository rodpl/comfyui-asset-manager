"""Web API adapter for handling HTTP requests (driving adapter)."""

import json
from typing import Dict, Any, Optional
from aiohttp import web, hdrs
from aiohttp.web_request import Request
from aiohttp.web_response import Response

from ...domain.ports.driving.model_management_port import ModelManagementPort
from ...domain.ports.driving.folder_management_port import FolderManagementPort
from ...domain.entities.base import ValidationError, NotFoundError, DomainError


class WebAPIAdapter:
    """Driving adapter that translates HTTP requests to domain operations.
    
    This adapter implements the REST API endpoints with /asset_manager prefix
    and uses dependency injection to access domain services through their ports.
    """
    
    def __init__(
        self,
        model_management: ModelManagementPort,
        folder_management: FolderManagementPort
    ):
        """Initialize the Web API adapter.
        
        Args:
            model_management: Port for model management operations
            folder_management: Port for folder management operations
        """
        self._model_management = model_management
        self._folder_management = folder_management
    
    def register_routes(self, app: web.Application) -> None:
        """Register all API routes with the application.
        
        Args:
            app: The aiohttp application to register routes with
        """
        # Folder endpoints
        app.router.add_get('/asset_manager/folders', self.get_folders)
        app.router.add_get('/asset_manager/folders/{folder_id}/models', self.get_models_in_folder)
        
        # Model endpoints
        app.router.add_get('/asset_manager/models/{model_id}', self.get_model_details)
        
        # Search endpoint
        app.router.add_get('/asset_manager/search', self.search_models)
    
    async def get_folders(self, request: Request) -> Response:
        """Handle GET /asset_manager/folders endpoint.
        
        Returns a list of all available model folders.
        
        Args:
            request: The HTTP request
            
        Returns:
            JSON response with list of folders
        """
        try:
            folders = self._folder_management.get_all_folders()
            folder_data = [folder.to_dict() for folder in folders]
            
            return web.json_response({
                "success": True,
                "data": folder_data,
                "count": len(folder_data)
            })
            
        except DomainError as e:
            return self._handle_domain_error(e)
        except Exception as e:
            return self._handle_unexpected_error(e)
    
    async def get_models_in_folder(self, request: Request) -> Response:
        """Handle GET /asset_manager/folders/{folder_id}/models endpoint.
        
        Returns all models in the specified folder.
        
        Args:
            request: The HTTP request with folder_id in path
            
        Returns:
            JSON response with list of models in the folder
        """
        try:
            folder_id = request.match_info['folder_id']
            models = self._model_management.get_models_in_folder(folder_id)
            model_data = [model.to_dict() for model in models]
            
            return web.json_response({
                "success": True,
                "data": model_data,
                "count": len(model_data),
                "folder_id": folder_id
            })
            
        except ValidationError as e:
            return self._handle_validation_error(e)
        except NotFoundError as e:
            return self._handle_not_found_error(e)
        except DomainError as e:
            return self._handle_domain_error(e)
        except Exception as e:
            return self._handle_unexpected_error(e)
    
    async def get_model_details(self, request: Request) -> Response:
        """Handle GET /asset_manager/models/{model_id} endpoint.
        
        Returns detailed information about a specific model.
        
        Args:
            request: The HTTP request with model_id in path
            
        Returns:
            JSON response with model details
        """
        try:
            model_id = request.match_info['model_id']
            model = self._model_management.get_model_details(model_id)
            
            return web.json_response({
                "success": True,
                "data": model.to_dict()
            })
            
        except ValidationError as e:
            return self._handle_validation_error(e)
        except NotFoundError as e:
            return self._handle_not_found_error(e)
        except DomainError as e:
            return self._handle_domain_error(e)
        except Exception as e:
            return self._handle_unexpected_error(e)
    
    async def search_models(self, request: Request) -> Response:
        """Handle GET /asset_manager/search endpoint.
        
        Searches for models based on query parameters.
        
        Query parameters:
        - q: Search query string (required)
        - folder_id: Optional folder ID to limit search scope
        
        Args:
            request: The HTTP request with query parameters
            
        Returns:
            JSON response with search results
        """
        try:
            query_params = request.query
            
            # Get required query parameter
            query = query_params.get('q')
            if not query:
                return web.json_response({
                    "success": False,
                    "error": "Missing required parameter 'q'",
                    "error_type": "validation_error"
                }, status=400)
            
            # Get optional folder_id parameter
            folder_id = query_params.get('folder_id')
            
            models = self._model_management.search_models(query, folder_id)
            model_data = [model.to_dict() for model in models]
            
            return web.json_response({
                "success": True,
                "data": model_data,
                "count": len(model_data),
                "query": query,
                "folder_id": folder_id
            })
            
        except ValidationError as e:
            return self._handle_validation_error(e)
        except DomainError as e:
            return self._handle_domain_error(e)
        except Exception as e:
            return self._handle_unexpected_error(e)
    
    def _handle_validation_error(self, error: ValidationError) -> Response:
        """Handle validation errors with appropriate HTTP response.
        
        Args:
            error: The validation error
            
        Returns:
            HTTP 400 Bad Request response
        """
        return web.json_response({
            "success": False,
            "error": error.message,
            "error_type": "validation_error",
            "field": error.field
        }, status=400)
    
    def _handle_not_found_error(self, error: NotFoundError) -> Response:
        """Handle not found errors with appropriate HTTP response.
        
        Args:
            error: The not found error
            
        Returns:
            HTTP 404 Not Found response
        """
        return web.json_response({
            "success": False,
            "error": str(error),
            "error_type": "not_found_error",
            "entity_type": error.entity_type,
            "identifier": error.identifier
        }, status=404)
    
    def _handle_domain_error(self, error: DomainError) -> Response:
        """Handle general domain errors with appropriate HTTP response.
        
        Args:
            error: The domain error
            
        Returns:
            HTTP 422 Unprocessable Entity response
        """
        return web.json_response({
            "success": False,
            "error": str(error),
            "error_type": "domain_error"
        }, status=422)
    
    def _handle_unexpected_error(self, error: Exception) -> Response:
        """Handle unexpected errors with appropriate HTTP response.
        
        Args:
            error: The unexpected error
            
        Returns:
            HTTP 500 Internal Server Error response
        """
        return web.json_response({
            "success": False,
            "error": "An unexpected error occurred",
            "error_type": "internal_error"
        }, status=500)