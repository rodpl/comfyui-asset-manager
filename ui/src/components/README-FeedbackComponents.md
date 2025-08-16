# Feedback Components with ComfyUI Theme Integration

This document describes the enhanced feedback components that provide consistent loading states, error messages, empty states, and success feedback using ComfyUI's theme system.

## Components Overview

### LoadingSpinner (Enhanced)
Enhanced loading spinner with new color variants and improved theme integration.

**Props:**
- `size?: 'small' | 'medium' | 'large'` - Spinner size
- `color?: 'primary' | 'secondary' | 'white' | 'success' | 'warning' | 'error'` - Color variant
- `text?: string` - Optional loading text
- `overlay?: boolean` - Show as overlay
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
<LoadingSpinner size="medium" color="primary" text="Loading models..." />
<LoadingSpinner size="large" color="success" overlay />
```

### ErrorMessage
Displays error messages with consistent styling and theme support.

**Props:**
- `title?: string` - Error title
- `message: string` - Error message (required)
- `variant?: 'error' | 'warning' | 'info'` - Message type
- `inline?: boolean` - Inline display for form fields
- `className?: string` - Additional CSS classes
- `onDismiss?: () => void` - Dismiss callback

**Usage:**
```tsx
<ErrorMessage
  title="Connection Error"
  message="Failed to connect to the server"
  variant="error"
  onDismiss={() => setError(null)}
/>

<ErrorMessage message="This field is required" inline />
```

### SuccessMessage
Displays success feedback with consistent styling.

**Props:**
- `title?: string` - Success title
- `message: string` - Success message (required)
- `className?: string` - Additional CSS classes
- `onDismiss?: () => void` - Dismiss callback

**Usage:**
```tsx
<SuccessMessage
  title="Upload Complete"
  message="Your model has been successfully uploaded"
  onDismiss={() => setSuccess(null)}
/>
```

### EmptyState
Displays empty state messages with icons and actions.

**Props:**
- `icon?: string` - PrimeIcons icon class (default: 'pi pi-folder-open')
- `title: string` - Empty state title (required)
- `description?: string` - Empty state description
- `actions?: React.ReactNode` - Action buttons
- `variant?: 'default' | 'search' | 'compact'` - Display variant
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
<EmptyState
  icon="pi pi-search"
  title="No Search Results"
  description="No models match your search criteria"
  actions={
    <button className="asset-manager-button asset-manager-button--primary">
      Clear Search
    </button>
  }
  variant="search"
/>
```

### Toast
Toast-style notifications with auto-dismiss functionality.

**Props:**
- `message: string` - Toast message (required)
- `title?: string` - Toast title
- `variant?: 'success' | 'error' | 'warning' | 'info'` - Toast type
- `duration?: number` - Auto-dismiss duration in ms (default: 5000)
- `visible?: boolean` - Visibility state
- `onClose?: () => void` - Close callback
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
<Toast
  title="Success"
  message="Model downloaded successfully"
  variant="success"
  visible={showToast}
  onClose={() => setShowToast(false)}
/>
```

### ProgressIndicator
Progress bars for loading states with determinate and indeterminate modes.

**Props:**
- `progress?: number` - Progress value 0-100 (undefined for indeterminate)
- `variant?: 'primary' | 'success' | 'warning' | 'error'` - Color variant
- `size?: 'small' | 'medium' | 'large'` - Progress bar size
- `showPercentage?: boolean` - Show percentage text
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
<ProgressIndicator progress={75} showPercentage />
<ProgressIndicator /> {/* Indeterminate */}
<ProgressIndicator progress={100} variant="success" />
```

## Theme Integration

All components automatically adapt to ComfyUI's light/dark theme using CSS variables:

### CSS Variables Used
- `--asset-manager-bg-primary` - Primary background
- `--asset-manager-bg-secondary` - Secondary background
- `--asset-manager-text-primary` - Primary text color
- `--asset-manager-text-secondary` - Secondary text color
- `--asset-manager-interactive-primary` - Primary interactive color
- `--asset-manager-success` - Success color
- `--asset-manager-warning` - Warning color
- `--asset-manager-error` - Error color
- `--asset-manager-border-primary` - Border color
- `--asset-manager-transition-normal` - Transition timing

### Theme Switching
Components automatically switch themes when ComfyUI's theme changes:
- Dark theme: Uses darker backgrounds and lighter text
- Light theme: Uses lighter backgrounds and darker text
- Smooth transitions between theme changes

## CSS Classes

All components use scoped CSS classes prefixed with `asset-manager-` and are contained within `#comfyui-asset-manager-root` for proper theme isolation.

### Key CSS Classes
- `.asset-manager-loading` - Loading container
- `.asset-manager-spinner` - Spinner element
- `.asset-manager-error-message` - Error message container
- `.asset-manager-success-message` - Success message container
- `.asset-manager-empty-state` - Empty state container
- `.asset-manager-toast` - Toast notification
- `.asset-manager-progress-indicator` - Progress indicator

## Accessibility

All components include proper accessibility features:
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Semantic HTML structure

## Examples

### Loading States
```tsx
// Basic loading
<LoadingSpinner />

// Loading with text
<LoadingSpinner text="Loading models..." />

// Overlay loading
<div style={{ position: 'relative', height: '200px' }}>
  <LoadingSpinner overlay />
</div>

// Progress loading
<ProgressIndicator progress={downloadProgress} showPercentage />
```

### Error Handling
```tsx
// API error
<ErrorMessage
  title="API Error"
  message="Failed to fetch models from server"
  variant="error"
/>

// Form validation
<ErrorMessage message="Email is required" inline />

// Warning message
<ErrorMessage
  title="Warning"
  message="This action cannot be undone"
  variant="warning"
/>
```

### Empty States
```tsx
// No search results
<EmptyState
  icon="pi pi-search"
  title="No Results Found"
  description="Try adjusting your search terms"
  variant="search"
/>

// Empty folder
<EmptyState
  icon="pi pi-folder-open"
  title="Folder is Empty"
  description="No models found in this folder"
  actions={
    <button className="asset-manager-button asset-manager-button--primary">
      Add Models
    </button>
  }
/>
```

### Success Feedback
```tsx
// Success message
<SuccessMessage
  title="Success!"
  message="Model uploaded successfully"
/>

// Success toast
<Toast
  title="Download Complete"
  message="Model has been downloaded to your library"
  variant="success"
/>
```

## Best Practices

1. **Consistent Messaging**: Use clear, actionable error messages
2. **Theme Compliance**: Always use theme CSS variables
3. **Accessibility**: Include proper ARIA labels
4. **Performance**: Use loading states for operations > 200ms
5. **User Feedback**: Provide immediate feedback for user actions
6. **Progressive Enhancement**: Gracefully handle missing features

## Migration from Old Components

If updating existing components:

1. Replace old CSS variables (`--cam-*`) with new theme variables (`--asset-manager-*`)
2. Update component imports to use new feedback components
3. Wrap components in `#comfyui-asset-manager-root` for proper theming
4. Test theme switching functionality
5. Verify accessibility features work correctly