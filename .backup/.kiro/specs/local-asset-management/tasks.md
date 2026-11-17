# Implementation Plan

- [x] 1. Set up hexagonal architecture foundation and domain entities

  - Create directory structure following hexagonal architecture pattern (domain, ports, adapters)
  - Implement core domain entities (Model, Folder, ExternalMetadata) with proper validation
  - Create base classes and common utilities for the domain layer
  - _Requirements: 8.4_

- [x] 2. Implement driving ports (primary interfaces)

  - Create ModelManagementPort interface with methods for model operations
  - Create FolderManagementPort interface with methods for folder operations
  - Define clear contracts for what the application can do
  - _Requirements: 8.1, 8.2_

- [x] 3. Implement driven ports (secondary interfaces)

  - Create ModelRepositoryPort for model data access abstraction
  - Create FolderRepositoryPort for folder data access abstraction
  - Create ExternalMetadataPort for external API abstraction
  - Create CachePort for caching abstraction
  - _Requirements: 8.3, 9.1, 9.5_

- [x] 4. Implement ComfyUI folder adapter

  - Create ComfyUIFolderAdapter that implements FolderRepositoryPort
  - Integrate with ComfyUI's folder_paths module to discover model folders
  - Handle different model types (checkpoints, loras, vae, etc.)
  - Write unit tests for folder discovery and structure mapping
  - _Requirements: 2.1, 2.3, 8.1_

- [x] 5. Implement file system model adapter

  - Create FileSystemModelAdapter that implements ModelRepositoryPort
  - Scan model files in ComfyUI folders and extract basic metadata
  - Generate model hashes for external API lookups
  - Implement search functionality across model files
  - Write unit tests for model scanning and metadata extraction
  - _Requirements: 1.1, 1.2, 4.1, 9.1_

- [x] 6. Implement domain services
- [x] 6.1 Create ModelService implementing ModelManagementPort

  - Implement get_models_in_folder using ModelRepositoryPort
  - Implement get_model_details with metadata enrichment
  - Implement search_models with filtering capabilities
  - Write unit tests using mock adapters
  - _Requirements: 1.1, 3.1, 4.1_

- [x] 6.2 Create FolderService implementing FolderManagementPort

  - Implement get_all_folders using FolderRepositoryPort
  - Implement get_folder_structure for hierarchical display
  - Write unit tests using mock adapters
  - _Requirements: 2.1, 2.2, 8.1_

- [x] 6.3 Create MetadataService for external enrichment

  - Implement metadata enrichment logic using external APIs
  - Implement caching strategy for performance optimization
  - Handle graceful fallback when external services are unavailable
  - Write unit tests with mocked external services
  - _Requirements: 9.1, 9.2, 9.4, 9.5_

- [x] 7. Implement external metadata adapters
- [x] 7.1 Create CivitAI metadata adapter

  - Implement CivitAIMetadataAdapter using ExternalMetadataPort
  - Create HTTP client for CivitAI API integration
  - Implement model hash-based metadata lookup
  - Handle API rate limiting and error responses
  - Write integration tests with real API calls
  - _Requirements: 9.1, 9.2, 9.4_

- [x] 7.2 Create HuggingFace metadata adapter

  - Implement HuggingFaceMetadataAdapter using ExternalMetadataPort
  - Create HTTP client for HuggingFace API integration
  - Implement model name-based metadata lookup
  - Handle API authentication and rate limiting
  - Write integration tests with real API calls
  - _Requirements: 9.1, 9.2, 9.4_

- [x] 8. Implement caching adapter

  - Create CacheAdapter implementing CachePort
  - Use file-based caching for metadata persistence
  - Implement TTL (time-to-live) for cache entries
  - Handle cache invalidation and cleanup
  - Write unit tests for cache operations
  - _Requirements: 9.2, 9.5_

- [x] 9. Implement Web API adapter (driving adapter)

  - Create WebAPIAdapter with dependency injection for domain services
  - Implement REST endpoints with /asset_manager prefix
  - Add GET /asset_manager/folders endpoint for folder listing
  - Add GET /asset_manager/folders/{folder_id}/models endpoint for model listing
  - Add GET /asset_manager/models/{model_id} endpoint for model details
  - Add GET /asset_manager/search endpoint for model search
  - Write integration tests for all endpoints
  - _Requirements: 8.1, 8.2, 1.1, 3.1, 4.1_

- [x] 10. Create dependency injection and application wiring

  - Create main application module that wires all dependencies
  - Configure dependency injection container for clean architecture
  - Register all adapters and services with proper interfaces
  - Add configuration management for external API keys and settings
  - Write integration tests for complete application setup
  - _Requirements: 8.4_

- [x] 11. Implement frontend folder navigation component

  - Create FolderNavigation React component with TypeScript interfaces
  - Implement folder tree display based on ComfyUI structure
  - Add folder selection and navigation functionality
  - Style component to match Stability Matrix reference design
  - Write component tests for folder navigation behavior
  - _Requirements: 2.1, 2.2_

