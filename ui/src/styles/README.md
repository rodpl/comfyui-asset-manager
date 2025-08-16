# Theme Integration System

## Overview

The ComfyUI Asset Manager uses a CSS-based theme integration system that automatically adapts to ComfyUI's light and dark themes. This system provides seamless visual integration without requiring complex JavaScript theme management.

## How It Works

### 1. Automatic Theme Detection

The system detects ComfyUI's theme through CSS class observation:

- **Dark Theme (Default)**: No special class required
- **Light Theme**: ComfyUI adds `.comfy-theme-light` class to `:root`

### 2. CSS Variable System

Theme-aware CSS variables automatically reference ComfyUI's design tokens:

```css
:root {
  /* Default (dark) theme */
  --asset-manager-bg-primary: var(--comfy-menu-bg, #2a2a2a);
  --asset-manager-text-primary: var(--input-text, #ffffff);
}

/* Light theme overrides */
:root.comfy-theme-light #asset-manager-root {
  --asset-manager-bg-primary: var(--comfy-menu-bg, #f0f0f0);
  --asset-manager-text-primary: var(--input-text, #000000);
}
```

### 3. Component Integration

Components use CSS variables for automatic theme adaptation:

```css
.my-component {
  background-color: var(--asset-manager-bg-primary);
  color: var(--asset-manager-text-primary);
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}
```

## File Structure

```
ui/src/styles/
├── README.md           # This file - system overview
├── theme.css          # Main theme variable definitions
└── components/        # Component-specific theme styles
```

## Key Files

### `theme.css`

Contains all CSS variable definitions and light theme overrides. This is the core of the theme system.

### Component CSS Files

Individual component CSS files use the theme variables defined in `theme.css`.

## Usage Guidelines

### For New Components

1. **Use CSS Variables**: Always use theme variables instead of hardcoded colors
2. **Add Transitions**: Include smooth transitions for theme switching
3. **Test Both Themes**: Verify components work in light and dark themes

### CSS Variable Reference

See the [Theme Integration Quick Reference](../../../docs/development/theme-integration-quick-reference.md) for a complete list of available CSS variables.

## Testing

Theme integration includes comprehensive testing:

- **CSS Variable Fallbacks**: Ensure variables work without ComfyUI
- **Theme Switching**: Test automatic theme transitions
- **Visual Regression**: Compare component appearance across themes

Test utilities are available in `ui/src/utils/themeTestUtils.ts`.

## Documentation

- **Complete Guide**: [Theme Integration Guide](../../../docs/development/theme-integration-guide.md)
- **Quick Reference**: [Theme Integration Quick Reference](../../../docs/development/theme-integration-quick-reference.md)
- **Test Utils**: `ui/src/utils/themeTestUtils.ts`
- **Theme Hook**: `ui/src/hooks/useComfyUITheme.ts` (optional)

## Benefits

- **Automatic Integration**: No manual theme management required
- **Performance**: CSS-based switching with no JavaScript overhead
- **Maintainability**: Centralized theme variable system
- **Future-Proof**: Automatically inherits ComfyUI theme updates
- **Accessibility**: Respects user theme preferences

## Architecture

The theme system follows a CSS-first approach:

1. **CSS Variables**: Define semantic color variables
2. **ComfyUI Integration**: Reference ComfyUI's CSS custom properties
3. **Fallback Values**: Provide defaults for graceful degradation
4. **Automatic Switching**: Use CSS selectors for theme transitions
5. **Optional JavaScript**: Minimal JS for components that need theme awareness

This approach ensures the theme system is performant, maintainable, and automatically compatible with ComfyUI's theme evolution.
