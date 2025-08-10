"""Tests for ComfyUIOutputAdapter."""

import pytest
import tempfile
import shutil
from pathlib import Path
from unittest.mock import patch, MagicMock
import sys

from src.adapters.driven.comfyui_output_adapter import ComfyUIOutputAdapter


class TestComfyUIOutputAdapter:
    """Test cases for ComfyUIOutputAdapter."""
    
    @pytest.fixture
    def temp_comfyui_dir(self):
        """Create a temporary ComfyUI directory structure for testing."""
        temp_dir = tempfile.mkdtemp()
        comfyui_dir = Path(temp_dir) / "ComfyUI"
        comfyui_dir.mkdir()
        
        # Create ComfyUI indicator files
        (comfyui_dir / "main.py").write_text("# ComfyUI main file")
        (comfyui_dir / "nodes.py").write_text("# ComfyUI nodes")
        (comfyui_dir / "execution.py").write_text("# ComfyUI execution")
        (comfyui_dir / "folder_paths.py").write_text("# ComfyUI folder paths")
        (comfyui_dir / "custom_nodes").mkdir()
        (comfyui_dir / "models").mkdir()
        (comfyui_dir / "output").mkdir()
        
        yield str(comfyui_dir)
        shutil.rmtree(temp_dir)
    
    def test_discover_comfyui_path_with_provided_path(self, temp_comfyui_dir):
        """Test ComfyUI path discovery with explicitly provided path."""
        adapter = ComfyUIOutputAdapter(temp_comfyui_dir)
        assert adapter.comfyui_base_path == temp_comfyui_dir
    
    def test_discover_comfyui_path_auto_detection(self, temp_comfyui_dir):
        """Test ComfyUI path auto-detection from current directory."""
        with patch('pathlib.Path.cwd', return_value=Path(temp_comfyui_dir)):
            adapter = ComfyUIOutputAdapter()
            assert adapter.comfyui_base_path == temp_comfyui_dir
    
    def test_discover_comfyui_path_parent_directory(self, temp_comfyui_dir):
        """Test ComfyUI path discovery from parent directory."""
        # Create a subdirectory
        sub_dir = Path(temp_comfyui_dir) / "subdirectory"
        sub_dir.mkdir()
        
        with patch('pathlib.Path.cwd', return_value=sub_dir):
            adapter = ComfyUIOutputAdapter()
            assert adapter.comfyui_base_path == temp_comfyui_dir
    
    def test_discover_comfyui_path_fallback_to_cwd(self):
        """Test ComfyUI path fallback to current working directory."""
        fake_dir = "/path/that/does/not/exist"
        
        with patch('pathlib.Path.cwd') as mock_cwd:
            mock_cwd.return_value = Path("/current/working/dir")
            adapter = ComfyUIOutputAdapter(fake_dir)
            assert adapter.comfyui_base_path == "/current/working/dir"
    
    def test_is_comfyui_directory_positive(self, temp_comfyui_dir):
        """Test that _is_comfyui_directory correctly identifies ComfyUI directory."""
        adapter = ComfyUIOutputAdapter()
        assert adapter._is_comfyui_directory(Path(temp_comfyui_dir)) is True
    
    def test_is_comfyui_directory_negative(self):
        """Test that _is_comfyui_directory rejects non-ComfyUI directory."""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create a directory with only one indicator file
            test_dir = Path(temp_dir)
            (test_dir / "main.py").write_text("# Some main file")
            
            adapter = ComfyUIOutputAdapter()
            assert adapter._is_comfyui_directory(test_dir) is False
    
    def test_is_comfyui_directory_nonexistent(self):
        """Test that _is_comfyui_directory handles non-existent directory."""
        adapter = ComfyUIOutputAdapter()
        assert adapter._is_comfyui_directory(Path("/nonexistent/path")) is False
    
    def test_get_comfyui_output_directory_default(self, temp_comfyui_dir):
        """Test getting ComfyUI output directory with default fallback."""
        adapter = ComfyUIOutputAdapter(temp_comfyui_dir)
        expected_output_dir = str(Path(temp_comfyui_dir) / "output")
        
        output_dir = adapter._get_comfyui_output_directory()
        assert output_dir == expected_output_dir
    
    @patch('sys.path')
    def test_get_comfyui_output_directory_from_folder_paths(self, mock_sys_path, temp_comfyui_dir):
        """Test getting ComfyUI output directory from folder_paths module."""
        # Mock the folder_paths module
        mock_folder_paths = MagicMock()
        mock_folder_paths.get_output_directory.return_value = "/custom/output/path"
        
        with patch.dict('sys.modules', {'folder_paths': mock_folder_paths}):
            adapter = ComfyUIOutputAdapter(temp_comfyui_dir)
            output_dir = adapter._get_comfyui_output_directory()
            assert output_dir == "/custom/output/path"
    
    @patch('sys.path')
    def test_get_comfyui_output_directory_import_error(self, mock_sys_path, temp_comfyui_dir):
        """Test fallback when folder_paths module cannot be imported."""
        # Simulate import error
        with patch.dict('sys.modules', {'folder_paths': None}):
            adapter = ComfyUIOutputAdapter(temp_comfyui_dir)
            output_dir = adapter._get_comfyui_output_directory()
            
            expected_output_dir = str(Path(temp_comfyui_dir) / "output")
            assert output_dir == expected_output_dir
    
    def test_extract_workflow_metadata_enhanced(self, temp_comfyui_dir):
        """Test that ComfyUI adapter enhances metadata extraction."""
        # Create a test PNG with metadata
        from PIL import Image, PngImagePlugin
        import json
        
        output_dir = Path(temp_comfyui_dir) / "output"
        image_path = output_dir / "test_enhanced.png"
        
        img = Image.new('RGB', (512, 512), color='green')
        pnginfo = PngImagePlugin.PngInfo()
        
        workflow_data = {
            "1": {
                "class_type": "CheckpointLoaderSimple",
                "inputs": {"ckpt_name": "enhanced_model.safetensors"}
            }
        }
        pnginfo.add_text("workflow", json.dumps(workflow_data))
        img.save(image_path, 'PNG', pnginfo=pnginfo)
        
        adapter = ComfyUIOutputAdapter(temp_comfyui_dir)
        outputs = adapter.scan_output_directory()
        
        if outputs:
            output = outputs[0]
            metadata = adapter.extract_workflow_metadata(output)
            
            assert metadata is not None
            assert 'workflow' in metadata
            assert 'workflow_summary' in metadata
            
            # Check workflow summary
            summary = metadata['workflow_summary']
            assert 'node_count' in summary
            assert 'node_types' in summary
            assert summary['node_count'] > 0
            assert 'CheckpointLoaderSimple' in summary['node_types']
    
    def test_create_workflow_summary(self, temp_comfyui_dir):
        """Test workflow summary creation."""
        adapter = ComfyUIOutputAdapter(temp_comfyui_dir)
        
        workflow_data = {
            "1": {"class_type": "CheckpointLoaderSimple"},
            "2": {"class_type": "LoraLoader"},
            "3": {"class_type": "ControlNetLoader"},
            "4": {"class_type": "UpscaleModelLoader"},
            "5": {"class_type": "KSampler"}
        }
        
        summary = adapter._create_workflow_summary(workflow_data)
        
        assert summary['node_count'] == 5
        assert len(summary['node_types']) == 5
        assert summary['has_lora'] is True
        assert summary['has_controlnet'] is True
        assert summary['has_upscaler'] is True
    
    def test_create_workflow_summary_empty(self, temp_comfyui_dir):
        """Test workflow summary creation with empty data."""
        adapter = ComfyUIOutputAdapter(temp_comfyui_dir)
        
        summary = adapter._create_workflow_summary({})
        
        assert summary['node_count'] == 0
        assert summary['node_types'] == []
        assert summary['has_lora'] is False
        assert summary['has_controlnet'] is False
        assert summary['has_upscaler'] is False
    
    def test_extract_model_information(self, temp_comfyui_dir):
        """Test model information extraction from metadata."""
        adapter = ComfyUIOutputAdapter(temp_comfyui_dir)
        
        metadata = {
            'prompt': {
                "1": {
                    "class_type": "CheckpointLoaderSimple",
                    "inputs": {"ckpt_name": "test_checkpoint.safetensors"}
                },
                "2": {
                    "class_type": "LoraLoader",
                    "inputs": {"lora_name": "test_lora.safetensors"}
                },
                "3": {
                    "class_type": "VAELoader",
                    "inputs": {"vae_name": "test_vae.safetensors"}
                }
            }
        }
        
        models = adapter._extract_model_information(metadata)
        
        assert models is not None
        assert len(models) == 3
        
        # Check model types
        model_types = {model['type'] for model in models}
        assert 'checkpoint' in model_types
        assert 'lora' in model_types
        assert 'vae' in model_types
        
        # Check model names
        checkpoint_model = next(m for m in models if m['type'] == 'checkpoint')
        assert checkpoint_model['name'] == 'test_checkpoint.safetensors'
    
    def test_extract_model_information_from_direct_metadata(self, temp_comfyui_dir):
        """Test model information extraction from direct metadata fields."""
        adapter = ComfyUIOutputAdapter(temp_comfyui_dir)
        
        metadata = {
            'model': 'direct_model.safetensors'
        }
        
        models = adapter._extract_model_information(metadata)
        
        assert models is not None
        assert len(models) == 1
        assert models[0]['type'] == 'checkpoint'
        assert models[0]['name'] == 'direct_model.safetensors'
    
    def test_extract_model_information_no_models(self, temp_comfyui_dir):
        """Test model information extraction when no models are found."""
        adapter = ComfyUIOutputAdapter(temp_comfyui_dir)
        
        metadata = {
            'prompt': {
                "1": {
                    "class_type": "KSampler",
                    "inputs": {"seed": 12345}
                }
            }
        }
        
        models = adapter._extract_model_information(metadata)
        assert models is None
    
    def test_get_workflow_for_loading_valid(self, temp_comfyui_dir):
        """Test getting workflow data for loading into ComfyUI."""
        from PIL import Image, PngImagePlugin
        import json
        
        output_dir = Path(temp_comfyui_dir) / "output"
        image_path = output_dir / "test_workflow.png"
        
        img = Image.new('RGB', (512, 512), color='blue')
        pnginfo = PngImagePlugin.PngInfo()
        
        workflow_data = {
            "1": {
                "class_type": "CheckpointLoaderSimple",
                "inputs": {"ckpt_name": "model.safetensors"}
            }
        }
        pnginfo.add_text("workflow", json.dumps(workflow_data))
        img.save(image_path, 'PNG', pnginfo=pnginfo)
        
        adapter = ComfyUIOutputAdapter(temp_comfyui_dir)
        outputs = adapter.scan_output_directory()
        
        if outputs:
            output = outputs[0]
            workflow = adapter.get_workflow_for_loading(output)
            
            assert workflow is not None
            assert "1" in workflow
            assert workflow["1"]["class_type"] == "CheckpointLoaderSimple"
    
    def test_get_workflow_for_loading_no_metadata(self, temp_comfyui_dir):
        """Test getting workflow data when no metadata exists."""
        from PIL import Image
        
        output_dir = Path(temp_comfyui_dir) / "output"
        image_path = output_dir / "test_no_workflow.png"
        
        img = Image.new('RGB', (512, 512), color='red')
        img.save(image_path, 'PNG')
        
        adapter = ComfyUIOutputAdapter(temp_comfyui_dir)
        outputs = adapter.scan_output_directory()
        
        if outputs:
            output = outputs[0]
            workflow = adapter.get_workflow_for_loading(output)
            assert workflow is None
    
    def test_get_comfyui_version_from_pyproject(self, temp_comfyui_dir):
        """Test getting ComfyUI version from pyproject.toml."""
        pyproject_path = Path(temp_comfyui_dir) / "pyproject.toml"
        pyproject_content = '''
[tool.poetry]
name = "comfyui"
version = "1.2.3"
description = "ComfyUI"
'''
        pyproject_path.write_text(pyproject_content)
        
        adapter = ComfyUIOutputAdapter(temp_comfyui_dir)
        version = adapter._get_comfyui_version()
        
        assert version == "1.2.3"
    
    def test_get_comfyui_version_no_version_file(self, temp_comfyui_dir):
        """Test getting ComfyUI version when no version file exists."""
        adapter = ComfyUIOutputAdapter(temp_comfyui_dir)
        version = adapter._get_comfyui_version()
        
        assert version is None
    
    def test_inheritance_from_filesystem_adapter(self, temp_comfyui_dir):
        """Test that ComfyUIOutputAdapter inherits from FilesystemOutputAdapter."""
        from src.adapters.driven.filesystem_output_adapter import FilesystemOutputAdapter
        
        adapter = ComfyUIOutputAdapter(temp_comfyui_dir)
        assert isinstance(adapter, FilesystemOutputAdapter)
        
        # Test that basic functionality works
        outputs = adapter.scan_output_directory()
        assert isinstance(outputs, list)