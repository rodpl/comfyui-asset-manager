"""Integration tests for workflow loading functionality."""

import pytest
import json
import tempfile
from pathlib import Path
from unittest.mock import patch, MagicMock

from src.adapters.driven.comfyui_output_adapter import ComfyUIOutputAdapter
from src.domain.entities.output import Output
from datetime import datetime


class TestWorkflowLoadingIntegration:
    """Integration tests for workflow loading functionality."""
    
    @pytest.fixture
    def sample_workflow_data(self):
        """Sample workflow data for testing."""
        return {
            "1": {
                "class_type": "CheckpointLoaderSimple",
                "inputs": {
                    "ckpt_name": "test_model.safetensors"
                }
            },
            "2": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": "a beautiful landscape",
                    "clip": ["1", 0]
                }
            },
            "3": {
                "class_type": "KSampler",
                "inputs": {
                    "seed": 12345,
                    "steps": 20,
                    "cfg": 7.0,
                    "sampler_name": "euler",
                    "scheduler": "normal",
                    "model": ["1", 0],
                    "positive": ["2", 0],
                    "negative": ["2", 0],
                    "latent_image": ["4", 0]
                }
            }
        }
    
    @pytest.fixture
    def output_with_workflow(self, sample_workflow_data):
        """Create an output with workflow metadata."""
        return Output(
            id="test-output-1",
            filename="test_workflow_image.png",
            file_path="/tmp/test_workflow_image.png",
            file_size=1024,
            created_at=datetime.now(),
            modified_at=datetime.now(),
            image_width=512,
            image_height=512,
            file_format="png",
            workflow_metadata={
                "workflow": sample_workflow_data,
                "prompt": "a beautiful landscape",
                "seed": 12345,
                "steps": 20,
                "cfg": 7.0
            }
        )
    
    @pytest.fixture
    def output_without_workflow(self):
        """Create an output without workflow metadata."""
        return Output(
            id="test-output-2",
            filename="test_no_workflow.jpg",
            file_path="/tmp/test_no_workflow.jpg",
            file_size=2048,
            created_at=datetime.now(),
            modified_at=datetime.now(),
            image_width=1024,
            image_height=768,
            file_format="jpg"
        )
    
    @pytest.fixture
    def comfyui_adapter(self):
        """Create a ComfyUI adapter for testing."""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create a mock ComfyUI directory structure
            comfyui_path = Path(temp_dir) / "ComfyUI"
            comfyui_path.mkdir()
            
            # Create characteristic ComfyUI files
            (comfyui_path / "main.py").touch()
            (comfyui_path / "nodes.py").touch()
            (comfyui_path / "execution.py").touch()
            (comfyui_path / "server.py").touch()
            (comfyui_path / "output").mkdir()
            
            adapter = ComfyUIOutputAdapter(str(comfyui_path))
            yield adapter
    
    def test_load_workflow_with_valid_metadata(self, comfyui_adapter, output_with_workflow, sample_workflow_data):
        """Test loading workflow with valid metadata."""
        # Mock the workflow extraction and loading methods
        with patch.object(comfyui_adapter, 'extract_workflow_metadata') as mock_extract, \
             patch.object(comfyui_adapter, '_send_workflow_to_comfyui', return_value=True):
            
            mock_extract.return_value = {
                "workflow": sample_workflow_data,
                "prompt": "a beautiful landscape"
            }
            
            result = comfyui_adapter.load_workflow_to_comfyui(output_with_workflow)
            assert result is True
    
    def test_load_workflow_without_metadata(self, comfyui_adapter, output_without_workflow):
        """Test loading workflow without metadata."""
        result = comfyui_adapter.load_workflow_to_comfyui(output_without_workflow)
        assert result is False
    
    def test_get_workflow_for_loading(self, comfyui_adapter, output_with_workflow, sample_workflow_data):
        """Test getting workflow data for loading."""
        # Mock the metadata extraction
        with patch.object(comfyui_adapter, 'extract_workflow_metadata') as mock_extract:
            mock_extract.return_value = {
                "workflow": sample_workflow_data,
                "prompt": "a beautiful landscape"
            }
            
            workflow_data = comfyui_adapter.get_workflow_for_loading(output_with_workflow)
            assert workflow_data == sample_workflow_data
    
    def test_get_workflow_for_loading_invalid_data(self, comfyui_adapter, output_with_workflow):
        """Test getting workflow data with invalid metadata."""
        # Mock the metadata extraction to return invalid data
        with patch.object(comfyui_adapter, 'extract_workflow_metadata') as mock_extract:
            mock_extract.return_value = {"invalid": "data"}
            
            workflow_data = comfyui_adapter.get_workflow_for_loading(output_with_workflow)
            assert workflow_data is None
    
    def test_load_via_server_api_success(self, comfyui_adapter, sample_workflow_data):
        """Test loading workflow via server API successfully."""
        # Mock the requests module
        mock_requests = MagicMock()
        mock_requests.get.return_value.status_code = 200
        mock_requests.post.return_value.status_code = 200
        
        with patch.dict('sys.modules', {'requests': mock_requests}):
            result = comfyui_adapter._load_via_server_api(sample_workflow_data)
            assert result is True
            
            # Verify the correct API calls were made
            mock_requests.get.assert_called_once_with("http://localhost:8188/system_stats", timeout=2)
            mock_requests.post.assert_called_once()
            
            # Check the payload structure
            call_args = mock_requests.post.call_args
            payload = call_args[1]['json']
            assert payload['prompt'] == sample_workflow_data
            assert payload['client_id'] == "asset_manager"
    
    def test_load_via_server_api_server_not_running(self, comfyui_adapter, sample_workflow_data):
        """Test loading workflow when server is not running."""
        # Mock the requests module with server not responding
        mock_requests = MagicMock()
        mock_requests.get.side_effect = Exception("Connection refused")
        mock_requests.RequestException = Exception
        
        with patch.dict('sys.modules', {'requests': mock_requests}):
            result = comfyui_adapter._load_via_server_api(sample_workflow_data)
            assert result is False
    
    def test_load_via_server_api_submission_failed(self, comfyui_adapter, sample_workflow_data):
        """Test loading workflow when submission fails."""
        # Mock the requests module with submission failure
        mock_requests = MagicMock()
        mock_requests.get.return_value.status_code = 200
        mock_requests.post.return_value.status_code = 500
        
        with patch.dict('sys.modules', {'requests': mock_requests}):
            result = comfyui_adapter._load_via_server_api(sample_workflow_data)
            assert result is False
    
    def test_load_via_file_system(self, comfyui_adapter, sample_workflow_data):
        """Test loading workflow via file system."""
        result = comfyui_adapter._load_via_file_system(sample_workflow_data)
        assert result is True
        
        # Check that a workflow file was created
        temp_workflows_dir = Path(comfyui_adapter.comfyui_base_path) / "temp_workflows"
        assert temp_workflows_dir.exists()
        
        # Check that at least one workflow file exists
        workflow_files = list(temp_workflows_dir.glob("asset_manager_workflow_*.json"))
        assert len(workflow_files) > 0
        
        # Verify the content of the workflow file
        with open(workflow_files[0], 'r', encoding='utf-8') as f:
            saved_workflow = json.load(f)
        assert saved_workflow == sample_workflow_data
    
    def test_load_via_execution_system_no_modules(self, comfyui_adapter, sample_workflow_data):
        """Test loading workflow via execution system when modules are not available."""
        # This should return False since we don't have actual ComfyUI modules
        result = comfyui_adapter._load_via_execution_system(sample_workflow_data)
        assert result is False
    
    def test_send_workflow_to_comfyui_fallback_chain(self, comfyui_adapter, sample_workflow_data):
        """Test the fallback chain in _send_workflow_to_comfyui."""
        # Mock all methods to fail except file system
        with patch.object(comfyui_adapter, '_load_via_server_api', return_value=False), \
             patch.object(comfyui_adapter, '_load_via_execution_system', return_value=False), \
             patch.object(comfyui_adapter, '_load_via_file_system', return_value=True):
            
            result = comfyui_adapter._send_workflow_to_comfyui(sample_workflow_data)
            assert result is True
    
    def test_send_workflow_to_comfyui_all_methods_fail(self, comfyui_adapter, sample_workflow_data):
        """Test when all workflow loading methods fail."""
        # Mock all methods to fail
        with patch.object(comfyui_adapter, '_load_via_server_api', return_value=False), \
             patch.object(comfyui_adapter, '_load_via_execution_system', return_value=False), \
             patch.object(comfyui_adapter, '_load_via_file_system', return_value=False):
            
            result = comfyui_adapter._send_workflow_to_comfyui(sample_workflow_data)
            assert result is False
    
    def test_workflow_validation_missing_class_type(self, comfyui_adapter):
        """Test workflow validation with missing class_type."""
        invalid_workflow = {
            "1": {
                "inputs": {"ckpt_name": "test.safetensors"}
                # Missing class_type
            }
        }
        
        # Mock metadata extraction to return invalid workflow
        output = Output(
            id="test", filename="test.png", file_path="/tmp/test.png",
            file_size=1024, created_at=datetime.now(), modified_at=datetime.now(),
            image_width=512, image_height=512, file_format="png"
        )
        
        with patch.object(comfyui_adapter, 'extract_workflow_metadata') as mock_extract:
            mock_extract.return_value = {"workflow": invalid_workflow}
            
            workflow_data = comfyui_adapter.get_workflow_for_loading(output)
            assert workflow_data is None
    
    def test_workflow_validation_empty_workflow(self, comfyui_adapter):
        """Test workflow validation with empty workflow."""
        output = Output(
            id="test", filename="test.png", file_path="/tmp/test.png",
            file_size=1024, created_at=datetime.now(), modified_at=datetime.now(),
            image_width=512, image_height=512, file_format="png"
        )
        
        with patch.object(comfyui_adapter, 'extract_workflow_metadata') as mock_extract:
            mock_extract.return_value = {"workflow": {}}
            
            workflow_data = comfyui_adapter.get_workflow_for_loading(output)
            assert workflow_data is None