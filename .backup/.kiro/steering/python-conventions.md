---
inclusion: fileMatch
fileMatchPattern: ["**/*.py", "src/**/*", "tests/**/*"]
---

# Python Conventions

## Naming Conventions
- Use snake_case for variables and functions
- Use PascalCase for classes
- Use UPPER_SNAKE_CASE for constants
- Use descriptive names that explain purpose

## Code Style
- Follow PEP 8 guidelines
- Use Black for code formatting
- Maximum line length of 88 characters
- Use type hints for all public functions

## File Structure
- One class per file for large classes
- Group related functions in modules
- Use __init__.py files for package organization
- Separate tests in tests/ directory

## Documentation
- Use docstrings for all public functions and classes
- Follow Google or NumPy docstring style
- Include type information in docstrings

## Architecture Principles

### Hexagonal Architecture (Ports and Adapters)
- Organize code into Domain Core, Ports, and Adapters
- **Domain Core**: Contains business logic and entities
- **Driving Ports (Primary)**: Define what the application can do (API)
- **Driven Ports (Secondary)**: Define what the application needs (SPI)
- **Driving Adapters**: Translate external requests to domain operations (Web API, CLI)
- **Driven Adapters**: Implement infrastructure concerns (Database, External APIs, File System)

### SOLID Principles
- **Single Responsibility**: Each class should have one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Derived classes must be substitutable for base classes
- **Interface Segregation**: Clients should not depend on interfaces they don't use
- **Dependency Inversion**: Depend on abstractions, not concretions

### Port and Adapter Guidelines
- All ports must be abstract base classes (ABC)
- Domain services implement driving ports
- Infrastructure adapters implement driven ports
- Use dependency injection to wire adapters to ports
- Keep domain logic free from infrastructure concerns

### Directory Structure for Hexagonal Architecture
```
src/
├── domain/
│   ├── entities/          # Domain entities
│   ├── services/          # Domain services (implement driving ports)
│   └── ports/
│       ├── driving/       # Primary ports (API)
│       └── driven/        # Secondary ports (SPI)
├── adapters/
│   ├── driving/           # Primary adapters (Web, CLI)
│   └── driven/            # Secondary adapters (DB, External APIs)
└── main.py                # Dependency injection and wiring
```

## Testing

### Testing Framework
- Use **pytest** for all Python testing
- Use **Poetry** for dependency management and test execution
- Organize tests in `tests/` directory mirroring the `src/` structure

### Test Organization
```
tests/
├── domain/
│   ├── entities/          # Entity tests (test_model.py, test_folder.py, etc.)
│   ├── services/          # Domain service tests
│   └── ports/             # Port interface tests
├── adapters/
│   ├── driving/           # Primary adapter tests
│   └── driven/            # Secondary adapter tests
└── integration/           # Integration tests
```

### Running Tests

```bash
# Install development dependencies
poetry install --with dev

# Run all tests
poetry run pytest

# Run tests with verbose output
poetry run pytest -v

# Run specific test file
poetry run pytest tests/domain/entities/test_model.py

# Run tests with coverage report
poetry run pytest --cov=src --cov-report=html

# Run tests matching a pattern
poetry run pytest -k "test_model"

# Run only unit tests (when marked)
poetry run pytest -m unit

# Run only integration tests (when marked)
poetry run pytest -m integration
```

### Test Configuration
- Configuration is defined in `pyproject.toml`
- Minimum code coverage: 70%
- HTML coverage reports generated in `htmlcov/`
- Test markers available: `unit`, `integration`, `slow`

### Test Writing Guidelines
- **Function-Based Tests**: Use function-based tests instead of class-based tests for simplicity
- **Fixtures**: Use pytest fixtures for common test setup and shared data
- **Test Naming**: Use descriptive names that explain what is being tested
- **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
- **Unit Tests**: Test individual components in isolation using mocks
- **Integration Tests**: Test component interactions with real dependencies
- **Mocking**: Mock external dependencies to keep tests fast and reliable

### Test Structure Example
```python
import pytest
from src.domain.entities import Model, ModelType

@pytest.fixture
def sample_model_data():
    """Fixture providing sample model data."""
    return {
        "id": "model-1",
        "name": "Test Model",
        "file_path": "/path/to/model.safetensors",
        "file_size": 1024,
        "model_type": ModelType.CHECKPOINT,
        "hash": "abc123",
        "folder_id": "folder-1"
    }

@pytest.mark.unit
def test_model_validation(sample_model_data):
    """Unit test for model validation logic."""
    model = Model(**sample_model_data)
    assert model.name == "Test Model"

@pytest.mark.integration
def test_repository_database_integration():
    """Integration test with actual database."""
    pass

@pytest.mark.slow
def test_external_api_call():
    """Test that makes actual external API calls."""
    pass
```

## Advanced Python Patterns

### Async/Await Best Practices

