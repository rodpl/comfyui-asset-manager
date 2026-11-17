# Design Document

## Overview

The simplified output gallery feature extends the existing ComfyUI Asset Manager with a visual interface for viewing and managing generated images. This feature integrates seamlessly into the existing tabbed architecture, providing users with a gallery view of their ComfyUI outputs alongside the existing Local Assets and Model Browser tabs.

The design follows the established hexagonal architecture pattern, implementing new domain services and adapters while reusing existing infrastructure components. The frontend leverages the existing React/TypeScript structure with consistent styling and user experience patterns.

## Architecture

### High-Level Architecture

The output gallery follows the same hexagonal architecture pattern as the existing asset management features:

```
┌────────────────────────────────────────────────────────────────┐
│                       Frontend (React)                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  LocalAssetsTab │  │ ModelBrowserTab │  │   OutputsTab    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                     Web API Adapter                            │
│                 /asset_manager/outputs/*                       │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                      Domain Services                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  FolderService  │  │  ModelService   │  │  OutputService  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                       Repository Ports                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │FolderRepository │  │ ModelRepository │  │OutputRepository │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                    Infrastructure Adapters                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ComfyUIFolderAdap│  │FilesystemModel  │  │FilesystemOutput │ │
│  │ter              │  │Adapter          │  │Adapter          │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

### Domain Model

#### Output Entity

```python
@dataclass
class Output:
    """Represents a generated output image from ComfyUI."""
    id: str
    filename: str
    file_path: str
    file_size: int
    created_at: datetime
    modified_at: datetime
    image_width: int
    image_height: int
    file_format: str  # png, jpg, jpeg, webp
    workflow_metadata: Optional[ComfyUIWorkflowMetadata] = None
    thumbnail_path: Optional[str] = None

@dataclass
class ComfyUIWorkflowMetadata:
    """ComfyUI-specific workflow metadata extracted from generated images."""
    workflow: Optional[Dict[str, Any]] = None  # Full workflow JSON
    prompt: Optional[str] = None  # Text prompt used
    seed: Optional[int] = None  # Generation seed
    model: Optional[str] = None  # Model used
    steps: Optional[int] = None  # Sampling steps
    cfg_scale: Optional[float] = None  # CFG scale
    sampler: Optional[str] = None  # Sampler used
    scheduler: Optional[str] = None  # Scheduler used
```

#### Output Value Objects

```python
@dataclass(frozen=True)
class ImageDimensions:
    width: int
    height: int

    @property
    def aspect_ratio(self) -> float:
        return self.width / self.height if self.height > 0 else 1.0

@dataclass(frozen=True)
class FileInfo:
    size: int
    format: str
    created_at: datetime
    modified_at: datetime

    @property
    def size_formatted(self) -> str:
        """Return human-readable file size."""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"
