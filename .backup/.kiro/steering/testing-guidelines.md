---
inclusion: always
---

# Testing Guidelines

## Testing Philosophy

This project follows a comprehensive testing strategy that ensures reliability, maintainability, and confidence in both backend and frontend code. Testing is integrated into the development workflow and is essential for spec-driven development.

## Testing Pyramid

### Unit Tests (Foundation)
- **Purpose**: Test individual components in isolation
- **Scope**: Domain entities, services, utilities, React components
- **Tools**: pytest (Python), Vitest (TypeScript)
- **Coverage Target**: 80%+ for domain logic

### Integration Tests (Middle)
- **Purpose**: Test component interactions and API endpoints
- **Scope**: Adapter implementations, API routes, service integrations
- **Tools**: pytest with real dependencies, React Testing Library
- **Coverage Target**: 70%+ for critical paths

### End-to-End Tests (Top)
- **Purpose**: Test complete user workflows in real browser environment
- **Scope**: Full feature workflows, ComfyUI integration
- **Tools**: Chrome MCP exclusively
- **Coverage Target**: 100% of critical user journeys

## Backend Testing (Python)

### Test Organization

```
tests/
├── unit/
│   ├── domain/
│   │   ├── entities/          # Entity validation and behavior
│   │   ├── services/          # Business logic testing
│   │   └── ports/             # Interface contract testing
│   └── utils/                 # Utility function testing
├── integration/
│   ├── adapters/
│   │   ├── driven/            # Repository and external service tests
│   │   └── driving/           # API endpoint tests
│   └── services/              # Service integration tests
└── fixtures/                  # Shared test data and utilities
```

### Testing Patterns

#### Domain Entity Testing

```python
import pytest
from datetime import datetime
from src.domain.entities.model import Model, ModelType

class TestModel:
    @pytest.fixture
    def valid_model_data(self):
        return {
            "id": "model-123",
            "name": "Test Model",
            "file_path": "/models/test.safetensors",
            "file_size": 1024,
            "model_type": ModelType.CHECKPOINT,
            "hash": "abc123def456",
            "folder_id": "folder-1",
            "created_at": datetime.now(),
            "modified_at": datetime.now()
        }

    def test_model_creation_with_valid_data(self, valid_model_data):
        """Test that model can be created with valid data."""
        model = Model(**valid_model_data)
        assert model.name == "Test Model"
        assert model.model_type == ModelType.CHECKPOINT

    def test_model_validation_fails_with_invalid_data(self):
        """Test that model validation fails with invalid data."""
        with pytest.raises(ValueError):
            Model(id="", name="Test", file_path="", file_size=-1)

    @pytest.mark.parametrize("file_size,expected", [
        (1024, "1.0 KB"),
        (1048576, "1.0 MB"),
        (1073741824, "1.0 GB"),
    ])
    def test_file_size_formatting(self, valid_model_data, file_size, expected):
        """Test file size formatting for different sizes."""
        valid_model_data["file_size"] = file_size
        model = Model(**valid_model_data)
        assert model.formatted_file_size == expected
```

#### Service Testing

```python
import pytest
from unittest.mock import MagicMock, AsyncMock
from src.domain.services.model_service import ModelService
from src.domain.entities.model import Model

class TestModelService:
    @pytest.fixture
    def mock_repository(self):
        return MagicMock()

    @pytest.fixture
    def mock_metadata_service(self):
        return MagicMock()

    @pytest.fixture
    def service(self, mock_repository, mock_metadata_service):
        return ModelService(mock_repository, mock_metadata_service)

    @pytest.mark.asyncio
    async def test_get_models_in_folder_success(self, service, mock_repository):
        """Test successful retrieval of models in folder."""
        # Arrange
        expected_models = [MagicMock(spec=Model), MagicMock(spec=Model)]
        mock_repository.find_all_in_folder.return_value = expected_models

        # Act
        result = await service.get_models_in_folder("folder-1")

        # Assert
        assert result == expected_models
        mock_repository.find_all_in_folder.assert_called_once_with("folder-1")

    @pytest.mark.asyncio
    async def test_get_models_handles_repository_error(self, service, mock_repository):
        """Test that service handles repository errors gracefully."""
        # Arrange
        mock_repository.find_all_in_folder.side_effect = Exception("Database error")

        # Act & Assert
        with pytest.raises(Exception) as exc_info:
            await service.get_models_in_folder("folder-1")
        
        assert "Database error" in str(exc_info.value)
```

