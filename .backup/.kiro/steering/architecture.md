---
inclusion: always
---

# Architecture Guidelines

## Hexagonal Architecture (Ports and Adapters Pattern)

This project follows the Hexagonal Architecture pattern to ensure clean separation of concerns, testability, and maintainability. The architecture is specifically adapted for ComfyUI extension development with React frontend and Python backend integration.

### Core Principles

- **Isolation of Business Logic**: Domain core contains pure business logic without infrastructure dependencies
- **Dependency Inversion**: High-level modules don't depend on low-level modules; both depend on abstractions
- **Testability**: Business logic can be tested in isolation from infrastructure
- **Flexibility**: Infrastructure can be swapped without affecting business logic
- **ComfyUI Integration**: Architecture accommodates ComfyUI's extension system and APIs

### Architecture Layers

#### Domain Core (Center of Hexagon)

- **Entities**: Core business objects with identity
- **Value Objects**: Immutable objects that describe aspects of the domain
- **Domain Services**: Business logic that doesn't naturally fit in entities
- **Domain Events**: Represent something important that happened in the domain

#### Ports (Interfaces)

- **Driving Ports (Primary/Left-side)**: Define what the application can do
  - Implemented by domain services
  - Used by driving adapters
  - Example: `ModelManagementPort`, `FolderManagementPort`
- **Driven Ports (Secondary/Right-side)**: Define what the application needs
  - Implemented by driven adapters
  - Used by domain services
  - Example: `ModelRepositoryPort`, `ExternalMetadataPort`

#### Adapters (Infrastructure)

- **Driving Adapters (Primary)**: Translate external requests to domain operations
  - Web API controllers
  - CLI command handlers
  - Message queue consumers
- **Driven Adapters (Secondary)**: Implement infrastructure concerns
  - Database repositories
  - External API clients
  - File system handlers
  - Cache implementations

### Implementation Guidelines

#### Port Design

```python
from abc import ABC, abstractmethod

# Driving Port (Primary)
class ModelManagementPort(ABC):
    """Defines what the application can do with models"""
    @abstractmethod
    def get_models_in_folder(self, folder_id: str) -> List[Model]:
        pass

# Driven Port (Secondary)
class ModelRepositoryPort(ABC):
    """Defines what the application needs for model persistence"""
    @abstractmethod
    def find_all_in_folder(self, folder_id: str) -> List[Model]:
        pass
```

#### Service Implementation

```python
class ModelService(ModelManagementPort):
    """Domain service implementing driving port"""
    def __init__(self, model_repository: ModelRepositoryPort):
        self._model_repository = model_repository  # Depends on abstraction

    def get_models_in_folder(self, folder_id: str) -> List[Model]:
        return self._model_repository.find_all_in_folder(folder_id)
```

#### Adapter Implementation

```python
class FileSystemModelAdapter(ModelRepositoryPort):
    """Driven adapter implementing repository port"""
    def find_all_in_folder(self, folder_id: str) -> List[Model]:
        # Infrastructure-specific implementation
        pass

class WebAPIAdapter:
    """Driving adapter using domain services through ports"""
    def __init__(self, model_management: ModelManagementPort):
        self._model_management = model_management

    async def get_models(self, request):
        folder_id = request.match_info['folder_id']
        models = self._model_management.get_models_in_folder(folder_id)
        return web.json_response([model.to_dict() for model in models])

    def register_routes(self, app):
        """Register all routes with /asset_manager prefix"""
        app.router.add_get('/asset_manager/folders/{folder_id}/models', self.get_models)
```

### Dependency Injection

- Use constructor injection for dependencies
- Wire dependencies at application startup
- Consider using dependency injection containers for complex applications

### Testing Strategy

- **Unit Tests**: Test domain services in isolation using mock adapters
- **Integration Tests**: Test adapters against real infrastructure
- **Contract Tests**: Verify adapters correctly implement their ports

### API Guidelines

- **Endpoint Prefix**: All API endpoints must start with `/asset_manager/`
- **RESTful Design**: Follow REST conventions for resource naming and HTTP methods
- **Consistent Response Format**: Use consistent JSON response structures
- **Error Handling**: Provide meaningful error messages and appropriate HTTP status codes

### Benefits

- **Maintainability**: Clear separation of concerns
- **Testability**: Business logic can be tested without infrastructure
- **Flexibility**: Easy to swap implementations
- **Independence**: Domain logic is independent of frameworks and databases

### ComfyUI Integration Guidelines

#### Extension Registration

- **NODE_CLASS_MAPPINGS**: Register Python nodes with ComfyUI
- **WEB_DIRECTORY**: Register web assets directory for frontend serving
- **Extension Entry Point**: Use `__init__.py` for ComfyUI extension discovery

#### Frontend Integration

- **Sidebar Registration**: Use `window.app.extensionManager.registerSidebarTab()`
- **API Access**: Leverage `window.app.graph`, `window.api`, and `window.app.ui`
- **Feature Flags**: Implement capability negotiation for backward compatibility

#### ComfyUI Registry Publishing

- **Metadata Configuration**: Configure `[tool.comfy]` section in `pyproject.toml`
- **Asset Inclusion**: Include `dist/` directory for built frontend assets
- **Version Management**: Use semantic versioning for registry updates

