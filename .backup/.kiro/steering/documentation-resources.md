---
inclusion: always
---

# Documentation Resources and MCP Tools

## Available MCP Documentation Tools

This project has access to comprehensive ComfyUI documentation through MCP (Model Context Protocol) tools. These should be consulted when creating new specs or updating existing ones to ensure alignment with ComfyUI's current capabilities and best practices.

### 1. ComfyUI Core Documentation

**Tool**: `mcp_ComfyUI_Docs_*`
**Purpose**: Main ComfyUI project documentation including backend architecture, installation, and core features.

**When to Use**:

- Understanding ComfyUI's core architecture
- Learning about model loading and folder_paths system
- Checking supported model types and formats
- Understanding ComfyUI's extension registration system

**Key Information Available**:

- Extension registration via NODE_CLASS_MAPPINGS and WEB_DIRECTORY
- Model folder structure and supported formats
- ComfyUI's internal APIs and architecture
- Installation and setup procedures

### 2. ComfyUI Frontend Documentation

**Tool**: `mcp_ComfyUI_Frontend_Docs_*`
**Purpose**: Frontend-specific documentation for ComfyUI's Vue-based interface.

**When to Use**:

- Understanding ComfyUI's frontend architecture
- Learning about the extension system from frontend perspective
- Checking feature flags and capability negotiation
- Understanding theme and styling systems

**Key Information Available**:

- Feature flags system for capability negotiation
- Frontend extension registration patterns
- Theme integration and CSS variable usage
- Component architecture and patterns

### 3. ComfyUI React Extension Template

**Tool**: `mcp_ComfyUI_React_Extension_Docs_*`
**Purpose**: Official template showing how to create React-based extensions.

**When to Use**:

- Designing React-based extension architecture
- Understanding build and development workflows
- Learning TypeScript integration patterns
- Planning ComfyUI Registry publishing

**Key Information Available**:

- Complete React extension setup and structure
- Build configuration with Vite
- TypeScript integration with ComfyUI types
- Registry publishing workflow
- Testing setup and patterns

### 4. ComfyUI-Copilot Reference

**Tool**: `mcp_ComfyUI_Copilot_Docs_*`
**Purpose**: Working example of a sophisticated ComfyUI extension with React frontend and Python backend.

**When to Use**:

- Understanding complex extension architecture
- Learning advanced integration patterns
- Seeing real-world implementation examples
- Understanding user experience patterns

**Key Information Available**:

- Hybrid Python-React architecture
- Advanced UI integration patterns
- Real-world extension features and capabilities
- User interaction and workflow integration

## How to Use MCP Tools During Spec Creation

### During Requirements Phase

```markdown
Before finalizing requirements, consult:

1. ComfyUI Core Docs - Verify technical feasibility
2. Frontend Docs - Check UI integration capabilities
3. Existing Extensions - Validate user experience expectations
```

### During Design Phase

```markdown
Reference documentation for:

1. Architecture patterns from React Extension Template
2. API integration patterns from ComfyUI Core
3. Feature flag usage from Frontend Docs
4. Real-world examples from ComfyUI-Copilot
```

### During Task Planning Phase

```markdown
Use documentation to:

1. Validate implementation approaches
2. Identify required dependencies
3. Plan integration points
4. Estimate complexity accurately
```

## Recommended Workflow for New Specs

### 1. Research Phase

Before writing requirements, use MCP tools to:

- Understand current ComfyUI capabilities
- Check for similar existing functionality
- Validate technical feasibility
- Identify integration constraints

### 2. Architecture Validation

During design phase:

- Compare proposed architecture with proven examples
- Verify API usage patterns
- Check compatibility with ComfyUI's systems
- Validate performance considerations

### 3. Implementation Planning

When creating tasks:

- Reference actual implementation examples
- Use proven patterns from documentation
- Plan for ComfyUI-specific integration points
- Consider registry publishing requirements

## Example Usage in Spec Creation

### Requirements Research

```markdown
# Before writing requirements for a new feature:

1. Search ComfyUI Core Docs for existing similar functionality
2. Check Frontend Docs for UI capability constraints
3. Review React Extension Template for technical limitations
4. Examine ComfyUI-Copilot for user experience patterns
```

### Design Validation