```

## Components and Interfaces

### Frontend Components

#### OutputsTab Component

- **Purpose**: Main container for the output gallery interface
- **Responsibilities**:
  - Manage gallery state (loading, error handling)
  - Coordinate between toolbar and gallery components
  - Handle image selection and modal display
- **Props**: None (root component)
- **State**:
  - `outputs: Output[]`
  - `loading: boolean`
  - `error: string | null`
  - `selectedOutput: Output | null`
  - `viewMode: 'grid' | 'list'`

#### OutputGallery Component

- **Purpose**: Display outputs in grid or list format
- **Responsibilities**:
  - Render output thumbnails/items
  - Handle user interactions (click, context menu)
  - Support keyboard navigation
- **Props**:
  - `outputs: Output[]`
  - `viewMode: 'grid' | 'list'`
  - `onOutputSelect: (output: Output) => void`
  - `onContextMenu: (output: Output, event: MouseEvent) => void`

#### OutputCard Component

- **Purpose**: Individual output item display
- **Responsibilities**:
  - Display thumbnail and metadata
  - Handle hover states and interactions
  - Show loading states for thumbnails
- **Props**:
  - `output: Output`
  - `viewMode: 'grid' | 'list'`
  - `onClick: () => void`
  - `onContextMenu: (event: MouseEvent) => void`

#### OutputModal Component

- **Purpose**: Full-size image viewer with details
- **Responsibilities**:
  - Display full-resolution image
  - Show detailed metadata including workflow information
  - Provide workflow loading functionality when metadata is available
  - Support keyboard navigation (ESC to close, arrow keys for navigation)
- **Props**:
  - `output: Output | null`
  - `isOpen: boolean`
  - `onClose: () => void`
  - `onLoadWorkflow: (output: Output) => void`
  - `onSystemAction: (action: 'open' | 'showInFolder' | 'copyPath', output: Output) => void`

#### OutputContextMenu Component

- **Purpose**: Right-click context menu for output actions
- **Responsibilities**:
  - Display context-sensitive actions for selected outputs
  - Handle system integration operations
  - Provide consistent positioning and keyboard support
- **Props**:
  - `output: Output | null`
  - `isVisible: boolean`
  - `position: { x: number; y: number }`
  - `onAction: (action: string, output: Output) => void`
  - `onClose: () => void`

#### EmptyState Component

- **Purpose**: Display appropriate message when no outputs are available
- **Responsibilities**:
  - Show helpful guidance when output directory is empty
  - Provide action suggestions (generate images, check directory)
  - Display error-specific messages for directory access issues
- **Props**:
  - `type: 'empty' | 'error' | 'loading'`
  - `message?: string`
  - `onRetry?: () => void`

#### OutputToolbar Component

- **Purpose**: Gallery controls and view options
- **Responsibilities**:
  - View mode toggle (grid/list)
  - Sort options
  - Refresh button
- **Props**:
  - `viewMode: 'grid' | 'list'`
  - `onViewModeChange: (mode: 'grid' | 'list') => void`
  - `sortBy: string`
  - `onSortChange: (sortBy: string) => void`
  - `onRefresh: () => void`

### Backend Components

#### OutputService (Domain Service)

- **Purpose**: Business logic for output management
- **Responsibilities**:
  - Coordinate output scanning and retrieval
  - Apply business rules for output filtering and sorting
  - Handle output metadata operations
  - Manage gallery view state and preferences
- **Dependencies**: `OutputRepositoryPort`

#### OutputRepositoryPort (Driven Port)

- **Purpose**: Abstract interface for output persistence
- **Methods**:
  - `scan_output_directory() -> List[Output]`
  - `get_output_by_id(output_id: str) -> Optional[Output]`
  - `get_outputs_by_date_range(start: datetime, end: datetime) -> List[Output]`
  - `get_outputs_sorted(sort_by: str, ascending: bool) -> List[Output]`

#### FilesystemOutputAdapter (Driven Adapter)

- **Purpose**: File system implementation of output repository
- **Responsibilities**:
  - Scan ComfyUI output directory (default: ./output/ or from ComfyUI config)
  - Extract image metadata (dimensions, format)
  - Extract ComfyUI workflow metadata from PNG files
  - Generate thumbnails for performance
  - Monitor directory changes (future enhancement)

#### ComfyUIOutputAdapter (Driven Adapter)

- **Purpose**: ComfyUI-specific output operations
- **Responsibilities**:
  - Determine ComfyUI output directory from configuration
  - Parse ComfyUI workflow metadata from generated images
  - Provide workflow loading functionality via ComfyUI's internal APIs
  - Handle ComfyUI-specific image formats and metadata
  - Validate workflow compatibility before loading

#### SystemIntegrationAdapter (Driven Adapter)

- **Purpose**: Cross-platform system integration operations
- **Responsibilities**:
  - Open files in default system viewers
  - Show files in system file explorers (Finder/Explorer/Nautilus)
  - Copy text to system clipboard
  - Handle platform-specific file operations securely
  - Validate file permissions and accessibility

#### OutputManagementPort (Driving Port)

- **Purpose**: API interface for output operations
- **Methods**:
  - `get_all_outputs(sort_by: Optional[str] = None, ascending: bool = True) -> List[Output]`
  - `get_output_details(output_id: str) -> Output`
  - `refresh_outputs() -> List[Output]`
  - `load_workflow_to_comfyui(output_id: str) -> bool`
  - `open_in_system_viewer(output_id: str) -> bool`
  - `show_in_folder(output_id: str) -> bool`
  - `copy_file_path(output_id: str) -> str`

#### SystemIntegrationPort (Driving Port)

- **Purpose**: API interface for system-level operations
- **Methods**:
  - `open_file_in_default_viewer(file_path: str) -> bool`
  - `show_file_in_explorer(file_path: str) -> bool`
  - `copy_to_clipboard(text: str) -> bool`
  - `validate_file_access(file_path: str) -> bool`

## Data Models

### API Response Models

```typescript
interface OutputResponse {
  id: string;
  filename: string;
  filePath: string;
  fileSize: number;
  createdAt: string; // ISO datetime
  modifiedAt: string; // ISO datetime
  imageWidth: number;
  imageHeight: number;
  fileFormat: string;
  thumbnailPath?: string;
  workflowMetadata?: Record<string, any>;
}

