/**
 * Comprehensive Theme Integration Tests
 *
 * End-to-end tests that combine CSS variables, theme switching, visual regression,
 * and notification integration to ensure complete theme system functionality.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { useComfyUITheme } from '../hooks/useComfyUITheme';
import { notificationService } from '../services/notificationService';
import {
  createThemeTestEnvironment,
  testThemeTransition,
  captureComponentSnapshot,
  compareComponentSnapshots,
  testAllComponentsVisualConsistency,
  mockComfyUIVariables,
  testVariableFallbackChain,
  performanceTestThemeSwitching,
  testThemeSwitchingPerformance,
  validateCSSClassNaming,
  testCSSVariableInheritance,
  setComfyUITheme,
  getCurrentTheme,
} from '../utils/themeTestUtils';
import React from 'react';

// Test components for integration testing
const ThemeAwareButton = ({ variant = 'primary', children = 'Button' }) => {
  const { theme, isTransitioning } = useComfyUITheme();

  return (
    <button
      className={`asset-manager-button asset-manager-button--${variant} ${isTransitioning ? 'transitioning' : ''}`}
      data-theme={theme}
    >
      {children}
    </button>
  );
};

const ThemeAwareCard = ({ children = 'Card content' }) => {
  const { isLight, isDark } = useComfyUITheme();

  return (
    <div className="asset-manager-card">
      <div className="asset-manager-card-header">Theme: {isLight ? 'Light' : 'Dark'}</div>
      <div className="asset-manager-card-content">{children}</div>
    </div>
  );
};

const NotificationTestComponent = () => {
  const handleShowNotification = () => {
    notificationService.show('Test notification', { type: 'info' });
  };

  return (
    <div className="asset-manager-component">
      <button onClick={handleShowNotification} className="asset-manager-button">
        Show Notification
      </button>
    </div>
  );
};

const ComplexThemeComponent = () => {
  const { theme, setPerformanceMode } = useComfyUITheme();

  return (
    <div className="asset-manager-component">
      <div className="asset-manager-card">
        <div className="asset-manager-loading">
          <div className="asset-manager-spinner asset-manager-spinner--medium" />
          <span className="asset-manager-loading-text">Loading...</span>
        </div>

        <div className="asset-manager-error-message">
          <div className="asset-manager-error-icon">⚠</div>
          <div className="asset-manager-error-content">
            <div className="asset-manager-error-title">Error Title</div>
            <div className="asset-manager-error-description">Error description</div>
          </div>
        </div>

        <div className="asset-manager-empty-state">
          <div className="asset-manager-empty-icon">📁</div>
          <div className="asset-manager-empty-title">No Items</div>
          <div className="asset-manager-empty-description">No items found</div>
        </div>

        <button
          className="asset-manager-button asset-manager-button--primary"
          onClick={() => setPerformanceMode(true)}
        >
          Enable Performance Mode
        </button>
      </div>
    </div>
  );
};

describe('Comprehensive Theme Integration Tests', () => {
  let testEnv: { rootElement: HTMLElement; cleanup: () => void };
  let mockComfyUIApp: any;

  beforeEach(() => {
    // Set up test environment
    testEnv = createThemeTestEnvironment();

    // Mock ComfyUI app
    mockComfyUIApp = {
      extensionManager: {
        toast: vi.fn(),
      },
      version: '1.0.0',
    };

    global.window = {
      ...global.window,
      app: mockComfyUIApp,
    } as any;

    // Start with dark theme
    setComfyUITheme('dark');
  });

  afterEach(() => {
    testEnv.cleanup();
    vi.clearAllMocks();
  });

  describe('End-to-End Theme Integration', () => {
    it('should integrate all theme components seamlessly', async () => {
      const { container } = render(<ComplexThemeComponent />);

      // Verify all components are rendered with correct classes
      expect(container.querySelector('.asset-manager-component')).toBeInTheDocument();
      expect(container.querySelector('.asset-manager-card')).toBeInTheDocument();
      expect(container.querySelector('.asset-manager-loading')).toBeInTheDocument();
      expect(container.querySelector('.asset-manager-error-message')).toBeInTheDocument();
      expect(container.querySelector('.asset-manager-empty-state')).toBeInTheDocument();
      expect(container.querySelector('.asset-manager-button')).toBeInTheDocument();

      // Test theme switching affects all components
      const darkSnapshot = captureComponentSnapshot('.asset-manager-component');
      expect(darkSnapshot.theme).toBe('dark');

      act(() => {
        setComfyUITheme('light');
      });

      const lightSnapshot = captureComponentSnapshot('.asset-manager-component');
      expect(lightSnapshot.theme).toBe('light');

      // Components should maintain structure but potentially different styles
      const comparison = compareComponentSnapshots(darkSnapshot, lightSnapshot);
      expect(comparison.component).toBe('.asset-manager-component');
    });

    it('should handle theme switching with React components', async () => {
      const { container, rerender } = render(
        <div>
          <ThemeAwareButton variant="primary" />
          <ThemeAwareCard />
        </div>
      );

      // Initial dark theme
      const button = container.querySelector('.asset-manager-button');
      const card = container.querySelector('.asset-manager-card');

      expect(button?.getAttribute('data-theme')).toBe('dark');
      expect(card?.textContent).toContain('Theme: Dark');

      // Switch to light theme
      act(() => {
        setComfyUITheme('light');
      });

      rerender(
        <div>
          <ThemeAwareButton variant="primary" />
          <ThemeAwareCard />
        </div>
      );

      expect(button?.getAttribute('data-theme')).toBe('light');
      expect(card?.textContent).toContain('Theme: Light');
    });
  });

  describe('CSS Variable Integration Tests', () => {
    it('should properly integrate ComfyUI variables with fallbacks', () => {
      const restoreMock = mockComfyUIVariables({
        '--comfy-menu-bg': '#123456',
        '--input-text': '#abcdef',
        '--border-color': '#fedcba',
      });

      // Test that our variables reference ComfyUI variables
      const bgTest = testVariableFallbackChain(
        '--asset-manager-bg-primary',
        '--comfy-menu-bg',
        '#2a2a2a'
      );

      const textTest = testVariableFallbackChain(
        '--asset-manager-text-primary',
        '--input-text',
        '#ffffff'
      );

      expect(bgTest.fallbackWorks).toBe(true);
      expect(textTest.fallbackWorks).toBe(true);

      restoreMock();
    });

    it('should maintain variable inheritance across component tree', () => {
      const { container } = render(
        <div className="asset-manager-component">
          <div className="asset-manager-card">
            <div className="asset-manager-button">Nested Button</div>
          </div>
        </div>
      );

      const inheritance = testCSSVariableInheritance();

      expect(inheritance.rootVariables.length).toBeGreaterThan(0);
      expect(inheritance.brokenInheritance.length).toBe(0);
    });

    it('should handle missing ComfyUI variables gracefully', () => {
      // Remove all ComfyUI variables
      const comfyVars = ['--comfy-menu-bg', '--comfy-input-bg', '--input-text', '--border-color'];

      comfyVars.forEach((varName) => {
        document.documentElement.style.removeProperty(varName);
      });

      const { container } = render(<ComplexThemeComponent />);

      // Components should still render and function
      expect(container.querySelector('.asset-manager-component')).toBeInTheDocument();

      // Should not throw errors
      expect(() => {
        captureComponentSnapshot('.asset-manager-component');
      }).not.toThrow();
    });
  });

  describe('Visual Regression Integration', () => {
    it('should maintain visual consistency across all components', async () => {
      const { container } = render(<ComplexThemeComponent />);

      const results = await testAllComponentsVisualConsistency([
        '.asset-manager-component',
        '.asset-manager-card',
        '.asset-manager-button',
        '.asset-manager-loading',
        '.asset-manager-error-message',
        '.asset-manager-empty-state',
      ]);

      // All components should have consistent styling patterns
      results.forEach((result) => {
        expect(result.component).toBeTruthy();
        expect(result.snapshots).toHaveLength(2);

        // While styles may differ between themes, structure should be consistent
        expect(result.snapshots[0].selector).toBe(result.snapshots[1].selector);
      });
    });

    it('should validate CSS class naming conventions across all components', () => {
      const { container } = render(<ComplexThemeComponent />);

      const allElements = container.querySelectorAll('[class*="asset-manager-"]');

      allElements.forEach((element) => {
        const validation = validateCSSClassNaming(element as HTMLElement);

        if (!validation.valid) {
          console.warn(`CSS naming violations for ${element.className}:`, validation.violations);
        }

        // Most elements should follow naming conventions
        expect(validation.violations.length).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Performance Integration Tests', () => {
    it('should handle theme switching performance with complex components', async () => {
      const { container } = render(<ComplexThemeComponent />);

      const performanceResult = await testThemeSwitchingPerformance(50);

      // Theme switching should be reasonably fast
      expect(performanceResult.switchTime).toBeLessThan(100); // Less than 100ms
      expect(performanceResult.totalTime).toBeLessThan(200); // Total less than 200ms
    });

    it('should maintain performance with rapid theme changes', () => {
      render(<ComplexThemeComponent />);

      const performanceResult = performanceTestThemeSwitching(20);

      // Average theme switch should be very fast
      expect(performanceResult.averageTime).toBeLessThan(10); // Less than 10ms average
      expect(performanceResult.maxTime).toBeLessThan(50); // Max less than 50ms
    });

    it('should handle performance mode correctly', () => {
      const { container } = render(<ComplexThemeComponent />);

      const performanceButton = container.querySelector('.asset-manager-button--primary');
      expect(performanceButton).toBeInTheDocument();

      // Click to enable performance mode
      act(() => {
        (performanceButton as HTMLElement).click();
      });

      // Root element should have performance mode class
      expect(testEnv.rootElement.classList.contains('performance-mode')).toBe(true);
    });
  });

  describe('Notification Integration with Themes', () => {
    it('should integrate notifications with theme system', () => {
      const { container } = render(<NotificationTestComponent />);

      const button = container.querySelector('.asset-manager-button');
      expect(button).toBeInTheDocument();

      // Click to show notification
      act(() => {
        (button as HTMLElement).click();
      });

      // Should use ComfyUI toast system
      expect(mockComfyUIApp.extensionManager.toast).toHaveBeenCalledWith('Test notification', {
        type: 'info',
        timeout: 5000,
      });
    });

    it('should handle notification fallback with theme styling', () => {
      // Remove ComfyUI toast capability
      delete mockComfyUIApp.extensionManager.toast;

      const { container } = render(<NotificationTestComponent />);

      const button = container.querySelector('.asset-manager-button');

      act(() => {
        (button as HTMLElement).click();
      });

      // Should fall back to internal system
      const fallbackToasts = notificationService.getFallbackToasts();
      expect(fallbackToasts).toHaveLength(1);
      expect(fallbackToasts[0].message).toBe('Test notification');
    });
  });

  describe('Transition Integration Tests', () => {
    it('should handle smooth transitions during theme changes', async () => {
      const { container } = render(<ThemeAwareButton />);

      const button = container.querySelector('.asset-manager-button') as HTMLElement;
      expect(button).toBeInTheDocument();

      // Test transition
      const transitionResult = await testThemeTransition(button, 'background-color');

      expect(transitionResult.element).toBe(button);
      expect(transitionResult.duration).toBeGreaterThan(0);
      expect(transitionResult.startValue).toBeTruthy();
      expect(transitionResult.endValue).toBeTruthy();
    });

    it('should track transition states in React components', async () => {
      const TestTransitionComponent = () => {
        const { isTransitioning } = useComfyUITheme();
        return (
          <div data-transitioning={isTransitioning}>
            Transition State: {isTransitioning ? 'Active' : 'Inactive'}
          </div>
        );
      };

      const { container, rerender } = render(<TestTransitionComponent />);

      // Initially not transitioning
      expect(container.textContent).toContain('Transition State: Inactive');

      // Trigger theme change
      act(() => {
        setComfyUITheme('light');
      });

      rerender(<TestTransitionComponent />);

      // Should be transitioning
      expect(container.textContent).toContain('Transition State: Active');

      // Wait for transition to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350));
      });

      rerender(<TestTransitionComponent />);

      // Should no longer be transitioning
      expect(container.textContent).toContain('Transition State: Inactive');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle theme system errors gracefully', () => {
      // Remove root element to simulate error condition
      testEnv.rootElement.remove();

      // Should not throw when components try to use theme
      expect(() => {
        render(<ComplexThemeComponent />);
      }).not.toThrow();
    });

    it('should handle malformed CSS variables', () => {
      // Set malformed CSS variables
      document.documentElement.style.setProperty('--asset-manager-bg-primary', 'invalid-value');

      const { container } = render(<ThemeAwareCard />);

      // Should still render
      expect(container.querySelector('.asset-manager-card')).toBeInTheDocument();
    });

    it('should handle rapid theme switching without errors', () => {
      const { rerender } = render(<ThemeAwareButton />);

      // Rapid theme switches
      for (let i = 0; i < 10; i++) {
        act(() => {
          setComfyUITheme(i % 2 === 0 ? 'light' : 'dark');
        });

        rerender(<ThemeAwareButton />);
      }

      // Should not throw and should end up in consistent state
      expect(getCurrentTheme()).toMatch(/^(light|dark)$/);
    });
  });

  describe('Cross-Browser Compatibility', () => {
    it('should handle CSS variable support detection', () => {
      // Mock CSS.supports for testing
      const originalSupports = CSS.supports;

      // Test with CSS variables supported
      CSS.supports = vi.fn().mockReturnValue(true);

      const { container } = render(<ComplexThemeComponent />);
      expect(container.querySelector('.asset-manager-component')).toBeInTheDocument();

      // Test with CSS variables not supported
      CSS.supports = vi.fn().mockReturnValue(false);

      // Should still work (fallback to default styles)
      expect(() => {
        render(<ComplexThemeComponent />);
      }).not.toThrow();

      // Restore original
      CSS.supports = originalSupports;
    });

    it('should handle different viewport sizes', () => {
      // Mock different viewport sizes
      const originalInnerWidth = window.innerWidth;
      const originalInnerHeight = window.innerHeight;

      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });

      const { container: mobileContainer } = render(<ComplexThemeComponent />);
      expect(mobileContainer.querySelector('.asset-manager-component')).toBeInTheDocument();

      // Test desktop viewport
      Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });

      const { container: desktopContainer } = render(<ComplexThemeComponent />);
      expect(desktopContainer.querySelector('.asset-manager-component')).toBeInTheDocument();

      // Restore original
      Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, writable: true });
    });
  });
});
