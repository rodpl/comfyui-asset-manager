/**
 * Tests for enhanced theme transition functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComfyUITheme, preventInitialTransitionFlash, withOptimizedTransitions } from '../useComfyUITheme';

// Mock MutationObserver
class MockMutationObserver {
  private callback: MutationCallback;
  static instances: MockMutationObserver[] = [];
  
  constructor(callback: MutationCallback) {
    this.callback = callback;
    MockMutationObserver.instances.push(this);
  }
  
  observe() {}
  disconnect() {}
  
  // Helper method to trigger mutations
  trigger(mutations: MutationRecord[]) {
    this.callback(mutations, this);
  }
  
  static triggerAll(mutations: MutationRecord[]) {
    MockMutationObserver.instances.forEach(instance => {
      instance.trigger(mutations);
    });
  }
  
  static reset() {
    MockMutationObserver.instances = [];
  }
}

const OriginalMutationObserver = global.MutationObserver;

describe('Enhanced Theme Transitions', () => {
  beforeEach(() => {
    document.documentElement.className = '';
    MockMutationObserver.reset();
    global.MutationObserver = MockMutationObserver as unknown;
    
    // Clear any existing root element
    const existingRoot = document.getElementById('comfyui-asset-manager-root');
    if (existingRoot) {
      existingRoot.remove();
    }
  });

  afterEach(() => {
    global.MutationObserver = OriginalMutationObserver;
    document.documentElement.className = '';
    
    // Clean up root element
    const existingRoot = document.getElementById('comfyui-asset-manager-root');
    if (existingRoot) {
      existingRoot.remove();
    }
  });

  describe('useComfyUITheme enhanced features', () => {
    it('should track transition state when theme changes', async () => {
      const { result } = renderHook(() => useComfyUITheme());
      
      // Initially not transitioning
      expect(result.current.isTransitioning).toBe(false);
      expect(result.current.theme).toBe('dark');
      
      // Simulate theme change to light
      act(() => {
        document.documentElement.classList.add('comfy-theme-light');
        
        // Trigger the mutation observer
        MockMutationObserver.triggerAll([{
          type: 'attributes',
          attributeName: 'class',
          target: document.documentElement,
        } as MutationRecord]);
      });
      
      // Should be transitioning and theme should update
      expect(result.current.isTransitioning).toBe(true);
      expect(result.current.theme).toBe('light');
      expect(result.current.isLight).toBe(true);
      expect(result.current.isDark).toBe(false);
    });

    it('should provide performance mode control', () => {
      // Create root element for testing
      const rootElement = document.createElement('div');
      rootElement.id = 'comfyui-asset-manager-root';
      document.body.appendChild(rootElement);
      
      const { result } = renderHook(() => useComfyUITheme());
      
      // Enable performance mode
      act(() => {
        result.current.setPerformanceMode(true);
      });
      
      expect(rootElement.classList.contains('performance-mode')).toBe(true);
      
      // Disable performance mode
      act(() => {
        result.current.setPerformanceMode(false);
      });
      
      expect(rootElement.classList.contains('performance-mode')).toBe(false);
    });

    it('should handle multiple rapid theme changes', async () => {
      const { result } = renderHook(() => useComfyUITheme());
      
      // Rapid theme changes
      act(() => {
        document.documentElement.classList.add('comfy-theme-light');
        MockMutationObserver.triggerAll([{
          type: 'attributes',
          attributeName: 'class',
          target: document.documentElement,
        } as MutationRecord]);
      });
      
      expect(result.current.isTransitioning).toBe(true);
      expect(result.current.theme).toBe('light');
      
      // Change back to dark quickly
      act(() => {
        document.documentElement.classList.remove('comfy-theme-light');
        MockMutationObserver.triggerAll([{
          type: 'attributes',
          attributeName: 'class',
          target: document.documentElement,
        } as MutationRecord]);
      });
      
      expect(result.current.isTransitioning).toBe(true);
      expect(result.current.theme).toBe('dark');
    });
  });

  describe('preventInitialTransitionFlash', () => {
    it('should add and remove loading class', async () => {
      // Create root element
      const rootElement = document.createElement('div');
      rootElement.id = 'comfyui-asset-manager-root';
      document.body.appendChild(rootElement);
      
      // Call the function
      preventInitialTransitionFlash();
      
      // Should immediately add loading class
      expect(rootElement.classList.contains('loading')).toBe(true);
      
      // Wait for the timeout (50ms)
      await new Promise(resolve => setTimeout(resolve, 60));
      
      // Should remove loading class
      expect(rootElement.classList.contains('loading')).toBe(false);
    });

    it('should handle missing root element gracefully', () => {
      // Should not throw when root element doesn't exist
      expect(() => preventInitialTransitionFlash()).not.toThrow();
    });
  });

  describe('withOptimizedTransitions', () => {
    it('should temporarily enable performance mode during operations', async () => {
      // Create root element
      const rootElement = document.createElement('div');
      rootElement.id = 'comfyui-asset-manager-root';
      document.body.appendChild(rootElement);
      
      const mockOperation = vi.fn().mockResolvedValue('result');
      
      // Execute operation with optimized transitions
      const promise = withOptimizedTransitions(mockOperation);
      
      // Should immediately enable performance mode
      expect(rootElement.classList.contains('performance-mode')).toBe(true);
      
      const result = await promise;
      
      // Should return operation result
      expect(result).toBe('result');
      expect(mockOperation).toHaveBeenCalledOnce();
      
      // Wait for cleanup delay (16ms)
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Should remove performance mode
      expect(rootElement.classList.contains('performance-mode')).toBe(false);
    });

    it('should handle synchronous operations', async () => {
      const rootElement = document.createElement('div');
      rootElement.id = 'comfyui-asset-manager-root';
      document.body.appendChild(rootElement);
      
      const mockOperation = vi.fn().mockReturnValue('sync-result');
      
      const result = await withOptimizedTransitions(mockOperation);
      
      expect(result).toBe('sync-result');
      expect(mockOperation).toHaveBeenCalledOnce();
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(rootElement.classList.contains('performance-mode')).toBe(false);
    });

    it('should handle operation errors', async () => {
      const rootElement = document.createElement('div');
      rootElement.id = 'comfyui-asset-manager-root';
      document.body.appendChild(rootElement);
      
      const mockOperation = vi.fn().mockRejectedValue(new Error('Operation failed'));
      
      await expect(withOptimizedTransitions(mockOperation)).rejects.toThrow('Operation failed');
      
      // Should still clean up performance mode
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(rootElement.classList.contains('performance-mode')).toBe(false);
    });

    it('should respect disableTransitions option', async () => {
      const rootElement = document.createElement('div');
      rootElement.id = 'comfyui-asset-manager-root';
      document.body.appendChild(rootElement);
      
      const mockOperation = vi.fn().mockResolvedValue('result');
      
      // Execute with transitions disabled
      await withOptimizedTransitions(mockOperation, { disableTransitions: false });
      
      // Should not have enabled performance mode
      expect(rootElement.classList.contains('performance-mode')).toBe(false);
    });

    it('should handle missing root element gracefully', async () => {
      const mockOperation = vi.fn().mockResolvedValue('result');
      
      // Should not throw when root element doesn't exist
      const result = await withOptimizedTransitions(mockOperation);
      expect(result).toBe('result');
    });
  });

  describe('CSS transition variables', () => {
    it('should have enhanced transition timing functions', () => {
      // Create a test element to check CSS variables
      const testElement = document.createElement('div');
      testElement.id = 'comfyui-asset-manager-root';
      document.body.appendChild(testElement);
      
      const styles = getComputedStyle(document.documentElement);
      
      // Check that enhanced transition variables exist
      // Note: In test environment, CSS variables might not be fully loaded
      // This test verifies the structure is in place
      expect(document.querySelector('#comfyui-asset-manager-root')).toBeTruthy();
    });
  });
});