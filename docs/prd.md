<!-- Powered by BMAD™ Core -->

# ComfyUI Asset Manager - Brownfield Enhancement PRD

## Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Initial | 2025-09-07 | 1.0 | Initial brownfield PRD creation | PM Agent |

## Intro Project Analysis and Context

### Existing Project Overview

#### Analysis Source
IDE-based fresh analysis

#### Current Project State
The ComfyUI Asset Manager is a full-stack application that provides asset management capabilities for ComfyUI installations. It features a Python backend implementing hexagonal architecture with domain services for model, folder, and metadata management, and a React frontend with theme integration for UI components.

The backend implements domain entities (Model, Folder, ExternalMetadata), domain services (ModelService, FolderService, MetadataService), and ports for driving and driven interactions. Currently, domain core and ports are fully implemented with comprehensive unit tests (96-100% coverage), while adapters are partially complete.

The frontend provides themed UI components for asset browsing, model management, and output handling, with automatic theme detection from ComfyUI's CSS variables. Key features include folder navigation, model search, metadata editing, and output management with workflow loading capabilities.

### Available Documentation

- [x] Tech Stack Documentation ✓ (From project analysis: Python with Poetry, React with Vite, aiohttp backend)
- [x] Source Tree/Architecture ✓ (Hexagonal architecture implemented, documented in docs/development/hexagonal-architecture.md)
- [ ] Coding Standards (Partial - CRUSH.md contains some standards)
- [ ] API Documentation (Backend API structure in ui/src/services/api.ts, needs formal spec)
- [ ] External API Documentation (CivitAI and HuggingFace integrations planned)
- [ ] UX/UI Guidelines (Theme integration guide exists, general UI patterns partial)
- [x] Technical Debt Documentation ✓ (From project analysis: Adapters incomplete, integration wiring needed)
- Other: Developer guides and theme documentation available

### Enhancement Scope Definition

#### Enhancement Type
- New Feature Addition
- Integration with New Systems
- UI/UX Overhaul

#### Enhancement Description
Add support for managing ComfyUI outputs within the Asset Manager. This includes scanning output directories, displaying output thumbnails and metadata, and providing workflow reloading functionality from saved outputs. The enhancement will integrate with existing model and folder management while maintaining the hexagonal architecture and theme integration.

#### Impact Assessment
- Significant Impact (substantial existing code changes)

### Goals and Background Context

#### Goals
- Enable users to browse and manage ComfyUI-generated outputs directly within the Asset Manager interface
- Provide thumbnail previews and metadata viewing for outputs
- Allow reloading workflows from saved output files back into ComfyUI
- Maintain existing model and folder management functionality
- Ensure seamless theme integration for the new output management UI
- Preserve hexagonal architecture principles in backend implementation

#### Background Context
The ComfyUI Asset Manager currently excels at model and folder management but lacks comprehensive output management capabilities. Users frequently need to locate, organize, and reload workflows from their generated outputs, which currently requires manual file system navigation. This enhancement will provide a unified interface for output management while integrating with the existing asset management system.

The enhancement must respect the existing hexagonal architecture, ensuring new output services follow established patterns. The UI must integrate with the current theme system and maintain consistency with existing components. Given the partially implemented adapters, the new output functionality will need to extend the existing infrastructure while completing necessary adapter implementations.

## Requirements

### Functional

1. FR1: The system shall scan and index ComfyUI output directories to discover generated files and their associated metadata.
2. FR2: The system shall provide a browsable interface for viewing and organizing output files with thumbnail previews.
3. FR3: The system shall extract and display output metadata including generation parameters, model used, and timestamps.
4. FR4: The system shall allow users to reload workflows from saved output files back into ComfyUI.
5. FR5: The system shall support filtering and searching of output files by date, format, and generation parameters.
6. FR6: The system shall maintain integration with existing folder and model management without disruption.

### Non Functional

1. NFR1: Output scanning shall complete within 5 seconds for directories containing up to 1000 files.
2. NFR2: The output management UI shall maintain the existing theme integration and responsive design patterns.
3. NFR3: Workflow reloading shall succeed for 95% of valid output files without requiring manual intervention.
4. NFR4: The system shall handle output directories up to 10GB in size without performance degradation.
5. NFR5: All new functionality shall maintain 95%+ unit test coverage following existing testing patterns.

### Compatibility Requirements

