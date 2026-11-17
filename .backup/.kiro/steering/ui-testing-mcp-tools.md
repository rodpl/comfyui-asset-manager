---
inclusion: always
---

# UI Testing with Chrome MCP

## Overview

This document provides comprehensive guidance for UI testing using Chrome MCP (Model Context Protocol). Chrome MCP is the primary and only tool used for UI testing in this project, providing real browser environment testing for all user interface validation needs.

## Chrome MCP as Primary Testing Tool

Chrome MCP is used for:

- **Interactive UI Testing**: Testing user interactions, form submissions, and dynamic content
- **Real Browser Environment**: Testing features that require actual browser APIs and rendering
- **Visual Debugging**: Debugging visual issues or layout problems in real-time
- **ComfyUI Extension Testing**: Testing extension integration within ComfyUI's actual interface
- **Manual Testing**: Exploratory testing and manual validation of features
- **Cross-Browser Compatibility**: Validating functionality across different browser engines
- **Integration Testing**: Testing frontend-backend integration with real HTTP requests
- **End-to-End Testing**: Complete user workflow validation
- **Performance Testing**: Real-world performance measurement and optimization

## Chrome MCP Testing Guidelines

### Chrome MCP Testing Workflow

#### 1. Setup and Navigation

```markdown
1. Navigate to ComfyUI development server (typically http://localhost:8188)
2. Ensure the Asset Manager extension is loaded and visible in sidebar
3. Take initial screenshot to verify baseline state
4. Check console for any JavaScript errors
```

#### 2. Feature Testing Pattern

```markdown
For each feature being tested:

1. **Navigate to Feature**: Click appropriate tab or navigate to feature area
2. **Capture State**: Take screenshot of initial state
3. **Perform Actions**: Execute the user interactions being tested
4. **Verify Results**: Check that expected changes occurred
5. **Capture Final State**: Take screenshot of final state
6. **Check Console**: Verify no errors were introduced
```

#### 3. Integration Testing

```markdown
When testing ComfyUI integration:

1. **Extension Registration**: Verify extension appears in sidebar
2. **API Communication**: Test backend API calls through browser dev tools
3. **Graph Integration**: Test drag-and-drop from extension to ComfyUI canvas
4. **Theme Integration**: Verify extension respects ComfyUI's theme changes
5. **Settings Integration**: Test extension settings in ComfyUI settings panel
```

### Common Chrome MCP Testing Scenarios

#### Testing Model Browser Feature

```markdown
1. Navigate to Model Browser tab
2. Test search functionality with various queries
3. Test filtering by model type, platform, etc.
4. Test model card interactions (hover, click, details modal)
5. Test download functionality (if implemented)
6. Verify error handling for network failures
7. Test pagination or infinite scroll
```

#### Testing Local Assets Feature

```markdown
1. Navigate to Local Assets tab
2. Test folder navigation and breadcrumbs
3. Test model grid display and sorting
4. Test search and filtering within local assets
5. Test metadata editing functionality
6. Test bulk operations (if implemented)
7. Verify drag-and-drop to ComfyUI canvas
```

#### Testing Output Gallery Feature

```markdown
1. Navigate to Outputs tab
2. Test image gallery display and thumbnails
3. Test image detail modal and metadata display
4. Test workflow loading from output metadata
5. Test sorting and filtering options
6. Test batch operations (delete, export, etc.)
7. Verify performance with large numbers of outputs
```

### Chrome MCP Error Handling and Debugging

#### Console Monitoring

- Always check browser console for JavaScript errors
- Monitor network tab for failed API requests
- Watch for ComfyUI-specific error messages

#### Screenshot Documentation

- Capture screenshots at key testing points
- Use descriptive names for screenshot files
- Compare screenshots across different test runs

#### Network Request Validation

- Monitor API calls to `/asset_manager/` endpoints
- Verify request/response formats match API specifications
- Test error scenarios (network failures, invalid responses)

### Chrome MCP Performance Testing

#### Loading Performance

- Measure initial extension load time
- Test performance with large model collections
- Monitor memory usage during extended sessions

#### User Experience Testing

- Test responsiveness of UI interactions
- Verify smooth scrolling and animations
- Test performance on different screen sizes

## Chrome MCP Session Management

### Session Restart Policy

- The assistant may restart the Chrome MCP browser/session at any time to ensure a clean state, recover from flakiness, or resolve hangs/timeouts. No user confirmation is required.
- Prefer restarting when encountering: stuck/hung pages, stale state across tests, repeated timeouts, cache issues, or browser-specific problems.
- A restart may include closing the current page/browser context and reinitializing a fresh session before continuing the task.

### When to Restart Chrome MCP Sessions

- **Stuck/Hung Pages**: Page becomes unresponsive or navigation fails
- **Stale State**: Previous test state interferes with current testing
- **Repeated Timeouts**: Multiple timeout errors in succession
- **Cache Issues**: Browser cache interfering with testing
- **Memory Issues**: High memory usage or suspected memory leaks
- **Extension Loading Problems**: ComfyUI extension fails to load properly

## Backend Server Restart Requirements

### When Backend Changes Require Server Restart

