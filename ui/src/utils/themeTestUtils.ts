/**
 * Enhanced Theme Testing Utilities
 *
 * Comprehensive utilities for testing CSS variable inheritance, fallback behavior,
 * theme switching functionality, and visual regression testing in the ComfyUI Asset Manager.
 */

export interface ThemeTestResult {
  variable: string;
  value: string;
  hasFallback: boolean;
  isValid: boolean;
}

export interface ThemeTestSuite {
  darkTheme: ThemeTestResult[];
  lightTheme: ThemeTestResult[];
  fallbackTests: ThemeTestResult[];
  transitionTests: boolean;
}

export interface ComponentStyleSnapshot {
  selector: string;
  computedStyles: Record<string, string>;
  theme: 'light' | 'dark';
  timestamp: number;
}

export interface ThemeTransitionTest {
  element: HTMLElement;
  property: string;
  startValue: string;
  endValue: string;
  duration: number;
  completed: boolean;
}

export interface VisualRegressionResult {
  component: string;
  theme: 'light' | 'dark';
  snapshots: ComponentStyleSnapshot[];
  differences: string[];
  passed: boolean;
}

/**
 * Get the computed value of a CSS variable from the extension root element
 */
export function getCSSVariableValue(variableName: string, element?: HTMLElement): string {
  const targetElement =
    element || document.getElementById('comfyui-asset-manager-root') || document.documentElement;
  return getComputedStyle(targetElement).getPropertyValue(variableName).trim();
}

/**
 * Test if a CSS variable has a valid value (not empty or 'initial')
 */
export function isValidCSSVariableValue(value: string): boolean {
  return value !== '' && value !== 'initial' && value !== 'inherit' && value !== 'unset' && value !== 'revert';
}

/**
 * Test CSS variable inheritance and fallback behavior
 */
export function testCSSVariables(): ThemeTestSuite {
  const testVariables = [
    // Background colors
    '--asset-manager-bg-primary',
    '--asset-manager-bg-secondary',
    '--asset-manager-bg-tertiary',

    // Text colors
    '--asset-manager-text-primary',
    '--asset-manager-text-secondary',
    '--asset-manager-text-muted',

    // Border colors
    '--asset-manager-border-primary',
    '--asset-manager-border-secondary',
    '--asset-manager-border-hover',

    // Interactive colors
    '--asset-manager-interactive-primary',
    '--asset-manager-interactive-secondary',
    '--asset-manager-interactive-hover',

    // Status colors
    '--asset-manager-success',
    '--asset-manager-warning',
    '--asset-manager-error',
    '--asset-manager-info',

    // Spacing
    '--asset-manager-spacing-xs',
    '--asset-manager-spacing-sm',
    '--asset-manager-spacing-md',
    '--asset-manager-spacing-lg',
    '--asset-manager-spacing-xl',

    // Border radius
    '--asset-manager-border-radius-sm',
    '--asset-manager-border-radius-md',
    '--asset-manager-border-radius-lg',

    // Transitions
    '--asset-manager-transition-fast',
    '--asset-manager-transition-normal',
    '--asset-manager-transition-slow',
  ];

  const results: ThemeTestSuite = {
    darkTheme: [],
    lightTheme: [],
    fallbackTests: [],
    transitionTests: false,
  };

  // Test dark theme (default)
  document.documentElement.classList.remove('comfy-theme-light');

  testVariables.forEach((variable) => {
    const value = getCSSVariableValue(variable);
    results.darkTheme.push({
      variable,
      value,
      hasFallback: value.includes('var(') || isValidCSSVariableValue(value),
      isValid: isValidCSSVariableValue(value),
    });
  });

  // Test light theme
  document.documentElement.classList.add('comfy-theme-light');

  testVariables.forEach((variable) => {
    const value = getCSSVariableValue(variable);
    results.lightTheme.push({
      variable,
      value,
      hasFallback: value.includes('var(') || isValidCSSVariableValue(value),
      isValid: isValidCSSVariableValue(value),
    });
  });

  // Test fallback behavior with non-existent ComfyUI variables
  const fallbackTests = [
    { variable: '--non-existent-comfy-var', fallback: '#ff0000' },
    { variable: '--another-missing-var', fallback: '#00ff00' },
  ];

  fallbackTests.forEach(({ variable, fallback }) => {
    // Create a test element with fallback
    const testElement = document.createElement('div');
    testElement.style.setProperty('--test-var', `var(${variable}, ${fallback})`);
    testElement.style.backgroundColor = 'var(--test-var)';
    document.body.appendChild(testElement);

    const computedValue = getComputedStyle(testElement).backgroundColor;
    document.body.removeChild(testElement);

    results.fallbackTests.push({
      variable,
      value: computedValue,
      hasFallback: true,
      isValid: computedValue !== '' && computedValue !== 'rgba(0, 0, 0, 0)',
    });
  });

  // Test transition properties
  const transitionElement = document.createElement('div');
  transitionElement.className = 'asset-manager-component';
  transitionElement.style.transition = 'var(--asset-manager-transition-normal)';
  document.body.appendChild(transitionElement);

  const transitionValue = getComputedStyle(transitionElement).transition;
  results.transitionTests = transitionValue.includes('0.2s') || transitionValue.includes('ease');

  document.body.removeChild(transitionElement);

  return results;
}