#### API Endpoint Testing

```python
import pytest
from aiohttp import web
from aiohttp.test_utils import AioHTTPTestCase, unittest_run_loop
from src.adapters.driving.web_api_adapter import WebAPIAdapter

class TestWebAPIAdapter(AioHTTPTestCase):
    async def get_application(self):
        """Create test application."""
        mock_service = MagicMock()
        adapter = WebAPIAdapter(mock_service)
        
        app = web.Application()
        adapter.register_routes(app)
        return app

    @unittest_run_loop
    async def test_get_models_endpoint(self):
        """Test GET /asset_manager/folders/{folder_id}/models endpoint."""
        # Arrange
        folder_id = "test-folder"
        expected_response = [{"id": "model-1", "name": "Test Model"}]
        
        # Act
        resp = await self.client.request(
            "GET", f"/asset_manager/folders/{folder_id}/models"
        )
        
        # Assert
        assert resp.status == 200
        data = await resp.json()
        assert isinstance(data, list)

    @unittest_run_loop
    async def test_get_models_handles_invalid_folder(self):
        """Test endpoint handles invalid folder ID."""
        resp = await self.client.request(
            "GET", "/asset_manager/folders/invalid/models"
        )
        
        assert resp.status == 404
```

### Test Configuration

```toml
# pyproject.toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py", "*_test.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = [
    "--strict-markers",
    "--strict-config",
    "--cov=src",
    "--cov-report=html",
    "--cov-report=term-missing",
    "--cov-fail-under=70"
]
markers = [
    "unit: Unit tests",
    "integration: Integration tests",
    "slow: Slow tests that make external calls"
]
```

## Frontend Testing (TypeScript/React)

### Test Organization

```
ui/src/
├── components/
│   └── __tests__/             # Component unit tests
├── features/
│   └── local-assets/
│       └── __tests__/         # Feature-specific tests
├── hooks/
│   └── __tests__/             # Custom hook tests
├── services/
│   └── __tests__/             # Service layer tests
└── utils/
    └── __tests__/             # Utility function tests
```

### Testing Patterns

#### Component Testing

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ModelCard } from '../ModelCard';
import type { Model } from '@/types/model';

// Mock ComfyUI globals
beforeEach(() => {
  global.window.app = {
    graph: { add: vi.fn() },
    ui: { settings: { addSetting: vi.fn() } },
    extensionManager: { registerSidebarTab: vi.fn() },
  };
});

describe('ModelCard', () => {
  const mockModel: Model = {
    id: 'test-model',
    name: 'Test Model',
    type: 'checkpoint',
    filePath: '/path/to/model.safetensors',
    fileSize: 1024,
    hash: 'abc123',
    folderId: 'folder-1',
  };

  it('renders model information correctly', () => {
    const onSelect = vi.fn();
    render(<ModelCard model={mockModel} onSelect={onSelect} />);
    
    expect(screen.getByText('Test Model')).toBeInTheDocument();
    expect(screen.getByText('1.0 KB')).toBeInTheDocument();
  });

  it('calls onSelect when card is clicked', async () => {
    const onSelect = vi.fn();
    render(<ModelCard model={mockModel} onSelect={onSelect} />);
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith(mockModel);
    });
  });

  it('handles drag start correctly', () => {
    const onDragStart = vi.fn();
    render(<ModelCard model={mockModel} onDragStart={onDragStart} />);
    
    const card = screen.getByRole('button');
    fireEvent.dragStart(card);
    
    expect(onDragStart).toHaveBeenCalledWith(mockModel);
  });
});
```

#### Hook Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { useAsyncData } from '../useAsyncData';

describe('useAsyncData', () => {
  it('handles successful data fetching', async () => {
    const mockData = { id: 1, name: 'Test' };
    const fetchFn = vi.fn().mockResolvedValue(mockData);
    
    const { result } = renderHook(() => useAsyncData(fetchFn));
    
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBe(null);
  });

  it('handles fetch errors', async () => {
    const errorMessage = 'Fetch failed';
    const fetchFn = vi.fn().mockRejectedValue(new Error(errorMessage));
    
    const { result } = renderHook(() => useAsyncData(fetchFn));
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(errorMessage);
  });
});
```

