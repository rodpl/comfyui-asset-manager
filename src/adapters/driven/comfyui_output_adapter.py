"""ComfyUI-specific output adapter for output directory discovery and workflow integration."""

import os
import sys
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime

from .filesystem_output_adapter import FilesystemOutputAdapter
from ...domain.entities.output import Output


class ComfyUIOutputAdapter(FilesystemOutputAdapter):
    """ComfyUI-specific implementation of output repository.
    
    This adapter extends FilesystemOutputAdapter with ComfyUI-specific
    functionality like automatic output directory discovery and enhanced
    workflow metadata extraction.
    """
    
    def __init__(self, comfyui_base_path: Optional[str] = None):
        """Initialize the ComfyUI output adapter.
        
        Args:
            comfyui_base_path: Path to ComfyUI installation (optional, will auto-detect)
        """
        self.comfyui_base_path = self._discover_comfyui_path(comfyui_base_path)
        output_directory = self._get_comfyui_output_directory()
        thumbnail_directory = str(Path(output_directory) / "thumbnails")
        
        super().__init__(output_directory, thumbnail_directory)
    
    def _discover_comfyui_path(self, provided_path: Optional[str] = None) -> str:
        """Discover the ComfyUI installation path.
        
        Args:
            provided_path: Explicitly provided ComfyUI path
            
        Returns:
            Path to ComfyUI installation
        """
        if provided_path and Path(provided_path).exists():
            # Preserve the original provided path format to match expectations in tests
            return str(Path(provided_path))
        
        # Try to detect ComfyUI path from current working directory
        cwd = Path.cwd()
        
        # Check if we're already in a ComfyUI directory
        if self._is_comfyui_directory(cwd):
            return str(cwd)
        
        # Check parent directories
        for parent in cwd.parents:
            if self._is_comfyui_directory(parent):
                return str(parent)
        
        # Check common ComfyUI installation locations
        common_paths = [
            Path.home() / "ComfyUI",
            Path("/opt/ComfyUI"),
            Path("C:/ComfyUI") if sys.platform == "win32" else None,
            cwd / "ComfyUI"
        ]
        
        for path in common_paths:
            if path and path.exists() and self._is_comfyui_directory(path):
                return str(path)
        
        # Fallback to current directory
        return str(cwd)
    
    def _is_comfyui_directory(self, path: Path) -> bool:
        """Check if a directory appears to be a ComfyUI installation.
        
        Args:
            path: Path to check
            
        Returns:
            True if the path appears to be a ComfyUI directory
        """
        if not path.is_dir():
            return False
        
        # Look for characteristic ComfyUI files/directories
        comfyui_indicators = [
            "main.py",
            "nodes.py",
            "execution.py",
            "server.py",
            "folder_paths.py",
            "custom_nodes",
            "models",
            "output"
        ]
        
        found_indicators = 0
        for indicator in comfyui_indicators:
            if (path / indicator).exists():
                found_indicators += 1
        
        # Consider it a ComfyUI directory if we find at least 3 indicators
        return found_indicators >= 3
    
    def _get_comfyui_output_directory(self) -> str:
        """Get the ComfyUI output directory path.
        
        Returns:
            Path to ComfyUI output directory
        """
        # Try to import ComfyUI's folder_paths module to get the configured output directory
        try:
            # Add ComfyUI path to sys.path temporarily
            comfyui_path = Path(self.comfyui_base_path)
            if str(comfyui_path) not in sys.path:
                sys.path.insert(0, str(comfyui_path))
            
            # Try to import folder_paths
            import folder_paths
            
            # Get output directory from ComfyUI configuration
            output_folders = folder_paths.get_output_directory()
            if output_folders:
                return output_folders
        
        except (ImportError, AttributeError, Exception):
            # If we can't import or get the output directory, fall back to default
            pass
        
        # Fallback to default output directory
        default_output = Path(self.comfyui_base_path) / "output"
        return str(default_output)
    
    def extract_workflow_metadata(self, output: Output) -> Optional[Dict[str, Any]]:
        """Extract ComfyUI workflow metadata from the output file.
        
        This method extends the base implementation with ComfyUI-specific
        metadata extraction and enhancement.
        
        Args:
            output: The output to extract metadata from
            
        Returns:
            Dictionary containing enhanced workflow metadata, or None if extraction failed
        """
        # Get base metadata from parent class
        metadata = super().extract_workflow_metadata(output)
        
        if not metadata:
            return None
        
        # Enhance metadata with ComfyUI-specific processing
        enhanced_metadata = metadata.copy()
        
        # Add ComfyUI version information if available
        try:
            enhanced_metadata['comfyui_version'] = self._get_comfyui_version()
        except Exception:
            pass
        
        # Process workflow data for better usability
        if 'workflow' in enhanced_metadata:
            try:
                workflow_data = enhanced_metadata['workflow']
                enhanced_metadata['workflow_summary'] = self._create_workflow_summary(workflow_data)
            except Exception:
                pass
        
        # Extract model information from various sources
        model_info = self._extract_model_information(enhanced_metadata)
        if model_info:
            enhanced_metadata['models_used'] = model_info
        
        return enhanced_metadata
    
    def _get_comfyui_version(self) -> Optional[str]:
        """Get the ComfyUI version if available.
        
        Returns:
            ComfyUI version string or None
        """
        try:
            # Try to read version from various sources
            version_files = [
                Path(self.comfyui_base_path) / "pyproject.toml",
                Path(self.comfyui_base_path) / "setup.py",
                Path(self.comfyui_base_path) / "VERSION"
            ]
            
            for version_file in version_files:
                if version_file.exists():
                    content = version_file.read_text(encoding='utf-8')
                    # Simple version extraction (could be enhanced)
                    if 'version' in content.lower():
                        # This is a simplified version extraction
                        # In practice, you might want to use proper parsing
                        lines = content.split('\n')
                        for line in lines:
                            if 'version' in line.lower() and '=' in line:
                                version = line.split('=')[-1].strip().strip('"\'')
                                if version:
                                    return version
        
        except Exception:
            pass
        
        return None
    
    def _create_workflow_summary(self, workflow_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a summary of the workflow for easier consumption.
        
        Args:
            workflow_data: Raw workflow data
            
        Returns:
            Workflow summary dictionary
        """
        summary = {
            'node_count': 0,
            'node_types': [],
            'has_controlnet': False,
            'has_lora': False,
            'has_upscaler': False
        }
        
        try:
            if isinstance(workflow_data, dict):
                # Count nodes and analyze types
                node_types = set()
                
                for node_id, node_data in workflow_data.items():
                    if isinstance(node_data, dict) and 'class_type' in node_data:
                        summary['node_count'] += 1
                        class_type = node_data['class_type']
                        node_types.add(class_type)
                        
                        # Check for specific node types
                        if 'controlnet' in class_type.lower():
                            summary['has_controlnet'] = True
                        elif 'lora' in class_type.lower():
                            summary['has_lora'] = True
                        elif 'upscal' in class_type.lower():
                            summary['has_upscaler'] = True
                
                summary['node_types'] = sorted(list(node_types))
        
        except Exception:
            pass
        
        return summary
    
    def _extract_model_information(self, metadata: Dict[str, Any]) -> Optional[List[Dict[str, str]]]:
        """Extract information about models used in the generation.
        
        Args:
            metadata: Metadata dictionary
            
        Returns:
            List of model information dictionaries
        """
        models = []
        
        try:
            # Extract from prompt data
            if 'prompt' in metadata:
                prompt_data = metadata['prompt']
                if isinstance(prompt_data, dict):
                    for node_id, node_data in prompt_data.items():
                        if isinstance(node_data, dict):
                            class_type = node_data.get('class_type', '')
                            inputs = node_data.get('inputs', {})
                            
                            # Extract different types of models
                            model_mappings = {
                                'CheckpointLoaderSimple': ('checkpoint', 'ckpt_name'),
                                'CheckpointLoader': ('checkpoint', 'ckpt_name'),
                                'LoraLoader': ('lora', 'lora_name'),
                                'VAELoader': ('vae', 'vae_name'),
                                'ControlNetLoader': ('controlnet', 'control_net_name'),
                                'UpscaleModelLoader': ('upscaler', 'model_name')
                            }
                            
                            if class_type in model_mappings:
                                model_type, input_key = model_mappings[class_type]
                                if input_key in inputs:
                                    models.append({
                                        'type': model_type,
                                        'name': inputs[input_key],
                                        'node_id': node_id
                                    })
            
            # Also check direct metadata fields
            if 'model' in metadata:
                models.append({
                    'type': 'checkpoint',
                    'name': metadata['model'],
                    'node_id': 'unknown'
                })
        
        except Exception:
            pass
        
        return models if models else None
    
    def get_workflow_for_loading(self, output: Output) -> Optional[Dict[str, Any]]:
        """Get workflow data formatted for loading back into ComfyUI.
        
        Args:
            output: The output to get workflow for
            
        Returns:
            Workflow data ready for ComfyUI loading, or None if not available
        """
        metadata = self.extract_workflow_metadata(output)
        if not metadata or 'workflow' not in metadata:
            return None
        
        try:
            workflow_data = metadata['workflow']
            
            # Validate that the workflow data is in the correct format
            if isinstance(workflow_data, dict):
                # Basic validation - check if it has the expected structure
                has_nodes = any(
                    isinstance(v, dict) and 'class_type' in v 
                    for v in workflow_data.values()
                )
                
                if has_nodes:
                    return workflow_data
        
        except Exception:
            pass
        
        return None