interface OutputsListResponse {
  success: boolean;
  data: OutputResponse[];
  total: number;
  error?: string;
}

interface SystemActionResponse {
  success: boolean;
  error?: string;
  data?: {
    filePath?: string; // For copy path action
    opened?: boolean;  // For open/show actions
  };
}

interface WorkflowLoadResponse {
  success: boolean;
  error?: string;
  data?: {
    nodesLoaded: number;
    missingNodes?: string[];
    warnings?: string[];
  };
}
```

### API Endpoints

```
GET    /asset_manager/outputs                    # Get all outputs with optional sorting
GET    /asset_manager/outputs/{id}              # Get specific output details
POST   /asset_manager/outputs/refresh           # Trigger directory rescan
POST   /asset_manager/outputs/{id}/load-workflow # Load workflow into ComfyUI
POST   /asset_manager/outputs/{id}/open         # Open in system viewer
POST   /asset_manager/outputs/{id}/show-folder  # Show in file explorer
POST   /asset_manager/outputs/{id}/copy-path    # Copy file path to clipboard
```

### Frontend Type Definitions

```typescript
interface Output {
  id: string;
  filename: string;
  filePath: string;
  fileSize: number;
  createdAt: Date;
  modifiedAt: Date;
  imageWidth: number;
  imageHeight: number;
  fileFormat: string;
  thumbnailPath?: string;
  workflowMetadata?: WorkflowMetadata;
}

interface WorkflowMetadata {
  workflow?: Record<string, any>;
  prompt?: string;
  seed?: number;
  model?: string;
  steps?: number;
  cfgScale?: number;
  sampler?: string;
  scheduler?: string;
}

type ViewMode = "grid" | "list";
type SortOption =
  | "date-desc"
  | "date-asc"
  | "name-asc"
  | "name-desc"
  | "size-desc"
  | "size-asc";

type ContextMenuAction = 
  | "openInViewer"
  | "showInFolder" 
  | "copyPath"
  | "loadWorkflow";

interface OutputsState {
  outputs: Output[];
  loading: boolean;
  error: string | null;
  viewMode: ViewMode;
  sortBy: SortOption;
  selectedOutput: Output | null;
  contextMenu: {
    visible: boolean;
    position: { x: number; y: number };
    output: Output | null;
  };
}

