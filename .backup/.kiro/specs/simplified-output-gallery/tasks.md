# Implementation Plan

- [x] 1. Set up output gallery foundation

  - Create basic project structure for output gallery feature
  - Define TypeScript interfaces and types for output entities
  - Set up test infrastructure for both frontend and backend components
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 2. Basic output gallery display
- [x] 2.1 Frontend: Create OutputsTab with grid layout and mocked data

  - Implement main OutputsTab component following existing tab patterns
  - Create OutputGallery component supporting grid view mode
  - Build OutputCard component for displaying individual output items with thumbnails
  - Add EmptyState component with context-specific messages (no outputs, directory error, scanning)
  - Add loading states, error handling, and proper empty state handling
  - Use mocked output data that matches expected API contract
  - Write unit tests for all components including empty state scenarios
  - _Requirements: 1.1, 1.2, 1.4, 4.1, 4.3_

- [x] 2.2 Backend: Implement output scanning and API endpoints

  - Create FilesystemOutputAdapter for directory scanning and metadata extraction
  - Create ComfyUIOutputAdapter for ComfyUI-specific output directory discovery
  - Implement ComfyUI workflow metadata extraction from PNG files
  - Add API endpoints for getting outputs (/asset_manager/outputs) to WebAPIAdapter
  - Integrate OutputService into dependency injection container
  - Replace mocked data in OutputsTab with real API calls immediately
  - Write unit and integration tests for adapter and API endpoints
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 3. Full-size image viewing
- [x] 3.1 Frontend: Create OutputModal for detailed image viewing

  - Implement OutputModal component for displaying full-resolution images
  - Add detailed metadata display (filename, date, size, dimensions, workflow info)
  - Include keyboard navigation (ESC to close, arrow keys for navigation)
  - Add image zoom and pan functionality for large images
  - Include workflow loading button when metadata is available
  - Add confirmation dialog for workflow loading operations
  - Write unit tests for OutputModal component behavior and workflow loading
  - _Requirements: 1.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3.2 Backend: Add individual output details endpoint

  - Create API endpoint for getting individual output details
  - Implement thumbnail generation for performance optimization
  - Add support for extracting ComfyUI workflow metadata from images
  - Add endpoint for loading workflow back into ComfyUI
  - Include proper error handling for missing or corrupted files
  - Replace mocked data in OutputModal with real API calls immediately
  - Write integration tests for output details endpoint
  - _Requirements: 1.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 4. Gallery controls and view options
- [x] 4.1 Frontend: Build OutputToolbar with view controls

  - Create OutputToolbar component with view mode toggle (grid/list)
  - Implement list view mode for OutputGallery component
  - Add sort dropdown with options (date, name, size)
  - Include refresh button for manual output scanning
  - Add responsive design for mobile devices
  - Write unit tests for OutputToolbar component interactions
  - _Requirements: 4.3, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 4.2 Backend: Add sorting and filtering capabilities

  - Extend OutputService with sorting logic (date, name, size)
  - Add filtering capabilities for output types and date ranges
  - Implement refresh endpoint for triggering directory rescans
  - Add caching mechanism for improved performance
  - Replace mocked sorting/filtering in OutputToolbar with real API calls immediately
  - Write unit tests for sorting and filtering logic
  - _Requirements: 2.1, 2.2, 5.1, 5.2, 5.3_

- [x] 5. Context menu and system integration
- [x] 5.1 Frontend: Implement context menu with basic actions

  - Create OutputContextMenu component for right-click actions on outputs
  - Add "Copy File Path" action with clipboard integration using browser Clipboard API
  - Add "Open in System Viewer" action for launching default image viewer
  - Add "Show in Folder" action for opening file explorer to image location
  - Add "Load Workflow" action when workflow metadata is available
  - Implement proper context menu positioning and keyboard support (ESC to close)
  - Handle context menu dismissal on outside clicks and window events
  - Write unit tests for all context menu actions and positioning
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 5.2 Backend: Add system integration endpoints

  - Create SystemIntegrationAdapter for cross-platform system operations
  - Add API endpoints: /asset_manager/outputs/{id}/open, /show-folder, /copy-path
  - Implement platform-specific system calls (macOS: open -R, Windows: explorer /select, Linux: xdg-open)
  - Add proper error handling for system operation failures (file not found, permission denied)
  - Ensure security by validating file paths are within allowed directories
  - Add file permission and accessibility validation before operations
  - Replace mocked system actions in context menu with real API calls immediately
  - Write integration tests for all system operations across platforms
  - _Requirements: 6.2, 6.3, 6.4_

- [x] 6. ComfyUI workflow integration
- [x] 6.1 Frontend: Add workflow loading functionality

  - Add "Load Workflow" button to OutputModal for images with workflow metadata
  - Implement workflow loading using ComfyUI's internal APIs
  - Add confirmation dialog before loading workflow
  - Handle cases where workflow contains missing nodes or models
  - Write unit tests for workflow loading functionality
  - _Requirements: 3.5, 3.6_

- [x] 6.2 Backend: Implement workflow loading endpoint

  - Create API endpoint /asset_manager/outputs/{id}/load-workflow for loading workflows into ComfyUI
  - Integrate with ComfyUI's workflow loading system via window.app.graph API
  - Add validation for workflow compatibility (check for missing nodes and models)
  - Implement workflow JSON parsing and validation from PNG metadata
  - Handle errors gracefully when workflow cannot be loaded (missing dependencies, format issues)
  - Return detailed response with loaded nodes count and any warnings/errors
  - Replace mocked workflow loading with real ComfyUI integration immediately
  - Write integration tests for workflow loading with various scenarios
  - _Requirements: 3.6_

- [ ] 7. Performance optimizations and polish

  - Implement thumbnail caching in browser storage for faster subsequent loads
  - Add virtual scrolling for large output collections (1000+ images)
  - Include lazy loading for images not currently visible in viewport
  - Optimize API calls with debouncing for search and request deduplication
  - Add error boundaries for robust error handling in React components
  - Implement proper loading states for all async operations
  - Test performance with large numbers of output files and various image sizes
  - Validate accessibility with keyboard navigation and screen reader support
  - Test cross-platform system integration functionality
  - _Requirements: 1.2, 2.1, 4.3_

- [ ] 8. Integration testing and validation
  - Perform comprehensive end-to-end testing with Chrome MCP
  - Test all context menu actions in real ComfyUI environment
  - Validate workflow loading with various ComfyUI workflow formats
  - Test error handling scenarios (missing files, permission issues, network failures)
  - Verify consistent styling and behavior across different ComfyUI themes
  - Test responsive design on different screen sizes and devices
  - Validate empty state handling in various scenarios
  - Test sorting and filtering with large datasets
  - Verify system integration works across different operating systems
  - _Requirements: All requirements - comprehensive validation_
