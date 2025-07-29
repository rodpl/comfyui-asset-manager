"""Output repository driven port (secondary interface)."""

from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import datetime

from ...entities.output import Output


class OutputRepositoryPort(ABC):
    """Secondary port for output data access.
    
    This port defines what the application needs for output persistence and scanning.
    It is implemented by driven adapters and used by domain services.
    """
    
    @abstractmethod
    def scan_output_directory(self) -> List[Output]:
        """Scan the ComfyUI output directory for generated images.
        
        Returns:
            List of outputs found in the output directory
            
        Raises:
            IOError: If output directory cannot be accessed
        """
        pass
    
    @abstractmethod
    def get_output_by_id(self, output_id: str) -> Optional[Output]:
        """Get a specific output by its ID.
        
        Args:
            output_id: The ID of the output to retrieve
            
        Returns:
            The output if found, None otherwise
        """
        pass
    
    @abstractmethod
    def get_outputs_by_date_range(
        self, 
        start_date: datetime, 
        end_date: datetime
    ) -> List[Output]:
        """Get outputs created within a specific date range.
        
        Args:
            start_date: Start of the date range (inclusive)
            end_date: End of the date range (inclusive)
            
        Returns:
            List of outputs created within the specified date range
        """
        pass
    
    @abstractmethod
    def get_outputs_by_format(self, file_format: str) -> List[Output]:
        """Get outputs filtered by file format.
        
        Args:
            file_format: File format to filter by (png, jpg, jpeg, webp)
            
        Returns:
            List of outputs with the specified file format
        """
        pass
    
    @abstractmethod
    def generate_thumbnail(self, output: Output) -> Optional[str]:
        """Generate a thumbnail for the given output.
        
        Args:
            output: The output to generate a thumbnail for
            
        Returns:
            Path to the generated thumbnail, or None if generation failed
        """
        pass
    
    @abstractmethod
    def extract_workflow_metadata(self, output: Output) -> Optional[dict]:
        """Extract workflow metadata from the output file.
        
        Args:
            output: The output to extract metadata from
            
        Returns:
            Dictionary containing workflow metadata, or None if extraction failed
        """
        pass