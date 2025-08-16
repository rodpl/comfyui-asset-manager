/**
 * Tests for useComfyUITheme hook
 */

import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useComfyUITheme, useThemeValue, useThemeConditional } from '../useComfyUITheme';

// Mock MutationObserver
class MockMutationObserver {
  private callback: MutationCallback;
  public observations: { target: Node; options: MutationObserverInit }[] = [];

  constructor(callback: MutationCallback) {
    this.callback = callback;
  }

  observe(target: Node, options: MutationObserverInit) {
    this.observations.push({ target, options });
  }

  disconnect() {
    this.observations = [];
  }

  takeRecords(): MutationRecord[] {
    return [];
  }

  // Helper method to trigger mutations for testing
  triggerMutation(mutations: MutationRecord[]) {
    this.callback(mutations, this as any);
  }
}

// Store original MutationObserver
const OriginalMutationObserver = global.MutationObserver;

describe('useComfyUITheme', () => {
  let mockObserver: MockMutationObserver;

  beforeEach(() => {
    // Reset document class
    document.documentElement.className = '';

    // Mock MutationObserver
    mockObserver = new MockMutationObserver(() => {});
    global.MutationObserver = vi.fn(() => mockObserver) as any;
  });

  afterEach(() => {
    // Restore original MutationObserver
    global.MutationObserver = OriginalMutationObserver;

    // Clean up document class
    document.documentElement.className = '';
  });

  describe('initial theme detection', () => {
    it('should detect dark theme by default', () => {
      const { result } = renderHook(() => useComfyUITheme());

      expect(result.current.theme).toBe('dark');
      expect(result.current.isDark).toBe(true);
      expect(result.current.isLight).toBe(false);
    });

    it('should detect light theme when class is present', () => {
      document.documentElement.classList.add('comfy-theme-light');

      const { result } = renderHook(() => useComfyUITheme());

      expect(result.current.theme).toBe('light');
      expect(result.current.isLight).toBe(true);
      expect(result.current.isDark).toBe(false);
    });
  });

  describe('theme change detection', () => {
    it('should detect theme changes through manual refresh', () => {
      const { result } = renderHook(() => useComfyUITheme());

      // Initially dark
      expect(result.current.theme).toBe('dark');

      // Change theme class
      act(() => {
        document.documentElement.classList.add('comfy-theme-light');
        result.current.refresh(); // Manually trigger refresh since mutation observer is mocked
      });

      expect(result.current.theme).toBe('light');
      expect(result.current.isLight).toBe(true);
      expect(result.current.isDark).toBe(false);
    });

    it('should detect theme changes back to dark', () => {
      document.documentElement.classList.add('comfy-theme-light');
      const { result } = renderHook(() => useComfyUITheme());

      // Initially light
      expect(result.current.theme).toBe('light');

      // Change back to dark
      act(() => {
        document.documentElement.classList.remove('comfy-theme-light');
        result.current.refresh(); // Manually trigger refresh since mutation observer is mocked
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.isDark).toBe(true);
      expect(result.current.isLight).toBe(false);
    });
  });

  describe('manual refresh', () => {
    it('should update theme when refresh is called', () => {
      const { result } = renderHook(() => useComfyUITheme());

      // Initially dark
      expect(result.current.theme).toBe('dark');

      // Change class without triggering observer
      document.documentElement.classList.add('comfy-theme-light');

      // Manually refresh
      act(() => {
        result.current.refresh();
      });

      expect(result.current.theme).toBe('light');
    });
  });

  describe('observer setup', () => {
    it('should set up MutationObserver correctly', () => {
      renderHook(() => useComfyUITheme());

      expect(global.MutationObserver).toHaveBeenCalledWith(expect.any(Function));
      expect(mockObserver.observations).toHaveLength(1);
      expect(mockObserver.observations[0].target).toBe(document.documentElement);
      expect(mockObserver.observations[0].options).toEqual({
        attributes: true,
        attributeFilter: ['class'],
      });
    });

    it('should disconnect observer on unmount', () => {
      const { unmount } = renderHook(() => useComfyUITheme());

      const disconnectSpy = vi.spyOn(mockObserver, 'disconnect');

      unmount();

      expect(disconnectSpy).toHaveBeenCalled();
    });
  });
});

describe('useThemeValue', () => {
  beforeEach(() => {
    document.documentElement.className = '';
    global.MutationObserver = vi.fn(() => new MockMutationObserver(() => {})) as any;
  });

  afterEach(() => {
    global.MutationObserver = OriginalMutationObserver;
    document.documentElement.className = '';
  });

  it('should return dark value by default', () => {
    const { result } = renderHook(() => useThemeValue('light-value', 'dark-value'));

    expect(result.current).toBe('dark-value');
  });

  it('should return light value when in light theme', () => {
    document.documentElement.classList.add('comfy-theme-light');

    const { result } = renderHook(() => useThemeValue('light-value', 'dark-value'));

    expect(result.current).toBe('light-value');
  });
});

describe('useThemeConditional', () => {
  beforeEach(() => {
    document.documentElement.className = '';
    global.MutationObserver = vi.fn(() => new MockMutationObserver(() => {})) as any;
  });

  afterEach(() => {
    global.MutationObserver = OriginalMutationObserver;
    document.documentElement.className = '';
  });

  it('should return content for matching theme', () => {
    const { result } = renderHook(() => useThemeConditional());

    // Dark theme by default
    expect(result.current('dark', 'dark-content')).toBe('dark-content');
    expect(result.current('light', 'light-content')).toBe(null);
  });

  it('should return content for light theme when active', () => {
    document.documentElement.classList.add('comfy-theme-light');

    const { result } = renderHook(() => useThemeConditional());

    expect(result.current('light', 'light-content')).toBe('light-content');
    expect(result.current('dark', 'dark-content')).toBe(null);
  });
});
