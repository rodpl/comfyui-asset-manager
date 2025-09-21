"""Output service implementing output management operations."""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import threading

from ..ports.driving.output_management_port import OutputManagementPort
from ..ports.driven.output_repository_port import OutputRepositoryPort
from ..entities.output import Output
from ..entities.base import ValidationError, NotFoundError


class OutputService(OutputManagementPort):
    """Domain service implementing output management operations.
    
    This service contains the core business logic for output management
    and implements the OutputManagementPort interface.
    """
    
    def __init__(self, output_repository: OutputRepositoryPort, cache_ttl_seconds: int = 300):
        """Initialize the output service.
        
        Args:
            output_repository: Repository for output data access
            cache_ttl_seconds: Time-to-live for cache entries in seconds (default: 5 minutes)
        """
        self._output_repository = output_repository
        self._cache_ttl = timedelta(seconds=cache_ttl_seconds)
        self._cache: Dict[str, Any] = {}
        self._cache_timestamps: Dict[str, datetime] = {}
        self._cache_lock = threading.RLock()
        self._last_scanned_outputs: Dict[str, Output] = {}
    
    def get_all_outputs(self) -> List[Output]:
        """Get all outputs from the output directory.
        
        Returns:
            List of all outputs found in the output directory
            
        Raises:
            ValidationError: If output directory configuration is invalid
        """
        cache_key = "all_outputs"
        
        # Check cache first
        cached_outputs = self._get_from_cache(cache_key)
        if cached_outputs is not None:
            return cached_outputs
        
        try:
            outputs = self._output_repository.scan_output_directory()

            previous_outputs = self._get_last_scan_snapshot()

            # Enrich outputs with thumbnails and metadata while reusing cached data when possible
            enriched_outputs: List[Output] = []
            for output in outputs:
                cached_output = previous_outputs.get(output.id)
                enriched_outputs.append(self._enrich_output(output, cached_output))

            # Cache the results and refresh the snapshot used for reuse
            self._set_cache(cache_key, enriched_outputs)
            self._update_last_scanned_outputs(enriched_outputs)

            return enriched_outputs
        except IOError as e:
            raise ValidationError(f"Failed to access output directory: {str(e)}", "output_directory")
    
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
        if not output_id or not output_id.strip():
            raise ValidationError("output_id cannot be empty", "output_id")
        
        output = self._output_repository.get_output_by_id(output_id.strip())
        if output is None:
            raise NotFoundError("Output", output_id)
        
        # Enrich with additional metadata and thumbnail
        enriched_output = self._enrich_output(
            output,
            self._get_last_scan_entry(output.id)
        )
        self._merge_into_last_scanned_outputs([enriched_output])
        return enriched_output
    
    def refresh_outputs(self) -> List[Output]:
        """Refresh the output list by rescanning the output directory.
        
        Returns:
            Updated list of all outputs after rescanning
            
        Raises:
            ValidationError: If output directory configuration is invalid
        """
        # Clear cache to force fresh scan
        self._clear_cache()
        
        # Get fresh outputs (will populate cache)
        return self.get_all_outputs()
    
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
        if not isinstance(start_date, datetime):
            raise ValidationError("start_date must be a datetime", "start_date")
        
        if not isinstance(end_date, datetime):
            raise ValidationError("end_date must be a datetime", "end_date")
        
        if start_date > end_date:
            raise ValidationError("start_date cannot be after end_date", "date_range")
        
        cache_key = f"date_range_{start_date.isoformat()}_{end_date.isoformat()}"
        
        # Check cache first
        cached_outputs = self._get_from_cache(cache_key)
        if cached_outputs is not None:
            return cached_outputs
        
        outputs = self._output_repository.get_outputs_by_date_range(start_date, end_date)

        previous_outputs = self._get_last_scan_snapshot()

        # Enrich outputs with thumbnails and metadata
        enriched_outputs: List[Output] = []
        for output in outputs:
            cached_output = previous_outputs.get(output.id)
            enriched_outputs.append(self._enrich_output(output, cached_output))

        # Cache the results and persist reusable snapshot entries
        self._set_cache(cache_key, enriched_outputs)
        self._merge_into_last_scanned_outputs(enriched_outputs)

        return enriched_outputs
    
    def get_outputs_by_format(self, file_format: str) -> List[Output]:
        """Get outputs filtered by file format.
        
        Args:
            file_format: File format to filter by (png, jpg, jpeg, webp)
            
        Returns:
            List of outputs with the specified file format
            
        Raises:
            ValidationError: If file_format is invalid
        """
        if not file_format or not file_format.strip():
            raise ValidationError("file_format cannot be empty", "file_format")
        
        # Validate supported formats
        supported_formats = {'png', 'jpg', 'jpeg', 'webp'}
        normalized_format = file_format.strip().lower()
        
        if normalized_format not in supported_formats:
            raise ValidationError(
                f"file_format must be one of {supported_formats}", 
                "file_format"
            )
        
        cache_key = f"format_{normalized_format}"
        
        # Check cache first
        cached_outputs = self._get_from_cache(cache_key)
        if cached_outputs is not None:
            return cached_outputs
        
        outputs = self._output_repository.get_outputs_by_format(normalized_format)

        previous_outputs = self._get_last_scan_snapshot()

        # Enrich outputs with thumbnails and metadata
        enriched_outputs: List[Output] = []
        for output in outputs:
            cached_output = previous_outputs.get(output.id)
            enriched_outputs.append(self._enrich_output(output, cached_output))

        # Cache the results and persist reusable snapshot entries
        self._set_cache(cache_key, enriched_outputs)
        self._merge_into_last_scanned_outputs(enriched_outputs)

        return enriched_outputs
    
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
        if not isinstance(outputs, list):
            raise ValidationError("outputs must be a list", "outputs")
        
        if not sort_by or not sort_by.strip():
            raise ValidationError("sort_by cannot be empty", "sort_by")
        
        valid_sort_options = {'date', 'name', 'size'}
        normalized_sort_by = sort_by.strip().lower()
        
        if normalized_sort_by not in valid_sort_options:
            raise ValidationError(
                f"sort_by must be one of {valid_sort_options}", 
                "sort_by"
            )
        
        # Define sort key functions
        sort_key_functions = {
            'date': lambda output: output.created_at,
            'name': lambda output: output.filename.lower(),
            'size': lambda output: output.file_size
        }
        
        sort_key = sort_key_functions[normalized_sort_by]
        
        try:
            return sorted(outputs, key=sort_key, reverse=not ascending)
        except Exception as e:
            raise ValidationError(f"Failed to sort outputs: {str(e)}", "sort_operation")
    
    def _enrich_output(self, output: Output, cached_output: Optional[Output] = None) -> Output:
        """Enrich output with thumbnail and workflow metadata.
        
        Args:
            output: The output to enrich
            
        Returns:
            Enriched output with thumbnail and metadata
        """
        try:
            thumbnail_path = output.thumbnail_path
            workflow_metadata = output.workflow_metadata or {}

            if cached_output and self._is_output_unchanged(output, cached_output):
                cached_thumbnail = cached_output.thumbnail_path
                cached_metadata = cached_output.workflow_metadata or {}

                if not thumbnail_path and cached_thumbnail:
                    thumbnail_path = cached_thumbnail
                if not workflow_metadata and cached_metadata:
                    workflow_metadata = cached_metadata.copy()

            if not thumbnail_path:
                generated_thumbnail = self._output_repository.generate_thumbnail(output)
                if generated_thumbnail:
                    thumbnail_path = generated_thumbnail

            if not workflow_metadata:
                extracted_metadata = self._output_repository.extract_workflow_metadata(output)
                if extracted_metadata:
                    workflow_metadata = extracted_metadata

            if (
                thumbnail_path != output.thumbnail_path or
                workflow_metadata != output.workflow_metadata
            ):
                enriched_output = Output(
                    id=output.id,
                    filename=output.filename,
                    file_path=output.file_path,
                    file_size=output.file_size,
                    created_at=output.created_at,
                    modified_at=output.modified_at,
                    image_width=output.image_width,
                    image_height=output.image_height,
                    file_format=output.file_format,
                    thumbnail_path=thumbnail_path,
                    workflow_metadata=workflow_metadata
                )
                return enriched_output

        except Exception:
            pass

        return output
    
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
        if not output_id or not output_id.strip():
            raise ValidationError("output_id cannot be empty", "output_id")
        
        output = self._output_repository.get_output_by_id(output_id.strip())
        if output is None:
            raise NotFoundError("Output", output_id)
        
        try:
            return self._output_repository.load_workflow_to_comfyui(output)
        except Exception:
            # If workflow loading fails, return False rather than raising
            return False
    
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
        if not output_id or not output_id.strip():
            raise ValidationError("output_id cannot be empty", "output_id")
        
        output = self._output_repository.get_output_by_id(output_id.strip())
        if output is None:
            raise NotFoundError("Output", output_id)
        
        try:
            return self._output_repository.open_file_in_system(output)
        except Exception:
            # If system operation fails, return False rather than raising
            return False
    
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
        if not output_id or not output_id.strip():
            raise ValidationError("output_id cannot be empty", "output_id")
        
        output = self._output_repository.get_output_by_id(output_id.strip())
        if output is None:
            raise NotFoundError("Output", output_id)
        
        try:
            return self._output_repository.show_file_in_folder(output)
        except Exception:
            # If system operation fails, return False rather than raising
            return False
    
    def _get_from_cache(self, key: str) -> Optional[List[Output]]:
        """Get data from cache if it exists and is not expired.
        
        Args:
            key: Cache key
            
        Returns:
            Cached data if valid, None otherwise
        """
        with self._cache_lock:
            if key not in self._cache:
                return None
            
            # Check if cache entry has expired
            timestamp = self._cache_timestamps.get(key)
            if timestamp is None:
                return None
            
            if datetime.now() - timestamp > self._cache_ttl:
                # Cache expired, remove it
                del self._cache[key]
                del self._cache_timestamps[key]
                return None
            
            return self._cache[key]

    def _set_cache(self, key: str, data: List[Output]) -> None:
        """Set data in cache with current timestamp.

        Args:
            key: Cache key
            data: Data to cache
        """
        with self._cache_lock:
            self._cache[key] = data
            self._cache_timestamps[key] = datetime.now()

    def _clear_cache(self) -> None:
        """Clear all cached data."""
        with self._cache_lock:
            self._cache.clear()
            self._cache_timestamps.clear()

    def _invalidate_cache_key(self, key: str) -> None:
        """Invalidate a specific cache key.

        Args:
            key: Cache key to invalidate
        """
        with self._cache_lock:
            if key in self._cache:
                del self._cache[key]
            if key in self._cache_timestamps:
                del self._cache_timestamps[key]

    def _get_last_scan_snapshot(self) -> Dict[str, Output]:
        """Create a snapshot of the most recently enriched outputs keyed by ID."""
        with self._cache_lock:
            return dict(self._last_scanned_outputs)

    def _update_last_scanned_outputs(self, outputs: List[Output]) -> None:
        """Replace the cached snapshot with the provided outputs."""
        with self._cache_lock:
            self._last_scanned_outputs = {output.id: output for output in outputs}

    def _merge_into_last_scanned_outputs(self, outputs: List[Output]) -> None:
        """Merge enriched outputs into the cached snapshot without dropping other entries."""
        with self._cache_lock:
            for output in outputs:
                self._last_scanned_outputs[output.id] = output

    def _get_last_scan_entry(self, output_id: str) -> Optional[Output]:
        """Get a previously enriched output by ID if available."""
        with self._cache_lock:
            return self._last_scanned_outputs.get(output_id)

    @staticmethod
    def _is_output_unchanged(output: Output, cached_output: Output) -> bool:
        """Determine if a cached output still matches the latest filesystem info."""
        return (
            output.file_path == cached_output.file_path
            and output.modified_at == cached_output.modified_at
            and output.file_size == cached_output.file_size
        )
