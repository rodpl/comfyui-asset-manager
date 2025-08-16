/**
 * React hook for ComfyUI theme detection with enhanced transition management
 * Provides simple theme awareness for components that need JavaScript theme logic
 *
 * This hook is optional since CSS handles most theme logic automatically.
 * Use only when components need conditional rendering based on theme.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseComfyUIThemeReturn {
  /** True when ComfyUI is in light theme mode */
  isLight: boolean;
  /** True when ComfyUI is in dark theme mode (default) */
  isDark: boolean;
  /** Current theme as string */
  theme: 'light' | 'dark';
  /** True when theme is currently transitioning */
  isTransitioning: boolean;
  /** Manually refresh theme detection (useful for testing) */
  refresh: () => void;
  /** Enable/disable performance mode (disables transitions) */
  setPerformanceMode: (enabled: boolean) => void;
}

/**
 * Detect current ComfyUI theme from DOM
 */
const detectTheme = (): 'light' | 'dark' => {
  // Check for ComfyUI's light theme class on document root
  return document.documentElement.classList.contains('comfy-theme-light') ? 'light' : 'dark';
};

/**
 * Hook for detecting ComfyUI theme changes with enhanced transition management
 *
 * Automatically detects theme switches and provides boolean values for conditional rendering.
 * Includes transition state management and performance optimizations.
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const { isLight, isDark, isTransitioning, setPerformanceMode } = useComfyUITheme();
 *
 *   // Enable performance mode for large datasets
 *   useEffect(() => {
 *     if (largeDataset) {
 *       setPerformanceMode(true);
 *     }
 *   }, [largeDataset, setPerformanceMode]);
 *
 *   return (
 *     <div className="asset-manager-component">
 *       {isLight && <LightThemeOnlyFeature />}
 *       {isDark && <DarkThemeOnlyFeature />}
 *       {isTransitioning && <TransitionIndicator />}
 *     </div>
 *   );
 * };
 * ```
 */
export const useComfyUITheme = (): UseComfyUIThemeReturn => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => detectTheme());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout>();

  // Manual refresh function for testing or forced updates
  const refresh = useCallback(() => {
    const currentTheme = detectTheme();
    setTheme(currentTheme);
  }, []);

  // Performance mode management
  const setPerformanceMode = useCallback((enabled: boolean) => {
    const rootElement = document.getElementById('comfyui-asset-manager-root');
    if (rootElement) {
      if (enabled) {
        rootElement.classList.add('performance-mode');
      } else {
        rootElement.classList.remove('performance-mode');
      }
    }
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
          if (newTheme !== theme) {
            // Theme is changing - set transitioning state
            setIsTransitioning(true);
            setTheme(newTheme);

            // Clear existing timeout
            if (transitionTimeoutRef.current) {
              clearTimeout(transitionTimeoutRef.current);
            }

            // Set timeout to clear transitioning state after transition completes
            // Use 300ms to account for the longest transition duration
            transitionTimeoutRef.current = setTimeout(() => {
              setIsTransitioning(false);
            }, 300);
          }
        }
      });
    });

    // Observe changes to the document root's class attribute
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Cleanup observer and timeout on unmount
    return () => {
      observer.disconnect();
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [refresh, theme]);

  return {
    isLight: theme === 'light',
    isDark: theme === 'dark',
    theme,
    isTransitioning,
    refresh,
    setPerformanceMode,
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

/**
 * Utility function to prevent transition flash during initial load
 * Call this when the extension first loads to prevent transition animations
 * during the initial render
 */
export const preventInitialTransitionFlash = (): void => {
  const rootElement = document.getElementById('comfyui-asset-manager-root');
  if (rootElement) {
    // Add loading class to prevent transitions
    rootElement.classList.add('loading');
    
    // Remove loading class after a short delay to allow initial render
    setTimeout(() => {
      rootElement.classList.remove('loading');
    }, 50);
  }
};

/**
 * Utility function to optimize transitions for large component trees
 * Temporarily disables transitions during bulk operations
 */
export const withOptimizedTransitions = async <T>(
  operation: () => Promise<T> | T,
  options: { disableTransitions?: boolean } = {}
): Promise<T> => {
  const { disableTransitions = true } = options;
  const rootElement = document.getElementById('comfyui-asset-manager-root');
  
  if (disableTransitions && rootElement) {
    rootElement.classList.add('performance-mode');
  }
  
  try {
    const result = await operation();
    return result;
  } finally {
    if (disableTransitions && rootElement) {
      // Re-enable transitions after a short delay
      setTimeout(() => {
        rootElement.classList.remove('performance-mode');
      }, 16); // One frame delay
    }
  }
};

export default useComfyUITheme;
