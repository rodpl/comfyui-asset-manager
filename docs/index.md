# Documentation Index

## Root Documents

### [ComfyUI Asset Manager Brownfield Architecture Document](./architecture.md)
Comprehensive brownfield architecture analysis describing the current system, technical stack, integration points, and known debt for the Asset Manager extension.

### [ComfyUI Asset Manager Brownfield Enhancement PRD](./prd.md)
Product requirements document outlining the Outputs-first release scope, requirements, and sequenced epic/story plan for shipping the MVP.

## ComfyUI Asset Manager Brownfield Architecture Document (Sharded)
Multi-part breakdown of the architecture analysis; use these sections when you need focused details without reading the full document.

### [Appendix - Useful Commands and Scripts](./architecture/appendix-useful-commands-and-scripts.md)
Collects frequently used scripts, CLI snippets, and troubleshooting tips for developers.

### [Data Models and APIs](./architecture/data-models-and-apis.md)
Documents core domain entities and the REST/adapter surfaces they expose.

### [Development and Deployment](./architecture/development-and-deployment.md)
Explains local setup, build steps, and deployment expectations for the extension.

### [High Level Architecture](./architecture/high-level-architecture.md)
Provides a technical summary of the system, including runtime stack, architectural style, and release focus notes.

### [If Enhancement PRD Provided - Impact Analysis](./architecture/if-enhancement-prd-provided-impact-analysis.md)
Maps potential enhancement work to affected files, new modules, and integration considerations.

### [Integration Points and External Dependencies](./architecture/integration-points-and-external-dependencies.md)
Lists key integrations with ComfyUI, external services, and subsystem touchpoints.

### [Introduction](./architecture/introduction.md)
Summarises the architecture document scope, context, and change history for the brownfield analysis.

### [Quick Reference - Key Files and Entry Points](./architecture/quick-reference-key-files-and-entry-points.md)
Catalogues mission-critical entry points and directories across backend and frontend code.

### [Source Tree and Module Organization](./architecture/source-tree-and-module-organization.md)
Details the actual repository layout, major modules, and their responsibilities.

### [Technical Debt and Known Issues](./architecture/technical-debt-and-known-issues.md)
Enumerates outstanding technical debt, workarounds, and risks affecting ongoing work.

### [Testing Reality](./architecture/testing-reality.md)
Summarises automated test coverage, suites, and commands used to validate the project.

## ComfyUI Asset Manager Brownfield Enhancement PRD (Sharded)
Targeted sections from the PRD for quick reference while planning or implementing the Outputs-first release.

### [Epic 1: Outputs-First Release](./prd/epic-1-outputs-first-release.md)
Breaks down the epic into stories with acceptance criteria and integration verification steps.

### [Epic and Story Structure](./prd/epic-and-story-structure.md)
Explains the chosen epic approach and provides context for sequencing the work.

### [Intro Project Analysis and Context](./prd/intro-project-analysis-and-context.md)
Captures brownfield discovery details, existing system state, documentation inventory, and enhancement scope definition.

### [Requirements](./prd/requirements.md)
Lists functional, non-functional, and compatibility requirements agreed for the release.

### [Technical Constraints and Integration Requirements](./prd/technical-constraints-and-integration-requirements.md)
Describes stack constraints, integration strategies, code standards, operations guidance, and risk mitigation.

### [User Interface Enhancement Goals](./prd/user-interface-enhancement-goals.md)
Defines UI integration expectations, affected screens, and consistency needs for ComfyUI theming.

## development
Developer enablement references, kept alphabetically for quick lookup.

### [ComfyUI Theme Integration Developer Guide](./development/theme-integration-guide.md)
Comprehensive reference for implementing and maintaining theme alignment with ComfyUI.

### [ComfyUI Theme Integration Quick Reference](./development/theme-integration-quick-reference.md)
Checklist-style quick start for applying theme support to components.

### [Current Implementation Status](./development/current-implementation-status.md)
Tracks what parts of the hexagonal architecture are complete, in progress, or pending.

### [Developer Documentation Overview](./development/README.md)
Introduces the development documentation set and how to use the materials in this folder.

### [Developer Guide: Working with Hexagonal Architecture](./development/developer-guide.md)
Provides practical guidance for implementing features within the existing hexagonal boundaries.

### [Hexagonal Architecture Implementation](./development/hexagonal-architecture.md)
Explains the Asset Manager’s ports-and-adapters design and how responsibilities are divided.

### [Theme Integration Examples](./development/theme-integration-examples.md)
Showcases fully themed component examples that follow ComfyUI styling best practices.

### [Work Items TODO](./development/TODO.md)
Short list of outstanding developer tasks and follow-ups captured for convenience.