1. CR1: Existing API endpoints for model and folder management shall remain unchanged and fully functional.
2. CR2: The output management feature shall not require changes to the existing database schema.
3. CR3: New UI components shall follow existing theme integration patterns and CSS variable system.
4. CR4: Integration with existing backend services shall maintain current error handling and validation patterns.

## User Interface Enhancement Goals

### Integration with Existing UI
The new output management interface will integrate with the existing tab-based navigation system, adding an "Outputs" tab alongside the existing "Local Assets" and "Model Browser" tabs. The UI will follow the established component patterns and theme integration system, using the same CSS variable hierarchy and responsive design principles.

### Modified/New Screens and Views
- New: Outputs Tab - Main listing view with filtering and search
- New: Output Details Modal - Detailed view with metadata and workflow reloading
- Modified: Main Navigation - Add Outputs tab to existing tab bar
- Modified: Theme System - Extend existing CSS variables for output-specific components

### UI Consistency Requirements
- All new components shall use the established CSS variable system (--asset-manager-*) with proper fallbacks
- Output thumbnails shall follow the same sizing and spacing patterns as existing model cards
- Interactive elements (buttons, modals) shall match existing hover and focus states
- Loading and error states shall follow existing feedback component patterns
- Mobile responsiveness shall maintain existing breakpoints and layouts

## Technical Constraints and Integration Requirements

### Existing Technology Stack

**Languages**: Python (backend), TypeScript (frontend)

**Frameworks**: aiohttp (backend), React with Vite (frontend)

**Database**: File-system based (no traditional database, uses ComfyUI folder structure)

**Infrastructure**: Local file system integration with ComfyUI directories

**External Dependencies**: Planned CivitAI and HuggingFace API clients, current implementation uses file system only

### Integration Approach

**Database Integration Strategy**: The output management will extend the existing file-system based approach, adding output directories to the folder scanning mechanism without requiring schema changes. Output metadata will be extracted from file names and embedded JSON where available.

**API Integration Strategy**: New endpoints will be added to the existing WebAPIAdapter following the established pattern. The ModelService will be extended to handle output-specific operations while maintaining backward compatibility with existing model management endpoints.

**Frontend Integration Strategy**: The new Outputs tab will integrate with the existing tab navigation system. Output components will follow the established ThemedCard and ThemedButton patterns, extending the CSS variable system for output-specific styling.

**Testing Integration Strategy**: New unit tests will follow the existing mock-based testing pattern for domain services. Frontend tests will extend the existing theme integration test utilities to cover output components in both light and dark themes.

### Code Organization and Standards

**File Structure Approach**: New output-related domain services will be added to src/domain/services/output_service.py. Frontend components will be placed in ui/src/features/outputs/. Adapters will extend the existing driven adapter patterns in src/adapters/driven/.

**Naming Conventions**: Follow existing snake_case for Python and camelCase for TypeScript. New entities will use descriptive names like Output and OutputMetadata following the Model and Folder patterns.

**Coding Standards**: Adhere to existing Black formatting (line length 88), mypy type checking, and pytest testing patterns. New code must maintain 95%+ test coverage and follow hexagonal architecture principles.

**Documentation Standards**: Update existing developer guides and add output-specific sections. Include comprehensive docstrings for new services and components following existing patterns.

### Deployment and Operations

**Build Process Integration**: The output management feature will integrate with the existing Poetry build process for backend and npm build for frontend without requiring build configuration changes.

**Deployment Strategy**: Deployment will follow existing patterns - backend as Python module within ComfyUI, frontend as static assets. No infrastructure changes required.

**Monitoring and Logging**: Extend existing logging patterns in domain services to include output operations. Use existing logger configuration without requiring new monitoring setup.

**Configuration Management**: Output directory paths will be configurable through existing environment variables or configuration files, following current ComfyUI path configuration patterns.

### Risk Assessment and Mitigation

**Technical Risks**: Incomplete adapter implementations may affect output scanning reliability. **Mitigation**: Complete FileSystemModelAdapter before implementing output scanning, ensuring robust file system integration.

**Integration Risks**: New output endpoints may conflict with existing model management APIs. **Mitigation**: Use RESTful URL patterns that extend existing hierarchy (/outputs vs /models), maintain backward compatibility.

**Deployment Risks**: Large output directories may impact startup time. **Mitigation**: Implement lazy scanning and caching strategies similar to existing metadata caching approach.

**Mitigation Strategies**: Incremental implementation with comprehensive testing at each step, maintaining existing functionality verification in every story, using feature flags for risky components if needed.