- [x] 12. Implement frontend model grid component

  - Create ModelGrid React component for displaying models in grid layout
  - Implement responsive grid design similar to Stability Matrix
  - Add model thumbnails with fallback placeholder images
  - Implement loading states and skeleton components
  - Add drag-and-drop functionality for ComfyUI integration
  - Write component tests for grid rendering and interactions
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.1_

- [x] 13. Implement frontend search and filter component

  - Create SearchFilterBar React component with search input
  - Implement real-time search with debouncing
  - Add filter options for model types and metadata
  - Implement search result highlighting
  - Add empty state handling with helpful messages
  - Write component tests for search and filter functionality
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 14. Implement frontend model detail modal

  - Create ModelDetailModal React component for detailed model view
  - Display comprehensive model information including external metadata
  - Add tabs for different information sections (details, metadata, usage)
  - Implement copy-to-clipboard functionality for file paths
  - Add quick actions for adding models to workflows
  - Write component tests for modal interactions
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 7.2_

- [x] 15. Implement frontend API client and state management

  - Create API client service for backend communication
  - Implement React Context or state management for global state
  - Add error handling and retry logic for API calls
  - Implement loading states and error boundaries
  - Add offline detection and user feedback
  - Write integration tests for API client functionality
  - _Requirements: 1.3, 8.1, 8.2_

- [x] 16. Integrate frontend components in LocalAssetsTab

  - Update existing LocalAssetsTab component to use new components
  - Implement proper component composition and data flow
  - Add internationalization support for all text content
  - Ensure responsive design works across different screen sizes
  - Add accessibility features (ARIA labels, keyboard navigation)
  - Write end-to-end tests for complete user workflows
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 17. Implement metadata management features

  - Add user metadata editing functionality in model detail modal
  - Implement tag management with autocomplete and suggestions
  - Add rating system for user model evaluation
  - Implement metadata persistence through backend API
  - Add bulk metadata operations for multiple models
  - Write tests for metadata management workflows
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4_

- [x] 18. Replace mock data with real API integration in LocalAssetsTab

  - Remove mock folder and model data from LocalAssetsTab component
  - Integrate real API calls for fetching folders and models using apiClient
  - Update component state management to use API responses instead of hardcoded data
  - Handle loading states and error scenarios properly with user feedback
  - Ensure all existing functionality works with real data from backend
  - Update tests to work with API integration instead of mock data
  - _Requirements: 1.1, 2.1, 8.1, 8.2_

- [x] 19. Complete ComfyUI workflow integration

  - Replace TODO comments with actual ComfyUI API integration in handleAddToWorkflow
  - Implement actual drag-and-drop data handling for ComfyUI nodes in handleModelDrag
  - Add ComfyUI graph API integration for adding models to workflows
  - Implement model usage tracking and recent items display
  - Add quick action buttons for loading models into compatible nodes
  - Highlight currently used models in the interface
  - Write integration tests for ComfyUI workflow interactions
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 20. Integrate ErrorBoundary components in main application

  - Add ErrorBoundary wrapper to main App component
  - Integrate ErrorBoundary in LocalAssetsTab and other feature components
  - Configure error reporting and retry mechanisms
  - Add fallback UI states for when services are unavailable
  - Write tests for error scenarios and recovery
  - _Requirements: 1.3, 9.4_

- [ ] 21. Enhance empty state and loading indicator implementations

  - Implement comprehensive empty state components with helpful guidance messages
  - Add skeleton loaders for better perceived performance during loading
  - Create loading indicators with progress tracking for long operations
  - Add search-specific empty states with actionable suggestions
  - Implement graceful loading state transitions throughout the application
  - Write tests for all loading and empty state scenarios
  - _Requirements: 1.3, 1.5, 4.4_

- [ ] 22. Implement enhanced search result highlighting and feedback

  - Add comprehensive search term highlighting in results
  - Implement match scoring and ranking for search results
  - Create detailed search feedback with matched field information
  - Add search suggestions and query improvement hints
  - Implement search timeout handling and recovery
  - Write tests for search highlighting and feedback functionality
  - _Requirements: 4.3, 4.4_

- [ ] 23. Implement comprehensive metadata editing error handling

  - Add optimistic UI updates with rollback capability for metadata editing
  - Implement detailed error recovery mechanisms for failed metadata saves
  - Create user-friendly error messages for validation failures
  - Add metadata editing state management with original value preservation
  - Implement retry mechanisms for failed metadata operations
  - Write tests for all metadata editing error scenarios
  - _Requirements: 5.5_

- [ ] 24. Implement enhanced drag-and-drop error handling and feedback

  - Add compatibility checking before drag operations begin
  - Implement clear error feedback for failed drag-and-drop operations
  - Create compatibility warnings and user guidance for incompatible assets
  - Add visual feedback during drag operations and error states
  - Implement graceful handling when ComfyUI integration is unavailable
  - Write tests for drag-and-drop error scenarios and recovery
  - _Requirements: 7.5_

- [ ] 25. Implement performance optimizations for large collections
  - Add virtual scrolling for large model collections in ModelGrid
  - Implement lazy loading for model thumbnails and metadata
  - Add request deduplication for API calls
  - Implement image lazy loading with IntersectionObserver
  - Add performance monitoring and optimization
  - Write performance tests and benchmarks
  - _Requirements: 9.5_
