"""Tests for driven ports (secondary interfaces)."""

import pytest
from abc import ABC
from typing import List, Optional, Dict, Any

from src.domain.ports.driven import (
    ModelRepositoryPort,
    FolderRepositoryPort,
    ExternalMetadataPort,
    CachePort
)
from src.domain.entities import Model, Folder, ExternalMetadata


class TestModelRepositoryPort:
    """Test ModelRepositoryPort interface."""
    
    def test_is_abstract_base_class(self):
        """Test that ModelRepositoryPort is an abstract base class."""
        assert issubclass(ModelRepositoryPort, ABC)
        
        with pytest.raises(TypeError):
            ModelRepositoryPort()
    
    def test_has_required_methods(self):
        """Test that ModelRepositoryPort has all required abstract methods."""
        required_methods = [
            'find_all_in_folder',
            'find_by_id',
            'search',
            'save',
            'delete'
        ]
        
        for method_name in required_methods:
            assert hasattr(ModelRepositoryPort, method_name)
            method = getattr(ModelRepositoryPort, method_name)
            assert getattr(method, '__isabstractmethod__', False)
    
    def test_method_signatures(self):
        """Test that methods have correct signatures."""
        # This test ensures the interface contract is maintained
        import inspect
        
        # find_all_in_folder
        sig = inspect.signature(ModelRepositoryPort.find_all_in_folder)
        params = list(sig.parameters.keys())
        assert params == ['self', 'folder_id']
        
        # find_by_id
        sig = inspect.signature(ModelRepositoryPort.find_by_id)
        params = list(sig.parameters.keys())
        assert params == ['self', 'model_id']
        
        # search
        sig = inspect.signature(ModelRepositoryPort.search)
        params = list(sig.parameters.keys())
        assert params == ['self', 'query', 'folder_id']
        
        # save
        sig = inspect.signature(ModelRepositoryPort.save)
        params = list(sig.parameters.keys())
        assert params == ['self', 'model']
        
        # delete
        sig = inspect.signature(ModelRepositoryPort.delete)
        params = list(sig.parameters.keys())
        assert params == ['self', 'model_id']
    
    def test_can_implement_interface(self):
        """Test that the interface can be properly implemented."""
        
        class TestModelRepository(ModelRepositoryPort):
            def find_all_in_folder(self, folder_id: str) -> List[Model]:
                return []
            
            def find_by_id(self, model_id: str) -> Optional[Model]:
                return None
            
            def search(self, query: str, folder_id: Optional[str] = None) -> List[Model]:
                return []
            
            def save(self, model: Model) -> None:
                pass
            
            def delete(self, model_id: str) -> bool:
                return False
        
        # Should be able to instantiate the implementation
        repo = TestModelRepository()
        assert isinstance(repo, ModelRepositoryPort)


class TestFolderRepositoryPort:
    """Test FolderRepositoryPort interface."""
    
    def test_is_abstract_base_class(self):
        """Test that FolderRepositoryPort is an abstract base class."""
        assert issubclass(FolderRepositoryPort, ABC)
        
        with pytest.raises(TypeError):
            FolderRepositoryPort()
    
    def test_has_required_methods(self):
        """Test that FolderRepositoryPort has all required abstract methods."""
        required_methods = [
            'get_all_folders',
            'get_folder_structure',
            'find_by_id',
            'save',
            'delete'
        ]
        
        for method_name in required_methods:
            assert hasattr(FolderRepositoryPort, method_name)
            method = getattr(FolderRepositoryPort, method_name)
            assert getattr(method, '__isabstractmethod__', False)
    
    def test_method_signatures(self):
        """Test that methods have correct signatures."""
        import inspect
        
        # get_all_folders
        sig = inspect.signature(FolderRepositoryPort.get_all_folders)
        params = list(sig.parameters.keys())
        assert params == ['self']
        
        # get_folder_structure
        sig = inspect.signature(FolderRepositoryPort.get_folder_structure)
        params = list(sig.parameters.keys())
        assert params == ['self']
        
        # find_by_id
        sig = inspect.signature(FolderRepositoryPort.find_by_id)
        params = list(sig.parameters.keys())
        assert params == ['self', 'folder_id']
        
        # save
        sig = inspect.signature(FolderRepositoryPort.save)
        params = list(sig.parameters.keys())
        assert params == ['self', 'folder']
        
        # delete
        sig = inspect.signature(FolderRepositoryPort.delete)
        params = list(sig.parameters.keys())
        assert params == ['self', 'folder_id']
    
    def test_can_implement_interface(self):
        """Test that the interface can be properly implemented."""
        
        class TestFolderRepository(FolderRepositoryPort):
            def get_all_folders(self) -> List[Folder]:
                return []
            
            def get_folder_structure(self) -> Dict[str, Folder]:
                return {}
            
            def find_by_id(self, folder_id: str) -> Optional[Folder]:
                return None
            
            def save(self, folder: Folder) -> None:
                pass
            
            def delete(self, folder_id: str) -> bool:
                return False
        
        # Should be able to instantiate the implementation
        repo = TestFolderRepository()
        assert isinstance(repo, FolderRepositoryPort)