## Epic and Story Structure

**Epic Structure Decision**: Single comprehensive epic with 3-4 stories sequenced to minimize risk to existing system. The stories will first complete necessary adapter implementations, then add output scanning, and finally implement the UI integration. This order makes sense given the project's current state where adapters are partially implemented and UI patterns are established.

## Epic 1: Output Management Integration

**Epic Goal**: Enable comprehensive output management within the ComfyUI Asset Manager while maintaining existing model and folder functionality and adhering to established architectural patterns.

**Integration Requirements**: All new functionality must integrate with existing hexagonal architecture, use established theme integration patterns, maintain backward compatibility with current APIs, and preserve existing performance characteristics.

### Story 1.1 Complete File System Adapters
As a developer,
I want complete file system adapter implementations,
so that output scanning can reliably integrate with existing model management.

#### Acceptance Criteria

1. 1: FileSystemModelAdapter implements all ModelRepositoryPort methods with ComfyUI directory scanning.
2. 2: ComfyUIFolderAdapter fully implements FolderRepositoryPort with output directory discovery.
3. 3: Both adapters handle large directories efficiently with proper error handling.
4. 4: Unit tests achieve 95%+ coverage for adapter implementations.
5. 5: Adapters follow existing driven adapter patterns and error handling.

#### Integration Verification

IV1: Existing ModelService operations continue to function without changes to model scanning.
IV2: New output directory scanning does not interfere with existing model folder scanning.
IV3: Performance impact on startup time remains within acceptable bounds (+/- 10%).

### Story 1.2 Implement Output Service
As a developer,
I want an OutputService domain service,
so that output management follows established hexagonal architecture patterns.

#### Acceptance Criteria

1. 1: OutputService implements OutputManagementPort with core output operations.
2. 2: Service integrates with existing FolderService for output organization.
3. 3: Output metadata extraction follows existing metadata enrichment patterns.
4. 4: Service handles various ComfyUI output formats (PNG, JSON workflows).
5. 5: Comprehensive unit tests with 95%+ coverage.

#### Integration Verification

IV1: OutputService operations do not affect existing ModelService performance.
IV2: Output metadata extraction maintains compatibility with existing metadata caching.
IV3: Service error handling follows established domain exception patterns.

### Story 1.3 Add Output Management UI Components
As a frontend developer,
I want themed output management UI components,
so that users can browse and manage outputs with consistent visual design.

#### Acceptance Criteria

1. 1: OutputsTab component implements tab navigation integration.
2. 2: OutputCard components follow existing ThemedCard patterns.
3. 3: Output filtering and search functionality matches existing patterns.
4. 4: Theme integration using established CSS variable system.
5. 5: Responsive design maintains existing breakpoints.
6. 6: Comprehensive component tests including theme switching.

#### Integration Verification

IV1: New Outputs tab integrates seamlessly with existing tab navigation.
IV2: Output components maintain visual consistency with model cards.
IV3: Theme switching affects output components identically to existing components.

### Story 1.4 Implement Output API Endpoints
As a backend developer,
I want RESTful API endpoints for output management,
so that the frontend can interact with output functionality.

#### Acceptance Criteria

1. 1: GET /outputs endpoint returns paginated output list.
2. 2: GET /outputs/{id} returns detailed output information.
3. 3: POST /outputs/refresh triggers output directory rescan.
4. 4: POST /outputs/{id}/load-workflow loads workflow into ComfyUI.
5. 5: API follows existing response formats and error handling.
6. 6: Integration tests verify complete request flows.

#### Integration Verification

IV1: New output endpoints do not interfere with existing model endpoints.
IV2: API response formats maintain consistency with existing endpoints.
IV3: Error handling follows established API patterns.

### Story 1.5 Output Workflow Integration
As a full-stack developer,
I want complete integration between output management and ComfyUI workflows,
so that users can seamlessly reload workflows from outputs.

#### Acceptance Criteria

1. 1: Workflow reloading extracts and loads JSON from output files.
2. 2: Integration with existing model loading functionality.
3. 3: Error handling for corrupted or incompatible workflows.
4. 4: User feedback during workflow loading process.
5. 5: End-to-end tests verify complete workflow reload cycle.
6. 6: Performance optimization for large workflow files.

#### Integration Verification

IV1: Workflow reloading maintains compatibility with existing model loading.
IV2: Output management does not affect existing ComfyUI workflow execution.
IV3: Integration maintains existing error reporting patterns.