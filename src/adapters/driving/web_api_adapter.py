"""Web API adapter for handling HTTP requests (driving adapter)."""

import json
import inspect
import os
import mimetypes
from typing import Dict, Any, Optional
from aiohttp import web, hdrs
from aiohttp.web_request import Request
from aiohttp.web_response import Response

from ...domain.ports.driving.model_management_port import ModelManagementPort
from ...domain.ports.driving.folder_management_port import FolderManagementPort
from ...domain.ports.driving.output_management_port import OutputManagementPort
from ...domain.ports.driving.external_model_management_port import ExternalModelManagementPort
from ...domain.entities.base import ValidationError, NotFoundError, DomainError
from ...domain.entities.external_model import ExternalPlatform
from ...domain.ports.driven.external_model_port import ExternalAPIError, RateLimitError, PlatformUnavailableError


class WebAPIAdapter:
    """Driving adapter that translates HTTP requests to domain operations.
    
    This adapter implements the REST API endpoints with /asset_manager prefix
    and uses dependency injection to access domain services through their ports.
    """
    
    def __init__(
        self,
        model_management: ModelManagementPort,
        folder_management: FolderManagementPort,
        output_management: Optional[OutputManagementPort] = None,
        external_model_management: Optional[ExternalModelManagementPort] = None,
    ):
        """Initialize the Web API adapter.
        
        Args:
            model_management: Port for model management operations
            folder_management: Port for folder management operations
            output_management: Port for output management operations
            external_model_management: Port for external model management operations
        """
        self._model_management = model_management
        self._folder_management = folder_management
        self._output_management = output_management
        self._external_model_management = external_model_management
    
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
        
        # Metadata management endpoints
        app.router.add_put('/asset_manager/models/{model_id}/metadata', self.update_model_metadata)
        app.router.add_post('/asset_manager/models/bulk-metadata', self.bulk_update_metadata)
        app.router.add_get('/asset_manager/tags', self.get_all_user_tags)
        
        # Output endpoints
        app.router.add_get('/asset_manager/outputs', self.get_outputs)
        app.router.add_get('/asset_manager/outputs/{output_id}', self.get_output_details)
        app.router.add_post('/asset_manager/outputs/refresh', self.refresh_outputs)
        app.router.add_post('/asset_manager/outputs/{output_id}/load-workflow', self.load_workflow)
        app.router.add_post('/asset_manager/outputs/{output_id}/open-system', self.open_system)
        app.router.add_post('/asset_manager/outputs/{output_id}/show-folder', self.show_folder)
        # Static file endpoints for serving output images and thumbnails
        app.router.add_get('/asset_manager/outputs/{output_id}/file', self.get_output_file)
        app.router.add_get('/asset_manager/outputs/{output_id}/thumbnail', self.get_output_thumbnail)
        
        # External model endpoints
        app.router.add_get('/asset_manager/external/models', self.search_external_models)
        app.router.add_get('/asset_manager/external/models/{platform}', self.search_external_models_platform)
        app.router.add_get('/asset_manager/external/models/{platform}/{model_id}', self.get_external_model_details)
        app.router.add_get('/asset_manager/external/popular', self.get_popular_external_models)
        app.router.add_get('/asset_manager/external/recent', self.get_recent_external_models)
        app.router.add_get('/asset_manager/external/platforms', self.get_supported_platforms)
        app.router.add_get('/asset_manager/external/platforms/{platform}/info', self.get_platform_info)
    
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
    
    async def update_model_metadata(self, request: Request) -> Response:
        """Handle PUT /asset_manager/models/{model_id}/metadata endpoint.
        
        Updates user metadata for a specific model.
        
        Args:
            request: The HTTP request with model_id in path and metadata in body
            
        Returns:
            JSON response with updated model
        """
        try:
            model_id = request.match_info['model_id']
            
            # Parse request body
            try:
                metadata = await request.json()
            except json.JSONDecodeError:
                return web.json_response({
                    "success": False,
                    "error": "Invalid JSON in request body",
                    "error_type": "validation_error"
                }, status=400)
            
            updated_model = self._model_management.update_model_metadata(model_id, metadata)
            
            return web.json_response({
                "success": True,
                "data": updated_model.to_dict()
            })
            
        except ValidationError as e:
            return self._handle_validation_error(e)
        except NotFoundError as e:
            return self._handle_not_found_error(e)
        except DomainError as e:
            return self._handle_domain_error(e)
        except Exception as e:
            return self._handle_unexpected_error(e)
    
    async def bulk_update_metadata(self, request: Request) -> Response:
        """Handle POST /asset_manager/models/bulk-metadata endpoint.
        
        Updates metadata for multiple models at once.
        
        Args:
            request: The HTTP request with model_ids and metadata in body
            
        Returns:
            JSON response with updated models
        """
        try:
            # Parse request body
            try:
                body = await request.json()
            except json.JSONDecodeError:
                return web.json_response({
                    "success": False,
                    "error": "Invalid JSON in request body",
                    "error_type": "validation_error"
                }, status=400)
            
            # Validate required fields
            if "model_ids" not in body:
                return web.json_response({
                    "success": False,
                    "error": "Missing required field 'model_ids'",
                    "error_type": "validation_error"
                }, status=400)
            
            if "metadata" not in body:
                return web.json_response({
                    "success": False,
                    "error": "Missing required field 'metadata'",
                    "error_type": "validation_error"
                }, status=400)
            
            model_ids = body["model_ids"]
            metadata = body["metadata"]
            
            updated_models = self._model_management.bulk_update_metadata(model_ids, metadata)
            
            return web.json_response({
                "success": True,
                "data": [model.to_dict() for model in updated_models],
                "count": len(updated_models)
            })
            
        except ValidationError as e:
            return self._handle_validation_error(e)
        except DomainError as e:
            return self._handle_domain_error(e)
        except Exception as e:
            return self._handle_unexpected_error(e)
    
    async def get_all_user_tags(self, request: Request) -> Response:
        """Handle GET /asset_manager/tags endpoint.
        
        Returns all unique user tags for autocomplete functionality.
        
        Args:
            request: The HTTP request
            
        Returns:
            JSON response with list of tags
        """
        try:
            tags = self._model_management.get_all_user_tags()
            
            return web.json_response({
                "success": True,
                "data": tags,
                "count": len(tags)
            })
            
        except DomainError as e:
            return self._handle_domain_error(e)
        except Exception as e:
            return self._handle_unexpected_error(e)
    
    async def get_outputs(self, request: Request) -> Response:
        """Handle GET /asset_manager/outputs endpoint.
        
        Returns a list of all generated outputs with optional filtering.
        
        Query parameters:
        - format: Filter by file format (png, jpg, jpeg, webp)
        - start_date: Filter by start date (ISO format)
        - end_date: Filter by end date (ISO format)
        - sort_by: Sort criteria (date, name, size)
        - ascending: Sort order (true/false, default: false for date, true for others)
        
        Args:
            request: The HTTP request
            
        Returns:
            JSON response with list of outputs
        """
        if self._output_management is None:
            return web.json_response({
                "success": False,
                "error": "Output management service not available",
                "error_type": "service_unavailable"
            }, status=503)
        
        try:
            query_params = request.query
            
            # Get optional filtering parameters
            file_format = query_params.get('format')
            start_date_str = query_params.get('start_date')
            end_date_str = query_params.get('end_date')
            sort_by = query_params.get('sort_by', 'date')
            ascending_str = query_params.get('ascending', 'false' if sort_by == 'date' else 'true')
            ascending = ascending_str.lower() in ('true', '1', 'yes')
            
            # Get outputs based on filters
            if start_date_str and end_date_str:
                from datetime import datetime
                try:
                    start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
                    end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
                    outputs = self._output_management.get_outputs_by_date_range(start_date, end_date)
                except ValueError:
                    return web.json_response({
                        "success": False,
                        "error": "Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)",
                        "error_type": "validation_error"
                    }, status=400)
            elif file_format:
                outputs = self._output_management.get_outputs_by_format(file_format)
            else:
                outputs = self._output_management.get_all_outputs()
            
            # Sort outputs
            sorted_outputs = self._output_management.sort_outputs(outputs, sort_by, ascending)
            
            # Build response payloads with HTTP-accessible URLs for files
            output_data = []
            for output in sorted_outputs:
                dto = output.to_dict()
                dto['file_url'] = f"/asset_manager/outputs/{output.id}/file"
                dto['thumbnail_url'] = f"/asset_manager/outputs/{output.id}/thumbnail"
                output_data.append(dto)
            
            return web.json_response({
                "success": True,
                "data": output_data,
                "count": len(output_data),
                "filters": {
                    "format": file_format,
                    "start_date": start_date_str,
                    "end_date": end_date_str,
                    "sort_by": sort_by,
                    "ascending": ascending
                }
            })
            
        except ValidationError as e:
            return self._handle_validation_error(e)
        except DomainError as e:
            return self._handle_domain_error(e)
        except Exception as e:
            return self._handle_unexpected_error(e)
    
    async def get_output_details(self, request: Request) -> Response:
        """Handle GET /asset_manager/outputs/{output_id} endpoint.
        
        Returns detailed information about a specific output.
        
        Args:
            request: The HTTP request with output_id in path
            
        Returns:
            JSON response with output details
        """
        if self._output_management is None:
            return web.json_response({
                "success": False,
                "error": "Output management service not available",
                "error_type": "service_unavailable"
            }, status=503)
        
        try:
            output_id = request.match_info['output_id']
            output = self._output_management.get_output_details(output_id)
            
            dto = output.to_dict()
            dto['file_url'] = f"/asset_manager/outputs/{output.id}/file"
            dto['thumbnail_url'] = f"/asset_manager/outputs/{output.id}/thumbnail"
            
            return web.json_response({
                "success": True,
                "data": dto
            })
            
        except ValidationError as e:
            return self._handle_validation_error(e)
        except NotFoundError as e:
            return self._handle_not_found_error(e)
        except DomainError as e:
            return self._handle_domain_error(e)
        except Exception as e:
            return self._handle_unexpected_error(e)

    async def get_output_file(self, request: Request) -> Response:
        """Serve the original image file for an output.
        
        Handle GET /asset_manager/outputs/{output_id}/file.
        """
        if self._output_management is None:
            return web.json_response({
                "success": False,
                "error": "Output management service not available",
                "error_type": "service_unavailable"
            }, status=503)

        try:
            output_id = request.match_info['output_id']
            output = self._output_management.get_output_details(output_id)
            file_path = output.file_path

            if not file_path or not os.path.exists(file_path) or not os.path.isfile(file_path):
                return web.json_response({
                    "success": False,
                    "error": "File not found",
                    "error_type": "not_found_error",
                    "entity_type": "OutputFile",
                    "identifier": output_id
                }, status=404)

            # Guess content type based on file extension
            content_type, _ = mimetypes.guess_type(file_path)
            headers = {"Cache-Control": "public, max-age=31536000"}
            if content_type:
                headers["Content-Type"] = content_type
            return web.FileResponse(path=file_path, headers=headers)
        except ValidationError as e:
            return self._handle_validation_error(e)
        except NotFoundError as e:
            return self._handle_not_found_error(e)
        except DomainError as e:
            return self._handle_domain_error(e)
        except Exception as e:
            return self._handle_unexpected_error(e)

    async def get_output_thumbnail(self, request: Request) -> Response:
        """Serve the thumbnail image for an output, generating if necessary.
        
        Handle GET /asset_manager/outputs/{output_id}/thumbnail.
        """
        if self._output_management is None:
            return web.json_response({
                "success": False,
                "error": "Output management service not available",
                "error_type": "service_unavailable"
            }, status=503)

        try:
            output_id = request.match_info['output_id']
            # get_output_details performs enrichment which includes thumbnail generation
            output = self._output_management.get_output_details(output_id)
            thumb_path = output.thumbnail_path

            if not thumb_path or not os.path.exists(thumb_path) or not os.path.isfile(thumb_path):
                return web.json_response({
                    "success": False,
                    "error": "Thumbnail not found",
                    "error_type": "not_found_error",
                    "entity_type": "OutputThumbnail",
                    "identifier": output_id
                }, status=404)

            # Prefer streaming bytes manually to avoid FileResponse edge cases
            try:
                with open(thumb_path, 'rb') as f:
                    data = f.read()
                content_type, _ = mimetypes.guess_type(thumb_path)
                return web.Response(
                    body=data,
                    headers={"Cache-Control": "public, max-age=31536000"},
                    content_type=content_type or 'image/jpeg',
                )
            except OSError:
                # If reading thumbnail fails unexpectedly, return 404 instead of 500
                return web.json_response({
                    "success": False,
                    "error": "Thumbnail not accessible",
                    "error_type": "not_found_error",
                    "entity_type": "OutputThumbnail",
                    "identifier": output_id
                }, status=404)
        except ValidationError as e:
            return self._handle_validation_error(e)
        except NotFoundError as e:
            return self._handle_not_found_error(e)
        except DomainError as e:
            return self._handle_domain_error(e)
        except Exception as e:
            return self._handle_unexpected_error(e)
    
    async def refresh_outputs(self, request: Request) -> Response:
        """Handle POST /asset_manager/outputs/refresh endpoint.
        
        Refreshes the output list by rescanning the output directory.
        
        Args:
            request: The HTTP request
            
        Returns:
            JSON response with refreshed list of outputs
        """
        if self._output_management is None:
            return web.json_response({
                "success": False,
                "error": "Output management service not available",
                "error_type": "service_unavailable"
            }, status=503)
        
        try:
            outputs = self._output_management.refresh_outputs()
            # Match the shape of GET /outputs by including HTTP URLs
            output_data = []
            for output in outputs:
                dto = output.to_dict()
                dto['file_url'] = f"/asset_manager/outputs/{output.id}/file"
                dto['thumbnail_url'] = f"/asset_manager/outputs/{output.id}/thumbnail"
                output_data.append(dto)
            
            return web.json_response({
                "success": True,
                "data": output_data,
                "count": len(output_data),
                "message": "Output directory rescanned successfully"
            })
            
        except ValidationError as e:
            return self._handle_validation_error(e)
        except DomainError as e:
            return self._handle_domain_error(e)
        except Exception as e:
            return self._handle_unexpected_error(e)
    
    async def load_workflow(self, request: Request) -> Response:
        """Handle POST /asset_manager/outputs/{output_id}/load-workflow endpoint.
        
        Loads the workflow from the specified output back into ComfyUI.
        
        Args:
            request: The HTTP request with output_id in path
            
        Returns:
            JSON response indicating success or failure
        """
        if self._output_management is None:
            return web.json_response({
                "success": False,
                "error": "Output management service not available",
                "error_type": "service_unavailable"
            }, status=503)
        
        try:
            output_id = request.match_info['output_id']
            success = self._output_management.load_workflow(output_id)
            
            if success:
                return web.json_response({
                    "success": True,
                    "message": "Workflow loaded successfully"
                })
            else:
                return web.json_response({
                    "success": False,
                    "error": "Failed to load workflow - no workflow metadata found",
                    "error_type": "workflow_not_found"
                }, status=404)
            
        except ValidationError as e:
            return self._handle_validation_error(e)
        except NotFoundError as e:
            return self._handle_not_found_error(e)
        except DomainError as e:
            return self._handle_domain_error(e)
        except Exception as e:
            return self._handle_unexpected_error(e)
    
    async def open_system(self, request: Request) -> Response:
        """Handle POST /asset_manager/outputs/{output_id}/open-system endpoint.
        
        Opens the output file in the system's default image viewer.
        
        Args:
            request: The HTTP request with output_id in path
            
        Returns:
            JSON response indicating success or failure
        """
        if self._output_management is None:
            return web.json_response({
                "success": False,
                "error": "Output management service not available",
                "error_type": "service_unavailable"
            }, status=503)
        
        try:
            output_id = request.match_info['output_id']
            success = self._output_management.open_in_system_viewer(output_id)
            
            if success:
                return web.json_response({
                    "success": True,
                    "message": "File opened in system viewer"
                })
            else:
                return web.json_response({
                    "success": False,
                    "error": "Failed to open file in system viewer",
                    "error_type": "system_operation_failed"
                }, status=500)
            
        except ValidationError as e:
            return self._handle_validation_error(e)
        except NotFoundError as e:
            return self._handle_not_found_error(e)
        except DomainError as e:
            return self._handle_domain_error(e)
        except Exception as e:
            return self._handle_unexpected_error(e)
    
    async def show_folder(self, request: Request) -> Response:
        """Handle POST /asset_manager/outputs/{output_id}/show-folder endpoint.
        
        Opens the containing folder of the output file in the system file explorer.
        
        Args:
            request: The HTTP request with output_id in path
            
        Returns:
            JSON response indicating success or failure
        """
        if self._output_management is None:
            return web.json_response({
                "success": False,
                "error": "Output management service not available",
                "error_type": "service_unavailable"
            }, status=503)
        
        try:
            output_id = request.match_info['output_id']
            success = self._output_management.show_in_folder(output_id)
            
            if success:
                return web.json_response({
                    "success": True,
                    "message": "Folder opened in system explorer"
                })
            else:
                return web.json_response({
                    "success": False,
                    "error": "Failed to open folder in system explorer",
                    "error_type": "system_operation_failed"
                }, status=500)
            
        except ValidationError as e:
            return self._handle_validation_error(e)
        except NotFoundError as e:
            return self._handle_not_found_error(e)
        except DomainError as e:
            return self._handle_domain_error(e)
        except Exception as e:
            return self._handle_unexpected_error(e)    

    # External Model Management Endpoints
    
    async def search_external_models(self, request: Request) -> Response:
        """Handle GET /asset_manager/external/models endpoint.
        
        Search for models across all external platforms.
        
        Args:
            request: The HTTP request with query parameters
            
        Returns:
            JSON response with search results
        """
        if not self._external_model_management:
            return web.json_response({
                "success": False,
                "error": "External model management not available",
                "error_type": "service_unavailable"
            }, status=503)
        
        try:
            # Parse query parameters
            query = request.query.get('query', '')
            limit = int(request.query.get('limit', '20'))
            offset = int(request.query.get('offset', '0'))
            
            # Parse filters
            filters = {}
            if 'model_type' in request.query:
                filters['model_type'] = request.query['model_type']
            if 'sort' in request.query:
                filters['sort'] = request.query['sort']
            if 'comfyui_compatible' in request.query:
                filters['comfyui_compatible'] = request.query['comfyui_compatible'].lower() == 'true'
            
            # Search across all platforms
            result = await self._external_model_management.search_models(
                platform=None,
                query=query,
                limit=limit,
                offset=offset,
                filters=filters
            )
            
            return web.json_response({
                "success": True,
                "data": {
                    "models": [model.to_dict() for model in result["models"]],
                    "total": result["total"],
                    "has_more": result["has_more"],
                    "next_offset": result["next_offset"],
                    "platforms_searched": result["platforms_searched"]
                }
            })
            
        except ValidationError as e:
            return self._handle_validation_error(e)
        except (ExternalAPIError, RateLimitError, PlatformUnavailableError) as e:
            return web.json_response({
                "success": False,
                "error": str(e),
                "error_type": "external_api_error"
            }, status=502)
        except Exception as e:
            return self._handle_unexpected_error(e)
    
    async def search_external_models_platform(self, request: Request) -> Response:
        """Handle GET /asset_manager/external/models/{platform} endpoint.
        
        Search for models on a specific external platform.
        
        Args:
            request: The HTTP request with platform in path and query parameters
            
        Returns:
            JSON response with search results
        """
        if not self._external_model_management:
            return web.json_response({
                "success": False,
                "error": "External model management not available",
                "error_type": "service_unavailable"
            }, status=503)
        
        try:
            # Parse platform
            platform_str = request.match_info['platform'].upper()
            try:
                platform = ExternalPlatform(platform_str.lower())
            except ValueError:
                return web.json_response({
                    "success": False,
                    "error": f"Unsupported platform: {platform_str}",
                    "error_type": "invalid_platform"
                }, status=400)
            
            # Parse query parameters
            query = request.query.get('query', '')
            limit = int(request.query.get('limit', '20'))
            offset = int(request.query.get('offset', '0'))
            
            # Parse filters
            filters = {}
            if 'model_type' in request.query:
                filters['model_type'] = request.query['model_type']
            if 'sort' in request.query:
                filters['sort'] = request.query['sort']
            if 'comfyui_compatible' in request.query:
                filters['comfyui_compatible'] = request.query['comfyui_compatible'].lower() == 'true'
            
            # Search on specific platform
            result = await self._external_model_management.search_models(
                platform=platform,
                query=query,
                limit=limit,
                offset=offset,
                filters=filters
            )
            
            return web.json_response({
                "success": True,
                "data": {
                    "models": [model.to_dict() for model in result["models"]],
                    "total": result["total"],
                    "has_more": result["has_more"],
                    "next_offset": result["next_offset"],
                    "platform": platform.value
                }
            })
            
        except ValidationError as e:
            return self._handle_validation_error(e)
        except (ExternalAPIError, RateLimitError, PlatformUnavailableError) as e:
            return web.json_response({
                "success": False,
                "error": str(e),
                "error_type": "external_api_error"
            }, status=502)
        except Exception as e:
            return self._handle_unexpected_error(e)
    
    async def get_external_model_details(self, request: Request) -> Response:
        """Handle GET /asset_manager/external/models/{platform}/{model_id} endpoint.
        
        Get detailed information about a specific external model.
        
        Args:
            request: The HTTP request with platform and model_id in path
            
        Returns:
            JSON response with model details
        """
        if not self._external_model_management:
            return web.json_response({
                "success": False,
                "error": "External model management not available",
                "error_type": "service_unavailable"
            }, status=503)
        
        try:
            # Parse platform
            platform_str = request.match_info['platform'].upper()
            try:
                platform = ExternalPlatform(platform_str.lower())
            except ValueError:
                return web.json_response({
                    "success": False,
                    "error": f"Unsupported platform: {platform_str}",
                    "error_type": "invalid_platform"
                }, status=400)
            
            model_id = request.match_info['model_id']
            
            # Get model details
            model = await self._external_model_management.get_model_details(platform, model_id)
            
            return web.json_response({
                "success": True,
                "data": model.to_dict()
            })
            
        except ValidationError as e:
            return self._handle_validation_error(e)
        except NotFoundError as e:
            return self._handle_not_found_error(e)
        except (ExternalAPIError, RateLimitError, PlatformUnavailableError) as e:
            return web.json_response({
                "success": False,
                "error": str(e),
                "error_type": "external_api_error"
            }, status=502)
        except Exception as e:
            return self._handle_unexpected_error(e)
    
    async def get_popular_external_models(self, request: Request) -> Response:
        """Handle GET /asset_manager/external/popular endpoint.
        
        Get popular models from external platforms.
        
        Args:
            request: The HTTP request with query parameters
            
        Returns:
            JSON response with popular models
        """
        if not self._external_model_management:
            return web.json_response({
                "success": False,
                "error": "External model management not available",
                "error_type": "service_unavailable"
            }, status=503)
        
        try:
            # Parse query parameters
            limit = int(request.query.get('limit', '20'))
            model_type = request.query.get('model_type')
            
            platform = None
            if 'platform' in request.query:
                platform_str = request.query['platform'].upper()
                try:
                    platform = ExternalPlatform(platform_str.lower())
                except ValueError:
                    return web.json_response({
                        "success": False,
                        "error": f"Unsupported platform: {platform_str}",
                        "error_type": "invalid_platform"
                    }, status=400)
            
            # Get popular models
            models = await self._external_model_management.get_popular_models(
                platform=platform,
                limit=limit,
                model_type=model_type
            )
            
            return web.json_response({
                "success": True,
                "data": {
                    "models": [model.to_dict() for model in models],
                    "count": len(models)
                }
            })
            
        except ValidationError as e:
            return self._handle_validation_error(e)
        except (ExternalAPIError, RateLimitError, PlatformUnavailableError) as e:
            return web.json_response({
                "success": False,
                "error": str(e),
                "error_type": "external_api_error"
            }, status=502)
        except Exception as e:
            return self._handle_unexpected_error(e)
    
    async def get_recent_external_models(self, request: Request) -> Response:
        """Handle GET /asset_manager/external/recent endpoint.
        
        Get recent models from external platforms.
        
        Args:
            request: The HTTP request with query parameters
            
        Returns:
            JSON response with recent models
        """
        if not self._external_model_management:
            return web.json_response({
                "success": False,
                "error": "External model management not available",
                "error_type": "service_unavailable"
            }, status=503)
        
        try:
            # Parse query parameters
            limit = int(request.query.get('limit', '20'))
            model_type = request.query.get('model_type')
            
            platform = None
            if 'platform' in request.query:
                platform_str = request.query['platform'].upper()
                try:
                    platform = ExternalPlatform(platform_str.lower())
                except ValueError:
                    return web.json_response({
                        "success": False,
                        "error": f"Unsupported platform: {platform_str}",
                        "error_type": "invalid_platform"
                    }, status=400)
            
            # Get recent models
            models = await self._external_model_management.get_recent_models(
                platform=platform,
                limit=limit,
                model_type=model_type
            )
            
            return web.json_response({
                "success": True,
                "data": {
                    "models": [model.to_dict() for model in models],
                    "count": len(models)
                }
            })
            
        except ValidationError as e:
            return self._handle_validation_error(e)
        except (ExternalAPIError, RateLimitError, PlatformUnavailableError) as e:
            return web.json_response({
                "success": False,
                "error": str(e),
                "error_type": "external_api_error"
            }, status=502)
        except Exception as e:
            return self._handle_unexpected_error(e)
    
    async def get_supported_platforms(self, request: Request) -> Response:
        """Handle GET /asset_manager/external/platforms endpoint.
        
        Get list of supported external platforms.
        
        Args:
            request: The HTTP request
            
        Returns:
            JSON response with supported platforms
        """
        if not self._external_model_management:
            return web.json_response({
                "success": False,
                "error": "External model management not available",
                "error_type": "service_unavailable"
            }, status=503)
        
        try:
            platforms = self._external_model_management.get_supported_platforms()
            # Support AsyncMock or async implementations by awaiting if needed
            if inspect.isawaitable(platforms):
                platforms = await platforms
            
            return web.json_response({
                "success": True,
                "data": {
                    "platforms": [platform.value for platform in platforms],
                    "count": len(platforms)
                }
            })
            
        except Exception as e:
            return self._handle_unexpected_error(e)
    
    async def get_platform_info(self, request: Request) -> Response:
        """Handle GET /asset_manager/external/platforms/{platform}/info endpoint.
        
        Get information about a specific platform.
        
        Args:
            request: The HTTP request with platform in path
            
        Returns:
            JSON response with platform information
        """
        if not self._external_model_management:
            return web.json_response({
                "success": False,
                "error": "External model management not available",
                "error_type": "service_unavailable"
            }, status=503)
        
        try:
            # Parse platform
            platform_str = request.match_info['platform'].upper()
            try:
                platform = ExternalPlatform(platform_str.lower())
            except ValueError:
                return web.json_response({
                    "success": False,
                    "error": f"Unsupported platform: {platform_str}",
                    "error_type": "invalid_platform"
                }, status=400)
            
            # Get platform info
            info = self._external_model_management.get_platform_info(platform)
            # Support AsyncMock or async implementations by awaiting if needed
            if inspect.isawaitable(info):
                info = await info
            
            return web.json_response({
                "success": True,
                "data": info
            })
            
        except ValidationError as e:
            return self._handle_validation_error(e)
        except Exception as e:
            return self._handle_unexpected_error(e)