```markdown
# During design phase:

1. Verify proposed APIs exist in ComfyUI Core Docs
2. Check feature flag requirements in Frontend Docs
3. Validate build process against React Extension Template
4. Compare UX patterns with ComfyUI-Copilot
```

### Task Creation

```markdown
# When planning implementation tasks:

1. Reference specific code examples from documentation
2. Include links to relevant documentation sections
3. Plan for ComfyUI-specific integration requirements
4. Consider registry publishing from the start
```

## Documentation-Driven Development Benefits

### 1. Accurate Requirements

- Requirements based on actual ComfyUI capabilities
- Realistic scope based on proven patterns
- Better understanding of user expectations

### 2. Validated Architecture

- Architecture decisions backed by working examples
- Integration patterns proven in production
- Performance considerations from real implementations

### 3. Efficient Implementation

- Tasks reference specific implementation examples
- Reduced trial-and-error during development
- Clear integration patterns to follow

### 4. Future-Proof Design

- Awareness of ComfyUI's evolution direction
- Compatibility with upcoming features
- Alignment with ecosystem best practices

## Best Practices

### 1. Always Research First

Before creating any new spec, spend time researching with MCP tools to understand the current state of ComfyUI and existing solutions.

### 2. Reference Real Examples

When possible, reference actual code examples and patterns from the documentation in your specs.

### 3. Stay Current

Regularly check documentation for updates, especially before major implementation phases.

### 4. Document Sources

Include references to specific documentation sections in your specs for future reference and validation.

### 5. Validate Assumptions

Use MCP tools to validate technical assumptions during spec review phases.

## MCP Tool Usage Examples

### Research Phase Example

```markdown
# Example MCP research workflow for new feature

1. **Core Functionality Research**:
   - Use `mcp_ComfyUI_Docs_fetch_ComfyUI_documentation` to understand base capabilities
   - Search for existing model management features
   - Identify extension points and APIs

2. **Frontend Integration Research**:
   - Use `mcp_ComfyUI_Frontend_Docs_fetch_ComfyUI_frontend_docs` for UI patterns
   - Check theme system and CSS variable usage
   - Understand sidebar registration process

3. **Implementation Pattern Research**:
   - Use `mcp_ComfyUI_React_Extension_Docs_fetch_docs` for React patterns
   - Review build configuration and TypeScript setup
   - Understand testing and deployment workflows

4. **Real-world Example Research**:
   - Use `mcp_ComfyUI_Copilot_Docs_fetch_ComfyUI_Copilot_docs` for complex patterns
   - Study advanced integration techniques
   - Learn from production extension architecture
```

### Design Validation Example

```markdown
# Example design validation using MCP tools

## API Design Validation
- Search ComfyUI core docs for existing `/api/` patterns
- Verify endpoint naming conventions
- Check authentication and security patterns

## Component Architecture Validation  
- Review React extension template for component structure
- Validate hook usage patterns
- Check state management approaches

## Integration Point Validation
- Verify `folder_paths` integration patterns in core docs
- Check extension registration requirements
- Validate theme integration approaches
```

### Implementation Reference Example

```markdown
# Example implementation guidance from MCP tools

## Backend Implementation
- Reference specific adapter patterns from core documentation
- Use proven error handling patterns from existing extensions
- Follow established testing patterns

## Frontend Implementation  
- Use component patterns from React extension template
- Follow established styling and theme integration
- Implement proven performance optimization techniques

## Integration Implementation
- Use established ComfyUI API integration patterns
- Follow proven extension lifecycle management
- Implement established drag-and-drop patterns
```

## Documentation Quality Assurance

### Validation Checklist

Before finalizing any spec, validate against MCP documentation:

- [ ] **Technical Feasibility**: All proposed APIs exist and are accessible
- [ ] **Integration Patterns**: Follow established ComfyUI extension patterns  
- [ ] **Performance Considerations**: Align with ComfyUI performance expectations
- [ ] **User Experience**: Match established ComfyUI UX patterns
- [ ] **Testing Approach**: Use proven testing strategies from examples
- [ ] **Deployment Process**: Follow established registry publishing patterns

### Documentation Freshness

- Always use latest documentation from MCP tools
- Cross-reference multiple sources for accuracy
- Validate examples against current ComfyUI versions
- Update references when ComfyUI APIs change

This comprehensive approach ensures all specs are grounded in current ComfyUI capabilities and follow proven patterns from the ecosystem.