/**
 * Test theme switching functionality
 */
export function testThemeSwitching(): Promise<boolean> {
  return new Promise((resolve) => {
    const testElement = document.createElement('div');
    testElement.id = 'theme-switch-test';
    testElement.className = 'asset-manager-component';
    document.body.appendChild(testElement);

    // Start with dark theme
    document.documentElement.classList.remove('comfy-theme-light');
    const darkBg = getComputedStyle(testElement).backgroundColor;

    // Switch to light theme
    document.documentElement.classList.add('comfy-theme-light');

    // Wait for transition to complete
    setTimeout(() => {
      const lightBg = getComputedStyle(testElement).backgroundColor;
      document.body.removeChild(testElement);

      // Themes should have different background colors
      const themesAreDifferent = darkBg !== lightBg && darkBg !== '' && lightBg !== '';
      resolve(themesAreDifferent);
    }, 300); // Wait longer than transition duration
  });
}

/**
 * Comprehensive theme system test
 */
export async function runThemeTests(): Promise<{
  variableTests: ThemeTestSuite;
  themeSwitchingWorks: boolean;
  summary: {
    totalVariables: number;
    validDarkVariables: number;
    validLightVariables: number;
    fallbacksWork: boolean;
    transitionsWork: boolean;
  };
}> {
  console.log('🎨 Running ComfyUI Asset Manager Theme Tests...');

  const variableTests = testCSSVariables();
  const themeSwitchingWorks = await testThemeSwitching();

  const summary = {
    totalVariables: variableTests.darkTheme.length,
    validDarkVariables: variableTests.darkTheme.filter((t) => t.isValid).length,
    validLightVariables: variableTests.lightTheme.filter((t) => t.isValid).length,
    fallbacksWork: variableTests.fallbackTests.every((t) => t.isValid),
    transitionsWork: variableTests.transitionTests,
  };

  console.log('📊 Theme Test Results:');
  console.log(`  Total Variables: ${summary.totalVariables}`);
  console.log(
    `  Valid Dark Theme Variables: ${summary.validDarkVariables}/${summary.totalVariables}`
  );
  console.log(
    `  Valid Light Theme Variables: ${summary.validLightVariables}/${summary.totalVariables}`
  );
  console.log(`  Fallback Behavior: ${summary.fallbacksWork ? '✅ Working' : '❌ Failed'}`);
  console.log(`  Transitions: ${summary.transitionsWork ? '✅ Working' : '❌ Failed'}`);
  console.log(`  Theme Switching: ${themeSwitchingWorks ? '✅ Working' : '❌ Failed'}`);

  return {
    variableTests,
    themeSwitchingWorks,
    summary,
  };
}

/**
 * Utility to set ComfyUI theme for testing
 */
export function setComfyUITheme(theme: 'light' | 'dark'): void {
  if (theme === 'light') {
    document.documentElement.classList.add('comfy-theme-light');
  } else {
    document.documentElement.classList.remove('comfy-theme-light');
  }
}

/**
 * Get current ComfyUI theme
 */
