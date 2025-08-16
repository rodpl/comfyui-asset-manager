# ComfyUI Asset Manager Theme System

This directory contains the comprehensive theme system for the ComfyUI Asset Manager extension. The theme system automatically adapts to ComfyUI's light and dark themes using CSS variables and provides a consistent visual experience.

## Files

- `theme.css` - Complete theme system with CSS variables, component styles, and theme switching
- `README.md` - This documentation file

## Architecture

The theme system uses a CSS-first approach that automatically adapts to ComfyUI's theme changes without requiring JavaScript theme management.

### Key Features

1. **Automatic Theme Detection**: Uses ComfyUI's `.comfy-theme-light` class to detect theme changes
2. **CSS Variable System**: Semantic variables that map to ComfyUI's CSS custom properties
3. **Fallback Values**: All variables include fallback values for when ComfyUI variables are unavailable
4. **Smooth Transitions**: Configurable transition properties for theme switching
5. **Component Classes**: Pre-styled component classes for consistent theming
6. **Utility Classes**: Helper classes for spacing, colors, and common styling needs

## CSS Variable Structure

### Semantic Categories

#### Background Colors
- `--asset-manager-bg-primary` - Main background color
- `--asset-manager-bg-secondary` - Secondary background (cards, inputs)
- `--asset-manager-bg-tertiary` - Tertiary background (hover states)

#### Text Colors
- `--asset-manager-text-primary` - Primary text color
- `--asset-manager-text-secondary` - Secondary text color
- `--asset-manager-text-muted` - Muted text color

#### Border Colors
- `--asset-manager-border-primary` - Primary border color
- `--asset-manager-border-secondary` - Secondary border color
- `--asset-manager-border-hover` - Hover state border color

#### Interactive Colors
- `--asset-manager-interactive-primary` - Primary interactive color (buttons, links)
- `--asset-manager-interactive-secondary` - Secondary interactive color
- `--asset-manager-interactive-hover` - Hover state color

#### Status Colors
- `--asset-manager-success` - Success state color
- `--asset-manager-warning` - Warning state color
- `--asset-manager-error` - Error state color
- `--asset-manager-info` - Info state color

#### Spacing
- `--asset-manager-spacing-xs` - Extra small spacing (0.25rem)
- `--asset-manager-spacing-sm` - Small spacing (0.5rem)
- `--asset-manager-spacing-md` - Medium spacing (1rem)
- `--asset-manager-spacing-lg` - Large spacing (1.5rem)
- `--asset-manager-spacing-xl` - Extra large spacing (2rem)

#### Border Radius
- `--asset-manager-border-radius-sm` - Small border radius (0.25rem)
- `--asset-manager-border-radius-md` - Medium border radius (0.375rem)
- `--asset-manager-border-radius-lg` - Large border radius (0.5rem)

#### Transitions
- `--asset-manager-transition-fast` - Fast transition (0.15s ease)
- `--asset-manager-transition-normal` - Normal transition (0.2s ease)
- `--asset-manager-transition-slow` - Slow transition (0.3s ease)

## Component Classes

### Base Components
- `.asset-manager-component` - Base component styling
- `.asset-manager-button` - Button styling
- `.asset-manager-input` - Input field styling
- `.asset-manager-card` - Card/panel styling
- `.asset-manager-modal` - Modal dialog styling

### Button Variants
- `.asset-manager-button--primary` - Primary button
- `.asset-manager-button--secondary` - Secondary button
- `.asset-manager-button--success` - Success button
- `.asset-manager-button--warning` - Warning button
- `.asset-manager-button--error` - Error button

### Status Components
- `.asset-manager-success` - Success styling
- `.asset-manager-warning` - Warning styling
- `.asset-manager-error` - Error styling
- `.asset-manager-info` - Info styling

### Loading States
- `.asset-manager-loading` - Loading text styling
- `.asset-manager-spinner` - Loading spinner animation

### Utility Classes
- `.asset-manager-spacing-*` - Margin utilities
- `.asset-manager-padding-*` - Padding utilities
- `.asset-manager-text-*` - Text color utilities
- `.asset-manager-bg-*` - Background color utilities

## Usage

### In React Components