```python
# Use async/await for I/O operations with proper error handling
class AsyncModelService:
    def __init__(self, repository: ModelRepositoryPort):
        self._repository = repository
        self._semaphore = asyncio.Semaphore(10)  # Limit concurrent operations
    
    async def process_models_batch(self, model_paths: List[str]) -> List[Model]:
        """Process multiple models concurrently with rate limiting"""
        async def process_single_model(path: str) -> Model:
            async with self._semaphore:
                return await self._repository.load_model_async(path)
        
        tasks = [process_single_model(path) for path in model_paths]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions and log errors
        return [r for r in results if not isinstance(r, Exception)]
```

### Context Managers for Resource Management

```python
# Proper resource management with context managers
from contextlib import asynccontextmanager
import aiofiles

class ModelFileProcessor:
    @asynccontextmanager
    async def open_model_file(self, file_path: str):
        """Safely open and process model files"""
        file_handle = None
        try:
            file_handle = await aiofiles.open(file_path, 'rb')
            yield file_handle
        except Exception as e:
            logger.error(f"Error processing model file {file_path}: {e}")
            raise
        finally:
            if file_handle:
                await file_handle.close()
    
    async def extract_metadata(self, file_path: str) -> ModelMetadata:
        async with self.open_model_file(file_path) as file:
            # Process file safely
            return await self._parse_metadata(file)
```

### Dependency Injection Container

```python
# Simple dependency injection container
from typing import TypeVar, Type, Dict, Any
from abc import ABC

T = TypeVar('T')

class DIContainer:
    def __init__(self):
        self._services: Dict[Type, Any] = {}
        self._singletons: Dict[Type, Any] = {}
    
    def register_singleton(self, interface: Type[T], implementation: T):
        """Register a singleton service"""
        self._singletons[interface] = implementation
    
    def register_transient(self, interface: Type[T], factory: callable):
        """Register a transient service with factory"""
        self._services[interface] = factory
    
    def get(self, interface: Type[T]) -> T:
        """Resolve service instance"""
        # Check singletons first
        if interface in self._singletons:
            return self._singletons[interface]
        
        # Create transient instance
        if interface in self._services:
            return self._services[interface]()
        
        raise ValueError(f"Service {interface} not registered")

# Usage example
def create_container() -> DIContainer:
    container = DIContainer()
    
    # Register repositories
    container.register_singleton(
        ModelRepositoryPort, 
        FileSystemModelAdapter()
    )
    
    # Register services
    container.register_transient(
        ModelManagementPort,
        lambda: ModelService(container.get(ModelRepositoryPort))
    )
    
    return container
```

### Error Handling Patterns

```python
# Custom exception hierarchy
class AssetManagerException(Exception):
    """Base exception for Asset Manager"""
    def __init__(self, message: str, error_code: str = None):
        super().__init__(message)
        self.error_code = error_code
        self.message = message

class ModelNotFoundError(AssetManagerException):
    """Raised when model cannot be found"""
    def __init__(self, model_id: str):
        super().__init__(
            f"Model with ID '{model_id}' not found",
            error_code="MODEL_NOT_FOUND"
        )
        self.model_id = model_id

class InvalidModelFormatError(AssetManagerException):
    """Raised when model format is invalid"""
    def __init__(self, file_path: str, expected_formats: List[str]):
        super().__init__(
            f"Invalid model format for {file_path}. Expected: {expected_formats}",
            error_code="INVALID_MODEL_FORMAT"
        )
        self.file_path = file_path
        self.expected_formats = expected_formats

# Error handling decorator
from functools import wraps

def handle_service_errors(func):
    """Decorator to handle common service errors"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except FileNotFoundError as e:
            raise ModelNotFoundError(str(e))
        except PermissionError as e:
            raise AssetManagerException(
                f"Permission denied: {e}",
                error_code="PERMISSION_DENIED"
            )
        except Exception as e:
            logger.exception(f"Unexpected error in {func.__name__}")
            raise AssetManagerException(
                f"Internal error in {func.__name__}",
                error_code="INTERNAL_ERROR"
            )
    
    return wrapper
```

### Performance Optimization Patterns

```python
# Caching with TTL
from functools import wraps
import time
from typing import Optional

class TTLCache:
    def __init__(self, ttl_seconds: int = 300):
        self.ttl_seconds = ttl_seconds
        self.cache = {}
    
    def get(self, key: str) -> Optional[Any]:
        if key in self.cache:
            value, timestamp = self.cache[key]
            if time.time() - timestamp < self.ttl_seconds:
                return value
            else:
                del self.cache[key]
        return None
    
    def set(self, key: str, value: Any):
        self.cache[key] = (value, time.time())

def cached_with_ttl(ttl_seconds: int = 300):
    """Decorator for caching function results with TTL"""
    cache = TTLCache(ttl_seconds)
    
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"
            
            # Try to get from cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            cache.set(cache_key, result)
            return result
        
        return wrapper
    return decorator

# Usage
class MetadataService:
    @cached_with_ttl(ttl_seconds=600)  # Cache for 10 minutes
    async def get_external_metadata(self, model_hash: str) -> Optional[ModelMetadata]:
        """Fetch metadata from external API with caching"""
        return await self._fetch_from_api(model_hash)
```