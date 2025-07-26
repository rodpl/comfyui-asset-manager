"""External metadata driven port (secondary interface)."""

from abc import ABC, abstractmethod
from typing import Optional

from ...entities.external_metadata import ExternalMetadata, CivitAIMetadata, HuggingFaceMetadata


class ExternalMetadataPort(ABC):
    """Secondary port for external metadata services.
    
    This port defines what the application needs for external metadata access.
    It is implemented by driven adapters and used by domain services.
    """
    
    @abstractmethod
    def fetch_metadata(self, identifier: str) -> Optional[ExternalMetadata]:
        """Fetch metadata from external source using an identifier.
        
        Args:
            identifier: The identifier to use for metadata lookup
                       (could be model hash, filename, etc.)
            
        Returns:
            External metadata if found, None otherwise
        """
        pass
    
    @abstractmethod
    def fetch_civitai_metadata(self, model_hash: str) -> Optional[CivitAIMetadata]:
        """Fetch metadata specifically from CivitAI.
        
        Args:
            model_hash: The model hash to lookup
            
        Returns:
            CivitAI metadata if found, None otherwise
        """
        pass
    
    @abstractmethod
    def fetch_huggingface_metadata(self, model_name: str) -> Optional[HuggingFaceMetadata]:
        """Fetch metadata specifically from HuggingFace.
        
        Args:
            model_name: The model name to lookup
            
        Returns:
            HuggingFace metadata if found, None otherwise
        """
        pass