#### Service Testing

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ApiService } from '../ApiService';

// Mock fetch globally
global.fetch = vi.fn();

describe('ApiService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('fetches models successfully', async () => {
    const mockModels = [{ id: '1', name: 'Model 1' }];
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockModels,
    });

    const result = await ApiService.fetchModels('folder-1');

    expect(fetch).toHaveBeenCalledWith('/asset_manager/folders/folder-1/models');
    expect(result).toEqual(mockModels);
  });

  it('handles API errors', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(ApiService.fetchModels('invalid-folder')).rejects.toThrow(
      'API request failed: 404 Not Found'
    );
  });
});
```

### Test Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
});
```

## End-to-End Testing with Chrome MCP

### Testing Strategy

Chrome MCP is the exclusive tool for UI testing, providing real browser environment validation.

### Testing Workflow

1. **Setup**: Navigate to ComfyUI development server
2. **Baseline**: Capture initial state screenshot
3. **Execute**: Perform user interactions
4. **Verify**: Check expected changes occurred
5. **Document**: Capture final state and results

### Feature Testing Scenarios

#### Local Assets Feature Testing

```markdown
**Test Scenario**: Local Asset Management
1. Navigate to Local Assets tab
2. Verify folder structure loads correctly
3. Test folder navigation and breadcrumbs
4. Test model grid display and sorting options
5. Test search functionality with various queries
6. Test filtering by model type and size
7. Test metadata editing modal
8. Test drag-and-drop to ComfyUI canvas
9. Verify no console errors throughout workflow
```

#### Model Browser Feature Testing

```markdown
**Test Scenario**: Model Discovery and Download
1. Navigate to Model Browser tab
2. Test platform switching (CivitAI/HuggingFace)
3. Test search with different queries
4. Test filtering by model type and popularity
5. Test model card interactions and details modal
6. Test download functionality (if implemented)
7. Verify error handling for network failures
8. Test pagination or infinite scroll
```

#### Output Gallery Feature Testing

```markdown
**Test Scenario**: Output Management
1. Navigate to Outputs tab
2. Test image gallery display and thumbnails
3. Test image detail modal and metadata display
4. Test workflow loading from output metadata
5. Test sorting and filtering options
6. Test batch selection and operations
7. Test export functionality
8. Verify performance with large image collections
```

### Session Management

- **Clean State**: Start each session with clean browser state
- **Restart Policy**: Restart sessions when encountering issues
- **Documentation**: Capture screenshots at key testing points
- **Error Monitoring**: Always check console for JavaScript errors

## Testing in Development Workflow

### Pre-Implementation Testing

```bash
# Verify environment before starting
python3 -c "from src.domain.entities.base import Entity; print('✓ Imports work')"
cd ui && pnpm run build && cd ..
poetry run pytest --tb=short
```

### During Implementation

```bash
# Test individual components as built
poetry run pytest tests/domain/ -v
poetry run pytest tests/adapters/driven/ -v

# Frontend testing
cd ui && pnpm run test && cd ..
```

### Post-Implementation Testing

```bash
# Comprehensive test suite
poetry run pytest --cov=src --cov-report=html
cd ui && pnpm run test && pnpm run build && cd ..

# Integration verification
python3 -c "
from src.container import get_container
container = get_container()
print('✓ Container works')
"
```

### Server Restart Protocol

**When Backend Changes Require Restart**:
- Any file in `src/` directory
- `__init__.py` modifications
- `pyproject.toml` changes

**Process**:
1. Stop current testing
2. Request user to restart ComfyUI server
3. Wait for confirmation
4. Resume testing with Chrome MCP

## Quality Gates

### Code Coverage Requirements

- **Backend**: Minimum 70% overall, 80% for domain logic
- **Frontend**: Minimum 70% overall, 80% for critical components
- **Integration**: 100% coverage of API endpoints

### Test Performance

- **Unit Tests**: Must complete in under 30 seconds
- **Integration Tests**: Must complete in under 2 minutes
- **E2E Tests**: Document performance for optimization

### Continuous Integration

- All tests must pass before code review
- Coverage reports generated for every pull request
- E2E tests run on critical path changes
- Performance regression detection

This comprehensive testing strategy ensures high-quality, reliable code that integrates seamlessly with ComfyUI while providing excellent user experience.