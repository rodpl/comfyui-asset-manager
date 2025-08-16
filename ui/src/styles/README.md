# ComfyUI Asset Manager Theme System

## Overview

The Asset Manager uses a CSS-based theme system that automatically adapts to ComfyUI's light and dark themes. The system leverages ComfyUI's existing CSS custom properties with fallback values to ensure compatibility.

## How It Works

### Automatic Theme Detection

The theme system uses CSS selectors to detect ComfyUI's theme state:

- **Default (Dark Theme)**: Uses `:root` selector with ComfyUI's dark theme variables
- **Light Theme**: Uses `:root.comfy-theme-light #comfyui-asset-manager-root` selector for overrides

### CSS Variables

All theme variables are defined in `theme.css` and reference ComfyUI's CSS custom properties:

```css
/* Dark theme (default) */
:root {
  --asset-manager-bg-primary: var(--comfy-menu-bg, #2a2a2a);
  --asset-manager-text-primary: var(--input-text, #ffffff);
  /* ... more variables */
}

/* Light theme overrides */
:root.comfy-theme-light #comfyui-asset-manager-root {
  --asset-manager-bg-primary: var(--comfy-menu-bg, #f0f0f0);
  --asset-manager-text-primary: var(--input-text, #000000);
  /* ... more overrides */
}
```

## Available CSS Variables

### Background Colors
- `--asset-manager-bg-primary`: Main background color
- `--asset-manager-bg-secondary`: Secondary background (cards, inputs)
- `--asset-manager-bg-tertiary`: Hover states and highlights

### Text Colors
- `--asset-manager-text-primary`: Main text color
- `--asset-manager-text-secondary`: Secondary text color
- `--asset-manager-text-muted`: Muted/disabled text color

### Border Colors
- `--asset-manager-border-primary`: Main border color
- `--asset-manager-border-secondary`: Secondary borders
- `--asset-manager-border-hover`: Hover state borders

### Interactive Colors
- `--asset-manager-interactive-primary`: Primary buttons and links
- `--asset-manager-interactive-secondary`: Secondary interactive elements
- `--asset-manager-interactive-hover`: Hover state backgrounds

### Status Colors
- `--asset-manager-success`: Success states
- `--asset-manager-warning`: Warning states
- `--asset-manager-error`: Error states
- `--asset-manager-info`: Info states

### Spacing
- `--asset-manager-spacing-xs`: 0.25rem
- `--asset-manager-spacing-sm`: 0.5rem
- `--asset-manager-spacing-md`: 1rem
- `--asset-manager-spacing-lg`: 1.5rem
- `--asset-manager-spacing-xl`: 2rem

### Border Radius
- `--asset-manager-border-radius-sm`: 0.25rem
- `--asset-manager-border-radius-md`: 0.375rem
- `--asset-manager-border-radius-lg`: 0.5rem

### Transitions
- `--asset-manager-transition-fast`: 0.15s ease
- `--asset-manager-transition-normal`: 0.2s ease
- `--asset-manager-transition-slow`: 0.3s ease

## Pre-built Component Classes

### Buttons
```css
.asset-manager-button                /* Base button */
.asset-manager-button--primary       /* Primary button */
.asset-manager-button--secondary     /* Secondary button */
.asset-manager-button--success       /* Success button */
.asset-manager-button--warning       /* Warning button */
.asset-manager-button--error         /* Error button */
```

### Inputs
```css
.asset-manager-input                 /* Base input field */
```

### Cards
```css
.asset-manager-card                  /* Base card component */
```

### Components
```css
.asset-manager-component             /* Base component styling */
```

### Status Classes
```css
.asset-manager-success               /* Success styling */
.asset-manager-warning               /* Warning styling */
.asset-manager-error                 /* Error styling */
.asset-manager-info                  /* Info styling */
```

### Utility Classes
```css
/* Spacing */
.asset-manager-spacing-xs            /* Extra small margin */
.asset-manager-spacing-sm            /* Small margin */
.asset-manager-spacing-md            /* Medium margin */
.asset-manager-spacing-lg            /* Large margin */
.asset-manager-spacing-xl            /* Extra large margin */

.asset-manager-padding-xs            /* Extra small padding */
.asset-manager-padding-sm            /* Small padding */
.asset-manager-padding-md            /* Medium padding */
.asset-manager-padding-lg            /* Large padding */
.asset-manager-padding-xl            /* Extra large padding */

/* Text Colors */
.asset-manager-text-primary          /* Primary text color */
.asset-manager-text-secondary        /* Secondary text color */
.asset-manager-text-muted             /* Muted text color */

/* Background Colors */
.asset-manager-bg-primary             /* Primary background */
.asset-manager-bg-secondary           /* Secondary background */
.asset-manager-bg-tertiary            /* Tertiary background */
```

## Usage Examples

### Basic Component
```tsx
function MyComponent() {
  return (
    <div className="asset-manager-card">
      <h3 className="asset-manager-text-primary">Card Title</h3>
      <p className="asset-manager-text-secondary">Card description</p>
      <button className="asset-manager-button asset-manager-button--primary">
        Action
      </button>
    </div>
  );
}
```

### Custom Styling with CSS Variables
```css
.my-custom-component {
  background-color: var(--asset-manager-bg-secondary);
  color: var(--asset-manager-text-primary);
  border: 1px solid var(--asset-manager-border-primary);
  border-radius: var(--asset-manager-border-radius-md);
  padding: var(--asset-manager-spacing-md);
  transition: 
    background-color var(--asset-manager-transition-normal),
    border-color var(--asset-manager-transition-normal);
}

.my-custom-component:hover {
  background-color: var(--asset-manager-bg-tertiary);
  border-color: var(--asset-manager-border-hover);
}
```

## Best Practices

### 1. Always Use CSS Variables
Instead of hardcoded colors, always use the theme variables:

```css
/* ❌ Don't do this */
.my-component {
  background-color: #2a2a2a;
  color: #ffffff;
}

/* ✅ Do this */
.my-component {
  background-color: var(--asset-manager-bg-primary);
  color: var(--asset-manager-text-primary);
}
```

### 2. Include Transitions
Add smooth transitions for theme switching:

```css
.my-component {
  transition: 
    color var(--asset-manager-transition-normal),
    background-color var(--asset-manager-transition-normal),
    border-color var(--asset-manager-transition-normal);
}
```

### 3. Use Scoped Selectors
All styles should be scoped to the extension root to prevent leakage:

```css
/* ✅ Properly scoped */
#comfyui-asset-manager-root .my-component {
  /* styles */
}
```

### 4. Leverage Pre-built Classes
Use the pre-built component classes when possible:

```tsx
// ✅ Use pre-built classes
<button className="asset-manager-button asset-manager-button--primary">
  Click me
</button>

// Instead of custom styling
<button style={{ backgroundColor: '#007acc', color: 'white' }}>
  Click me
</button>
```

## Theme Testing

To test your components in both themes:

1. Open ComfyUI
2. Switch between light and dark themes in ComfyUI settings
3. Verify your components adapt automatically
4. Check that transitions are smooth

## Fallback Values

All CSS variables include fallback values for compatibility:

```css
--asset-manager-bg-primary: var(--comfy-menu-bg, #2a2a2a);
```

If ComfyUI's `--comfy-menu-bg` is not available, it falls back to `#2a2a2a`.