"""Tests for driving ports (primary interfaces)."""

import pytest
from abc import ABC
from typing import List, Dict, Optional

from src.domain.ports.driving import ModelManagementPort, FolderManagementPort
from src.domain.entities import Model, Folder


def test_model_management_port_is_abstract():
    """Test that ModelManagementPort is an abstract base class."""
    assert issubclass(ModelManagementPort, ABC)
    
    # Should not be able to instantiate directly
    with pytest.raises(TypeError):
        ModelManagementPort()


def test_folder_management_port_is_abstract():
    """Test that FolderManagementPort is an abstract base class."""
    assert issubclass(FolderManagementPort, ABC)
    
    # Should not be able to instantiate directly
    with pytest.raises(TypeError):
        FolderManagementPort()


def test_model_management_port_has_required_methods():
    """Test that ModelManagementPort defines all required abstract methods."""
    required_methods = [
        'get_models_in_folder',
        'get_model_details', 
        'search_models',
        'enrich_model_metadata'
    ]
    
    for method_name in required_methods:
        assert hasattr(ModelManagementPort, method_name)
        method = getattr(ModelManagementPort, method_name)
        assert getattr(method, '__isabstractmethod__', False), f"{method_name} should be abstract"


def test_folder_management_port_has_required_methods():
    """Test that FolderManagementPort defines all required abstract methods."""
    required_methods = [
        'get_all_folders',
        'get_folder_by_id',
        'get_folder_structure'
    ]
    
    for method_name in required_methods:
        assert hasattr(FolderManagementPort, method_name)
        method = getattr(FolderManagementPort, method_name)
        assert getattr(method, '__isabstractmethod__', False), f"{method_name} should be abstract"


def test_model_management_port_method_signatures():
    """Test that ModelManagementPort methods have correct signatures."""
    # Check get_models_in_folder signature
    method = ModelManagementPort.get_models_in_folder
    annotations = method.__annotations__
    assert 'folder_id' in annotations
    assert annotations['folder_id'] == str
    assert annotations['return'] == List[Model]
    
    # Check get_model_details signature
    method = ModelManagementPort.get_model_details
    annotations = method.__annotations__
    assert 'model_id' in annotations
    assert annotations['model_id'] == str
    assert annotations['return'] == Model
    
    # Check search_models signature
    method = ModelManagementPort.search_models
    annotations = method.__annotations__
    assert 'query' in annotations
    assert annotations['query'] == str
    assert 'folder_id' in annotations
    assert annotations['folder_id'] == Optional[str]
    assert annotations['return'] == List[Model]
    
    # Check enrich_model_metadata signature
    method = ModelManagementPort.enrich_model_metadata
    annotations = method.__annotations__
    assert 'model' in annotations
    assert annotations['model'] == Model
    assert annotations['return'] == Model


def test_folder_management_port_method_signatures():
    """Test that FolderManagementPort methods have correct signatures."""
    # Check get_all_folders signature
    method = FolderManagementPort.get_all_folders
    annotations = method.__annotations__
    assert annotations['return'] == List[Folder]
    
    # Check get_folder_by_id signature
    method = FolderManagementPort.get_folder_by_id
    annotations = method.__annotations__
    assert 'folder_id' in annotations
    assert annotations['folder_id'] == str
    assert annotations['return'] == Folder
    
    # Check get_folder_structure signature
    method = FolderManagementPort.get_folder_structure
    annotations = method.__annotations__
    assert annotations['return'] == Dict[str, Folder]


class MockModelManagementPort(ModelManagementPort):
    """Mock implementation for testing purposes."""
    
    def get_models_in_folder(self, folder_id: str) -> List[Model]:
        return []
    
    def get_model_details(self, model_id: str) -> Model:
        from datetime import datetime
        from src.domain.entities.model import ModelType
        return Model(
            id="test-id",
            name="Test Model",
            file_path="/test/path.safetensors",
            file_size=1024,
            created_at=datetime.now(),
            modified_at=datetime.now(),
            model_type=ModelType.CHECKPOINT,
            hash="test-hash",
            folder_id="test-folder"
        )
    
    def search_models(self, query: str, folder_id: Optional[str] = None) -> List[Model]:
        return []
    
    def enrich_model_metadata(self, model: Model) -> Model:
        return model


class MockFolderManagementPort(FolderManagementPort):
    """Mock implementation for testing purposes."""
    
    def get_all_folders(self) -> List[Folder]:
        return []
    
    def get_folder_by_id(self, folder_id: str) -> Folder:
        from src.domain.entities.model import ModelType
        return Folder(
            id="test-id",
            name="Test Folder",
            path="/test/path",
            model_type=ModelType.CHECKPOINT
        )
    
    def get_folder_structure(self) -> Dict[str, Folder]:
        return {}


def test_can_implement_model_management_port():
    """Test that ModelManagementPort can be properly implemented."""
    mock_port = MockModelManagementPort()
    
    # Should be able to call all methods
    models = mock_port.get_models_in_folder("test-folder")
    assert isinstance(models, list)
    
    model = mock_port.get_model_details("test-model")
    assert isinstance(model, Model)
    
    search_results = mock_port.search_models("test query")
    assert isinstance(search_results, list)
    
    enriched_model = mock_port.enrich_model_metadata(model)
    assert isinstance(enriched_model, Model)


def test_can_implement_folder_management_port():
    """Test that FolderManagementPort can be properly implemented."""
    mock_port = MockFolderManagementPort()
    
    # Should be able to call all methods
    folders = mock_port.get_all_folders()
    assert isinstance(folders, list)
    
    folder = mock_port.get_folder_by_id("test-folder")
    assert isinstance(folder, Folder)
    
    structure = mock_port.get_folder_structure()
    assert isinstance(structure, dict)