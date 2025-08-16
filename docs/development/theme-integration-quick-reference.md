# ComfyUI Theme Integration Quick Reference

## Quick Start Checklist

### ✅ Adding Theme Support to a New Component

1. **Use CSS Variables**:
   ```css
   .my-component {
     background-color: var(--asset-manager-bg-secondary);
     color: var(--asset-manager-text-primary);
     border: 1px solid var(--asset-manager-border-primary);
   }
   ```

2. **Add Transitions**:
   ```css
   .my-component {
     transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
   }
   ```

3. **Test Both Themes**:
   ```typescript
   // In your test file
   import { themeTestUtils } from '../utils/themeTestUtils';
   
   themeTestUtils.setComfyUITheme('light');
   themeTestUtils.setComfyUITheme('dark');
   ```

## CSS Variable Reference

### Essential Variables
```css
/* Backgrounds */
--asset-manager-bg-primary      /* Main panels, cards */
--asset-manager-bg-secondary    /* Input fields, secondary panels */
--asset-manager-bg-hover        /* Hover states */

/* Text */
--asset-manager-text-primary    /* Main content, labels */
--asset-manager-text-secondary  /* Descriptions, metadata */
--asset-manager-text-muted      /* Placeholders, disabled */

/* Borders & Interactive */
--asset-manager-border-primary  /* Standard borders */
--asset-manager-border-hover    /* Hover borders */
--asset-manager-interactive-primary /* Buttons, links */
--asset-manager-interactive-hover   /* Interactive hover */
```

### Usage Pattern
```css
.component {
  /* Always include fallbacks */
  background-color: var(--asset-manager-bg-secondary);
  color: var(--asset-manager-text-primary);
  border: 1px solid var(--asset-manager-border-primary);
  
  /* Add smooth transitions */
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
```

## Common Component Patterns

### Button
```css
.asset-manager-button {
  background-color: var(--asset-manager-bg-secondary);
  color: var(--asset-manager-text-primary);
  border: 1px solid var(--asset-manager-border-primary);
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.asset-manager-button--primary {
  background-color: var(--asset-manager-interactive-primary);
  color: white;
  border-color: var(--asset-manager-interactive-primary);
}

.asset-manager-button:hover {
  background-color: var(--asset-manager-bg-hover);
  border-color: var(--asset-manager-interactive-hover);
}
```

### Card
```css
.asset-manager-card {
  background-color: var(--asset-manager-bg-secondary);
  border: 1px solid var(--asset-manager-border-primary);
  border-radius: 8px;
  padding: 16px;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.asset-manager-card:hover {
  background-color: var(--asset-manager-bg-hover);
  border-color: var(--asset-manager-border-hover);
}
```

### Input
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

## Testing Quick Commands

### Test Theme Switching
```typescript
import { themeTestUtils } from '../utils/themeTestUtils';

// Switch themes
themeTestUtils.setComfyUITheme('light');
themeTestUtils.setComfyUITheme('dark');

// Wait for transitions
await themeTestUtils.waitForThemeTransition();

// Check CSS variable values
const bgColor = themeTestUtils.getCSSVariableValue('--asset-manager-bg-primary');
```

### Test Component in Both Themes
```typescript
describe('Component Theme Tests', () => {
  it('should work in both themes', async () => {
    const { container } = render(<MyComponent />);
    
    for (const theme of ['dark', 'light'] as const) {
      themeTestUtils.setComfyUITheme(theme);
      await themeTestUtils.waitForThemeTransition();
      
      // Add your assertions here
      expect(container.firstChild).toBeInTheDocument();
    }
  });
});
```

## Troubleshooting

### ❌ CSS Variables Not Working
**Check**: Are ComfyUI variables loaded?
```javascript
// In browser console
console.log(getComputedStyle(document.documentElement).getPropertyValue('--comfy-menu-bg'));
```

### ❌ Theme Not Switching
**Check**: Is the theme class being added?
```javascript
// In browser console
console.log(document.documentElement.classList.contains('comfy-theme-light'));
```

### ❌ Transitions Not Smooth
**Fix**: Add specific transition properties
```css
/* ❌ Don't use 'all' */
transition: all 0.2s ease;

/* ✅ Use specific properties */
transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
```

### ❌ Light Theme Not Applying
**Fix**: Check CSS specificity
```css
/* ❌ Too low specificity */
.component { background: var(--asset-manager-bg-primary); }

/* ✅ Proper specificity for light theme */
:root.comfy-theme-light #asset-manager-root .component {
  /* Variables automatically update */
}
```

## Debug Tools

### CSS Variable Inspector
```javascript
// Paste in browser console
function inspectThemeVars() {
  const styles = getComputedStyle(document.documentElement);
  const vars = {};
  for (let i = 0; i < styles.length; i++) {
    const name = styles[i];
    if (name.startsWith('--asset-manager-') || name.startsWith('--comfy-')) {
      vars[name] = styles.getPropertyValue(name);
    }
  }
  console.table(vars);
}
inspectThemeVars();
```

### Theme Monitor
```javascript
// Monitor theme changes
const observer = new MutationObserver(() => {
  const isLight = document.documentElement.classList.contains('comfy-theme-light');
  console.log('Theme:', isLight ? 'light' : 'dark');
});
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
```

## File Locations

- **Main Guide**: `docs/development/theme-integration-guide.md`
- **Test Utils**: `ui/src/utils/themeTestUtils.ts`
- **Theme Hook**: `ui/src/hooks/useComfyUITheme.ts`
- **Theme CSS**: `ui/src/styles/theme.css`

## Need Help?

1. Check the [full guide](./theme-integration-guide.md) for detailed explanations
2. Look at existing themed components for examples
3. Use browser dev tools to inspect CSS variables
4. Test in both light and dark themes
5. Verify CSS variable fallbacks work without ComfyUI