interface SystemActionResponse {
  success: boolean;
  error?: string;
}
```

## Error Handling

### Frontend Error Handling

- **Network Errors**: Display retry mechanism with user-friendly messages
- **Loading States**: Show skeleton loaders during data fetching
- **Empty States**: Provide context-specific messages based on the situation:
  - No outputs generated yet: "No outputs found. Generate some images to see them here!"
  - Directory access error: "Unable to access output directory. Please check permissions."
  - Scanning in progress: "Scanning for outputs..."
- **Image Loading Errors**: Fallback to placeholder images for broken thumbnails
- **System Operation Errors**: Show toast notifications for failed system operations (file not found, permission denied)
- **Workflow Loading Errors**: Display specific error messages when workflow cannot be loaded (missing nodes, incompatible format)

### Backend Error Handling

- **Directory Access Errors**: Return appropriate HTTP status codes with error messages
- **File Permission Errors**: Log errors and return generic error responses
- **Image Processing Errors**: Skip problematic files and continue processing
- **Invalid File Formats**: Filter out unsupported files during scanning

### Error Response Format

```json
{
  "success": false,
  "error": "Human-readable error message",
  "error_type": "directory_not_found | permission_denied | invalid_format",
  "details": "Additional technical details for debugging"
}
```

## Testing Strategy

### Frontend Testing

- **Unit Tests**: Test individual components with React Testing Library
- **Integration Tests**: Test component interactions and API integration
- **Visual Tests**: Ensure consistent styling and responsive behavior
- **Accessibility Tests**: Verify keyboard navigation and screen reader support

### Backend Testing

- **Unit Tests**: Test domain services and adapters in isolation
- **Integration Tests**: Test file system operations with temporary directories
- **Contract Tests**: Verify API endpoints match frontend expectations
- **Performance Tests**: Ensure efficient handling of large output directories

### Test Data Strategy

- **Mock Data**: Use consistent mock outputs for frontend development
- **Test Fixtures**: Create sample image files for integration testing
- **Edge Cases**: Test with various image formats, sizes, and edge conditions

## Performance Considerations

### Frontend Optimizations

- **Virtual Scrolling**: Implement for large output collections
- **Lazy Loading**: Load thumbnails only when visible
- **Image Caching**: Cache thumbnails in browser storage
- **Debounced Refresh**: Prevent excessive API calls during rapid interactions

### Backend Optimizations

- **Thumbnail Generation**: Create and cache thumbnails for faster loading
- **Directory Caching**: Cache directory scan results with invalidation
- **Incremental Scanning**: Only scan for new/changed files on refresh
- **Async Processing**: Use async operations for file system access

### Scalability Considerations

- **Pagination**: Support for large output collections (future enhancement)
- **Filtering**: Server-side filtering for better performance
- **Compression**: Optimize thumbnail sizes for network efficiency

## Security Considerations

### File System Access

- **Path Validation**: Ensure all file paths are within allowed directories
- **Permission Checks**: Verify read permissions before file operations
- **Sanitization**: Sanitize file names and paths in API responses

### API Security

- **Input Validation**: Validate all API parameters
- **Rate Limiting**: Prevent abuse of refresh operations
- **Error Information**: Avoid exposing sensitive system information in errors

## Design Decisions and Rationales

### Gallery View Design

- **Grid Layout as Primary View**: Chosen to maximize visual information density for image browsing
  - **Rationale**: Images are inherently visual; thumbnails provide immediate recognition
  - **Requirement Addressed**: 1.2 - "system SHALL show image thumbnails in a responsive grid layout"

- **List View as Alternative**: Provides detailed metadata view for users who prefer information-dense layouts
  - **Rationale**: Some users prefer tabular data presentation, especially when managing large collections
  - **Requirement Addressed**: 5.4 - "system SHALL support both grid and list view modes"

### Automatic Directory Scanning

- **Proactive Scanning**: Automatically scan output directory on tab activation and provide manual refresh
  - **Rationale**: Reduces user friction while providing control for power users
  - **Requirement Addressed**: 2.1, 2.2 - automatic detection and inclusion of new images

- **ComfyUI Configuration Integration**: Use ComfyUI's output directory configuration
  - **Rationale**: Respects user's existing ComfyUI setup and folder structure
  - **Requirement Addressed**: 2.6 - "use ComfyUI's configuration or default to standard output folder"

### Context Menu Design

- **Right-Click Context Menus**: Standard desktop application pattern for file operations
  - **Rationale**: Familiar interaction pattern that doesn't clutter the interface
  - **Requirement Addressed**: 6.1 - "provide a context menu with basic actions"

- **System Integration Actions**: Direct integration with OS-level file operations
  - **Rationale**: Leverages existing user workflows and preferred applications
  - **Requirements Addressed**: 6.2, 6.3, 6.4 - system viewer, copy path, show in folder

### Workflow Metadata Integration

- **PNG Metadata Extraction**: Parse ComfyUI workflow data embedded in generated images
  - **Rationale**: Preserves generation context without requiring separate metadata files
  - **Requirement Addressed**: 2.4, 3.5 - extract and display workflow metadata

- **Workflow Loading with Validation**: Load workflows back into ComfyUI with compatibility checks
  - **Rationale**: Enables workflow reuse while preventing errors from missing dependencies
  - **Requirement Addressed**: 3.6 - "provide options to load the workflow back into ComfyUI"

### Error Handling Strategy

- **Graceful Degradation**: Continue operation when individual files fail to load
  - **Rationale**: Don't let single file issues break the entire gallery experience
  - **Requirement Addressed**: 2.5 - "display appropriate error message" for directory access

- **Context-Specific Empty States**: Different messages based on the actual situation
  - **Rationale**: Provides actionable guidance rather than generic error messages
  - **Requirement Addressed**: 1.4 - "display an appropriate empty state message"

## Integration Points

### ComfyUI Integration

- **Output Directory**: Use ComfyUI's default output directory or read from configuration
  - **Design Rationale**: Automatically discovers outputs without manual configuration
  - **Implementation**: Integrate with ComfyUI's folder_paths system and configuration
- **File Monitoring**: Future integration with ComfyUI's file generation events
- **Workflow Metadata**: Extract workflow information from ComfyUI PNG metadata
  - **Design Rationale**: Preserves generation parameters for reproducibility and learning
  - **Implementation**: Parse PNG metadata chunks containing ComfyUI workflow JSON
- **Workflow Loading**: Provide functionality to load saved workflows back into ComfyUI
  - **Design Rationale**: Enables users to recreate or modify previous generations
  - **Implementation**: 
    - Extract workflow JSON from image metadata
    - Validate workflow compatibility (check for missing nodes/models)
    - Load workflow into ComfyUI's graph via `window.app.graph` API
    - Show confirmation dialog before loading to prevent accidental overwrites
    - Handle error cases gracefully (missing nodes, incompatible versions)
- **ComfyUI API Integration**: Use ComfyUI's internal APIs for workflow operations
  - **Design Rationale**: Ensures seamless integration with ComfyUI's existing functionality
  - **Implementation**: Leverage `window.app.graph`, `window.api`, and extension registration system

### Existing Asset Manager Integration

- **Consistent Styling**: Use existing CSS variables and component patterns
- **Shared Services**: Leverage existing API client and error handling
- **Navigation**: Integrate seamlessly with existing tab navigation

### System Integration

- **File Explorer**: Open containing folders using system APIs
  - **Design Rationale**: Provides quick access to file location for advanced file operations
  - **Implementation**: Cross-platform system calls (macOS: `open -R`, Windows: `explorer /select`, Linux: `xdg-open`)
- **Default Viewers**: Launch system image viewers for full-size viewing
  - **Design Rationale**: Leverages user's preferred image viewing applications with full feature sets
  - **Implementation**: System default application association handling
- **Clipboard**: Copy file paths to system clipboard
  - **Design Rationale**: Enables easy integration with other applications and workflows
  - **Implementation**: Browser Clipboard API with fallback for older browsers
- **Context Menu Integration**: Right-click context menus for intuitive access to system operations
  - **Design Rationale**: Follows standard desktop application patterns for file management
  - **Implementation**: Custom context menu component with proper positioning and keyboard support
