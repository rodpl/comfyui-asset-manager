/**
 * Tests for useRetryMechanism hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import useRetryMechanism from '../useRetryMechanism';

describe('useRetryMechanism', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('executes operation successfully on first try', async () => {
    const operation = vi.fn().mockResolvedValue('success');
    const { result } = renderHook(() => useRetryMechanism(operation));

    let operationResult: string;
    await act(async () => {
      operationResult = await result.current.execute();
    });

    expect(operationResult!).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
    expect(result.current.retryCount).toBe(0);
    expect(result.current.isRetrying).toBe(false);
  });

  it('retries on retryable errors', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockResolvedValue('success');

    const { result } = renderHook(() => useRetryMechanism(operation, {
      initialDelay: 100,
    }));

    const executePromise = act(async () => {
      return result.current.execute();
    });

    // Should be retrying
    expect(result.current.isRetrying).toBe(true);
    expect(result.current.retryCount).toBe(1);

    // Advance timers to trigger retry
    act(() => {
      vi.advanceTimersByTime(100);
    });

    const operationResult = await executePromise;

    expect(operationResult).toBe('success');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('does not retry on non-retryable errors', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Syntax error'));
    const { result } = renderHook(() => useRetryMechanism(operation));

    await expect(act(async () => {
      await result.current.execute();
    })).rejects.toThrow('Syntax error');

    expect(operation).toHaveBeenCalledTimes(1);
    expect(result.current.canRetry).toBe(false);
  });

  it('stops retrying after max attempts', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('NetworkError'));
    const onMaxRetriesReached = vi.fn();

    const { result } = renderHook(() => useRetryMechanism(operation, {
      maxRetries: 2,
      initialDelay: 100,
      onMaxRetriesReached,
    }));

    await expect(act(async () => {
      const executePromise = result.current.execute();
      
      // Advance through all retries
      act(() => {
        vi.advanceTimersByTime(100); // First retry
      });
      
      act(() => {
        vi.advanceTimersByTime(200); // Second retry (exponential backoff)
      });

      await executePromise;
    })).rejects.toThrow('NetworkError');

    expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    expect(onMaxRetriesReached).toHaveBeenCalledWith(expect.any(Error));
    expect(result.current.hasReachedMaxRetries).toBe(true);
  });

  it('uses exponential backoff for retry delays', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('NetworkError'))
      .mockRejectedValueOnce(new Error('NetworkError'))
      .mockResolvedValue('success');

    const { result } = renderHook(() => useRetryMechanism(operation, {
      initialDelay: 100,
      backoffFactor: 2,
    }));

    const executePromise = act(async () => {
      return result.current.execute();
    });

    // First retry after 100ms
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Second retry after 200ms (100 * 2)
    act(() => {
      vi.advanceTimersByTime(200);
    });

    const operationResult = await executePromise;

    expect(operationResult).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('adds jitter to retry delays when enabled', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('NetworkError'))
      .mockResolvedValue('success');

    // Mock Math.random to return a predictable value
    const originalRandom = Math.random;
    Math.random = vi.fn().mockReturnValue(0.5);

    const { result } = renderHook(() => useRetryMechanism(operation, {
      initialDelay: 100,
      jitter: true,
    }));

    const executePromise = act(async () => {
      return result.current.execute();
    });

    // With jitter, delay should be modified
    act(() => {
      vi.advanceTimersByTime(100); // Base delay
    });

    await executePromise;

    Math.random = originalRandom;
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('respects maximum delay limit', async () => {
    const operation = vi.fn()
      .mockRejectedValue(new Error('NetworkError'));

    const { result } = renderHook(() => useRetryMechanism(operation, {
      initialDelay: 1000,
      maxDelay: 2000,
      backoffFactor: 10, // Would normally create very large delays
      maxRetries: 3,
    }));

    act(async () => {
      try {
        await result.current.execute();
      } catch (error) {
        // Expected to fail
      }
    });

    // Even with high backoff factor, delay should be capped at maxDelay
    expect(result.current.nextRetryIn).toBeLessThanOrEqual(2000);
  });

  it('opens circuit breaker after threshold failures', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('NetworkError'));
    const onCircuitOpen = vi.fn();

    const { result } = renderHook(() => useRetryMechanism(operation, {
      circuitBreakerThreshold: 2,
      maxRetries: 1,
      onCircuitOpen,
    }));

    // First failure
    await expect(act(async () => {
      await result.current.execute();
    })).rejects.toThrow();

    // Second failure - should open circuit
    await expect(act(async () => {
      await result.current.execute();
    })).rejects.toThrow();

    expect(result.current.isCircuitOpen).toBe(true);
    expect(onCircuitOpen).toHaveBeenCalled();

    // Third attempt should fail immediately due to open circuit
    await expect(act(async () => {
      await result.current.execute();
    })).rejects.toThrow('Circuit breaker is open');
  });

  it('closes circuit breaker after timeout', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('NetworkError'));
    const onCircuitClose = vi.fn();

    const { result } = renderHook(() => useRetryMechanism(operation, {
      circuitBreakerThreshold: 1,
      circuitBreakerTimeout: 1000,
      maxRetries: 0,
      onCircuitClose,
    }));

    // Open circuit
    await expect(act(async () => {
      await result.current.execute();
    })).rejects.toThrow();

    expect(result.current.isCircuitOpen).toBe(true);

    // Advance time to close circuit
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.isCircuitOpen).toBe(false);
    expect(onCircuitClose).toHaveBeenCalled();
  });

  it('calls onRetry callback for each retry attempt', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('NetworkError'))
      .mockResolvedValue('success');

    const onRetry = vi.fn();

    const { result } = renderHook(() => useRetryMechanism(operation, {
      onRetry,
      initialDelay: 100,
    }));

    const executePromise = act(async () => {
      return result.current.execute();
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    await executePromise;

    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  });

  it('provides countdown timer for next retry', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('NetworkError'));

    const { result } = renderHook(() => useRetryMechanism(operation, {
      initialDelay: 1000,
      maxRetries: 1,
    }));

    act(async () => {
      try {
        await result.current.execute();
      } catch (error) {
        // Expected to fail
      }
    });

    expect(result.current.nextRetryIn).toBe(1000);
    expect(result.current.nextRetryInSeconds).toBe(1);
    expect(result.current.isWaitingToRetry).toBe(true);

    // Advance time partially
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.nextRetryIn).toBe(500);
    expect(result.current.nextRetryInSeconds).toBe(1);
  });

  it('provides manual retry function', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('NetworkError'))
      .mockResolvedValue('success');

    const { result } = renderHook(() => useRetryMechanism(operation));

    // First execution fails
    await expect(act(async () => {
      await result.current.execute();
    })).rejects.toThrow();

    expect(result.current.retryCount).toBe(1);

    // Manual retry should reset state and succeed
    let retryResult: string;
    await act(async () => {
      retryResult = await result.current.retry();
    });

    expect(retryResult!).toBe('success');
    expect(result.current.retryCount).toBe(0);
  });

  it('provides reset function', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('NetworkError'));

    const { result } = renderHook(() => useRetryMechanism(operation, {
      maxRetries: 1,
    }));

    // Execute and fail
    await expect(act(async () => {
      await result.current.execute();
    })).rejects.toThrow();

    expect(result.current.retryCount).toBeGreaterThan(0);
    expect(result.current.lastError).toBeTruthy();

    // Reset state
    act(() => {
      result.current.reset();
    });

    expect(result.current.retryCount).toBe(0);
    expect(result.current.lastError).toBeNull();
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.canRetry).toBe(true);
  });

  it('provides cancel function', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('NetworkError'));

    const { result } = renderHook(() => useRetryMechanism(operation, {
      initialDelay: 1000,
    }));

    act(async () => {
      try {
        await result.current.execute();
      } catch (error) {
        // Expected to fail
      }
    });

    expect(result.current.isWaitingToRetry).toBe(true);

    // Cancel pending retry
    act(() => {
      result.current.cancel();
    });

    expect(result.current.isRetrying).toBe(false);
    expect(result.current.nextRetryIn).toBe(0);
  });

  it('calculates failure rate correctly', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('NetworkError'))
      .mockRejectedValueOnce(new Error('NetworkError'))
      .mockResolvedValue('success');

    const { result } = renderHook(() => useRetryMechanism(operation, {
      initialDelay: 100,
    }));

    const executePromise = act(async () => {
      return result.current.execute();
    });

    // After first failure
    expect(result.current.failureRate).toBe(1); // 1 failure out of 1 attempt

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // After second failure
    expect(result.current.failureRate).toBe(1); // 2 failures out of 2 attempts

    act(() => {
      vi.advanceTimersByTime(200);
    });

    await executePromise;

    // After success
    expect(result.current.failureRate).toBe(0); // Reset on success
  });

  it('provides appropriate status messages', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Test error'));

    const { result } = renderHook(() => useRetryMechanism(operation, {
      initialDelay: 1000,
      maxRetries: 1,
    }));

    expect(result.current.statusMessage).toBe('Ready');

    act(async () => {
      try {
        await result.current.execute();
      } catch (error) {
        // Expected to fail
      }
    });

    expect(result.current.statusMessage).toContain('Retrying in');

    // Advance time to complete retry
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.statusMessage).toBe('Maximum retry attempts reached.');
    });
  });

  it('cleans up timers on unmount', () => {
    const operation = vi.fn().mockRejectedValue(new Error('NetworkError'));

    const { result, unmount } = renderHook(() => useRetryMechanism(operation, {
      initialDelay: 1000,
    }));

    act(async () => {
      try {
        await result.current.execute();
      } catch (error) {
        // Expected to fail
      }
    });

    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('handles custom retryable errors', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('CUSTOM_ERROR'));

    const { result } = renderHook(() => useRetryMechanism(operation, {
      retryableErrors: ['CUSTOM_ERROR'],
      initialDelay: 100,
    }));

    const executePromise = act(async () => {
      try {
        await result.current.execute();
      } catch (error) {
        // Expected to fail after retries
      }
    });

    expect(result.current.isRetrying).toBe(true);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    await executePromise;

    expect(operation).toHaveBeenCalledTimes(2); // Initial + 1 retry
  });
});