The assistant MUST request user to restart the backend server when any of the following backend files are modified:

#### Python Backend Files

- Any file in `src/` directory (domain services, adapters, entities)
- `__init__.py` (ComfyUI extension entry point)
- `pyproject.toml` (dependencies or configuration changes)
- Any new Python files added to the project

#### Configuration Files

- Any changes to server configuration
- Changes to ComfyUI integration code
- API endpoint modifications or additions

### Server Restart Protocol

When backend files are modified, the assistant MUST:

1. **Stop Current Work**: Pause any ongoing testing or implementation
2. **Request Restart**: Ask user to restart the ComfyUI server/backend
3. **Wait for Confirmation**: Wait for user confirmation that server is restarted and ready
4. **Resume Work**: Only continue after receiving explicit user confirmation

#### Example Request Message:

```
Backend files have been modified. Please restart your ComfyUI server to apply the changes, then confirm when ready to continue testing.
```

### Frontend-Only Changes

The assistant can continue testing immediately when only frontend files are modified:

- Files in `ui/src/` directory
- CSS/styling changes
- TypeScript/JavaScript frontend code
- Frontend configuration files (vite.config.ts, package.json)

These changes are automatically reflected through the development build process without requiring server restart.

## ComfyUI-Specific Testing

### Extension Integration Testing

#### Extension Registration

```markdown
1. Verify extension appears in ComfyUI sidebar
2. Test extension icon and tooltip display
3. Verify extension doesn't interfere with ComfyUI core functionality
4. Test extension behavior during ComfyUI workflow execution
```

#### Theme and Styling

```markdown
1. Test extension appearance in light theme
2. Test extension appearance in dark theme
3. Verify theme switching works correctly
4. Test custom ComfyUI themes (if any)
```

#### API Integration

```markdown
1. Test that extension APIs don't conflict with ComfyUI APIs
2. Verify proper error handling when ComfyUI backend is unavailable
3. Test extension behavior during ComfyUI updates or restarts
```

## Best Practices for MCP Testing

### Session Management

- Start each testing session with a clean browser state
- Clear cache and cookies when testing caching functionality
- Use incognito/private browsing for isolated testing
- Restart sessions when encountering persistent issues

### Test Data Management

- Use consistent test data across testing sessions
- Prepare test model files and outputs for consistent testing
- Document test data requirements for reproducible testing
- Clean up test data after testing sessions

### Documentation and Reporting

- Document all testing steps and expected outcomes
- Record any bugs or issues discovered during testing
- Maintain a testing checklist for comprehensive coverage
- Capture screenshots and logs for issue reproduction

### Collaboration

- Share screenshots and findings with development team
- Document browser-specific issues or compatibility problems
- Provide clear reproduction steps for any issues found
- Maintain testing artifacts for team review

## Troubleshooting Common Issues

### Extension Not Loading

1. Check ComfyUI console for extension registration errors
2. Verify `dist/` directory contains built frontend assets
3. Check that `__init__.py` properly registers web directory
4. Verify no JavaScript errors prevent extension initialization
5. Restart browser session if extension registration fails

### API Communication Failures

1. Check network tab for failed requests to `/asset_manager/` endpoints
2. Verify backend server is running and accessible
3. Check CORS configuration if testing from different origin
4. Verify API endpoint URLs match frontend expectations
5. Test with different network conditions

### UI Rendering Issues

1. Check for CSS conflicts with ComfyUI styles
2. Verify responsive design works at different screen sizes
3. Test with browser zoom levels
4. Check for JavaScript errors that might break rendering
5. Compare rendering across different browsers

### Performance Issues

1. Monitor memory usage in browser dev tools
2. Check for memory leaks during extended usage
3. Profile JavaScript performance for slow operations
4. Test with large datasets to identify bottlenecks
5. Use Chrome MCP for performance testing and profiling

### Session and State Issues

1. Clear browser cache and cookies
2. Restart Chrome MCP session
3. Check for conflicting browser extensions
4. Verify clean test environment setup
5. Test in incognito/private browsing mode

## Testing Strategy with Chrome MCP

### Development Phase Testing

- Use Chrome MCP for interactive development and debugging
- Test individual features as they are implemented
- Validate ComfyUI integration points manually
- Capture visual states for comparison
- Test immediately after frontend changes
- Request server restart after backend changes

### Integration Testing

- Use Chrome MCP for complete integration validation
- Test complete user workflows end-to-end
- Verify cross-feature interactions
- Test with realistic data volumes
- Validate frontend-backend communication
- Test error handling and edge cases

### Feature Testing Workflow

1. **Frontend Changes**: Test immediately with Chrome MCP
2. **Backend Changes**: Request server restart, wait for confirmation, then test
3. **Full Feature Testing**: Comprehensive testing of complete user workflows
4. **Visual Validation**: Screenshot comparison and visual regression testing
5. **Performance Testing**: Real-world performance measurement

### Release Testing

- Perform comprehensive manual testing with Chrome MCP
- Test all critical user paths and workflows
- Validate performance and compatibility
- Test with production-like data volumes
- Verify all integration points work correctly
