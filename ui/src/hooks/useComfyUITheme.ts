/**
 * React hook for ComfyUI theme detection
 * Provides simple theme awareness for components that need JavaScript theme logic
 *
 * This hook is optional since CSS handles most theme logic automatically.
 * Use only when components need conditional rendering based on theme.
 */

import { useState, useEffect, useCallback } from 'react';

export interface UseComfyUIThemeReturn {
  /** True when ComfyUI is in light theme mode */
  isLight: boolean;
  /** True when ComfyUI is in dark theme mode (default) */
  isDark: boolean;
  /** Current theme as string */
  theme: 'light' | 'dark';
  /** Manually refresh theme detection (useful for testing) */
  refresh: () => void;
}

/**
 * Detect current ComfyUI theme from DOM
 */
const detectTheme = (): 'light' | 'dark' => {
  // Check for ComfyUI's light theme class on document root
  return document.documentElement.classList.contains('comfy-theme-light') ? 'light' : 'dark';
};

/**
 * Hook for detecting ComfyUI theme changes
 *
 * Automatically detects theme switches and provides boolean values for conditional rendering.
 * Keeps the hook minimal and optional since CSS handles most theme logic.
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const { isLight, isDark } = useComfyUITheme();
 *
 *   return (
 *     <div className="asset-manager-component">
 *       {isLight && <LightThemeOnlyFeature />}
 *       {isDark && <DarkThemeOnlyFeature />}
 *     </div>
 *   );
 * };
 * ```
 */
export const useComfyUITheme = (): UseComfyUIThemeReturn => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => detectTheme());

  // Manual refresh function for testing or forced updates
  const refresh = useCallback(() => {
    const currentTheme = detectTheme();
    setTheme(currentTheme);
  }, []);

  useEffect(() => {
    // Initial theme detection
    refresh();

    // Set up CSS class observation for theme change detection
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class' &&
          mutation.target === document.documentElement
        ) {
          const newTheme = detectTheme();
          setTheme(newTheme);
        }
      });
    });

    // Observe changes to the document root's class attribute
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Cleanup observer on unmount
    return () => {
      observer.disconnect();
    };
  }, [refresh]);

  return {
    isLight: theme === 'light',
    isDark: theme === 'dark',
    theme,
    refresh,
  };
};

/**
 * Utility hook for theme-dependent values
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const iconName = useThemeValue('pi-sun', 'pi-moon'); // light, dark
 *
 *   return <i className={iconName} />;
 * };
 * ```
 */
export const useThemeValue = <T>(lightValue: T, darkValue: T): T => {
  const { isLight } = useComfyUITheme();
  return isLight ? lightValue : darkValue;
};

/**
 * Hook for theme-aware conditional rendering
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const renderForTheme = useThemeConditional();
 *
 *   return (
 *     <div>
 *       {renderForTheme('light', <LightOnlyComponent />)}
 *       {renderForTheme('dark', <DarkOnlyComponent />)}
 *     </div>
 *   );
 * };
 * ```
 */
export const useThemeConditional = () => {
  const { theme } = useComfyUITheme();

  return useCallback(
    <T>(targetTheme: 'light' | 'dark', content: T): T | null => {
      return theme === targetTheme ? content : null;
    },
    [theme]
  );
};

export default useComfyUITheme;
