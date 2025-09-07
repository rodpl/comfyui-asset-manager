# ComfyUI Asset Manager Brownfield Enhancement PRD

## Intro Project Analysis and Context

**Analysis Source**: IDE-based analysis using .kiro/steering/, .kiro/specs/, and docs/development/ files.

**Current Project State**: The project is a ComfyUI extension following Hexagonal Architecture (Ports and Adapters) with Python backend (src/domain/, src/adapters/) and React frontend (ui/src/components/). It manages assets like models, outputs, and themes, integrating with ComfyUI's APIs for folder paths, model loading, and sidebar tabs. Primary purpose: Provide asset browsing, management, and integration tools within ComfyUI workflows. Current implementation includes basic backend services and frontend components, but specs indicate pending features like simplified model browser and output gallery.

**Available Documentation**:
- [x] Tech Stack Documentation (from .kiro/steering/tech.md and architecture.md)
- [x] Source Tree/Architecture (from .kiro/steering/structure.md and docs/development/hexagonal-architecture.md)
- [x] Coding Standards (from .kiro/steering/python-conventions.md, ts-conventions.md, react-patterns.md)
- [x] API Documentation (from architecture.md and comfyui-integration.md)
- [x] External API Documentation (ComfyUI integration details in steering/comfyui-integration.md)
- [x] UX/UI Guidelines (from docs/development/theme-integration-*.md and react-patterns.md)
- [x] Technical Debt Documentation (from docs/development/current-implementation-status.md and TODO.md)
- [x] Other: Specs in .kiro/specs/ for features like simplified-model-browser, simplified-output-gallery, local-asset-management, comfyui-theme-integration

Documentation is comprehensive via steering and specs files. Current status shows partial implementation: Basic hexagonal structure exists, but specs (e.g., simplified model browser requirements.md) detail unimplemented features like advanced search and filtering.

**Enhancement Type**:
8. Other: ComfyUI integration enhancements - Implementing pending specs for simplified UI components (model browser, output gallery, local assets, theme integration) while maintaining backward compatibility.

**Enhancement Description**: Enhance the ComfyUI Asset Manager by implementing the specifications in .kiro/specs/ for simplified model browser (with search/filtering), output gallery (thumbnails and workflow loading), local asset management (import/export), and theme integration (CSS variables and dark mode support). This builds on the existing hexagonal architecture to improve user workflow efficiency without disrupting current ComfyUI integrations.

**Impact Assessment**:
3. Significant Impact (substantial existing code changes) - Requires updates to adapters, domain services, and React components, but follows existing patterns.

Based on my analysis from the steering and specs files, the existing project uses hexagonal architecture with ComfyUI sidebar integration, Python backend for asset ops, and React frontend. The enhancement focuses on unimplemented specs while ensuring compatibility with ComfyUI's model loading and output systems. Is this correct?

**Goals**:
- Implement simplified model browser for efficient asset discovery and filtering.
- Create intuitive output gallery to visualize and reload workflows from generated images.
- Enable seamless local asset management for import/export without external dependencies.
- Integrate theme support to match ComfyUI's UI styling and dark mode.
- Maintain 100% backward compatibility with existing ComfyUI extensions and asset paths.
- Achieve full test coverage for new features following existing testing guidelines.
- Enable automated workflows for 40% step reduction, measured by user session time, per product.md KPIs.

**Background Context**: The ComfyUI Asset Manager currently provides basic asset management but lacks user-friendly interfaces for browsing models and outputs, as detailed in the specs folders. These enhancements address key pain points in ComfyUI workflows by simplifying asset discovery and integration, building on the established hexagonal architecture and ComfyUI extension patterns. This will improve developer and user efficiency in managing ComfyUI assets without requiring architectural overhauls, focusing on incremental improvements to the existing codebase.

**Change Log**:

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Initial | 2025-09-07 | 1.0 | Initial brownfield PRD based on steering/specs/development docs | John (PM) |
| Update 1 | 2025-09-07 | 1.1 | Incorporated analysis from .kiro/steering/, specs, and docs/development/ | John (PM) |
| Update 2 | 2025-09-07 | 1.2 | Integrated stories from .kiro/specs/ requirements into Epic Structure | John (PM) |
| Update 3 | 2025-09-07 | 1.3 | Applied refinements from audience expansion, critique, risks, alignment, ToT, Agile, and stakeholder perspectives | John (PM) |
| Update 4 | 2025-09-07 | 1.4 | Incorporated Innovation Tournament winners (hybrid theme preview, workflow automation) | John (PM) |
| Final Persist | 2025-09-07 | 1.5 | Final persistence after all elicitations | John (PM) |

