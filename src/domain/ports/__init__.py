"""Domain ports (interfaces) for the hexagonal architecture."""

# Driving ports (primary interfaces)
from .driving.model_management_port import ModelManagementPort
from .driving.folder_management_port import FolderManagementPort

# Driven ports (secondary interfaces)
from .driven.model_repository_port import ModelRepositoryPort
from .driven.folder_repository_port import FolderRepositoryPort
from .driven.external_metadata_port import ExternalMetadataPort
from .driven.cache_port import CachePort

__all__ = [
    # Driving ports
    "ModelManagementPort",
    "FolderManagementPort",
    # Driven ports
    "ModelRepositoryPort",
    "FolderRepositoryPort",
    "ExternalMetadataPort",
    "CachePort"
]