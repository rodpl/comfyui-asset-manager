"""Filesystem output adapter for scanning and managing output files."""

import os
import json
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime
from PIL import Image, PngImagePlugin
import hashlib

from ...domain.ports.driven.output_repository_port import OutputRepositoryPort
from ...domain.entities.output import Output


class FilesystemOutputAdapter(OutputRepositoryPort):
    """Filesystem implementation of output repository.
    
    This adapter handles scanning the filesystem for output images,
    extracting metadata, and generating thumbnails.
    """
    
    def __init__(self, output_directory: str, thumbnail_directory: Optional[str] = None):
        """Initialize the filesystem output adapter.
        
        Args:
            output_directory: Path to the ComfyUI output directory
            thumbnail_directory: Path to store thumbnails (optional)
        """
        self.output_directory = Path(output_directory)
        self.thumbnail_directory = Path(thumbnail_directory) if thumbnail_directory else self.output_directory / "thumbnails"
        self.supported_extensions = {'.png', '.jpg', '.jpeg', '.webp'}
        
        # Ensure directories exist
        self.output_directory.mkdir(parents=True, exist_ok=True)
        self.thumbnail_directory.mkdir(parents=True, exist_ok=True)
    
    def scan_output_directory(self) -> List[Output]:
        """Scan the output directory for generated images.
        
        Returns:
            List of outputs found in the output directory
            
        Raises:
            IOError: If output directory cannot be accessed
        """
        if not self.output_directory.exists():
            raise IOError(f"Output directory does not exist: {self.output_directory}")
        
        if not self.output_directory.is_dir():
            raise IOError(f"Output path is not a directory: {self.output_directory}")
        
        outputs = []
        
        try:
            # Recursively scan for image files
            for file_path in self.output_directory.rglob("*"):
                if file_path.is_file() and file_path.suffix.lower() in self.supported_extensions:
                    try:
                        output = self._create_output_from_file(file_path)
                        if output:
                            outputs.append(output)
                    except Exception as e:
                        # Log error but continue processing other files
                        print(f"Warning: Failed to process file {file_path}: {e}")
                        continue
        
        except Exception as e:
            raise IOError(f"Failed to scan output directory: {e}")
        
        return outputs
    
    def get_output_by_id(self, output_id: str) -> Optional[Output]:
        """Get a specific output by its ID.
        
        Args:
            output_id: The ID of the output to retrieve
            
        Returns:
            The output if found, None otherwise
        """
        # Since we're using file path hash as ID, we need to scan and find matching ID
        outputs = self.scan_output_directory()
        for output in outputs:
            if output.id == output_id:
                return output
        return None
    
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
        all_outputs = self.scan_output_directory()
        filtered_outputs = []
        
        for output in all_outputs:
            if start_date <= output.created_at <= end_date:
                filtered_outputs.append(output)
        
        return filtered_outputs
    
    def get_outputs_by_format(self, file_format: str) -> List[Output]:
        """Get outputs filtered by file format.
        
        Args:
            file_format: File format to filter by (png, jpg, jpeg, webp)
            
        Returns:
            List of outputs with the specified file format
        """
        all_outputs = self.scan_output_directory()
        filtered_outputs = []
        
        normalized_format = file_format.lower()
        for output in all_outputs:
            if output.file_format.lower() == normalized_format:
                filtered_outputs.append(output)
        
        return filtered_outputs
    
    def generate_thumbnail(self, output: Output) -> Optional[str]:
        """Generate a thumbnail for the given output.
        
        Args:
            output: The output to generate a thumbnail for
            
        Returns:
            Path to the generated thumbnail, or None if generation failed
        """
        try:
            source_path = Path(output.file_path)
            if not source_path.exists():
                return None
            
            # Generate thumbnail filename based on original file
            thumbnail_name = f"{source_path.stem}_thumb.jpg"
            thumbnail_path = self.thumbnail_directory / thumbnail_name
            
            # Skip if thumbnail already exists and is newer than source
            if (thumbnail_path.exists() and 
                thumbnail_path.stat().st_mtime > source_path.stat().st_mtime):
                return str(thumbnail_path)
            
            # Generate thumbnail
            with Image.open(source_path) as img:
                # Convert to RGB if necessary (for PNG with transparency)
                if img.mode in ('RGBA', 'LA', 'P'):
                    rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    rgb_img.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                    img = rgb_img
                
                # Calculate thumbnail size (max 256x256, maintain aspect ratio)
                img.thumbnail((256, 256), Image.Resampling.LANCZOS)
                
                # Save thumbnail
                img.save(thumbnail_path, 'JPEG', quality=85, optimize=True)
                
                return str(thumbnail_path)
        
        except Exception as e:
            print(f"Warning: Failed to generate thumbnail for {output.file_path}: {e}")
            return None
    
    def extract_workflow_metadata(self, output: Output) -> Optional[Dict[str, Any]]:
        """Extract workflow metadata from the output file.
        
        Args:
            output: The output to extract metadata from
            
        Returns:
            Dictionary containing workflow metadata, or None if extraction failed
        """
        try:
            file_path = Path(output.file_path)
            if not file_path.exists() or file_path.suffix.lower() != '.png':
                return None
            
            # Extract PNG metadata
            with Image.open(file_path) as img:
                if not isinstance(img, PngImagePlugin.PngImageFile):
                    return None
                
                metadata = {}
                
                # Extract ComfyUI workflow metadata
                if 'workflow' in img.text:
                    try:
                        workflow_data = json.loads(img.text['workflow'])
                        metadata['workflow'] = workflow_data
                    except json.JSONDecodeError:
                        pass
                
                # Extract prompt metadata
                if 'prompt' in img.text:
                    try:
                        prompt_data = json.loads(img.text['prompt'])
                        metadata['prompt'] = prompt_data
                        
                        # Extract common parameters from prompt
                        self._extract_generation_parameters(prompt_data, metadata)
                    except json.JSONDecodeError:
                        pass
                
                # Extract other ComfyUI metadata
                for key in ['parameters', 'model', 'seed', 'steps', 'cfg', 'sampler', 'scheduler']:
                    if key in img.text:
                        metadata[key] = img.text[key]
                
                return metadata if metadata else None
        
        except Exception as e:
            print(f"Warning: Failed to extract metadata from {output.file_path}: {e}")
            return None
    
    def _create_output_from_file(self, file_path: Path) -> Optional[Output]:
        """Create an Output entity from a file path.
        
        Args:
            file_path: Path to the image file
            
        Returns:
            Output entity or None if creation failed
        """
        try:
            # Get file stats
            stat = file_path.stat()
            created_at = datetime.fromtimestamp(stat.st_ctime)
            modified_at = datetime.fromtimestamp(stat.st_mtime)
            file_size = stat.st_size
            
            # Get image dimensions
            with Image.open(file_path) as img:
                width, height = img.size
                file_format = img.format.lower() if img.format else file_path.suffix[1:].lower()
            
            # Generate unique ID based on file path
            output_id = self._generate_output_id(str(file_path))
            
            return Output(
                id=output_id,
                filename=file_path.name,
                file_path=str(file_path),
                file_size=file_size,
                created_at=created_at,
                modified_at=modified_at,
                image_width=width,
                image_height=height,
                file_format=file_format
            )
        
        except Exception as e:
            print(f"Warning: Failed to create output from file {file_path}: {e}")
            return None
    
    def _generate_output_id(self, file_path: str) -> str:
        """Generate a unique ID for an output based on its file path.
        
        Args:
            file_path: The file path to generate ID from
            
        Returns:
            Unique ID string
        """
        # Use SHA-256 hash of file path for consistent, unique IDs
        return hashlib.sha256(file_path.encode('utf-8')).hexdigest()[:16]
    
    def _extract_generation_parameters(self, prompt_data: Dict[str, Any], metadata: Dict[str, Any]) -> None:
        """Extract common generation parameters from prompt data.
        
        Args:
            prompt_data: The prompt data dictionary
            metadata: The metadata dictionary to update
        """
        try:
            # Look for common ComfyUI node types and extract parameters
            for node_id, node_data in prompt_data.items():
                if not isinstance(node_data, dict):
                    continue
                
                class_type = node_data.get('class_type', '')
                inputs = node_data.get('inputs', {})
                
                # Extract checkpoint/model information
                if class_type in ['CheckpointLoaderSimple', 'CheckpointLoader']:
                    if 'ckpt_name' in inputs:
                        metadata['model'] = inputs['ckpt_name']
                
                # Extract sampling parameters
                elif class_type in ['KSampler', 'KSamplerAdvanced']:
                    if 'seed' in inputs:
                        metadata['seed'] = inputs['seed']
                    if 'steps' in inputs:
                        metadata['steps'] = inputs['steps']
                    if 'cfg' in inputs:
                        metadata['cfg_scale'] = inputs['cfg']
                    if 'sampler_name' in inputs:
                        metadata['sampler'] = inputs['sampler_name']
                    if 'scheduler' in inputs:
                        metadata['scheduler'] = inputs['scheduler']
                
                # Extract prompt text
                elif class_type in ['CLIPTextEncode']:
                    if 'text' in inputs:
                        if 'positive_prompt' not in metadata:
                            metadata['positive_prompt'] = inputs['text']
                        elif 'negative_prompt' not in metadata:
                            metadata['negative_prompt'] = inputs['text']
        
        except Exception:
            # Ignore errors in parameter extraction
            pass