## Requirements

These requirements are based on my understanding of your existing system from the steering and specs files, focusing on implementing pending features while adhering to hexagonal architecture and ComfyUI integration guidelines. Please review carefully and confirm they align with your project's reality.

**Functional** (Merged Asset Management & Discovery for conciseness):
- FR1: Implement simplified model browser with search, filtering by type/folder, and thumbnail previews, integrating with existing ModelRepositoryPort; include retry logic and caching for API calls; support ComfyUI model type filters (checkpoint/LoRA) for 100% spec coverage.
- FR2: Add output gallery displaying generated images with metadata, clickable to reload workflows via ComfyUI's graph API; add right-click context menu for copy path/show in folder per specs/tasks.md.
- FR3: Enable local asset import/export functionality, supporting drag-and-drop and folder synchronization without altering ComfyUI's folder_paths; sync changes in <1s for folders <100 items.
- FR4: Integrate theme support using CSS variables, automatically detecting ComfyUI's dark/light mode and applying to Asset Manager UI components; no visual glitches in tests across ComfyUI v0.2.0+; real-time theme preview via shadow DOM.
- FR5: Ensure all new features register properly as ComfyUI sidebar tabs and nodes, following existing extension patterns.
- FR6: Add error handling for asset operations with user-friendly notifications via ComfyUI's UI system.

**Non Functional**:
- NFR1: Maintain existing performance (<200ms API responses) and add caching for model/output lists using TTL-based adapters; throttle output scans to 1/min to avoid ComfyUI perf hits; document in comfyui-integration.md; benchmark scans; alert if >100ms for >1000 files.
- NFR2: Achieve 100% test coverage for new features, following existing unit/integration patterns in tests/domain/ and tests/adapters/; build on 60% existing coverage; all stories include e2e tests per testing-guidelines.md.
- NFR3: Ensure backward compatibility with ComfyUI versions >=0.2.0, no breaking changes to existing ports or adapters.
- NFR4: Follow coding standards from python-conventions.md and ts-conventions.md, with no new technical debt introduced.
- NFR5: Security: Validate all file paths to prevent traversal attacks, using SecurePathValidator pattern; sync changes in <1s for folders <100 items, per specs.

**Compatibility Requirements**:
- CR1/CR2: Existing API endpoints and database schema remain unchanged/additive only; new endpoints prefixed with /asset_manager/enhancements/; no migrations affecting existing models.
- CR3: UI consistency with ComfyUI themes; new components inherit from existing React patterns in ui/src/components/; support keyboard/arrow key navigation in galleries/browsers for accessibility; run e2e tests for responsive modes (mobile/desktop).
- CR4: Integration with ComfyUI's folder_paths and model loading remains intact; enhancements use driven adapters without altering core ComfyUI calls; include version-specific fallbacks; test in e2e suite (ui/tests-e2e/); include pre-build script validating against ComfyUI version via pyproject.toml.

## User Interface Enhancement Goals

**Integration with Existing UI**: New components will inherit from existing React patterns (e.g., tabbed interface, modal views) in ui/src/components/, using ComfyUI's sidebar registration. Follow theme-integration-guide.md for CSS variables and dark mode detection via window.app.ui; include example CSS vars for dev reference.

**Modified/New Screens and Views**:
- Model Browser tab: Add sub-tabs for CivitAI/HuggingFace with grid views and search/filter.
- Outputs tab: New gallery grid with thumbnails, modals for details/workflow reload.
- Local Assets tab: Update with import/export drag-and-drop, folder sync.
- Theme settings: Integrate into existing settings panel for mode switching.

**UI Consistency Requirements**: All new UI must match ComfyUI's responsive design, use consistent error notifications, and support infinite scroll/pagination as per react-patterns.md. Thumbnails and grids follow existing asset display patterns; run e2e tests for responsive modes (mobile/desktop).

## Technical Constraints and Integration Requirements

**Existing Technology Stack**:
**Languages**: Python (backend), TypeScript (frontend).
**Frameworks**: FastAPI/Aiohttp (backend), React with hooks/contexts (frontend), ComfyUI extension system.
**Database**: File-system based with potential SQLite for metadata; no traditional DB yet.
**Infrastructure**: ComfyUI-hosted; frontend served via WEB_DIRECTORY.
**External Dependencies**: ComfyUI APIs (folder_paths, graph, ui), CivitAI/HuggingFace APIs for browsing.

