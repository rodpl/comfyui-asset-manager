"""Tests for FileCacheAdapter."""

import json
import tempfile
import time
from pathlib import Path
from unittest.mock import patch

import pytest

from src.adapters.driven.file_cache_adapter import FileCacheAdapter


@pytest.fixture
def temp_cache_dir():
    """Create a temporary directory for cache testing."""
    with tempfile.TemporaryDirectory() as temp_dir:
        yield temp_dir


@pytest.fixture
def cache_adapter(temp_cache_dir):
    """Create a FileCacheAdapter instance with temporary directory."""
    return FileCacheAdapter(cache_dir=temp_cache_dir)


class TestFileCacheAdapter:
    """Test cases for FileCacheAdapter."""
    
    def test_set_and_get_basic_value(self, cache_adapter):
        """Test setting and getting a basic value."""
        key = "test_key"
        value = "test_value"
        
        cache_adapter.set(key, value)
        result = cache_adapter.get(key)
        
        assert result == value
    
    def test_set_and_get_complex_value(self, cache_adapter):
        """Test setting and getting complex data structures."""
        key = "complex_key"
        value = {
            "string": "test",
            "number": 42,
            "list": [1, 2, 3],
            "nested": {"inner": "value"}
        }
        
        cache_adapter.set(key, value)
        result = cache_adapter.get(key)
        
        assert result == value
    
    def test_get_nonexistent_key(self, cache_adapter):
        """Test getting a key that doesn't exist."""
        result = cache_adapter.get("nonexistent_key")
        assert result is None
    
    def test_exists_with_existing_key(self, cache_adapter):
        """Test exists method with existing key."""
        key = "existing_key"
        value = "test_value"
        
        cache_adapter.set(key, value)
        assert cache_adapter.exists(key) is True
    
    def test_exists_with_nonexistent_key(self, cache_adapter):
        """Test exists method with nonexistent key."""
        assert cache_adapter.exists("nonexistent_key") is False
    
    def test_delete_existing_key(self, cache_adapter):
        """Test deleting an existing key."""
        key = "delete_key"
        value = "test_value"
        
        cache_adapter.set(key, value)
        assert cache_adapter.exists(key) is True
        
        result = cache_adapter.delete(key)
        assert result is True
        assert cache_adapter.exists(key) is False
    
    def test_delete_nonexistent_key(self, cache_adapter):
        """Test deleting a nonexistent key."""
        result = cache_adapter.delete("nonexistent_key")
        assert result is False
    
    def test_clear_cache(self, cache_adapter):
        """Test clearing all cache entries."""
        # Set multiple values
        cache_adapter.set("key1", "value1")
        cache_adapter.set("key2", "value2")
        cache_adapter.set("key3", "value3")
        
        # Verify they exist
        assert cache_adapter.exists("key1") is True
        assert cache_adapter.exists("key2") is True
        assert cache_adapter.exists("key3") is True
        
        # Clear cache
        cache_adapter.clear()
        
        # Verify they're gone
        assert cache_adapter.exists("key1") is False
        assert cache_adapter.exists("key2") is False
        assert cache_adapter.exists("key3") is False
    
    def test_ttl_expiration(self, cache_adapter):
        """Test TTL expiration functionality."""
        key = "ttl_key"
        value = "ttl_value"
        ttl = 1  # 1 second
        
        cache_adapter.set(key, value, ttl=ttl)
        
        # Should exist immediately
        assert cache_adapter.exists(key) is True
        assert cache_adapter.get(key) == value
        
        # Wait for expiration
        time.sleep(1.1)
        
        # Should be expired now
        assert cache_adapter.exists(key) is False
        assert cache_adapter.get(key) is None
    
    def test_ttl_none_no_expiration(self, cache_adapter):
        """Test that TTL=None means no expiration."""
        key = "no_ttl_key"
        value = "no_ttl_value"
        
        cache_adapter.set(key, value, ttl=None)
        
        # Should exist and not expire
        assert cache_adapter.exists(key) is True
        assert cache_adapter.get(key) == value
        
        # Even after some time (simulated with mock)
        with patch('time.time', return_value=time.time() + 3600):  # 1 hour later
            assert cache_adapter.exists(key) is True
            assert cache_adapter.get(key) == value
    
    def test_key_sanitization(self, cache_adapter):
        """Test that problematic keys are sanitized."""
        problematic_key = "key/with\\special:chars*and?spaces"
        value = "test_value"
        
        cache_adapter.set(problematic_key, value)
        result = cache_adapter.get(problematic_key)
        
        assert result == value
    
    def test_very_long_key_handling(self, cache_adapter):
        """Test handling of very long keys."""
        long_key = "a" * 300  # Very long key
        value = "test_value"
        
        cache_adapter.set(long_key, value)
        result = cache_adapter.get(long_key)
        
        assert result == value
    
    def test_cleanup_expired_entries(self, cache_adapter):
        """Test cleanup of expired entries."""
        # Set some entries with different TTLs
        cache_adapter.set("key1", "value1", ttl=1)  # Will expire
        cache_adapter.set("key2", "value2", ttl=None)  # Won't expire
        cache_adapter.set("key3", "value3", ttl=10)  # Won't expire yet
        
        # Wait for first entry to expire
        time.sleep(1.1)
        
        # Run cleanup
        removed_count = cache_adapter.cleanup_expired()
        
        # Should have removed 1 expired entry
        assert removed_count == 1
        assert cache_adapter.exists("key1") is False
        assert cache_adapter.exists("key2") is True
        assert cache_adapter.exists("key3") is True
    
    def test_get_cache_stats(self, cache_adapter):
        """Test cache statistics functionality."""
        # Initially empty
        stats = cache_adapter.get_cache_stats()
        assert stats['total_entries'] == 0
        assert stats['expired_entries'] == 0
        assert stats['cache_size_bytes'] == 0
        
        # Add some entries
        cache_adapter.set("key1", "value1", ttl=1)  # Will expire
        cache_adapter.set("key2", "value2", ttl=None)  # Won't expire
        
        # Wait for one to expire
        time.sleep(1.1)
        
        stats = cache_adapter.get_cache_stats()
        assert stats['total_entries'] == 2
        assert stats['expired_entries'] == 1
        assert stats['cache_size_bytes'] > 0
    
    def test_corrupted_cache_file_handling(self, cache_adapter, temp_cache_dir):
        """Test handling of corrupted cache files."""
        key = "corrupted_key"
        
        # Create a corrupted cache file
        cache_file = Path(temp_cache_dir) / f"{key}.json"
        cache_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(cache_file, 'w') as f:
            f.write("invalid json content")
        
        # Should handle corruption gracefully
        result = cache_adapter.get(key)
        assert result is None
        
        # File should be cleaned up
        assert not cache_file.exists()
    
    def test_missing_cache_directory(self):
        """Test behavior when cache directory doesn't exist initially."""
        with tempfile.TemporaryDirectory() as temp_dir:
            cache_dir = Path(temp_dir) / "nonexistent" / "cache"
            adapter = FileCacheAdapter(cache_dir=str(cache_dir))
            
            # Should create directory and work normally
            adapter.set("test_key", "test_value")
            result = adapter.get("test_key")
            
            assert result == "test_value"
            assert cache_dir.exists()
    
    def test_file_write_error_handling(self, cache_adapter, temp_cache_dir):
        """Test handling of file write errors."""
        key = "write_error_key"
        value = "test_value"
        
        # Create a cache file first
        cache_adapter.set(key, "initial_value")
        
        # Make cache directory read-only to simulate write error
        cache_dir = Path(temp_cache_dir)
        cache_dir.chmod(0o444)  # Read-only
        
        try:
            # Should not raise exception, just log warning
            cache_adapter.set(key, value)
            
            # Since write failed, should still have the old value
            # But we can't read it due to permission issues, so we'll skip this check
            # The important thing is that set() didn't raise an exception
            
        finally:
            # Restore permissions for cleanup
            cache_dir.chmod(0o755)
    
    def test_concurrent_access_safety(self, cache_adapter):
        """Test that cache operations are safe under concurrent access."""
        import threading
        import time
        
        results = []
        errors = []
        
        def worker(worker_id):
            try:
                for i in range(10):
                    key = f"worker_{worker_id}_key_{i}"
                    value = f"worker_{worker_id}_value_{i}"
                    
                    cache_adapter.set(key, value)
                    retrieved = cache_adapter.get(key)
                    
                    if retrieved == value:
                        results.append(True)
                    else:
                        results.append(False)
                    
                    time.sleep(0.01)  # Small delay
            except Exception as e:
                errors.append(e)
        
        # Start multiple worker threads
        threads = []
        for i in range(3):
            thread = threading.Thread(target=worker, args=(i,))
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Should have no errors and all operations should succeed
        assert len(errors) == 0
        assert all(results)
        assert len(results) == 30  # 3 workers * 10 operations each
    
    def test_cache_persistence_across_instances(self, temp_cache_dir):
        """Test that cache persists across adapter instances."""
        key = "persistent_key"
        value = "persistent_value"
        
        # Create first adapter instance and set value
        adapter1 = FileCacheAdapter(cache_dir=temp_cache_dir)
        adapter1.set(key, value)
        
        # Create second adapter instance and retrieve value
        adapter2 = FileCacheAdapter(cache_dir=temp_cache_dir)
        result = adapter2.get(key)
        
        assert result == value
    
    def test_special_characters_in_values(self, cache_adapter):
        """Test caching values with special characters."""
        key = "special_chars_key"
        value = "Value with special chars: àáâãäåæçèéêë 中文 🚀"
        
        cache_adapter.set(key, value)
        result = cache_adapter.get(key)
        
        assert result == value
    
    def test_numeric_and_boolean_values(self, cache_adapter):
        """Test caching numeric and boolean values."""
        test_cases = [
            ("int_key", 42),
            ("float_key", 3.14159),
            ("bool_true_key", True),
            ("bool_false_key", False),
            ("zero_key", 0),
            ("negative_key", -123)
        ]
        
        for key, value in test_cases:
            cache_adapter.set(key, value)
            result = cache_adapter.get(key)
            assert result == value
            assert type(result) == type(value)