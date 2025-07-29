"""Driven ports (secondary interfaces) for the domain layer."""

from .model_repository_port import ModelRepositoryPort
from .folder_repository_port import FolderRepositoryPort
from .external_metadata_port import ExternalMetadataPort
from .cache_port import CachePort
from .output_repository_port import OutputRepositoryPort

__all__ = [
    "ModelRepositoryPort",
    "FolderRepositoryPort", 
    "ExternalMetadataPort",
    "CachePort",
    "OutputRepositoryPort"
]