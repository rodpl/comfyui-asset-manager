# ComfyUI Theme Integration Developer Guide

## Overview

This guide provides comprehensive documentation for implementing and maintaining ComfyUI theme integration in the Asset Manager extension. The theme system uses CSS-based automatic theme detection and adaptation, following ComfyUI's proven patterns for seamless visual integration.

## Table of Contents

1. [CSS Variable System](#css-variable-system)
2. [Theme Detection and Switching](#theme-detection-and-switching)
3. [Component Theming Guidelines](#component-theming-guidelines)
4. [Testing Theme Integration](#testing-theme-integration)
5. [Troubleshooting Guide](#troubleshooting-guide)
6. [Best Practices](#best-practices)
7. [Examples and Patterns](#examples-and-patterns)

## CSS Variable System

### Variable Naming Conventions

The theme system uses a hierarchical naming convention for CSS variables:

```css
/* Pattern: --asset-manager-{category}-{variant} */
--asset-manager-bg-primary      /* Primary background color */
--asset-manager-bg-secondary    /* Secondary background color */
--asset-manager-text-primary    /* Primary text color */
--asset-manager-text-secondary  /* Secondary/muted text color */
--asset-manager-border-primary  /* Primary border color */
--asset-manager-interactive-primary /* Primary interactive color */
```

### Variable Categories

#### Background Variables
```css
:root {
  /* Primary backgrounds - main panels, cards */
  --asset-manager-bg-primary: var(--comfy-menu-bg, #2a2a2a);
  
  /* Secondary backgrounds - input fields, secondary panels */
  --asset-manager-bg-secondary: var(--comfy-input-bg, #3a3a3a);
  
  /* Hover states */
  --asset-manager-bg-hover: var(--comfy-input-bg-hover, #4a4a4a);
}
```

#### Text Variables
```css
:root {
  /* Primary text - main content, labels */
  --asset-manager-text-primary: var(--input-text, #ffffff);
  
  /* Secondary text - descriptions, metadata */
  --asset-manager-text-secondary: var(--descrip-text, #cccccc);
  
  /* Muted text - placeholders, disabled states */
  --asset-manager-text-muted: var(--descrip-text, #999999);
}
```

#### Border and Interactive Variables
```css
:root {
  /* Borders */
  --asset-manager-border-primary: var(--border-color, #555555);
  --asset-manager-border-hover: var(--comfy-input-border-hover, #777777);
  
  /* Interactive elements */
  --asset-manager-interactive-primary: var(--p-button-text-primary-color, #007acc);
  --asset-manager-interactive-hover: var(--p-button-text-primary-hover-color, #0099ff);
}
```

### Light Theme Overrides

Light theme overrides use CSS selector specificity to override default (dark) values:

```css
/* Light theme overrides using ComfyUI's theme class */
:root.comfy-theme-light #asset-manager-root {
  --asset-manager-bg-primary: var(--comfy-menu-bg, #f0f0f0);
  --asset-manager-bg-secondary: var(--comfy-input-bg, #ffffff);
  --asset-manager-text-primary: var(--input-text, #000000);
  --asset-manager-text-secondary: var(--descrip-text, #666666);
  --asset-manager-border-primary: var(--border-color, #cccccc);
  --asset-manager-interactive-primary: var(--p-button-text-primary-color, #0066cc);
}
```

### Fallback Strategy

All CSS variables include fallback values to ensure graceful degradation:

```css
/* Pattern: var(--comfy-variable, fallback-value) */
background-color: var(--comfy-menu-bg, #2a2a2a);
color: var(--input-text, #ffffff);
border: 1px solid var(--border-color, #555555);
```

## Theme Detection and Switching

### CSS-Based Theme Detection

The theme system automatically detects ComfyUI's theme through CSS class observation:

```css
/* Default (dark) theme - no special selector needed */
.asset-card {
  background-color: var(--asset-manager-bg-secondary);
  color: var(--asset-manager-text-primary);
}

/* Light theme - activated when ComfyUI adds .comfy-theme-light class */
:root.comfy-theme-light #asset-manager-root .asset-card {
  /* CSS variables automatically update through the override system */
}
```

### Optional React Hook for Theme Detection

For components that need JavaScript theme awareness:

```typescript
import { useState, useEffect } from 'react';

interface UseComfyUIThemeReturn {
  isLight: boolean;
  isDark: boolean;
}

export const useComfyUITheme = (): UseComfyUIThemeReturn => {
  const [isLight, setIsLight] = useState(false);
  
  useEffect(() => {
    const checkTheme = () => {
      const hasLightClass = document.documentElement.classList.contains('comfy-theme-light');
      setIsLight(hasLightClass);
    };
    
    // Check initial theme
    checkTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);
  
  return {
    isLight,
    isDark: !isLight
  };
};
```

### Theme Transitions

Smooth theme transitions are handled through CSS:

```css
.themed-component {
  /* Add transitions for smooth theme switching */
  transition: 
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
}

/* Avoid transitions on initial load */
.no-transitions * {
  transition: none !important;
}
```

## Component Theming Guidelines

### Creating Themed Components

#### 1. CSS-First Approach (Recommended)

Use CSS classes and variables for theming:

```typescript
// Component implementation
interface ThemedButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const ThemedButton: React.FC<ThemedButtonProps & ButtonHTMLAttributes<HTMLButtonElement>> = ({
  variant = 'primary',
  size = 'medium',
  className = '',
  children,
  ...props
}) => {
  const classes = `asset-manager-button asset-manager-button--${variant} asset-manager-button--${size} ${className}`;
  
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};
```

```css
/* CSS implementation */
.asset-manager-button {
  background-color: var(--asset-manager-bg-secondary);
  color: var(--asset-manager-text-primary);
  border: 1px solid var(--asset-manager-border-primary);
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.asset-manager-button--primary {
  background-color: var(--asset-manager-interactive-primary);
  color: white;
  border-color: var(--asset-manager-interactive-primary);
}

.asset-manager-button--secondary {
  background-color: transparent;
  color: var(--asset-manager-text-primary);
  border-color: var(--asset-manager-border-primary);
}

.asset-manager-button:hover {
  background-color: var(--asset-manager-bg-hover);
  border-color: var(--asset-manager-interactive-hover);
}

.asset-manager-button--primary:hover {
  background-color: var(--asset-manager-interactive-hover);
  border-color: var(--asset-manager-interactive-hover);
}
```

#### 2. Component-Specific Variables

For complex components, define component-specific variables:

```css
.asset-card {
  /* Component-specific variables */
  --card-bg: var(--asset-manager-bg-secondary);
  --card-border: var(--asset-manager-border-primary);
  --card-text: var(--asset-manager-text-primary);
  --card-text-muted: var(--asset-manager-text-secondary);
  
  /* Use component variables */
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  color: var(--card-text);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
}

.asset-card:hover {
  --card-bg: var(--asset-manager-bg-hover);
  --card-border: var(--asset-manager-border-hover);
}

.asset-card__title {
  color: var(--card-text);
  font-weight: 600;
  margin-bottom: 8px;
}

.asset-card__description {
  color: var(--card-text-muted);
  font-size: 0.9em;
}
```

### Component Patterns

#### Modal Components
```css
.asset-manager-modal {
  background-color: var(--asset-manager-bg-primary);
  border: 1px solid var(--asset-manager-border-primary);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.asset-manager-modal__header {
  background-color: var(--asset-manager-bg-secondary);
  color: var(--asset-manager-text-primary);
  padding: 16px;
  border-bottom: 1px solid var(--asset-manager-border-primary);
}

.asset-manager-modal__content {
  padding: 16px;
  color: var(--asset-manager-text-primary);
}
```

#### Form Components
```css
.asset-manager-input {
  background-color: var(--asset-manager-bg-secondary);
  color: var(--asset-manager-text-primary);
  border: 1px solid var(--asset-manager-border-primary);
  border-radius: 4px;
  padding: 8px 12px;
  transition: border-color 0.2s ease;
}

.asset-manager-input:focus {
  outline: none;
  border-color: var(--asset-manager-interactive-primary);
  box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
}

.asset-manager-input::placeholder {
  color: var(--asset-manager-text-muted);
}
```

#### Loading and Feedback Components
```css
.asset-manager-spinner {
  border: 2px solid var(--asset-manager-border-primary);
  border-top: 2px solid var(--asset-manager-interactive-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.asset-manager-error {
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  border: 1px solid rgba(220, 53, 69, 0.3);
  border-radius: 4px;
  padding: 12px;
}

.asset-manager-success {
  background-color: rgba(40, 167, 69, 0.1);
  color: #28a745;
  border: 1px solid rgba(40, 167, 69, 0.3);
  border-radius: 4px;
  padding: 12px;
}
```

## Testing Theme Integration

### Test Structure

Theme integration tests should cover:

1. **CSS Variable Fallbacks**: Ensure variables work without ComfyUI
2. **Theme Switching**: Test light/dark theme transitions
3. **Component Styling**: Verify components render correctly in both themes
4. **Visual Regression**: Compare screenshots across themes

### Test Utilities

```typescript
// src/utils/themeTestUtils.ts
export interface ThemeTestUtils {
  setComfyUITheme: (theme: 'light' | 'dark') => void;
  getCSSVariableValue: (name: string, element?: Element) => string;
  waitForThemeTransition: () => Promise<void>;
  createThemeTestContainer: () => HTMLElement;
}

export const themeTestUtils: ThemeTestUtils = {
  setComfyUITheme: (theme: 'light' | 'dark') => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('comfy-theme-light');
    } else {
      root.classList.remove('comfy-theme-light');
    }
  },
  
  getCSSVariableValue: (name: string, element: Element = document.documentElement) => {
    return getComputedStyle(element).getPropertyValue(name).trim();
  },
  
  waitForThemeTransition: async () => {
    // Wait for CSS transitions to complete
    await new Promise(resolve => setTimeout(resolve, 250));
  },
  
  createThemeTestContainer: () => {
    const container = document.createElement('div');
    container.id = 'asset-manager-root';
    document.body.appendChild(container);
    return container;
  }
};
```

### Example Tests

#### CSS Variable Fallback Tests
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { themeTestUtils } from '../utils/themeTestUtils';

describe('CSS Variable Fallbacks', () => {
  let container: HTMLElement;
  
  beforeEach(() => {
    container = themeTestUtils.createThemeTestContainer();
  });
  
  afterEach(() => {
    container.remove();
  });
  
  it('should use fallback values when ComfyUI variables are not available', () => {
    const bgColor = themeTestUtils.getCSSVariableValue('--asset-manager-bg-primary');
    expect(bgColor).toBe('#2a2a2a'); // Fallback value
  });
  
  it('should inherit ComfyUI variables when available', () => {
    // Mock ComfyUI variable
    document.documentElement.style.setProperty('--comfy-menu-bg', '#custom-bg');
    
    const bgColor = themeTestUtils.getCSSVariableValue('--asset-manager-bg-primary');
    expect(bgColor).toBe('#custom-bg');
  });
});
```

#### Theme Switching Tests
```typescript
describe('Theme Switching', () => {
  let container: HTMLElement;
  
  beforeEach(() => {
    container = themeTestUtils.createThemeTestContainer();
  });
  
  afterEach(() => {
    container.remove();
    themeTestUtils.setComfyUITheme('dark'); // Reset to dark
  });
  
  it('should switch to light theme when ComfyUI class is added', async () => {
    // Start with dark theme
    themeTestUtils.setComfyUITheme('dark');
    let bgColor = themeTestUtils.getCSSVariableValue('--asset-manager-bg-primary');
    expect(bgColor).toBe('#2a2a2a');
    
    // Switch to light theme
    themeTestUtils.setComfyUITheme('light');
    await themeTestUtils.waitForThemeTransition();
    
    bgColor = themeTestUtils.getCSSVariableValue('--asset-manager-bg-primary');
    expect(bgColor).toBe('#f0f0f0');
  });
});
```

#### Component Styling Tests
```typescript
import { render } from '@testing-library/react';
import { ThemedButton } from '../components/ThemedButton';

describe('ThemedButton', () => {
  it('should apply correct CSS classes', () => {
    const { container } = render(<ThemedButton variant="primary">Test</ThemedButton>);
    const button = container.querySelector('button');
    
    expect(button).toHaveClass('asset-manager-button');
    expect(button).toHaveClass('asset-manager-button--primary');
    expect(button).toHaveClass('asset-manager-button--medium');
  });
  
  it('should render correctly in both themes', async () => {
    const { container, rerender } = render(<ThemedButton>Test</ThemedButton>);
    const button = container.querySelector('button');
    
    // Test dark theme
    themeTestUtils.setComfyUITheme('dark');
    await themeTestUtils.waitForThemeTransition();
    
    let computedStyle = getComputedStyle(button!);
    expect(computedStyle.backgroundColor).toBe('rgb(58, 58, 58)'); // Dark theme color
    
    // Test light theme
    themeTestUtils.setComfyUITheme('light');
    await themeTestUtils.waitForThemeTransition();
    
    computedStyle = getComputedStyle(button!);
    expect(computedStyle.backgroundColor).toBe('rgb(255, 255, 255)'); // Light theme color
  });
});
```

### Visual Regression Testing

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { themeTestUtils } from '../utils/themeTestUtils';

describe('Visual Regression Tests', () => {
  it('should maintain consistent styling across theme switches', async () => {
    const { container } = render(
      <div className="asset-card">
        <h3 className="asset-card__title">Test Card</h3>
        <p className="asset-card__description">Test description</p>
      </div>
    );
    
    // Test both themes
    for (const theme of ['dark', 'light'] as const) {
      themeTestUtils.setComfyUITheme(theme);
      await themeTestUtils.waitForThemeTransition();
      
      const card = container.querySelector('.asset-card');
      const computedStyle = getComputedStyle(card!);
      
      // Verify styling is applied
      expect(computedStyle.backgroundColor).not.toBe('');
      expect(computedStyle.color).not.toBe('');
      expect(computedStyle.borderColor).not.toBe('');
      
      // Verify contrast ratios (basic accessibility check)
      const bgColor = computedStyle.backgroundColor;
      const textColor = computedStyle.color;
      expect(bgColor).not.toBe(textColor); // Basic contrast check
    }
  });
});
```

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. CSS Variables Not Working

**Problem**: CSS variables show default values instead of ComfyUI values

**Possible Causes**:
- ComfyUI CSS variables not loaded
- Incorrect variable names
- CSS specificity issues

**Solutions**:
```css
/* Check if ComfyUI variables exist */
:root {
  --test-var: var(--comfy-menu-bg, 'NOT_FOUND');
}

/* Use browser dev tools to inspect computed values */
```

**Debugging Steps**:
1. Open browser dev tools
2. Inspect element using CSS variables
3. Check "Computed" tab for actual values
4. Verify ComfyUI variables exist in `:root`

#### 2. Theme Switching Not Working

**Problem**: Extension doesn't respond to ComfyUI theme changes

**Possible Causes**:
- Missing theme class detection
- CSS selector specificity issues
- JavaScript theme hook not updating

**Solutions**:
```typescript
// Debug theme detection
console.log('Theme class present:', document.documentElement.classList.contains('comfy-theme-light'));

// Check CSS selector specificity
// Ensure light theme selectors have higher specificity
:root.comfy-theme-light #asset-manager-root .component {
  /* Light theme styles */
}
```

#### 3. Transitions Not Smooth

**Problem**: Theme transitions are jarring or don't work

**Solutions**:
```css
/* Add transitions to all themed properties */
.themed-component {
  transition: 
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

/* Avoid transitions on initial load */
.preload * {
  transition: none !important;
}
```

#### 4. Light Theme Not Applying

**Problem**: Light theme styles don't override dark theme

**Solutions**:
```css
/* Ensure proper CSS specificity */
/* ❌ Too low specificity */
.asset-card {
  background-color: var(--asset-manager-bg-secondary);
}

/* ✅ Proper specificity for overrides */
:root.comfy-theme-light #asset-manager-root .asset-card {
  /* Light theme variables automatically apply */
}
```

#### 5. Performance Issues with Theme Switching

**Problem**: Theme switching causes performance problems

**Solutions**:
```css
/* Use CSS containment for better performance */
.asset-manager-root {
  contain: style layout;
}

/* Avoid expensive properties in transitions */
.themed-component {
  /* ❌ Expensive */
  transition: all 0.2s ease;
  
  /* ✅ Specific properties only */
  transition: background-color 0.2s ease, color 0.2s ease;
}
```

### Debugging Tools

#### CSS Variable Inspector
```javascript
// Console utility to inspect CSS variables
function inspectCSSVariables(element = document.documentElement) {
  const styles = getComputedStyle(element);
  const variables = {};
  
  for (let i = 0; i < styles.length; i++) {
    const name = styles[i];
    if (name.startsWith('--')) {
      variables[name] = styles.getPropertyValue(name);
    }
  }
  
  return variables;
}

// Usage
console.table(inspectCSSVariables());
```

#### Theme State Monitor
```typescript
// Monitor theme changes in development
if (process.env.NODE_ENV === 'development') {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        const isLight = document.documentElement.classList.contains('comfy-theme-light');
        console.log('Theme changed:', isLight ? 'light' : 'dark');
      }
    });
  });
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });
}
```

## Best Practices

### 1. CSS-First Approach

- Prefer CSS variables over JavaScript theme management
- Use CSS selectors for theme switching
- Keep JavaScript theme detection minimal and optional

### 2. Fallback Strategy

- Always provide fallback values for CSS variables
- Test without ComfyUI variables to ensure graceful degradation
- Use semantic color names in fallbacks

### 3. Performance Optimization

- Use specific CSS properties in transitions, avoid `all`
- Implement CSS containment for large component trees
- Minimize JavaScript theme detection overhead

### 4. Accessibility

- Ensure sufficient color contrast in both themes
- Test with high contrast mode
- Provide focus indicators that work in both themes

### 5. Maintainability

- Use consistent naming conventions for CSS variables
- Document component-specific theming requirements
- Create reusable themed component patterns

### 6. Testing

- Test both themes in all components
- Include visual regression tests
- Test CSS variable fallbacks
- Verify smooth transitions

## Examples and Patterns

### Complete Component Example

```typescript
// ThemedCard.tsx
import React from 'react';
import './ThemedCard.css';

interface ThemedCardProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  variant?: 'default' | 'highlighted';
  className?: string;
}

export const ThemedCard: React.FC<ThemedCardProps> = ({
  title,
  description,
  actions,
  variant = 'default',
  className = ''
}) => {
  const classes = `asset-manager-card asset-manager-card--${variant} ${className}`;
  
  return (
    <div className={classes}>
      <div className="asset-manager-card__header">
        <h3 className="asset-manager-card__title">{title}</h3>
      </div>
      
      {description && (
        <div className="asset-manager-card__content">
          <p className="asset-manager-card__description">{description}</p>
        </div>
      )}
      
      {actions && (
        <div className="asset-manager-card__actions">
          {actions}
        </div>
      )}
    </div>
  );
};
```

```css
/* ThemedCard.css */
.asset-manager-card {
  /* Component-specific CSS variables */
  --card-bg: var(--asset-manager-bg-secondary);
  --card-border: var(--asset-manager-border-primary);
  --card-text: var(--asset-manager-text-primary);
  --card-text-muted: var(--asset-manager-text-secondary);
  --card-shadow: rgba(0, 0, 0, 0.1);
  
  /* Base styles */
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  box-shadow: 0 2px 4px var(--card-shadow);
  overflow: hidden;
  transition: 
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.asset-manager-card:hover {
  --card-bg: var(--asset-manager-bg-hover);
  --card-border: var(--asset-manager-border-hover);
  --card-shadow: rgba(0, 0, 0, 0.15);
}

.asset-manager-card--highlighted {
  --card-border: var(--asset-manager-interactive-primary);
  --card-shadow: rgba(0, 122, 204, 0.1);
}

.asset-manager-card__header {
  padding: 16px 16px 0;
}

.asset-manager-card__title {
  color: var(--card-text);
  font-size: 1.1em;
  font-weight: 600;
  margin: 0;
}

.asset-manager-card__content {
  padding: 8px 16px;
}

.asset-manager-card__description {
  color: var(--card-text-muted);
  font-size: 0.9em;
  line-height: 1.4;
  margin: 0;
}

.asset-manager-card__actions {
  padding: 0 16px 16px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* Light theme adjustments */
:root.comfy-theme-light #asset-manager-root .asset-manager-card {
  --card-shadow: rgba(0, 0, 0, 0.05);
}

:root.comfy-theme-light #asset-manager-root .asset-manager-card:hover {
  --card-shadow: rgba(0, 0, 0, 0.1);
}

:root.comfy-theme-light #asset-manager-root .asset-manager-card--highlighted {
  --card-shadow: rgba(0, 102, 204, 0.1);
}
```

### Theme-Aware Hook Usage

```typescript
// Example component using optional theme detection
import React from 'react';
import { useComfyUITheme } from '../hooks/useComfyUITheme';

export const ConditionalThemedComponent: React.FC = () => {
  const { isLight, isDark } = useComfyUITheme();
  
  return (
    <div className="conditional-component">
      {/* Most styling handled by CSS */}
      <div className="content">
        {/* Only use JavaScript theme detection when necessary */}
        {isLight && <LightThemeSpecificFeature />}
        {isDark && <DarkThemeSpecificFeature />}
      </div>
      
      {/* Prefer CSS-based theming for visual elements */}
      <div className="themed-visual-element">
        This element's appearance is controlled by CSS variables
      </div>
    </div>
  );
};
```

This comprehensive guide provides all the necessary information for developers to implement and maintain ComfyUI theme integration effectively. The CSS-first approach ensures automatic theme adaptation while maintaining performance and simplicity.