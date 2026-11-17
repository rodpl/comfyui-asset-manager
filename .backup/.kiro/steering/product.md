---
inclusion: always
---

# Product Guidelines

## Product Vision

ComfyUI Asset Manager is a comprehensive asset management extension that consolidates local asset organization, model discovery/download, and output gallery management into ComfyUI's sidebar interface.

## Core Features & Implementation Priorities

### 1. Local Asset Management (Primary Feature)

- **Asset Discovery**: Automatic scanning using ComfyUI's `folder_paths` system
- **Visual Grid**: Thumbnail-based browsing with metadata overlay
- **Search & Filter**: Real-time filtering by type, size, date, tags
- **Drag & Drop**: Direct integration with ComfyUI canvas via `app.graph`
- **Metadata Editing**: In-place editing with persistence

### 2. Model Browser (Secondary Feature)

- **Platform Integration**: CivitAI and HuggingFace API integration
- **Search Interface**: Unified search across platforms with filtering
- **Download Management**: Progress tracking with ComfyUI folder integration
- **Preview System**: Model cards with images, descriptions, ratings

### 3. Output Gallery (Tertiary Feature)

- **Image Gallery**: Thumbnail grid of generated outputs
- **Workflow Preservation**: Extract and reload generation parameters
- **Metadata Display**: Show model, settings, and generation data
- **Batch Operations**: Multi-select for organization and export

## Architecture Requirements

### ComfyUI Integration Patterns

- **Extension Registration**: Use `NODE_CLASS_MAPPINGS` and `WEB_DIRECTORY`
- **Sidebar Integration**: Register via `app.extensionManager.registerSidebarTab()`
- **API Endpoints**: Prefix all routes with `/asset_manager/`
- **Theme Integration**: Use ComfyUI CSS variables for consistent styling
- **Feature Flags**: Implement capability negotiation for backward compatibility

### Code Architecture

- **Hexagonal Architecture**: Clean separation of domain and infrastructure
- **Port/Adapter Pattern**: Abstract interfaces for testability
- **Frontend**: React + TypeScript with tabbed interface
- **Backend**: Python with aiohttp integration
- **API Design**: RESTful endpoints with consistent JSON responses

## Development Standards

### MVP Development Approach

- **MVP First**: Implement core functionality before enhancements
- **Frontend-First**: Build UI with mocked data, then integrate backend
- **Task Structure**: Main tasks (complete MVP features) with frontend/backend subtasks
- **Incremental Testing**: Test each feature as implemented
- **Server Restart Protocol**: Request restart after backend changes, continue immediately after frontend changes

### Code Quality Requirements

- **Theme Compatibility**: Support light/dark themes automatically
- **Performance**: Handle large collections (1000+ items) efficiently
- **Error Handling**: Graceful degradation with meaningful messages
- **Accessibility**: Keyboard navigation and screen reader support
- **Testing**: Use Chrome MCP for UI testing, pytest for backend testing

### Technical Constraints

- **ComfyUI Compatibility**: Support current and recent ComfyUI versions
- **Resource Usage**: Minimize memory and CPU impact
- **File System**: Respect ComfyUI's folder structure and permissions
- **Network**: Handle offline scenarios and API failures gracefully

## User Experience Principles

### Design Language

- **Native Feel**: Match ComfyUI's visual design and interaction patterns
- **Minimal Disruption**: Integrate seamlessly without workflow interruption
- **Visual Hierarchy**: Clear information architecture with intuitive navigation
- **Performance**: Responsive interactions with large asset collections

### Interaction Patterns

- **One-Click Operations**: Minimize steps for common tasks
- **Drag & Drop**: Direct asset-to-canvas workflow integration
- **Context Awareness**: Show relevant actions based on selection
- **Batch Operations**: Efficient multi-item management

## Implementation Phases

### Phase 1: Local Asset Management

1. Basic folder scanning and model detection
2. Grid-based visual interface with thumbnails
3. Search and filtering functionality
4. Drag-and-drop to ComfyUI canvas
5. Basic metadata display and editing

### Phase 2: Model Browser Integration

1. CivitAI API integration with search
2. Model card display with previews
3. Download functionality with progress
4. HuggingFace integration
5. Download queue management

### Phase 3: Output Gallery

1. Output directory scanning
2. Image gallery with thumbnails
3. Metadata extraction and display
4. Workflow loading functionality
5. Batch operations and export
