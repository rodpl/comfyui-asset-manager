"""Output management driving port (primary interface)."""

from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import datetime

from ...entities.output import Output


class OutputManagementPort(ABC):
    """Primary port for output management operations.
    
    This port defines what the application can do with outputs.
    It is implemented by domain services and used by driving adapters.
    """
    
    @abstractmethod
    def get_all_outputs(self) -> List[Output]:
        """Get all outputs from the output directory.
        
        Returns:
            List of all outputs found in the output directory
            
        Raises:
            ValidationError: If output directory configuration is invalid
        """
        pass
    
    @abstractmethod
    def get_output_details(self, output_id: str) -> Output:
        """Get detailed information about a specific output.
        
        Args:
            output_id: The ID of the output to get details for
            
        Returns:
            Output with detailed information
            
        Raises:
            ValidationError: If output_id is invalid
            NotFoundError: If output is not found
        """
        pass
    
    @abstractmethod
    def refresh_outputs(self) -> List[Output]:
        """Refresh the output list by rescanning the output directory.
        
        Returns:
            Updated list of all outputs after rescanning
            
        Raises:
            ValidationError: If output directory configuration is invalid
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
            
        Raises:
            ValidationError: If date range is invalid
        """
        pass
    
    @abstractmethod
    def get_outputs_by_format(self, file_format: str) -> List[Output]:
        """Get outputs filtered by file format.
        
        Args:
            file_format: File format to filter by (png, jpg, jpeg, webp)
            
        Returns:
            List of outputs with the specified file format
            
        Raises:
            ValidationError: If file_format is invalid
        """
        pass
    
    @abstractmethod
    def sort_outputs(
        self, 
        outputs: List[Output], 
        sort_by: str, 
        ascending: bool = True
    ) -> List[Output]:
        """Sort outputs by specified criteria.
        
        Args:
            outputs: List of outputs to sort
            sort_by: Sort criteria (date, name, size)
            ascending: Whether to sort in ascending order
            
        Returns:
            Sorted list of outputs
            
        Raises:
            ValidationError: If sort_by is invalid
        """
        pass
    
    @abstractmethod
    def load_workflow(self, output_id: str) -> bool:
        """Load the workflow from the specified output back into ComfyUI.
        
        Args:
            output_id: The ID of the output to load workflow from
            
        Returns:
            True if workflow was loaded successfully, False otherwise
            
        Raises:
            ValidationError: If output_id is invalid
            NotFoundError: If output is not found
        """
        pass
    
    @abstractmethod
    def open_in_system_viewer(self, output_id: str) -> bool:
        """Open the output file in the system's default image viewer.
        
        Args:
            output_id: The ID of the output to open
            
        Returns:
            True if file was opened successfully, False otherwise
            
        Raises:
            ValidationError: If output_id is invalid
            NotFoundError: If output is not found
        """
        pass
    
    @abstractmethod
    def show_in_folder(self, output_id: str) -> bool:
        """Open the containing folder of the output file in the system file explorer.
        
        Args:
            output_id: The ID of the output to show folder for
            
        Returns:
            True if folder was opened successfully, False otherwise
            
        Raises:
            ValidationError: If output_id is invalid
            NotFoundError: If output is not found
        """
        pass