export function getCurrentTheme(): 'light' | 'dark' {
  return document.documentElement.classList.contains('comfy-theme-light') ? 'light' : 'dark';
}

/**
 * Test specific CSS variable mapping to ComfyUI variables
 */
export function testComfyUIVariableMapping(): Record<
  string,
  { assetManagerVar: string; comfyUIVar: string; mapped: boolean }
> {
  const mappings = {
    'background-primary': {
      assetManagerVar: '--asset-manager-bg-primary',
      comfyUIVar: '--comfy-menu-bg',
    },
    'background-secondary': {
      assetManagerVar: '--asset-manager-bg-secondary',
      comfyUIVar: '--comfy-input-bg',
    },
    'text-primary': {
      assetManagerVar: '--asset-manager-text-primary',
      comfyUIVar: '--input-text',
    },
    'border-primary': {
      assetManagerVar: '--asset-manager-border-primary',
      comfyUIVar: '--border-color',
    },
    'interactive-primary': {
      assetManagerVar: '--asset-manager-interactive-primary',
      comfyUIVar: '--p-button-text-primary-color',
    },
  };

  const results: Record<string, { assetManagerVar: string; comfyUIVar: string; mapped: boolean }> =
    {};

  Object.entries(mappings).forEach(([key, { assetManagerVar, comfyUIVar }]) => {
    const assetManagerValue = getCSSVariableValue(assetManagerVar);
    const comfyUIValue = getCSSVariableValue(comfyUIVar);

    // Check if the asset manager variable references the ComfyUI variable
    const mapped =
      assetManagerValue.includes(comfyUIVar) ||
      (assetManagerValue === comfyUIValue && comfyUIValue !== '');

    results[key] = {
      assetManagerVar,
      comfyUIVar,
      mapped,
    };
  });

  return results;
}

/**
 * Enhanced theme switching test utilities for comprehensive testing
 */

/**
 * Create a test environment with proper DOM structure
 */
