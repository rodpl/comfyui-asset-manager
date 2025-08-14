/**
 * Tests for useOfflineDetection hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import useOfflineDetection from '../useOfflineDetection';

// Mock fetch
global.fetch = vi.fn();

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock navigator.connection
Object.defineProperty(navigator, 'connection', {
  writable: true,
  value: {
    effectiveType: '4g',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
});

describe('useOfflineDetection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigator.onLine = true;
    (fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('initializes with online state', () => {
    const { result } = renderHook(() => useOfflineDetection());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isApiHealthy).toBe(true);
    expect(result.current.isFullyOnline).toBe(true);
  });

  it('initializes with offline state when navigator is offline', () => {
    navigator.onLine = false;
    
    const { result } = renderHook(() => useOfflineDetection());

    expect(result.current.isOnline).toBe(false);
    expect(result.current.isFullyOnline).toBe(false);
  });

  it('detects connection type from navigator.connection', () => {
    const { result } = renderHook(() => useOfflineDetection());

    expect(result.current.connectionType).toBe('4g');
    expect(result.current.connectionQuality).toBe('excellent');
  });

  it('handles online/offline events', async () => {
    const { result } = renderHook(() => useOfflineDetection());

    // Go offline
    act(() => {
      navigator.onLine = false;
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.isFullyOnline).toBe(false);

    // Go back online
    act(() => {
      navigator.onLine = true;
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('calls onOnline callback when coming online', async () => {
    const onOnline = vi.fn();
    navigator.onLine = false;

    renderHook(() => useOfflineDetection({ onOnline }));

    act(() => {
      navigator.onLine = true;
      window.dispatchEvent(new Event('online'));
    });

    expect(onOnline).toHaveBeenCalled();
  });

  it('calls onOffline callback when going offline', async () => {
    const onOffline = vi.fn();

    renderHook(() => useOfflineDetection({ onOffline }));

    act(() => {
      navigator.onLine = false;
      window.dispatchEvent(new Event('offline'));
    });

    expect(onOffline).toHaveBeenCalled();
  });

  it('performs API health checks', async () => {
    const { result } = renderHook(() => useOfflineDetection({
      endpoints: ['/test-endpoint'],
    }));

    await act(async () => {
      await result.current.checkApiHealth();
    });

    expect(fetch).toHaveBeenCalledWith('/test-endpoint', expect.objectContaining({
      method: 'HEAD',
      cache: 'no-cache',
    }));
  });

  it('handles API health check failures', async () => {
    (fetch as any).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useOfflineDetection());

    await act(async () => {
      const isHealthy = await result.current.checkApiHealth();
      expect(isHealthy).toBe(false);
    });

    expect(result.current.isApiHealthy).toBe(false);
    expect(result.current.hasConnectivityIssues).toBe(true);
  });

  it('retries API health checks with exponential backoff', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('Network error'))
                   .mockRejectedValueOnce(new Error('Network error'))
                   .mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useOfflineDetection({
      maxRetries: 2,
      retryDelay: 100,
    }));

    await act(async () => {
      await result.current.checkApiHealth();
    });

    // Should have made multiple attempts
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('handles rate limiting (429) responses', async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
      status: 429,
      headers: {
        get: vi.fn().mockReturnValue('2'), // Retry-After: 2 seconds
      },
    });

    const { result } = renderHook(() => useOfflineDetection({
      maxRetries: 1,
    }));

    await act(async () => {
      await result.current.checkApiHealth();
    });

    expect(result.current.retryCount).toBeGreaterThan(0);
  });

  it('provides manual retry function', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('Network error'))
                   .mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useOfflineDetection());

    // First call fails
    await act(async () => {
      await result.current.checkApiHealth();
    });

    expect(result.current.isApiHealthy).toBe(false);

    // Manual retry succeeds
    await act(async () => {
      const success = await result.current.retry();
      expect(success).toBe(true);
    });

    expect(result.current.isApiHealthy).toBe(true);
  });

  it('provides force refresh function', async () => {
    navigator.onLine = false;
    const { result } = renderHook(() => useOfflineDetection());

    expect(result.current.isOnline).toBe(false);

    act(() => {
      navigator.onLine = true;
      result.current.forceRefresh();
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('calculates connection quality correctly', () => {
    const testCases = [
      { connectionType: '4g', expected: 'excellent' },
      { connectionType: 'wifi', expected: 'excellent' },
      { connectionType: '3g', expected: 'good' },
      { connectionType: '2g', expected: 'poor' },
      { connectionType: 'slow-2g', expected: 'poor' },
    ];

    testCases.forEach(({ connectionType, expected }) => {
      (navigator as any).connection.effectiveType = connectionType;
      
      const { result } = renderHook(() => useOfflineDetection());
      
      expect(result.current.connectionQuality).toBe(expected);
    });
  });

  it('calculates time since online when offline', async () => {
    const { result } = renderHook(() => useOfflineDetection());

    // Go offline
    act(() => {
      navigator.onLine = false;
      window.dispatchEvent(new Event('offline'));
    });

    // Wait a bit
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.timeSinceOnline).toBeGreaterThan(0);
  });

  it('returns null for time since online when online', () => {
    const { result } = renderHook(() => useOfflineDetection());

    expect(result.current.timeSinceOnline).toBeNull();
  });

  it('calls API health callbacks on state changes', async () => {
    const onApiHealthy = vi.fn();
    const onApiUnhealthy = vi.fn();

    const { result } = renderHook(() => useOfflineDetection({
      onApiHealthy,
      onApiUnhealthy,
      pingInterval: 100,
    }));

    // Make API unhealthy
    (fetch as any).mockRejectedValue(new Error('Network error'));

    await act(async () => {
      await result.current.checkApiHealth();
    });

    expect(onApiUnhealthy).toHaveBeenCalled();

    // Make API healthy again
    (fetch as any).mockResolvedValue({ ok: true });

    await act(async () => {
      await result.current.checkApiHealth();
    });

    expect(onApiHealthy).toHaveBeenCalled();
  });

  it('handles connection change events', () => {
    const { result } = renderHook(() => useOfflineDetection());

    act(() => {
      (navigator as any).connection.effectiveType = '2g';
      (navigator as any).connection.addEventListener.mock.calls[0][1]();
    });

    expect(result.current.connectionType).toBe('2g');
    expect(result.current.connectionQuality).toBe('poor');
  });

  it('cleans up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useOfflineDetection());

    const removeEventListener = vi.spyOn(window, 'removeEventListener');
    const connectionRemoveListener = (navigator as any).connection.removeEventListener;

    unmount();

    expect(removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    expect(connectionRemoveListener).toHaveBeenCalled();
  });

  it('aborts pending requests on unmount', () => {
    const abortController = {
      abort: vi.fn(),
      signal: {} as AbortSignal,
    };
    vi.spyOn(window, 'AbortController').mockImplementation(() => abortController as any);

    const { unmount } = renderHook(() => useOfflineDetection());

    unmount();

    expect(abortController.abort).toHaveBeenCalled();
  });

  it('handles multiple endpoints for health checks', async () => {
    const endpoints = ['/endpoint1', '/endpoint2', '/endpoint3'];
    
    (fetch as any).mockImplementation((url: string) => {
      if (url === '/endpoint1') {
        return Promise.reject(new Error('Failed'));
      }
      return Promise.resolve({ ok: true });
    });

    const { result } = renderHook(() => useOfflineDetection({ endpoints }));

    await act(async () => {
      const isHealthy = await result.current.checkApiHealth();
      expect(isHealthy).toBe(true); // Should be healthy if at least one endpoint works
    });

    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('considers API unhealthy if all endpoints fail', async () => {
    const endpoints = ['/endpoint1', '/endpoint2'];
    
    (fetch as any).mockRejectedValue(new Error('All failed'));

    const { result } = renderHook(() => useOfflineDetection({ endpoints }));

    await act(async () => {
      const isHealthy = await result.current.checkApiHealth();
      expect(isHealthy).toBe(false);
    });

    expect(result.current.isApiHealthy).toBe(false);
  });
});