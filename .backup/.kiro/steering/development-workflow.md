---
inclusion: always
---

# Development Workflow Guidelines

## Overview

This document provides comprehensive guidance for the development workflow, integrating spec-driven development, testing practices, and ComfyUI-specific considerations.

## Spec-Driven Development Workflow

### Phase 1: Requirements Gathering

**Objective**: Transform rough feature ideas into detailed, testable requirements

**Process**:
1. **Research First**: Use MCP documentation tools to understand current ComfyUI capabilities
2. **Write Initial Requirements**: Create requirements.md with user stories and EARS format acceptance criteria
3. **Iterate with User**: Refine requirements based on feedback until explicit approval
4. **Validate Feasibility**: Ensure requirements align with ComfyUI's technical constraints

**Tools to Use**:
- `mcp_ComfyUI_Docs_*` for core functionality research
- `mcp_ComfyUI_Frontend_Docs_*` for UI capability validation
- `mcp_ComfyUI_React_Extension_Docs_*` for technical feasibility
- `mcp_ComfyUI_Copilot_Docs_*` for UX pattern validation

### Phase 2: Design Creation

**Objective**: Create comprehensive technical design based on validated requirements

**Process**:
1. **Architecture Research**: Validate proposed architecture against proven patterns
2. **API Design**: Design APIs that align with ComfyUI's extension system
3. **Component Design**: Plan React components following established patterns
4. **Integration Planning**: Design ComfyUI-specific integration points
5. **User Approval**: Iterate design until explicit user approval

**Key Considerations**:
- Follow hexagonal architecture principles
- Ensure ComfyUI theme compatibility
- Plan for feature flag support
- Design for testability

### Phase 3: Task Planning

**Objective**: Break down design into actionable, testable implementation tasks

**Process**:
1. **MVP Identification**: Identify minimum viable features that deliver user value
2. **Task Breakdown**: Create main tasks and subtasks following MVP principles
3. **Dependency Mapping**: Ensure clear task dependencies and sequencing
4. **Implementation Strategy**: Plan frontend-first approach with backend integration
5. **User Approval**: Get explicit approval before implementation begins

**Task Structure**:
- Main tasks represent complete MVP features
- Subtasks break down into frontend and backend work
- Each task must be independently testable
- Tasks must reference specific requirements

## Implementation Workflow

### Development Environment Setup

**Before Starting Any Task**:

```bash
# 1. Verify environment
python3 --version && poetry --version
cd ui && pnpm --version && cd ..

# 2. Install dependencies
poetry install --with dev
cd ui && pnpm install && cd ..

# 3. Verify basic functionality
python3 -c "from src.domain.entities.base import Entity; print('✓ Imports work')"
cd ui && pnpm run build && cd ..

# 4. Run existing tests
poetry run pytest --tb=short
```

### Task Execution Pattern

**For Each Task**:

1. **Update Task Status**: Mark task as "in progress"
2. **Implement Solution**: Follow MVP and architecture principles
3. **Test Implementation**: Ensure task meets acceptance criteria
4. **Update Task Status**: Mark task as "completed"
5. **Stop and Review**: Wait for user review before proceeding

**Frontend Tasks**:
- Implement UI components with mocked data
- Focus on user experience and visual design
- Use ComfyUI's styling system and theme integration
- Test immediately (no server restart needed)

**Backend Tasks**:
- Implement domain services and adapters
- Create API endpoints following REST conventions
- Replace mocked data with real integration
- Request server restart after implementation

### Testing Strategy

**Unit Testing**:
```bash
# Test individual components in isolation
poetry run pytest tests/domain/ -v
poetry run pytest tests/adapters/driven/ -v
```

**Integration Testing**:
```bash
# Test component interactions
poetry run pytest tests/integration/ -v
```

**UI Testing**:
- Use Chrome MCP for all UI testing
- Test after frontend changes immediately
- Request server restart after backend changes
- Follow comprehensive testing scenarios

### Quality Assurance

**Code Quality Checks**:
```bash
# Python
poetry run pytest --cov=src --cov-report=html

# Frontend
cd ui && pnpm run lint && pnpm run typecheck && cd ..
```

**ComfyUI Integration Validation**:
- Test extension registration
- Verify theme compatibility
- Test API integration
- Validate drag-and-drop functionality

## Server Restart Protocol

### When Restart is Required

**Backend Changes Requiring Restart**:
- Any file in `src/` directory
- `__init__.py` modifications
- `pyproject.toml` changes
- New Python files

**Frontend-Only Changes (No Restart)**:
- Files in `ui/src/` directory
- CSS/styling changes
- TypeScript/JavaScript code
- Frontend configuration files

### Restart Process

When backend files are modified:

1. **Stop Current Work**: Pause implementation
2. **Request Restart**: Ask user to restart ComfyUI server
3. **Wait for Confirmation**: Don't proceed until user confirms
4. **Resume Work**: Continue with testing and implementation

## Testing with Chrome MCP

### Testing Workflow

1. **Setup**: Navigate to ComfyUI development server
2. **Baseline**: Take screenshot of initial state
3. **Execute**: Perform user interactions being tested
4. **Verify**: Check expected changes occurred
5. **Document**: Capture final state and any issues

### Feature-Specific Testing

**Local Assets Feature**:
- Test folder navigation and breadcrumbs
- Test model grid display and sorting
- Test search and filtering
- Test metadata editing
- Verify drag-and-drop to ComfyUI canvas

**Model Browser Feature**:
- Test search functionality
- Test filtering by model type and platform
- Test model card interactions
- Test download functionality
- Verify error handling

**Output Gallery Feature**:
- Test image gallery display
- Test image detail modal
- Test workflow loading
- Test sorting and filtering
- Test batch operations

### Session Management

- Restart Chrome MCP sessions when encountering issues
- Use clean browser state for each testing session
- Clear cache when testing caching functionality
- Document all testing steps and outcomes

## Documentation and Communication

### During Development

- Update task status in real-time
- Document any architectural decisions
- Note any deviations from original design
- Capture screenshots for UI changes

### After Task Completion

- Provide clear summary of what was implemented
- Note any issues encountered and how they were resolved
- Update documentation if patterns changed
- Prepare for user review and feedback

### Collaboration

- Share screenshots and findings
- Document browser-specific issues
- Provide clear reproduction steps for issues
- Maintain testing artifacts for team review

## Best Practices Summary

### Architecture
- Follow hexagonal architecture principles
- Maintain clean separation of concerns
- Use dependency injection
- Design for testability

### Development
- Implement one task at a time
- Follow MVP principles
- Test incrementally
- Request server restart when needed

### Testing
- Use Chrome MCP for all UI testing
- Test both happy path and error scenarios
- Validate ComfyUI integration points
- Document all testing activities

### Quality
- Maintain high code coverage
- Follow coding conventions
- Ensure ComfyUI compatibility
- Validate against requirements

This workflow ensures consistent, high-quality development while maintaining alignment with ComfyUI's ecosystem and user expectations.