export function createThemeTestEnvironment(): {
  rootElement: HTMLElement;
  cleanup: () => void;
} {
  // Create extension root element
  const rootElement = document.createElement('div');
  rootElement.id = 'comfyui-asset-manager-root';
  document.body.appendChild(rootElement);

  // Add basic CSS variables for testing
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --asset-manager-bg-primary: var(--comfy-menu-bg, #2a2a2a);
      --asset-manager-text-primary: var(--input-text, #ffffff);
      --asset-manager-border-primary: var(--border-color, #555555);
      --asset-manager-transition-normal: 0.2s ease;
    }
    
    :root.comfy-theme-light #comfyui-asset-manager-root {
      --asset-manager-bg-primary: var(--comfy-menu-bg, #f0f0f0);
      --asset-manager-text-primary: var(--input-text, #000000);
      --asset-manager-border-primary: var(--border-color, #cccccc);
    }
    
    .asset-manager-component {
      background-color: var(--asset-manager-bg-primary);
      color: var(--asset-manager-text-primary);
      border: 1px solid var(--asset-manager-border-primary);
      transition: var(--asset-manager-transition-normal);
    }
  `;
  document.head.appendChild(style);

  const cleanup = () => {
    if (rootElement.parentNode) {
      rootElement.parentNode.removeChild(rootElement);
    }
    if (style.parentNode) {
      style.parentNode.removeChild(style);
    }
    document.documentElement.className = '';
  };

  return { rootElement, cleanup };
}

/**
 * Test theme switching with transition monitoring
 */
export function testThemeTransition(
  element: HTMLElement,
  property: string = 'background-color'
): Promise<ThemeTransitionTest> {
  return new Promise((resolve) => {
    const startValue = getComputedStyle(element).getPropertyValue(property);
    const startTime = performance.now();
    
    // Switch theme
    const currentTheme = getCurrentTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setComfyUITheme(newTheme);
    
    // Monitor for transition completion
    const checkTransition = () => {
      const currentValue = getComputedStyle(element).getPropertyValue(property);
      const duration = performance.now() - startTime;
      
      if (currentValue !== startValue || duration > 1000) {
        resolve({
          element,
          property,
          startValue,
          endValue: currentValue,
          duration,
          completed: currentValue !== startValue
        });
      } else {
        requestAnimationFrame(checkTransition);
      }
    };
    
    requestAnimationFrame(checkTransition);
  });
}

/**
 * Capture component style snapshot for visual regression testing
 */
export function captureComponentSnapshot(
  selector: string,
  properties: string[] = [
    'background-color',
    'color',
    'border-color',
    'font-size',
    'padding',
    'margin'
  ]
): ComponentStyleSnapshot {
  const element = document.querySelector(selector) as HTMLElement;
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }
  
  const computedStyles = getComputedStyle(element);
  const styles: Record<string, string> = {};
  
  properties.forEach(property => {
    styles[property] = computedStyles.getPropertyValue(property);
  });
  
  return {
    selector,
    computedStyles: styles,
    theme: getCurrentTheme(),
    timestamp: Date.now()
  };
}

/**
 * Compare component snapshots for visual regression testing
 */
export function compareComponentSnapshots(
  snapshot1: ComponentStyleSnapshot,
  snapshot2: ComponentStyleSnapshot,
  toleranceProperties: string[] = []
): VisualRegressionResult {
  const differences: string[] = [];
  
  // Compare all properties
  const allProperties = new Set([
    ...Object.keys(snapshot1.computedStyles),
    ...Object.keys(snapshot2.computedStyles)
  ]);
  
  allProperties.forEach(property => {
    const value1 = snapshot1.computedStyles[property] || '';
    const value2 = snapshot2.computedStyles[property] || '';
    
    if (value1 !== value2 && !toleranceProperties.includes(property)) {
      differences.push(
        `${property}: "${value1}" (${snapshot1.theme}) vs "${value2}" (${snapshot2.theme})`
      );
    }
  });
  
  return {
    component: snapshot1.selector,
    theme: snapshot2.theme,
    snapshots: [snapshot1, snapshot2],
    differences,
    passed: differences.length === 0
  };
}

/**
 * Test all theme components for visual consistency
 */
export function testAllComponentsVisualConsistency(
  componentSelectors: string[] = [
    '.asset-manager-button',
    '.asset-manager-card',
    '.asset-manager-input',
    '.asset-manager-modal',
    '.asset-manager-loading',
    '.asset-manager-error-message',
    '.asset-manager-empty-state'
  ]
): Promise<VisualRegressionResult[]> {
  return new Promise((resolve) => {
    const results: VisualRegressionResult[] = [];
    
    // Test each component in both themes
    componentSelectors.forEach(selector => {
      const element = document.querySelector(selector);
      if (!element) return;
      
      // Capture dark theme snapshot
      setComfyUITheme('dark');
      const darkSnapshot = captureComponentSnapshot(selector);
      
      // Capture light theme snapshot
      setComfyUITheme('light');
      const lightSnapshot = captureComponentSnapshot(selector);
      
      // Compare snapshots
      const comparison = compareComponentSnapshots(darkSnapshot, lightSnapshot);
      results.push(comparison);
    });
    
    resolve(results);
  });
}

/**
 * Mock ComfyUI variables for testing
 */
export function mockComfyUIVariables(variables: Record<string, string>): () => void {
  const originalValues: Record<string, string> = {};
  
  Object.entries(variables).forEach(([variable, value]) => {
    originalValues[variable] = document.documentElement.style.getPropertyValue(variable);
    document.documentElement.style.setProperty(variable, value);
  });
  
  return () => {
    Object.entries(originalValues).forEach(([variable, value]) => {
      if (value) {
        document.documentElement.style.setProperty(variable, value);
      } else {
        document.documentElement.style.removeProperty(variable);
      }
    });
  };
}

/**
 * Test CSS variable fallback chain
 */
export function testVariableFallbackChain(
  assetManagerVar: string,
  comfyUIVar: string,
  fallbackValue: string
): {
  withComfyUI: string;
  withoutComfyUI: string;
  fallbackWorks: boolean;
} {
  const testElement = document.createElement('div');
  testElement.style.setProperty('--test-var', `var(${assetManagerVar})`);
  testElement.style.backgroundColor = 'var(--test-var)';
  document.body.appendChild(testElement);
  
  // Test with ComfyUI variable
  document.documentElement.style.setProperty(comfyUIVar, '#ff0000');
  const withComfyUI = getComputedStyle(testElement).backgroundColor;
  
  // Test without ComfyUI variable
  document.documentElement.style.removeProperty(comfyUIVar);
  const withoutComfyUI = getComputedStyle(testElement).backgroundColor;
  
  document.body.removeChild(testElement);
  
  return {
    withComfyUI,
    withoutComfyUI,
    fallbackWorks: withoutComfyUI !== '' && withoutComfyUI !== 'rgba(0, 0, 0, 0)'
  };
}

/**
 * Performance test for theme switching
 */
export function performanceTestThemeSwitching(iterations: number = 100): {
  averageTime: number;
  minTime: number;
  maxTime: number;
  totalTime: number;
} {
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    
    // Switch theme
    const currentTheme = getCurrentTheme();
    setComfyUITheme(currentTheme === 'light' ? 'dark' : 'light');
    
    const endTime = performance.now();
    times.push(endTime - startTime);
  }
  
  return {
    averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    totalTime: times.reduce((sum, time) => sum + time, 0)
  };
}

/**
 * Test theme switching with large component trees
 */
export function testThemeSwitchingPerformance(componentCount: number = 100): Promise<{
  switchTime: number;
  renderTime: number;
  totalTime: number;
}> {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    container.id = 'performance-test-container';
    document.body.appendChild(container);
    
    // Create many components
    const startCreateTime = performance.now();
    for (let i = 0; i < componentCount; i++) {
      const component = document.createElement('div');
      component.className = 'asset-manager-component';
      component.textContent = `Component ${i}`;
      container.appendChild(component);
    }
    const createTime = performance.now() - startCreateTime;
    
    // Test theme switching
    const startSwitchTime = performance.now();
    setComfyUITheme('light');
    
    requestAnimationFrame(() => {
      const switchTime = performance.now() - startSwitchTime;
      
      // Clean up
      document.body.removeChild(container);
      
      resolve({
        switchTime,
        renderTime: createTime,
        totalTime: switchTime + createTime
      });
    });
  });
}

/**
 * Validate CSS class naming conventions
 */
export function validateCSSClassNaming(element: HTMLElement): {
  valid: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  const classes = element.className.split(' ');
  
  classes.forEach(className => {
    if (className.startsWith('asset-manager-')) {
      // Check kebab-case pattern
      if (!/^asset-manager-[a-z-]+$/.test(className)) {
        violations.push(`Invalid class name pattern: ${className}`);
      }
      
      // Check modifier pattern
      if (className.includes('--')) {
        if (!/^asset-manager-[a-z-]+--[a-z-]+$/.test(className)) {
          violations.push(`Invalid modifier pattern: ${className}`);
        }
      }
    }
  });
  
  return {
    valid: violations.length === 0,
    violations
  };
}

/**
 * Test CSS variable inheritance chain
 */
export function testCSSVariableInheritance(): {
  rootVariables: string[];
  inheritedVariables: string[];
  brokenInheritance: string[];
} {
  const rootElement = document.getElementById('comfyui-asset-manager-root');
  if (!rootElement) {
    throw new Error('Extension root element not found');
  }
  
  const testChild = document.createElement('div');
  testChild.className = 'asset-manager-component';
  rootElement.appendChild(testChild);
  
  const rootStyles = getComputedStyle(rootElement);
  const childStyles = getComputedStyle(testChild);
  
  const testVariables = [
    '--asset-manager-bg-primary',
    '--asset-manager-text-primary',
    '--asset-manager-border-primary',
    '--asset-manager-interactive-primary'
  ];
  
  const rootVariables: string[] = [];
  const inheritedVariables: string[] = [];
  const brokenInheritance: string[] = [];
  
  testVariables.forEach(variable => {
    const rootValue = rootStyles.getPropertyValue(variable);
    const childValue = childStyles.getPropertyValue(variable);
    
    if (rootValue) {
      rootVariables.push(variable);
      
      if (childValue === rootValue) {
        inheritedVariables.push(variable);
      } else {
        brokenInheritance.push(variable);
      }
    }
  });
  
  rootElement.removeChild(testChild);
  
  return {
    rootVariables,
    inheritedVariables,
    brokenInheritance
  };
}