class TestExternalMetadataPort:
    """Test ExternalMetadataPort interface."""
    
    def test_is_abstract_base_class(self):
        """Test that ExternalMetadataPort is an abstract base class."""
        assert issubclass(ExternalMetadataPort, ABC)
        
        with pytest.raises(TypeError):
            ExternalMetadataPort()
    
    def test_has_required_methods(self):
        """Test that ExternalMetadataPort has all required abstract methods."""
        required_methods = [
            'fetch_metadata',
            'fetch_civitai_metadata',
            'fetch_huggingface_metadata'
        ]
        
        for method_name in required_methods:
            assert hasattr(ExternalMetadataPort, method_name)
            method = getattr(ExternalMetadataPort, method_name)
            assert getattr(method, '__isabstractmethod__', False)
    
    def test_method_signatures(self):
        """Test that methods have correct signatures."""
        import inspect
        
        # fetch_metadata
        sig = inspect.signature(ExternalMetadataPort.fetch_metadata)
        params = list(sig.parameters.keys())
        assert params == ['self', 'identifier']
        
        # fetch_civitai_metadata
        sig = inspect.signature(ExternalMetadataPort.fetch_civitai_metadata)
        params = list(sig.parameters.keys())
        assert params == ['self', 'model_hash']
        
        # fetch_huggingface_metadata
        sig = inspect.signature(ExternalMetadataPort.fetch_huggingface_metadata)
        params = list(sig.parameters.keys())
        assert params == ['self', 'model_name']
    
    def test_can_implement_interface(self):
        """Test that the interface can be properly implemented."""
        from src.domain.entities.external_metadata import CivitAIMetadata, HuggingFaceMetadata
        
        class TestExternalMetadataAdapter(ExternalMetadataPort):
            def fetch_metadata(self, identifier: str) -> Optional[ExternalMetadata]:
                return None
            
            def fetch_civitai_metadata(self, model_hash: str) -> Optional[CivitAIMetadata]:
                return None
            
            def fetch_huggingface_metadata(self, model_name: str) -> Optional[HuggingFaceMetadata]:
                return None
        
        # Should be able to instantiate the implementation
        adapter = TestExternalMetadataAdapter()
        assert isinstance(adapter, ExternalMetadataPort)


class TestCachePort:
    """Test CachePort interface."""
    
    def test_is_abstract_base_class(self):
        """Test that CachePort is an abstract base class."""
        assert issubclass(CachePort, ABC)
        
        with pytest.raises(TypeError):
            CachePort()
    
    def test_has_required_methods(self):
        """Test that CachePort has all required abstract methods."""
        required_methods = [
            'get',
            'set',
            'delete',
            'clear',
            'exists'
        ]
        
        for method_name in required_methods:
            assert hasattr(CachePort, method_name)
            method = getattr(CachePort, method_name)
            assert getattr(method, '__isabstractmethod__', False)
    
    def test_method_signatures(self):
        """Test that methods have correct signatures."""
        import inspect
        
        # get
        sig = inspect.signature(CachePort.get)
        params = list(sig.parameters.keys())
        assert params == ['self', 'key']
        
        # set
        sig = inspect.signature(CachePort.set)
        params = list(sig.parameters.keys())
        assert params == ['self', 'key', 'value', 'ttl']
        
        # delete
        sig = inspect.signature(CachePort.delete)
        params = list(sig.parameters.keys())
        assert params == ['self', 'key']
        
        # clear
        sig = inspect.signature(CachePort.clear)
        params = list(sig.parameters.keys())
        assert params == ['self']
        
        # exists
        sig = inspect.signature(CachePort.exists)
        params = list(sig.parameters.keys())
        assert params == ['self', 'key']
    
    def test_can_implement_interface(self):
        """Test that the interface can be properly implemented."""
        
        class TestCacheAdapter(CachePort):
            def get(self, key: str) -> Optional[Any]:
                return None
            
            def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
                pass
            
            def delete(self, key: str) -> bool:
                return False
            
            def clear(self) -> None:
                pass
            
            def exists(self, key: str) -> bool:
                return False
        
        # Should be able to instantiate the implementation
        cache = TestCacheAdapter()
        assert isinstance(cache, CachePort)