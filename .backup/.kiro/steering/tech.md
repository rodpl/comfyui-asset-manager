---
inclusion: always
---

# Technology Stack

## Architecture Overview

Hybrid Python-React extension that integrates with ComfyUI's sidebar interface, combining a lightweight Python backend for ComfyUI integration with a modern React frontend for the user interface.

## Frontend

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Package Manager**: pnpm for Node.js dependencies
- **Styling**: CSS modules with component-scoped styles
- **Internationalization**: i18next with react-i18next for multi-language support
- **Testing**: Vitest with jsdom environment and React Testing Library
- **Type Safety**: TypeScript with ComfyUI Frontend Types for proper integration
- **Code Quality**: ESLint with TypeScript support, Prettier for formatting

### Frontend Dependencies

- **Core**: React 18, React DOM, TypeScript
- **i18n**: i18next, react-i18next, i18next-browser-languagedetector, i18next-http-backend
- **ComfyUI Integration**: @comfyorg/comfyui-frontend-types
- **Development**: Vite, ESLint, Prettier, Vitest, various TypeScript and React plugins

## Backend

- **Language**: Python (compatible with ComfyUI's Python environment)
- **Architecture**: Hexagonal/Clean Architecture pattern with ports and adapters
- **Web Server**: aiohttp integration with ComfyUI's PromptServer
- **Dependency Management**: Poetry for Python package management
- **Static Serving**: Custom routes for serving React build assets and localization files
- **ComfyUI Integration**: Extension registration via NODE_CLASS_MAPPINGS and web directory registration

### Backend Responsibilities

- Register static routes for serving frontend assets (`/asset_manager/`)
- Serve localization files (`/locales/`)
- Register with ComfyUI's extension system via NODE_CLASS_MAPPINGS
- Handle ComfyUI-specific configuration and project metadata
- Integrate with ComfyUI's folder_paths module for model discovery
- Support ComfyUI Registry publishing via pyproject.toml configuration

## Common Commands

### Initial Setup

```bash
# Quick setup (recommended)
./setup.sh

# Manual setup
poetry install --no-root
cd ui && pnpm install && cd ..
```

### Development

```bash
# Frontend development with hot reload
cd ui && pnpm run dev

# Watch mode for automatic rebuilding
cd ui && pnpm run watch

# Development server with symlink (for ComfyUI integration)
./dev_server.sh
```

### Building

```bash
# Build frontend for production
cd ui && pnpm run build

# TypeScript type checking
cd ui && pnpm run typecheck
```

### Testing & Quality

#### Frontend Testing

```bash
# Run frontend tests
cd ui && pnpm run test

# Run tests in watch mode
cd ui && pnpm run test:watch

# Lint code
cd ui && pnpm run lint

# Fix linting issues
cd ui && pnpm run lint:fix

# Format code
cd ui && pnpm run format
```

#### Python Backend Testing

```bash
# Install development dependencies
poetry install --with dev

# Run all Python tests
poetry run pytest

# Run tests with coverage
poetry run pytest --cov=src --cov-report=html

# Run specific test file
poetry run pytest tests/domain/entities/test_model.py

# Run tests matching pattern
poetry run pytest -k "test_model"
```

## Testing Strategy

### Testing Philosophy

- **Test-Driven Development**: Write tests before implementation
- **Layered Testing**: Unit tests for domain logic, integration tests for adapters
- **Real Browser Testing**: Use Chrome MCP for UI validation
- **Continuous Testing**: Run tests frequently during development

### Test Organization

```
tests/
├── unit/                    # Pure unit tests (no external dependencies)
├── integration/             # Integration tests (with real dependencies)
├── adapters/
│   ├── driven/             # Infrastructure adapter tests
│   └── driving/            # API/UI adapter tests
└── domain/                 # Domain logic tests
```

### Testing Best Practices

#### Writing Testable Code

1. **Use Dependency Injection**: Makes mocking easier
2. **Separate Pure Functions**: Test business logic without I/O
3. **Mock External Dependencies**: Use `unittest.mock.MagicMock`
4. **Test Error Cases**: Include validation and error handling tests
5. **Use Fixtures**: Share test setup with pytest fixtures

#### Example Test Structure

```python
import pytest
from unittest.mock import MagicMock
from src.domain.services.output_service import OutputService

class TestOutputService:
    @pytest.fixture
    def mock_repository(self):
        return MagicMock()
    
    @pytest.fixture
    def service(self, mock_repository):
        return OutputService(mock_repository)
    
    def test_get_all_outputs_success(self, service, mock_repository):
        # Arrange
        mock_repository.scan_output_directory.return_value = []
        
        # Act
        result = service.get_all_outputs()
        
        # Assert
        assert result == []
        mock_repository.scan_output_directory.assert_called_once()
```

### Troubleshooting Common Issues

#### Environment Issues

**Poetry/Python Problems**:
```bash
# Ensure correct Python version
poetry env use python3
poetry env info
poetry install --with dev

# Fallback to virtual environment
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

**TypeScript Build Errors**:
```bash
# Remove unused imports and build
cd ui && pnpm run build
```

#### Quick Validation

```bash
# Test basic imports
python3 -c "from src.domain.entities.base import Entity; print('✓ Imports work')"

# Test service creation
python3 -c "
from unittest.mock import MagicMock
from src.domain.services.output_service import OutputService
service = OutputService(MagicMock())
print('✓ Service creation works')
"
```

#### Debugging Strategies

1. **Run Single Test**: `poetry run pytest tests/specific_test.py::test_function -v`
2. **Add Debug Output**: Use `print()` or `pytest.set_trace()`
3. **Check Mock Calls**: Verify `mock.assert_called_with()` and `mock.call_args_list`
4. **Isolate Dependencies**: Test each layer separately
5. **Use Test Doubles**: Create simple test implementations

#### Performance Optimization

```bash
# Run tests in parallel
poetry run pytest -n auto

# Run only fast tests
poetry run pytest -m "not slow"

# Skip integration tests for quick feedback
poetry run pytest -m "unit"
```

## Build Output

- Frontend builds to `dist/asset_manager/` directory
- Localization files served from `dist/locales/`
- ComfyUI serves assets via registered web routes

## ComfyUI Registry Integration

### Publishing Configuration

The extension is configured for ComfyUI Registry publishing in `pyproject.toml`:

```toml
[tool.comfy]
PublisherId = "rodpl"
DisplayName = "ComfyUI Asset Manager"
Icon = ""
includes = ["dist/"]  # Include built frontend assets
```

### Publishing Commands

```bash
# Install comfy-cli for publishing
pip install comfy-cli

# Publish to ComfyUI Registry
comfy-cli publish

# Update version and republish
# 1. Update version in pyproject.toml
# 2. Run comfy-cli publish again
```

### Registry Features

- Automatic dependency management
- Version control and updates
- User-friendly installation via ComfyUI Manager
- Metadata display in registry listings

## Development Workflow Best Practices

### Before Starting Development

1. **Environment Setup Verification**:
```bash
# Verify Python environment
python3 --version
poetry --version

# Set up Poetry environment
poetry env use python3
poetry install --with dev

# Verify frontend environment
cd ui
pnpm --version
pnpm install
cd ..
```

2. **Dependency Management**:
- Always add new Python dependencies to `pyproject.toml`
- Add test-specific dependencies to `[tool.poetry.group.dev.dependencies]`
- For external libraries (PIL, aiohttp), add to both main and dev dependencies if used in tests
- Run `poetry install --with dev` after adding dependencies

3. **Pre-Development Checks**:
```bash
# Test basic imports work
python3 -c "from src.domain.entities.base import Entity; print('✓ Imports work')"

# Build frontend to catch TypeScript errors early
cd ui && pnpm run build && cd ..

# Run existing tests to ensure nothing is broken
poetry run pytest --tb=short
```

### During Development

1. **Test-Driven Development**:
- Write failing tests first
- Implement minimal code to make tests pass
- Refactor while keeping tests green

2. **Incremental Testing**:
```bash
# Test individual components as you build them
poetry run pytest tests/domain/ -v
poetry run pytest tests/adapters/driven/ -v
poetry run pytest tests/adapters/driving/ -v
```

3. **Frontend-Backend Integration**:
- Build frontend after API changes: `cd ui && pnpm run build`
- Test API endpoints with simple Python scripts before frontend integration
- Use browser dev tools to debug API calls

### After Implementation

1. **Comprehensive Testing**:
```bash
# Run all tests
poetry run pytest

# Check test coverage
poetry run pytest --cov=src --cov-report=html

# Test frontend build
cd ui && pnpm run build && pnpm run typecheck
```

2. **Integration Verification**:
```bash
# Test that all services can be created
python3 -c "
from src.container import get_container
container = get_container()
print('✓ Container works')
try:
    service = container.get_output_service()
    print('✓ Output service works')
except Exception as e:
    print(f'✗ Output service failed: {e}')
"
```

3. **Documentation Updates**:
- Update API documentation if endpoints changed
- Update README if new dependencies were added
- Update steering docs if new patterns were established

### Troubleshooting Checklist

When tests fail, check in this order:

1. **Environment Issues**:
   - [ ] Poetry environment is active and correct
   - [ ] All dependencies are installed (`poetry install --with dev`)
   - [ ] Python version is compatible (>=3.12)

2. **Import Issues**:
   - [ ] All new modules are properly structured with `__init__.py`
   - [ ] Import paths are correct relative to project root
   - [ ] No circular imports

3. **Dependency Issues**:
   - [ ] External libraries are in `pyproject.toml`
   - [ ] Test dependencies are in dev group
   - [ ] Version constraints are compatible

4. **Code Issues**:
   - [ ] All required parameters are provided to constructors
   - [ ] Mock objects are configured correctly
   - [ ] Test data matches expected formats

5. **Build Issues**:
   - [ ] TypeScript errors are resolved
   - [ ] Unused imports are removed
   - [ ] Frontend builds successfully before testing backend

## Technology Integration Patterns

### Frontend-Backend Communication

```typescript
// Type-safe API client with consistent error handling
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class AssetManagerApiClient {
  private baseUrl = '/asset_manager';
  
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    const result: ApiResponse<T> = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Unknown API error');
    }
    return result.data!;
  }
  
  // Similar implementation for post, put, delete methods
}
```

### State Management Patterns

```typescript
// Use React Context for global state management
// See react-patterns.md for detailed implementation examples
interface AssetManagerState {
  models: Model[];
  folders: Folder[];
  outputs: Output[];
  loading: boolean;
  error: string | null;
}

// Implement context provider with actions for state updates
// Full implementation available in react-patterns.md
```

### Performance Monitoring

```python
# Backend performance monitoring with decorators
from functools import wraps
import time

def monitor_performance(operation_name: str):
    """Decorator to monitor function performance"""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start_time
                logger.info(f"{operation_name} completed in {duration:.2f}s")
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start_time
                logger.info(f"{operation_name} completed in {duration:.2f}s")
        
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    return decorator
```

### Build Optimization

```typescript
// Vite configuration for optimal builds
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  
  build: {
    // Optimize for ComfyUI integration
    outDir: '../dist/asset_manager',
    emptyOutDir: true,
    
    // Code splitting for better loading
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['./src/utils/i18n.ts'],
        }
      }
    },
    
    // Optimize bundle size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  
  // Development optimizations
  server: {
    hmr: {
      overlay: false // Don't block ComfyUI interface
    }
  },
  
  // Path resolution for clean imports
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@features': resolve(__dirname, 'src/features'),
      '@utils': resolve(__dirname, 'src/utils')
    }
  }
});
```

This technology stack ensures optimal performance, maintainability, and integration with ComfyUI while supporting modern development practices and tooling.
