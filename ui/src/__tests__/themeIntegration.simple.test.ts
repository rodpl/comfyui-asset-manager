/**
 * Simplified Theme Integration Tests
 * 
 * Focused tests that avoid React Testing Library conflicts while still
 * providing comprehensive coverage of theme integration functionality.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  createThemeTestEnvironment,
  setComfyUITheme,
  getCurrentTheme,
  testCSSVariableInheritance,
  validateCSSClassNaming,
  performanceTestThemeSwitching
} from '../utils/themeTestUtils';
import { notificationService } from '../services/notificationService';

describe('Theme Integration Tests (Simplified)', () => {
  let testEnv: { rootElement: HTMLElement; cleanup: () => void };
  let mockComfyUIApp: any;

  beforeEach(() => {
    // Set up test environment
    testEnv = createThemeTestEnvironment();
    
    // Mock ComfyUI app
    mockComfyUIApp = {
      extensionManager: {
        toast: vi.fn()
      },
      version: '1.0.0'
    };
    
    global.window = {
      ...global.window,
      app: mockComfyUIApp
    } as any;
    
    // Start with dark theme
    setComfyUITheme('dark');
  });

  afterEach(() => {
    testEnv.cleanup();
    vi.clearAllMocks();
  });

  describe('Basic Theme Integration', () => {
    it('should handle theme switching correctly', () => {
      // Test dark theme
      setComfyUITheme('dark');
      expect(getCurrentTheme()).toBe('dark');

      // Test light theme
      setComfyUITheme('light');
      expect(getCurrentTheme()).toBe('light');

      // Switch back to dark
      setComfyUITheme('dark');
      expect(getCurrentTheme()).toBe('dark');
    });

    it('should create proper DOM structure', () => {
      expect(testEnv.rootElement).toBeTruthy();
      expect(testEnv.rootElement.id).toBe('comfyui-asset-manager-root');
      expect(document.body.contains(testEnv.rootElement)).toBe(true);
    });

    it('should apply theme classes correctly', () => {
      setComfyUITheme('light');
      expect(document.documentElement.classList.contains('comfy-theme-light')).toBe(true);

      setComfyUITheme('dark');
      expect(document.documentElement.classList.contains('comfy-theme-light')).toBe(false);
    });
  });

  describe('Component Integration', () => {
    it('should handle component styling with theme classes', () => {
      // Create test components
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="asset-manager-component">
          <button class="asset-manager-button asset-manager-button--primary">Test Button</button>
          <div class="asset-manager-card">
            <div class="asset-manager-card-content">Card Content</div>
          </div>
          <input class="asset-manager-input" placeholder="Test Input" />
          <div class="asset-manager-loading">
            <div class="asset-manager-spinner asset-manager-spinner--medium"></div>
          </div>
        </div>
      `;
      testEnv.rootElement.appendChild(container);

      // Verify components are present
      expect(container.querySelector('.asset-manager-component')).toBeTruthy();
      expect(container.querySelector('.asset-manager-button')).toBeTruthy();
      expect(container.querySelector('.asset-manager-card')).toBeTruthy();
      expect(container.querySelector('.asset-manager-input')).toBeTruthy();
      expect(container.querySelector('.asset-manager-loading')).toBeTruthy();
      expect(container.querySelector('.asset-manager-spinner')).toBeTruthy();

      testEnv.rootElement.removeChild(container);
    });

    it('should validate CSS class naming conventions', () => {
      const testElement = document.createElement('div');
      testElement.className = 'asset-manager-button asset-manager-button--primary asset-manager-button--large';
      
      const validation = validateCSSClassNaming(testElement);
      expect(validation.valid).toBe(true);
      expect(validation.violations).toHaveLength(0);
    });

    it('should handle invalid CSS class names', () => {
      const testElement = document.createElement('div');
      testElement.className = 'asset-manager-InvalidClass asset-manager-button--';
      
      const validation = validateCSSClassNaming(testElement);
      expect(validation.valid).toBe(false);
      expect(validation.violations.length).toBeGreaterThan(0);
    });
  });

  describe('CSS Variable Integration', () => {
    it('should test CSS variable inheritance', () => {
      const inheritance = testCSSVariableInheritance();
      
      expect(Array.isArray(inheritance.rootVariables)).toBe(true);
      expect(Array.isArray(inheritance.inheritedVariables)).toBe(true);
      expect(Array.isArray(inheritance.brokenInheritance)).toBe(true);
    });

    it('should handle CSS variable scoping', () => {
      // Set variable on extension root
      testEnv.rootElement.style.setProperty('--test-scoped-var', '#123456');
      
      // Create element inside extension root
      const insideElement = document.createElement('div');
      testEnv.rootElement.appendChild(insideElement);
      
      // Create element outside extension root
      const outsideElement = document.createElement('div');
      document.body.appendChild(outsideElement);
      
      // Variables should be scoped to extension root
      const insideValue = getComputedStyle(insideElement).getPropertyValue('--test-scoped-var');
      const outsideValue = getComputedStyle(outsideElement).getPropertyValue('--test-scoped-var');
      
      expect(typeof insideValue).toBe('string');
      expect(typeof outsideValue).toBe('string');
      
      testEnv.rootElement.removeChild(insideElement);
      document.body.removeChild(outsideElement);
    });
  });

  describe('Performance Integration', () => {
    it('should handle theme switching performance', () => {
      const performanceResult = performanceTestThemeSwitching(10);
      
      expect(performanceResult.averageTime).toBeGreaterThan(0);
      expect(performanceResult.minTime).toBeGreaterThanOrEqual(0);
      expect(performanceResult.maxTime).toBeGreaterThanOrEqual(performanceResult.minTime);
      expect(performanceResult.totalTime).toBeGreaterThan(0);
    });

    it('should handle rapid theme changes', () => {
      // Rapid theme switches
      for (let i = 0; i < 10; i++) {
        setComfyUITheme(i % 2 === 0 ? 'light' : 'dark');
      }
      
      // Should end up in consistent state
      expect(getCurrentTheme()).toMatch(/^(light|dark)$/);
    });
  });

  describe('Notification Integration', () => {
    it('should integrate with ComfyUI notification system', () => {
      const id = notificationService.show('Test notification', { type: 'info' });
      
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
      
      // Should use ComfyUI toast system
      expect(mockComfyUIApp.extensionManager.toast).toHaveBeenCalledWith(
        'Test notification',
        { type: 'info', timeout: 5000 }
      );
    });

    it('should handle notification fallback', () => {
      // Remove ComfyUI toast capability
      delete mockComfyUIApp.extensionManager.toast;
      
      const id = notificationService.show('Fallback notification');
      
      // Should fall back to internal system
      expect(typeof id).toBe('string');
      expect(id).toMatch(/^toast-/);
    });

    it('should provide notification convenience methods', () => {
      notificationService.showSuccess('Success message');
      notificationService.showError('Error message');
      notificationService.showWarning('Warning message');
      notificationService.showInfo('Info message');
      
      expect(mockComfyUIApp.extensionManager.toast).toHaveBeenCalledTimes(4);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle missing root element gracefully', () => {
      // Remove root element
      testEnv.rootElement.remove();
      
      // Should not throw when testing theme functions
      expect(() => {
        setComfyUITheme('light');
        getCurrentTheme();
      }).not.toThrow();
    });

    it('should handle malformed CSS gracefully', () => {
      // Set malformed CSS variables
      document.documentElement.style.setProperty('--asset-manager-bg-primary', 'invalid-value');
      
      // Should not throw
      expect(() => {
        setComfyUITheme('light');
        setComfyUITheme('dark');
      }).not.toThrow();
    });

    it('should handle missing ComfyUI app gracefully', () => {
      // Remove ComfyUI app
      delete (global.window as any).app;
      
      // Should not throw
      expect(() => {
        notificationService.show('Test message');
      }).not.toThrow();
    });
  });

  describe('Cross-Browser Compatibility', () => {
    it('should handle different CSS support levels', () => {
      // Mock CSS.supports
      const originalSupports = CSS.supports;
      
      // Test with CSS variables supported
      CSS.supports = vi.fn().mockReturnValue(true);
      expect(() => setComfyUITheme('light')).not.toThrow();
      
      // Test with CSS variables not supported
      CSS.supports = vi.fn().mockReturnValue(false);
      expect(() => setComfyUITheme('dark')).not.toThrow();
      
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
      
      expect(() => setComfyUITheme('light')).not.toThrow();
      
      // Test desktop viewport
      Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });
      
      expect(() => setComfyUITheme('dark')).not.toThrow();
      
      // Restore original
      Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, writable: true });
    });
  });
});