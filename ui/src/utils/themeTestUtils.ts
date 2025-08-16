/**
 * Theme Testing Utilities
 *
 * Utilities for testing CSS variable inheritance, fallback behavior,
 * and theme switching functionality in the ComfyUI Asset Manager.
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
  return value !== '' && value !== 'initial' && value !== 'inherit' && value !== 'unset';
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