**Integration Approach**:
**Database Integration Strategy**: Use existing file-system adapters; add metadata extraction for PNG workflows without schema changes.
**API Integration Strategy**: Extend /asset_manager/ endpoints with new routes for gallery/browser; use driven ports like ModelRepositoryPort.
**Frontend Integration Strategy**: Register new tabs via window.app.extensionManager; use existing hooks/services for state.
**Testing Integration Strategy**: Add tests to existing suites in tests/adapters/ and ui/tests-e2e/; follow testing-guidelines.md.

**Code Organization and Standards**:
**File Structure Approach**: New components in ui/src/components/features/; backend services in src/domain/services/; adapters in src/adapters/driven/.
**Naming Conventions**: Follow python-conventions.md (snake_case) and ts-conventions.md (camelCase).
**Coding Standards**: Adhere to hexagonal principles from architecture.md; async/await for I/O, error boundaries in React.
**Documentation Standards**: Update docs/development/ with new examples; use MCP tools for specs.

**Deployment and Operations**:
**Build Process Integration**: Use existing pnpm build for frontend, poetry for backend; include in ComfyUI registry via pyproject.toml; include pre-build script validating against ComfyUI version via pyproject.toml.
**Deployment Strategy**: As ComfyUI extension; no separate deployment, load via ComfyUI's extension manager.
**Monitoring and Logging**: Use existing logger.py; add performance decorators from tech.md.
**Configuration Management**: Extend .env for new API keys (CivitAI/HuggingFace); follow comfyui-integration.md.

**Risk Assessment and Mitigation**:

| Risk ID | Description | Likelihood | Impact | Mitigation |
|---------|-------------|------------|--------|------------|
| TECH-001 | External API Instability (Model Browser) | Medium | Medium | Implement retry/caching in adapters; fallback to cached data; monitor via logs. Add to Story 1.2 tasks: "Handle API errors with offline mode." |
| INT-001 | ComfyUI Compatibility Breaks (All Stories) | High | High | Use feature flags/version checks; test against >=0.2.0; incremental rollout. Reference comfyui-integration.md for registration. |
| DEP-001 | Extension Loading Conflicts (Epic Overall) | Medium | Medium | Validate in build process; use pyproject.toml for registry. Add Story 1.2 task: "Register new tabs with prefix check." |
| UX-001 | UX Inconsistencies in Gallery/Browser | Low | Low | Inherit from ui/src/components/; e2e tests for views. |
| OPS-001 | Performance Degradation in Sync/Gallery | Medium | Medium | Debounce scans; use TTL caching; limit initial loads. |

## Epic Structure

**Epic Structure Decision**: Single comprehensive epic with 5 stories (one per spec + meta-workflow). Rationale: Specs represent related UI enhancements that build on shared adapters and ComfyUI integrations, minimizing risk through sequential implementation while maintaining hexagonal architecture. This avoids multiple epics for interconnected features. Does this align with your understanding of the work required?

## Epic 1: Implement Pending UI Specs for ComfyUI Asset Manager

**Epic Goal**: Deliver user-friendly interfaces for model browsing, output gallery, local assets, and theme integration by implementing the specifications in .kiro/specs/, enhancing ComfyUI workflow efficiency while preserving existing architecture and compatibility. Achieve 20% faster asset workflows, measured by user session time, per product.md KPIs.

**Integration Requirements**: All stories must use existing ports (e.g., ModelRepositoryPort, FolderManagementPort); register new tabs/nodes via ComfyUI extension system; ensure backward compatibility with current asset paths and themes; include verification of existing functionality in each story's AC.

**Sprint Planning Notes**: Story 1.1: Sprint 1; Daily standups focus on ComfyUI tests. Estimation: 8-12 hours per story. Reviewed by PO.

#### Story 1.1 ComfyUI Theme Integration (MoSCoW: Must; High Priority for UI Foundation)

**Non-Technical Summary**: Users get automatic theme matching (dark/light) across all Asset Manager UI, ensuring a seamless ComfyUI experience without manual tweaks.

As a ComfyUI user,  
I want the Asset Manager to match ComfyUI's themes (dark/light),  
so that it provides a seamless visual experience.

