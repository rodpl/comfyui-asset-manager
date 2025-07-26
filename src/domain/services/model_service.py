"""Model service implementing model management operations."""

from typing import List, Optional

from ..ports.driving.model_management_port import ModelManagementPort
from ..ports.driven.model_repository_port import ModelRepositoryPort
from ..ports.driven.external_metadata_port import ExternalMetadataPort
from ..entities.model import Model
from ..entities.base import ValidationError, NotFoundError


class ModelService(ModelManagementPort):
    """Domain service implementing model management operations.
    
    This service contains the core business logic for model management
    and implements the ModelManagementPort interface.
    """
    
    def __init__(
        self,
        model_repository: ModelRepositoryPort,
        external_metadata_port: Optional[ExternalMetadataPort] = None
    ):
        """Initialize the model service.
        
        Args:
            model_repository: Repository for model data access
            external_metadata_port: Optional port for external metadata enrichment
        """
        self._model_repository = model_repository
        self._external_metadata_port = external_metadata_port
    
    def get_models_in_folder(self, folder_id: str) -> List[Model]:
        """Get all models in a specific folder.
        
        Args:
            folder_id: The ID of the folder to get models from
            
        Returns:
            List of models in the folder
            
        Raises:
            ValidationError: If folder_id is invalid
        """
        if not folder_id or not folder_id.strip():
            raise ValidationError("folder_id cannot be empty", "folder_id")
        
        return self._model_repository.find_all_in_folder(folder_id.strip())
    
    def get_model_details(self, model_id: str) -> Model:
        """Get detailed information about a specific model.
        
        Args:
            model_id: The ID of the model to get details for
            
        Returns:
            Model with detailed information
            
        Raises:
            ValidationError: If model_id is invalid
            NotFoundError: If model is not found
        """
        if not model_id or not model_id.strip():
            raise ValidationError("model_id cannot be empty", "model_id")
        
        model = self._model_repository.find_by_id(model_id.strip())
        if model is None:
            raise NotFoundError("Model", model_id)
        
        # Try to enrich with external metadata if available
        if self._external_metadata_port:
            try:
                enriched_model = self.enrich_model_metadata(model)
                return enriched_model
            except Exception:
                # If enrichment fails, return the original model
                # This ensures graceful fallback
                pass
        
        return model
    
    def search_models(self, query: str, folder_id: Optional[str] = None) -> List[Model]:
        """Search for models based on query and optional folder filter.
        
        Args:
            query: Search query string
            folder_id: Optional folder ID to limit search scope
            
        Returns:
            List of models matching the search criteria
            
        Raises:
            ValidationError: If query is invalid
        """
        if not query or not query.strip():
            raise ValidationError("query cannot be empty", "query")
        
        # Validate folder_id if provided
        if folder_id is not None and (not folder_id or not folder_id.strip()):
            raise ValidationError("folder_id cannot be empty when provided", "folder_id")
        
        cleaned_query = query.strip()
        cleaned_folder_id = folder_id.strip() if folder_id else None
        
        return self._model_repository.search(cleaned_query, cleaned_folder_id)
    
    def enrich_model_metadata(self, model: Model) -> Model:
        """Enrich model with external metadata.
        
        Args:
            model: The model to enrich with external metadata
            
        Returns:
            Model with enriched metadata
            
        Raises:
            ValidationError: If model is invalid
        """
        if model is None:
            raise ValidationError("model cannot be None", "model")
        
        # If no external metadata port is available, return original model
        if self._external_metadata_port is None:
            return model
        
        try:
            # Try to fetch external metadata using model hash
            external_metadata = self._external_metadata_port.fetch_metadata(model.hash)
            
            if external_metadata:
                # Create a copy of the model with enriched metadata
                enriched_user_metadata = model.user_metadata.copy()
                
                # Add external metadata to user_metadata
                enriched_user_metadata["external_metadata"] = external_metadata.to_dict()
                
                # If external metadata has tags, merge them with existing user tags
                external_tags = external_metadata.get_all_tags()
                if external_tags:
                    existing_tags = enriched_user_metadata.get("tags", [])
                    all_tags = list(set(existing_tags + external_tags))
                    enriched_user_metadata["tags"] = all_tags
                
                # If external metadata has a description and model doesn't have one, use it
                if not enriched_user_metadata.get("description"):
                    external_description = external_metadata.get_primary_description()
                    if external_description:
                        enriched_user_metadata["description"] = external_description
                
                # Create new model instance with enriched metadata
                enriched_model = Model(
                    id=model.id,
                    name=model.name,
                    file_path=model.file_path,
                    file_size=model.file_size,
                    created_at=model.created_at,
                    modified_at=model.modified_at,
                    model_type=model.model_type,
                    hash=model.hash,
                    folder_id=model.folder_id,
                    thumbnail_path=model.thumbnail_path,
                    user_metadata=enriched_user_metadata
                )
                
                return enriched_model
            
        except Exception:
            # If external metadata fetching fails, gracefully fall back
            # to returning the original model without enrichment
            pass
        
        return model