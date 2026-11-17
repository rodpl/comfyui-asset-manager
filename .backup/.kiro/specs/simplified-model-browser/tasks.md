# Implementation Plan

- [x] 1. Set up external model data structures and types

  - Create TypeScript interfaces for external models and API responses
  - Define platform-specific metadata types for CivitAI and HuggingFace
  - Create Python domain entities for external models
  - Add ComfyUI-specific compatibility and model type enums
  - Define model type mapping utilities for ComfyUI integration
  - _Requirements: 1.1, 2.1, 4.2, 4.4, 6.1_

- [x] 2. Implement external API service layer

  - [x] 2.1 Create CivitAI API service with search and model details

    - Implement CivitAI API client with search functionality
    - Add model details fetching from CivitAI API
    - Include ComfyUI model type mapping and compatibility detection
    - Add filtering for ComfyUI-compatible models and formats
    - Include error handling and rate limiting
    - Write unit tests for CivitAI service
    - _Requirements: 1.2, 1.3, 1.5, 6.1, 6.2_

  - [x] 2.2 Create HuggingFace API service with search and model details
    - Implement HuggingFace API client with search functionality
    - Add model details fetching from HuggingFace API
    - Add filtering for diffusion models and ComfyUI-compatible libraries
    - Include ComfyUI compatibility detection based on model metadata
    - Include error handling and rate limiting
    - Write unit tests for HuggingFace service
    - _Requirements: 2.2, 2.3, 2.4, 6.1, 6.2_

- [x] 3. Create reusable model card component

  - Implement ModelCard component with platform-agnostic design
  - Add support for different model metadata display based on platform
  - Include ComfyUI compatibility indicators and model type badges
  - Add file size and format information display
  - Include loading states and error handling for images
  - Style component to match existing design system
  - Write unit tests for ModelCard component
  - _Requirements: 1.2, 2.2, 4.2, 4.4, 4.5, 6.1_

- [x] 4. Implement CivitAI browser interface

  - [x] 4.1 Create CivitAI browser component with model grid

    - Build CivitAIBrowser component with model grid layout
    - Implement pagination or infinite scroll for model browsing
    - Add loading states and error handling
    - Integrate with CivitAI API service
    - _Requirements: 1.2, 1.4, 1.5_

  - [x] 4.2 Add CivitAI-specific search and filtering
    - Implement search functionality with debounced input
    - Add CivitAI-specific filters (model type, sort order, NSFW toggle)
    - Add ComfyUI-specific filters (base model, file format, compatibility)
    - Create filter UI components with ComfyUI model type options
    - Wire search and filters to API service
    - _Requirements: 3.1, 3.2, 3.3, 6.2, 6.3_

- [x] 5. Implement HuggingFace browser interface

  - [x] 5.1 Create HuggingFace browser component with model grid

    - Build HuggingFaceBrowser component with model grid layout
    - Implement pagination or infinite scroll for model browsing
    - Add loading states and error handling
    - Integrate with HuggingFace API service
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 5.2 Add HuggingFace-specific search and filtering
    - Implement search functionality with debounced input
    - Add HuggingFace-specific filters (task type, library, language)
    - Add ComfyUI-specific filters (diffusion type, compatibility, format)
    - Create filter UI components with ComfyUI model categories
    - Wire search and filters to API service
    - _Requirements: 3.1, 3.2, 3.3, 6.2, 6.3_

- [x] 6. Create model detail modal component

  - Implement ModelDetailModal component for detailed model information
  - Add platform-specific metadata display
  - Include ComfyUI compatibility information and model folder indication
  - Add file size, format, and download requirements display
  - Include image gallery for model examples
  - Add modal overlay and close functionality
  - Style modal to match existing design patterns
  - Write unit tests for modal component
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.3, 6.4_

- [x] 7. Enhance ModelBrowserTab with sub-tab navigation

  - [x] 7.1 Add sub-tab navigation to ModelBrowserTab

    - Implement tab switching between CivitAI and HuggingFace
    - Add tab state preservation when switching
    - Update existing ModelBrowserTab component structure
    - Style sub-tabs to match ComfyUI design system
    - _Requirements: 1.1, 2.1, 5.1_

  - [x] 7.2 Integrate browser components into sub-tabs
    - Wire CivitAIBrowser component to CivitAI sub-tab
    - Wire HuggingFaceBrowser component to HuggingFace sub-tab
    - Implement shared search context between tabs
    - Add error boundaries for each sub-tab
    - _Requirements: 1.1, 2.1, 5.2_

- [x] 8. Implement backend API endpoints for external models

  - [x] 8.1 Create Python domain entities and ports for external models

    - Define ExternalModel domain entity
    - Create ExternalModelPort interface for external model access
    - Implement domain service for external model operations
    - Write unit tests for domain entities and services
    - _Requirements: 1.1, 2.1, 4.1_

  - [x] 8.2 Create API adapters for CivitAI and HuggingFace

    - Implement CivitAIAdapter for external API integration
    - Implement HuggingFaceAdapter for external API integration
    - Add error handling and rate limiting to adapters
    - Write integration tests for API adapters
    - _Requirements: 1.3, 1.5, 2.3, 2.4_

  - [x] 8.3 Add external model endpoints to web API
    - Create REST endpoints for external model search and details
    - Integrate external model adapters with web API
    - Add proper error handling and response formatting
    - Update API client to use new external model endpoints
    - _Requirements: 1.2, 2.2, 4.1_

- [x] 9. Add comprehensive error handling and loading states

  - Implement error boundaries for all browser components
  - Add retry mechanisms for failed API calls
  - Create loading skeletons for model grids
  - Add empty state components for no results
  - Implement offline detection and messaging
  - Write tests for error scenarios
  - _Requirements: 1.5, 2.4, 3.4, 5.4, 5.5_

- [x] 10. Implement ComfyUI integration utilities

  - Create model type mapping utilities for CivitAI and HuggingFace models
  - Implement ComfyUI compatibility detection algorithms
  - Add model folder path resolution for different model types
  - Create utilities for future download integration (folder detection, naming)
  - Add validation for model formats and ComfyUI support
  - Write unit tests for integration utilities
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 11. Optimize performance and add caching
  - Implement response caching for external API calls (localStorage/sessionStorage)
  - ~~Add image lazy loading for model thumbnails~~ (Already implemented)
  - Implement virtual scrolling for large model lists (1000+ items)
  - Add request deduplication for identical searches
  - ~~Optimize component re-rendering with React.memo~~ (useCallback/useMemo already implemented)
  - Add React.memo to ModelCard and other pure components
  - Write performance tests and benchmarks
  - _Requirements: 5.1, 5.2, 5.3_