```tsx
// Use component classes
<button className="asset-manager-button asset-manager-button--primary">
  Primary Button
</button>

<div className="asset-manager-card">
  <h3>Card Title</h3>
  <p className="asset-manager-text-secondary">Card content</p>
</div>

// Use utility classes
<div className="asset-manager-padding-md asset-manager-bg-secondary">
  Content with padding and background
</div>
```

### In CSS

```css
/* Use CSS variables directly */
.custom-component {
  background-color: var(--asset-manager-bg-secondary);
  color: var(--asset-manager-text-primary);
  border: 1px solid var(--asset-manager-border-primary);
  border-radius: var(--asset-manager-border-radius-md);
  padding: var(--asset-manager-spacing-md);
  transition: 
    color var(--asset-manager-transition-normal),
    background-color var(--asset-manager-transition-normal);
}

.custom-component:hover {
  background-color: var(--asset-manager-bg-tertiary);
  border-color: var(--asset-manager-border-hover);
}
```

## Theme Switching

The theme system automatically responds to ComfyUI's theme changes. When ComfyUI adds the `.comfy-theme-light` class to the document root, all Asset Manager components automatically switch to light theme styling.

### Manual Theme Testing

For development and testing, you can manually toggle themes:

```javascript
// Switch to light theme
document.documentElement.classList.add('comfy-theme-light');

// Switch to dark theme
document.documentElement.classList.remove('comfy-theme-light');
```

## Testing

### Automated Tests

Run the theme system tests:

```bash
npm test -- --run src/utils/__tests__/themeSystem.test.ts
```

### Browser Validation

Open the validation page in a browser:

```bash
# Serve the UI directory and open validate-theme-system.html
# This provides interactive testing of all theme features
```

### Validation Features

The validation page tests:
- CSS variable inheritance and fallback behavior
- Theme switching functionality
- Component styling consistency
- Status and feedback components
- Loading states and animations

## Integration with ComfyUI

### CSS Variable Mapping

Asset Manager variables map to ComfyUI variables with fallbacks:

```css
:root {
  --asset-manager-bg-primary: var(--comfy-menu-bg, #2a2a2a);
  --asset-manager-text-primary: var(--input-text, #ffffff);
  --asset-manager-interactive-primary: var(--p-button-text-primary-color, #007acc);
}
```

### Theme Class Detection

Light theme overrides are scoped to the extension root:

```css
:root.comfy-theme-light #comfyui-asset-manager-root {
  --asset-manager-bg-primary: var(--comfy-menu-bg, #f0f0f0);
  --asset-manager-text-primary: var(--input-text, #000000);
}
```

### Extension Root Scoping

All styles are scoped to `#comfyui-asset-manager-root` to prevent style leakage:

```css
#comfyui-asset-manager-root .asset-manager-component {
  /* Scoped styles here */
}
```

## Best Practices

### For Developers

1. **Use Semantic Variables**: Always use semantic variables instead of hardcoded colors
2. **Follow Naming Conventions**: Use `asset-manager-` prefix for all custom variables and classes
3. **Include Transitions**: Add transition properties for smooth theme switching
4. **Test Both Themes**: Always test components in both light and dark themes
5. **Use Utility Classes**: Leverage utility classes for consistent spacing and colors

### For Components

1. **Scope Styles**: Always scope styles to the extension root element
2. **Use Component Classes**: Prefer component classes over inline styles
3. **Handle Hover States**: Include hover and focus states for interactive elements
4. **Support Status States**: Use status classes for success, warning, error states
5. **Include Loading States**: Provide loading and empty state styling

## Troubleshooting

### Common Issues

1. **Variables Not Working**: Ensure styles are scoped to `#comfyui-asset-manager-root`
2. **Theme Not Switching**: Check that ComfyUI's theme class is being applied
3. **Fallbacks Not Working**: Verify fallback values are valid CSS values
4. **Transitions Not Smooth**: Check transition properties are applied to changing elements

### Debugging

1. **Use Browser DevTools**: Inspect computed styles to see actual variable values
2. **Check Console**: Look for CSS parsing errors
3. **Test Isolation**: Test components in isolation to identify issues
4. **Validate HTML**: Use the validation page to test all theme features

## Future Enhancements

- Support for custom ComfyUI themes
- Additional component variants
- Animation and motion utilities
- Accessibility improvements
- Performance optimizations