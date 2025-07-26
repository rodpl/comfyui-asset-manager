"""Domain entities for the local asset management system."""

from .base import (
    Entity,
    ValueObject,
    DomainError,
    ValidationError,
    NotFoundError,
    validate_not_empty,
    validate_positive_number,
    validate_file_path
)
from .model import Model, ModelType
from .folder import Folder
from .external_metadata import (
    ExternalMetadata,
    CivitAIMetadata,
    HuggingFaceMetadata,
    MetadataSource
)

__all__ = [
    # Base classes and utilities
    "Entity",
    "ValueObject",
    "DomainError",
    "ValidationError",
    "NotFoundError",
    "validate_not_empty",
    "validate_positive_number",
    "validate_file_path",
    # Domain entities
    "Model",
    "ModelType",
    "Folder",
    "ExternalMetadata",
    "CivitAIMetadata",
    "HuggingFaceMetadata",
    "MetadataSource"
]