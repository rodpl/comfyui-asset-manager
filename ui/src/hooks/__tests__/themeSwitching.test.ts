/**
 * Theme Switching Functionality Tests
 * 
 * Comprehensive tests for theme switching in both light and dark modes,
 * including transition states, performance optimizations, and edge cases.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { 
  useComfyUITheme, 
  preventInitialTransitionFlash, 
  withOptimizedTransitions 
} from '../useComfyUITheme';
import { setComfyUITheme, getCurrentTheme } from '../../utils/themeTestUtils';

// Mock MutationObserver for testing
class MockMutationObserver {
  private callback: MutationCallback;
  public observations: { target: Node; options: MutationObserverInit }[] = [];
  static instances: MockMutationObserver[] = [];

  constructor(callback: MutationCallback) {
    this.callback = callback;
    MockMutationObserver.instances.push(this);
  }

  observe(target: Node, options: MutationObserverInit) {
    this.observations.push({ target, options });
  }

  disconnect() {
    this.observations = [];
    const index = MockMutationObserver.instances.indexOf(this);
    if (index > -1) {
      MockMutationObserver.instances.splice(index, 1);
    }
  }

  takeRecords(): MutationRecord[] {
    return [];
  }

  // Helper to trigger mutations
  triggerMutation(mutations: MutationRecord[]) {
    this.callback(mutations, this);
  }

  static triggerAll(mutations: MutationRecord[]) {
    MockMutationObserver.instances.forEach(instance => {
      instance.triggerMutation(mutations);
    });
  }

  static reset() {
    MockMutationObserver.instances = [];
  }
}

const OriginalMutationObserver = global.MutationObserver;

describe('Theme Switching Functionality', () => {
  let rootElement: HTMLElement;

  beforeEach(() => {
    // Reset document class
    document.documentElement.className = '';
    
    // Create extension root element
    rootElement = document.createElement('div');
    rootElement.id = 'comfyui-asset-manager-root';
    document.body.appendChild(rootElement);

    // Reset mock observer
    MockMutationObserver.reset();
    global.MutationObserver = MockMutationObserver as any;

    // Start with dark theme
    setComfyUITheme('dark');
  });

  afterEach(() => {
    // Restore original MutationObserver
    global.MutationObserver = OriginalMutationObserver;

    // Clean up DOM
    if (rootElement.parentNode) {
      rootElement.parentNode.removeChild(rootElement);
    }
    document.documentElement.className = '';
    MockMutationObserver.reset();
  });

  describe('Basic Theme Detection', () => {
    it('should detect dark theme by default', () => {
      const { result } = renderHook(() => useComfyUITheme());

      expect(result.current.theme).toBe('dark');
      expect(result.current.isDark).toBe(true);
      expect(result.current.isLight).toBe(false);
    });

    it('should detect light theme when class is present', () => {
      setComfyUITheme('light');
      
      const { result } = renderHook(() => useComfyUITheme());

      expect(result.current.theme).toBe('light');
      expect(result.current.isLight).toBe(true);
      expect(result.current.isDark).toBe(false);
    });

    it('should update theme when DOM class changes', () => {
      const { result } = renderHook(() => useComfyUITheme());

      // Initially dark
      expect(result.current.theme).toBe('dark');

      // Change to light theme
      act(() => {
        setComfyUITheme('light');
        
        // Trigger mutation observer
        MockMutationObserver.triggerAll([
          {
            type: 'attributes',
            attributeName: 'class',
            target: document.documentElement,
            addedNodes: [] as any,
            removedNodes: [] as any,
            previousSibling: null,
            nextSibling: null,
            attributeNamespace: null,
            oldValue: null
          } as MutationRecord
        ]);
      });

      expect(result.current.theme).toBe('light');
      expect(result.current.isLight).toBe(true);
      expect(result.current.isDark).toBe(false);
    });
  });

  describe('Theme Transition States', () => {
    it('should track transition state during theme changes', async () => {
      const { result } = renderHook(() => useComfyUITheme());

      // Initially not transitioning
      expect(result.current.isTransitioning).toBe(false);

      // Change theme
      act(() => {
        setComfyUITheme('light');
        
        MockMutationObserver.triggerAll([
          {
            type: 'attributes',
            attributeName: 'class',
            target: document.documentElement,
            addedNodes: [] as any,
            removedNodes: [] as any,
            previousSibling: null,
            nextSibling: null,
            attributeNamespace: null,
            oldValue: null
          } as MutationRecord
        ]);
      });

      // Should be transitioning
      expect(result.current.isTransitioning).toBe(true);
      expect(result.current.theme).toBe('light');

      // Wait for transition to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350)); // Wait longer than transition timeout
      });

      expect(result.current.isTransitioning).toBe(false);
    });

    it('should handle rapid theme changes correctly', () => {
      const { result } = renderHook(() => useComfyUITheme());

      // Rapid theme changes
      act(() => {
        setComfyUITheme('light');
        MockMutationObserver.triggerAll([
          {
            type: 'attributes',
            attributeName: 'class',
            target: document.documentElement,
            addedNodes: [] as any,
            removedNodes: [] as any,
            previousSibling: null,
            nextSibling: null,
            attributeNamespace: null,
            oldValue: null
          } as MutationRecord
        ]);
      });

      expect(result.current.theme).toBe('light');
      expect(result.current.isTransitioning).toBe(true);

      // Change back quickly
      act(() => {
        setComfyUITheme('dark');
        MockMutationObserver.triggerAll([
          {
            type: 'attributes',
            attributeName: 'class',
            target: document.documentElement,
            addedNodes: [] as any,
            removedNodes: [] as any,
            previousSibling: null,
            nextSibling: null,
            attributeNamespace: null,
            oldValue: null
          } as MutationRecord
        ]);
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.isTransitioning).toBe(true);
    });
  });

  describe('Performance Mode Management', () => {
    it('should enable and disable performance mode', () => {
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

    it('should handle missing root element gracefully', () => {
      // Remove root element
      rootElement.remove();

      const { result } = renderHook(() => useComfyUITheme());

      // Should not throw when root element is missing
      expect(() => {
        act(() => {
          result.current.setPerformanceMode(true);
        });
      }).not.toThrow();
    });
  });

  describe('Manual Theme Refresh', () => {
    it('should update theme when refresh is called', () => {
      const { result } = renderHook(() => useComfyUITheme());

      // Initially dark
      expect(result.current.theme).toBe('dark');

      // Change DOM without triggering observer
      document.documentElement.classList.add('comfy-theme-light');

      // Manually refresh
      act(() => {
        result.current.refresh();
      });

      expect(result.current.theme).toBe('light');
    });

    it('should work with multiple refresh calls', () => {
      const { result } = renderHook(() => useComfyUITheme());

      // Multiple rapid refreshes should not cause issues
      act(() => {
        result.current.refresh();
        result.current.refresh();
        result.current.refresh();
      });

      expect(result.current.theme).toBe('dark'); // Should remain consistent
    });
  });

  describe('Observer Setup and Cleanup', () => {
    it('should set up MutationObserver correctly', () => {
      renderHook(() => useComfyUITheme());

      expect(MockMutationObserver.instances.length).toBe(1);
      const observer = MockMutationObserver.instances[0];
      
      expect(observer.observations).toHaveLength(1);
      expect(observer.observations[0].target).toBe(document.documentElement);
      expect(observer.observations[0].options).toEqual({
        attributes: true,
        attributeFilter: ['class'],
      });
    });

    it('should disconnect observer on unmount', () => {
      const { unmount } = renderHook(() => useComfyUITheme());

      expect(MockMutationObserver.instances.length).toBe(1);

      unmount();

      // Observer should be cleaned up
      expect(MockMutationObserver.instances.length).toBe(0);
    });

    it('should handle multiple hook instances', () => {
      const { unmount: unmount1 } = renderHook(() => useComfyUITheme());
      const { unmount: unmount2 } = renderHook(() => useComfyUITheme());

      expect(MockMutationObserver.instances.length).toBe(2);

      unmount1();
      expect(MockMutationObserver.instances.length).toBe(1);

      unmount2();
      expect(MockMutationObserver.instances.length).toBe(0);
    });
  });

  describe('Theme Switching Edge Cases', () => {
    it('should handle theme changes when component is unmounted', () => {
      const { result, unmount } = renderHook(() => useComfyUITheme());

      expect(result.current.theme).toBe('dark');

      // Unmount component
      unmount();

      // Change theme after unmount - should not cause errors
      expect(() => {
        setComfyUITheme('light');
      }).not.toThrow();
    });

    it('should handle invalid class changes', () => {
      const { result } = renderHook(() => useComfyUITheme());

      // Trigger observer with non-class attribute change
      act(() => {
        MockMutationObserver.triggerAll([
          {
            type: 'attributes',
            attributeName: 'id',
            target: document.documentElement,
            addedNodes: [] as any,
            removedNodes: [] as any,
            previousSibling: null,
            nextSibling: null,
            attributeNamespace: null,
            oldValue: null
          } as MutationRecord
        ]);
      });

      // Theme should remain unchanged
      expect(result.current.theme).toBe('dark');
    });

    it('should handle mutations on different elements', () => {
      const { result } = renderHook(() => useComfyUITheme());

      // Create different element
      const otherElement = document.createElement('div');
      document.body.appendChild(otherElement);

      // Trigger observer with mutation on different element
      act(() => {
        MockMutationObserver.triggerAll([
          {
            type: 'attributes',
            attributeName: 'class',
            target: otherElement,
            addedNodes: [] as any,
            removedNodes: [] as any,
            previousSibling: null,
            nextSibling: null,
            attributeNamespace: null,
            oldValue: null
          } as MutationRecord
        ]);
      });

      // Theme should remain unchanged
      expect(result.current.theme).toBe('dark');

      document.body.removeChild(otherElement);
    });
  });

  describe('Utility Functions', () => {
    describe('preventInitialTransitionFlash', () => {
      it('should add and remove loading class', async () => {
        preventInitialTransitionFlash();

        // Should immediately add loading class
        expect(rootElement.classList.contains('loading')).toBe(true);

        // Wait for timeout
        await new Promise(resolve => setTimeout(resolve, 60));

        // Should remove loading class
        expect(rootElement.classList.contains('loading')).toBe(false);
      });

      it('should handle missing root element', () => {
        rootElement.remove();

        // Should not throw
        expect(() => preventInitialTransitionFlash()).not.toThrow();
      });
    });

    describe('withOptimizedTransitions', () => {
      it('should temporarily enable performance mode', async () => {
        const mockOperation = vi.fn().mockResolvedValue('result');

        const promise = withOptimizedTransitions(mockOperation);

        // Should immediately enable performance mode
        expect(rootElement.classList.contains('performance-mode')).toBe(true);

        const result = await promise;

        expect(result).toBe('result');
        expect(mockOperation).toHaveBeenCalledOnce();

        // Wait for cleanup
        await new Promise(resolve => setTimeout(resolve, 20));

        // Should remove performance mode
        expect(rootElement.classList.contains('performance-mode')).toBe(false);
      });

      it('should handle synchronous operations', async () => {
        const mockOperation = vi.fn().mockReturnValue('sync-result');

        const result = await withOptimizedTransitions(mockOperation);

        expect(result).toBe('sync-result');
        expect(mockOperation).toHaveBeenCalledOnce();

        // Wait for cleanup
        await new Promise(resolve => setTimeout(resolve, 20));
        expect(rootElement.classList.contains('performance-mode')).toBe(false);
      });

      it('should handle operation errors', async () => {
        const mockOperation = vi.fn().mockRejectedValue(new Error('Operation failed'));

        await expect(withOptimizedTransitions(mockOperation)).rejects.toThrow('Operation failed');

        // Should still clean up performance mode
        await new Promise(resolve => setTimeout(resolve, 20));
        expect(rootElement.classList.contains('performance-mode')).toBe(false);
      });

      it('should respect disableTransitions option', async () => {
        const mockOperation = vi.fn().mockResolvedValue('result');

        await withOptimizedTransitions(mockOperation, { disableTransitions: false });

        // Should not have enabled performance mode
        expect(rootElement.classList.contains('performance-mode')).toBe(false);
      });

      it('should handle missing root element', async () => {
        rootElement.remove();

        const mockOperation = vi.fn().mockResolvedValue('result');

        // Should not throw
        const result = await withOptimizedTransitions(mockOperation);
        expect(result).toBe('result');
      });
    });
  });

  describe('Theme Consistency', () => {
    it('should maintain theme consistency across multiple components', () => {
      const { result: result1 } = renderHook(() => useComfyUITheme());
      const { result: result2 } = renderHook(() => useComfyUITheme());

      // Both should start with same theme
      expect(result1.current.theme).toBe(result2.current.theme);

      // Change theme
      act(() => {
        setComfyUITheme('light');
        MockMutationObserver.triggerAll([
          {
            type: 'attributes',
            attributeName: 'class',
            target: document.documentElement,
            addedNodes: [] as any,
            removedNodes: [] as any,
            previousSibling: null,
            nextSibling: null,
            attributeNamespace: null,
            oldValue: null
          } as MutationRecord
        ]);
      });

      // Both should update to same theme
      expect(result1.current.theme).toBe('light');
      expect(result2.current.theme).toBe('light');
      expect(result1.current.theme).toBe(result2.current.theme);
    });

    it('should handle theme changes during component lifecycle', () => {
      let hookResult: any;

      const { result, rerender } = renderHook(() => {
        hookResult = useComfyUITheme();
        return hookResult;
      });

      expect(result.current.theme).toBe('dark');

      // Change theme and rerender
      act(() => {
        setComfyUITheme('light');
        MockMutationObserver.triggerAll([
          {
            type: 'attributes',
            attributeName: 'class',
            target: document.documentElement,
            addedNodes: [] as any,
            removedNodes: [] as any,
            previousSibling: null,
            nextSibling: null,
            attributeNamespace: null,
            oldValue: null
          } as MutationRecord
        ]);
        rerender();
      });

      expect(result.current.theme).toBe('light');
    });
  });
});