#### ComfyUI-Specific Adapters

- **folder_paths Integration**: Use ComfyUI's model discovery system
- **Output Directory**: Read from ComfyUI configuration
- **Model Loading**: Integrate with ComfyUI's model loading pipeline

#### Documentation and Research

- **MCP Tools**: Use available MCP documentation tools during spec creation
- **Reference Examples**: Consult ComfyUI-Copilot and React Extension Template
- **API Validation**: Verify integration patterns against current ComfyUI documentation
- **Best Practices**: Follow proven patterns from the ComfyUI ecosystem

## MVP Development Approach

### Task Structure for Feature Development

When developing new features, tasks should be organized as Minimum Viable Product (MVP) with the following structure:

#### MVP Task Organization

- **Main Tasks**: Represent complete MVP features that deliver user value
- **Subtasks**: Break down implementation into manageable, sequential steps
- **Frontend-First Approach**: Start with frontend implementation using mocked data
- **Backend Integration**: Replace mocked data with real backend implementation

#### Standard Subtask Pattern

For features requiring both frontend and backend work:

1. **Frontend Subtask**:
   - Implement UI components and user interactions
   - Use mocked data that matches the expected API contract
   - Focus on user experience and visual design
   - Include basic error handling and loading states

2. **Backend Subtask**:
   - Implement domain services and repository adapters
   - Create API endpoints that match frontend expectations
   - Replace mocked data with real data integration immediately
   - Include proper error handling and validation
   - Ensure the MVP feature is fully functional and testable after completion

#### Task Organization Structure

- **Main Tasks (1, 2, 3, etc.)**: Complete MVP features that deliver user value
- **Subtasks (1.1, 1.2, 2.1, 2.2, etc.)**: Implementation steps within each MVP feature
  - **Frontend Subtasks**: UI implementation with mocked data
  - **Backend Subtasks**: Real data integration and API implementation
  - **Technical Subtasks**: Architecture, setup, or integration work

#### Technical/Architectural Tasks

Some tasks are purely technical or architectural and don't require frontend/backend separation:

- Setting up project structure
- Configuring build tools
- Creating shared types and interfaces
- Setting up testing infrastructure
- Performance optimizations
- Security implementations

#### MVP Principles

- **Deliver Value Early**: Each main task should provide tangible user value
- **Iterative Development**: Build core functionality first, enhance later
- **Testable Increments**: Each subtask should be independently testable
- **Clear Dependencies**: Subtasks should have clear dependency relationships
- **Minimal Scope**: Focus on essential functionality, avoid feature creep
- **Immediate Integration**: Backend subtasks must replace mocked data immediately, making each MVP task fully functional for testing and release

## Spec-Driven Development

### Workflow Integration

This architecture supports the spec-driven development workflow:

1. **Requirements Phase**: Define user stories and acceptance criteria
2. **Design Phase**: Create architectural design based on hexagonal principles
3. **Task Planning**: Break down into MVP tasks following the patterns above
4. **Implementation**: Execute tasks using the defined architecture patterns

### Documentation Integration

- Use MCP tools during spec creation to validate architectural decisions
- Reference ComfyUI documentation for integration patterns
- Ensure all architectural decisions align with ComfyUI's extension system

## Error Handling Architecture

### Error Handling Guidelines

- **Domain Exceptions**: Use custom exception hierarchy for business rule violations (see python-conventions.md)
- **API Error Responses**: Implement consistent error response format across all endpoints (see python-conventions.md)
- **Frontend Error Handling**: Use ComfyUI's notification system for user feedback (see react-patterns.md)
- **Error Boundaries**: Implement React error boundaries for robust UX (see react-patterns.md)

## Performance Architecture

### Performance Guidelines

- **Backend**: Use async/await patterns for I/O operations (see python-conventions.md)
- **Frontend**: Implement virtual scrolling and debounced search (see react-patterns.md)
- **Caching**: Implement TTL-based caching for expensive operations (see python-conventions.md)
- **Monitoring**: Use performance decorators to track operation timing (see tech.md)

## Security Architecture

### Input Validation

```python
# Validate all inputs at the adapter layer
from pydantic import BaseModel, validator

class ModelSearchRequest(BaseModel):
    query: str
    folder_id: str
    limit: int = 50
    
    @validator('query')
    def validate_query(cls, v):
        if len(v) > 100:
            raise ValueError('Search query too long')
        return v.strip()
    
    @validator('limit')
    def validate_limit(cls, v):
        if v > 1000:
            raise ValueError('Limit too high')
        return v
```

### Path Security

```python
# Prevent directory traversal attacks
import os
from pathlib import Path

class SecurePathValidator:
    def __init__(self, allowed_base_paths: List[str]):
        self.allowed_base_paths = [Path(p).resolve() for p in allowed_base_paths]
    
    def validate_path(self, file_path: str) -> Path:
        """Ensure path is within allowed directories"""
        resolved_path = Path(file_path).resolve()
        
        for base_path in self.allowed_base_paths:
            try:
                resolved_path.relative_to(base_path)
                return resolved_path
            except ValueError:
                continue
        
        raise SecurityError(f"Path not allowed: {file_path}")
```

This comprehensive architecture ensures robust, performant, and secure ComfyUI extension development while maintaining clean separation of concerns and testability.