**Acceptance Criteria** (MoSCoW: Must):
1.1: WHEN ComfyUI changes theme THEN automatically detect (via window.app.ui) and apply CSS variables to all components; no visual glitches in tests across ComfyUI v0.2.0+; support keyboard/arrow key navigation in galleries/browsers for accessibility.
1.2: WHEN in settings THEN allow manual override; support dark/light modes fully; real-time theme preview via shadow DOM.
1.3: Update grids/modals/tabs to be theme-aware; inherit from existing React components; run e2e tests for responsive modes (mobile/desktop).
1.4: Follow theme-integration-guide.md; test compatibility with ComfyUI >=0.2.0; QA: Run e2e for theme compatibility; verify <200ms via decorators.
1.5: No performance impact; ensure backward compatibility for older themes. Reviewed by PO.

**Tasks** (LoE: 8 hours):
- [ ] Detect theme changes and apply CSS vars; add settings toggle.
- [ ] Update components for theme support; implement shadow DOM preview.
- [ ] Test across modes; integrate with existing UI patterns.
- [ ] Add tests for theme switching and consistency; QA e2e.

#### Integration Verification
- IV1: Confirm detection via window.app.ui without breaking existing components; include version-specific fallbacks.
- IV2: Verify consistency across all tabs post-implementation; run e2e suite.
- IV3: Ensure CSS variables don't conflict with ComfyUI's global styles; <200ms switching.

#### Story 1.2 Simplified Model Browser Implementation (MoSCoW: Must; High Priority for Discovery)

**Non-Technical Summary**: Users can search and preview models from CivitAI/HuggingFace in a grid, with details on click, making asset discovery fast and integrated.

As a ComfyUI user,  
I want to browse and search models from CivitAI and HuggingFace within the Asset Manager,  
so that I can discover compatible models without leaving the interface.

**Acceptance Criteria** (MoSCoW: Must):
1.1: WHEN clicking Model Browser tab THEN display sub-tabs for CivitAI/HuggingFace with grid views of models (thumbnails, name, creator/metadata); support ComfyUI model type filters (checkpoint/LoRA) for 100% spec coverage.
1.2: WHEN searching/filtering THEN filter by name/tags/type, supporting pagination/infinite scroll; show "no results" with suggestions; <100ms search.
1.3: WHEN clicking a model THEN show modal with details (description, tags, version, examples, requirements, compatibility, file size).
1.4: WHEN API unavailable THEN display error with retry; prioritize ComfyUI-compatible models; include retry logic and caching for API calls.
1.5: Existing model management remains unchanged; new browser uses driven adapters (e.g., ExternalMetadataPort) without altering core ports; follow design.md for responsive grid/modal; QA: Run e2e for theme compatibility. Reviewed by PO.

**Tasks** (LoE: 12 hours):
- [ ] Implement sub-tabs and grid view using React patterns; add search/filter via hooks.
- [ ] Integrate CivitAI/HuggingFace APIs via adapters; create modal component for details.
- [ ] Extract compatibility info; handle API errors with offline mode.
- [ ] Add tests for API errors and compatibility checks; QA e2e.

#### Integration Verification
- IV1: Verify existing Local Assets tab functionality intact; confirm ComfyUI sidebar registration works; no conflicts with other tabs.
- IV2: Test performance: <200ms load for initial grid; cache results per NFR1.
- IV3: ComfyUI Compatibility Check: Version fallbacks; e2e suite.

#### Story 1.3 Simplified Output Gallery Implementation (MoSCoW: Should; Medium Priority for Review)

**Non-Technical Summary**: Users see thumbnails of generated images, click to view details/reload workflows, with sorting for easy organization.

As a ComfyUI user,  
I want to view generated images in a gallery with metadata and workflow reload,  
so that I can review and reuse outputs efficiently.

**Acceptance Criteria** (MoSCoW: Should):
1.1: WHEN clicking Outputs tab THEN display responsive grid of thumbnails from ComfyUI output directory (support PNG/JPG/WebP); add right-click context menu for copy path/show in folder per specs/tasks.md.
1.2: WHEN clicking thumbnail THEN open modal with full image, metadata (date, size, dimensions, embedded workflow if PNG); sort in <100ms.
1.3: WHEN no images THEN show empty state; support sorting (date/name/size), refresh button, grid/list views.
1.4: WHEN viewing details THEN enable workflow reload via ComfyUI graph API if metadata available; auto-scan for new images; throttle scans to 1/min.
1.5: Existing output paths unchanged; use file-system adapters for scanning without altering folder_paths; follow design.md for modal/context menu; QA: Run e2e for theme compatibility. Reviewed by PO.

**Tasks** (LoE: 10 hours):
- [ ] Scan output directory and extract PNG metadata; implement grid/modal with React.
- [ ] Add sorting/refresh; integrate workflow reload via ComfyUI APIs.
- [ ] Add context menu actions; handle errors.
- [ ] Add tests for scanning, metadata extraction, and reload; QA e2e.

#### Integration Verification
- IV1: Confirm ComfyUI output directory scanning doesn't alter folder_paths; verify modal doesn't interfere with existing UI.
- IV2: Test error handling for inaccessible directories; maintain <200ms grid load.
- IV3: ComfyUI Compatibility Check: Version fallbacks; e2e suite.

#### Story 1.4 Local Asset Management Implementation (MoSCoW: Should; Medium Priority for Management)

**Non-Technical Summary**: Users drag-drop to import assets and sync folders, with safe validation to avoid errors.

As a ComfyUI user,  
I want to import/export local assets with drag-and-drop and folder sync,  
so that I can manage personal models/outputs without external tools.

**Acceptance Criteria** (MoSCoW: Should):
1.1: WHEN in Local Assets tab THEN enable drag-and-drop import to ComfyUI folders (support common formats); sync changes in <1s for folders <100 items.
1.2: WHEN exporting THEN provide context menu (copy path, show in folder, open in viewer); support folder sync for changes.
1.3: WHEN syncing THEN detect additions/deletions and update views; validate paths to prevent traversal.
1.4: Integrate with existing adapters (e.g., FolderManagementPort); no changes to core ComfyUI asset loading; follow design.md for drag-drop UI.
1.5: Error handling for invalid paths/files; QA: Run e2e for theme compatibility. Reviewed by PO.

**Tasks** (LoE: 10 hours):
- [ ] Implement drag-drop and sync using file-system adapters; add context menu actions.
- [ ] Validate with SecurePathValidator; update views on sync.
- [ ] Handle errors.
- [ ] Add tests for import/export and validation; QA e2e.

#### Integration Verification
- IV1: Ensure imports respect existing SecurePathValidator and folder_paths; test sync doesn't conflict with auto-scanning.
- IV2: Verify performance for large folders; add caching as per NFR1.
- IV3: ComfyUI Compatibility Check: Version fallbacks; e2e suite.

#### Story 1.5 Workflow Automation Overlay (MoSCoW: Could; Low Priority for Efficiency)

**Non-Technical Summary**: Users get one-click automation across features (e.g., search model → import → view in gallery), streamlining workflows.

As a ComfyUI user,  
I want automated flows across asset features,  
so that I can complete tasks with fewer steps.

**Acceptance Criteria** (MoSCoW: Could):
1.1: WHEN in browser THEN enable one-click "Import & Add to Gallery" for selected models, auto-syncing to outputs.
1.2: WHEN in gallery THEN "Reload Workflow in ComfyUI" button integrates with graph API for seamless reuse.
1.3: Support 40% step reduction (e.g., browser → import → gallery in one flow); use ComfyUI hooks for orchestration.
1.4: No impact on existing flows; optional toggle in settings; QA: Run e2e for end-to-end automation. Reviewed by PO.

**Tasks** (LoE: 8 hours):
- [ ] Implement cross-feature hooks (e.g., browser to import/gallery).
- [ ] Add automation buttons; test with ComfyUI graph.
- [ ] Ensure optional; handle errors.
- [ ] Add tests for flows; QA e2e.

#### Integration Verification
- IV1: Verify no breaks to individual stories; deps on 1.1-1.4 UI/ports.
- IV2: Test performance <200ms for automated flows.
- IV3: ComfyUI Compatibility Check: Version fallbacks; e2e suite.

**Updated Adapter Flow** (Mermaid):
```mermaid
graph TD
    A[Driving Adapter: UI Tab (React)] --> B[Domain Service: AssetManagementService]
    B --> C[Driven Port: ModelRepositoryPort]
    C --> D[Driven Adapter: External API/FileSystem]
    B --> E[Driven Port: FolderManagementPort]
    E --> F[Driven Adapter: ComfyUI folder_paths]
    G[Workflow Automation Overlay] -.-> B
```

**Advanced Elicitation Options**: PRD finalized. Use *doc-out if needed for export.