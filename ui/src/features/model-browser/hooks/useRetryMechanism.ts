/**
 * Retry Mechanism Hook for Model Browser
 * Provides intelligent retry logic with exponential backoff and circuit breaker pattern
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  lastError: Error | null;
  nextRetryIn: number; // milliseconds until next retry
  canRetry: boolean;
  isCircuitOpen: boolean; // Circuit breaker state
}

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number; // Initial delay in ms
  maxDelay?: number; // Maximum delay in ms
  backoffFactor?: number; // Exponential backoff multiplier
  jitter?: boolean; // Add random jitter to delays
  circuitBreakerThreshold?: number; // Failures before opening circuit
  circuitBreakerTimeout?: number; // Time to wait before trying again (ms)
  retryableErrors?: string[]; // Error types that should trigger retry
  onRetry?: (attempt: number, error: Error) => void;
  onMaxRetriesReached?: (error: Error) => void;
  onCircuitOpen?: () => void;
  onCircuitClose?: () => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffFactor: 2,
  jitter: true,
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 60000, // 1 minute
  retryableErrors: [
    'NetworkError',
    'TimeoutError',
    'Failed to fetch',
    'Load failed',
    'HTTP 429', // Rate limited
    'HTTP 502', // Bad Gateway
    'HTTP 503', // Service Unavailable
    'HTTP 504', // Gateway Timeout
    'CIVITAI_API_ERROR',
    'HUGGINGFACE_API_ERROR',
  ],
  onRetry: () => {},
  onMaxRetriesReached: () => {},
  onCircuitOpen: () => {},
  onCircuitClose: () => {},
};

export const useRetryMechanism = <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null,
    nextRetryIn: 0,
    canRetry: true,
    isCircuitOpen: false,
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Interval | null>(null);
  const circuitBreakerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const failureCountRef = useRef(0);
  const lastFailureTimeRef = useRef<Date | null>(null);

  // Calculate delay with exponential backoff and jitter
  const calculateDelay = useCallback((attempt: number): number => {
    let delay = opts.initialDelay * Math.pow(opts.backoffFactor, attempt - 1);
    delay = Math.min(delay, opts.maxDelay);

    if (opts.jitter) {
      // Add ±25% jitter
      const jitterRange = delay * 0.25;
      delay += (Math.random() - 0.5) * 2 * jitterRange;
    }

    return Math.max(delay, opts.initialDelay);
  }, [opts.initialDelay, opts.backoffFactor, opts.maxDelay, opts.jitter]);

  // Check if error is retryable
  const isRetryableError = useCallback((error: Error): boolean => {
    return opts.retryableErrors.some(retryableError =>
      error.message.includes(retryableError) || error.name.includes(retryableError)
    );
  }, [opts.retryableErrors]);

  // Open circuit breaker
  const openCircuit = useCallback(() => {
    setState(prev => ({ ...prev, isCircuitOpen: true, canRetry: false }));
    opts.onCircuitOpen();

    // Close circuit after timeout
    circuitBreakerTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, isCircuitOpen: false, canRetry: true }));
      failureCountRef.current = 0;
      opts.onCircuitClose();
    }, opts.circuitBreakerTimeout);
  }, [opts.onCircuitOpen, opts.onCircuitClose, opts.circuitBreakerTimeout]);

  // Start countdown timer
  const startCountdown = useCallback((delay: number) => {
    setState(prev => ({ ...prev, nextRetryIn: delay }));

    countdownIntervalRef.current = setInterval(() => {
      setState(prev => {
        const newTime = prev.nextRetryIn - 100;
        if (newTime <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          return { ...prev, nextRetryIn: 0 };
        }
        return { ...prev, nextRetryIn: newTime };
      });
    }, 100);
  }, []);

  // Execute operation with retry logic
  const execute = useCallback(async (): Promise<T> => {
    // Check circuit breaker
    if (state.isCircuitOpen) {
      throw new Error('Circuit breaker is open. Service temporarily unavailable.');
    }

    try {
      setState(prev => ({ ...prev, isRetrying: true, lastError: null }));
      
      const result = await operation();
      
      // Success - reset failure count and state
      failureCountRef.current = 0;
      lastFailureTimeRef.current = null;
      setState(prev => ({
        ...prev,
        isRetrying: false,
        retryCount: 0,
        lastError: null,
        nextRetryIn: 0,
        canRetry: true,
      }));

      return result;

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      setState(prev => ({ ...prev, lastError: err }));
      
      // Increment failure count
      failureCountRef.current++;
      lastFailureTimeRef.current = new Date();

      // Check if we should open circuit breaker
      if (failureCountRef.current >= opts.circuitBreakerThreshold) {
        openCircuit();
        throw err;
      }

      // Check if error is retryable and we haven't exceeded max retries
      if (!isRetryableError(err) || state.retryCount >= opts.maxRetries) {
        setState(prev => ({ 
          ...prev, 
          isRetrying: false, 
          canRetry: false 
        }));
        
        if (state.retryCount >= opts.maxRetries) {
          opts.onMaxRetriesReached(err);
        }
        
        throw err;
      }

      // Schedule retry
      const nextAttempt = state.retryCount + 1;
      const delay = calculateDelay(nextAttempt);

      setState(prev => ({
        ...prev,
        retryCount: nextAttempt,
        canRetry: nextAttempt < opts.maxRetries,
      }));

      opts.onRetry(nextAttempt, err);
      startCountdown(delay);

      return new Promise<T>((resolve, reject) => {
        retryTimeoutRef.current = setTimeout(async () => {
          try {
            const result = await execute();
            resolve(result);
          } catch (retryError) {
            reject(retryError);
          }
        }, delay);
      });
    }
  }, [
    state.isCircuitOpen,
    state.retryCount,
    operation,
    opts.maxRetries,
    opts.onRetry,
    opts.onMaxRetriesReached,
    isRetryableError,
    calculateDelay,
    openCircuit,
    startCountdown,
  ]);

  // Manual retry function
  const retry = useCallback(async (): Promise<T> => {
    // Clear any pending retries
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    // Reset state for manual retry
    setState(prev => ({
      ...prev,
      retryCount: 0,
      lastError: null,
      nextRetryIn: 0,
      canRetry: true,
      isRetrying: false,
    }));

    return execute();
  }, [execute]);

  // Reset function
  const reset = useCallback(() => {
    // Clear all timeouts and intervals
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (circuitBreakerTimeoutRef.current) {
      clearTimeout(circuitBreakerTimeoutRef.current);
      circuitBreakerTimeoutRef.current = null;
    }

    // Reset all state
    failureCountRef.current = 0;
    lastFailureTimeRef.current = null;
    setState({
      isRetrying: false,
      retryCount: 0,
      lastError: null,
      nextRetryIn: 0,
      canRetry: true,
      isCircuitOpen: false,
    });
  }, []);

  // Cancel any pending operations
  const cancel = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isRetrying: false,
      nextRetryIn: 0,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (circuitBreakerTimeoutRef.current) {
        clearTimeout(circuitBreakerTimeoutRef.current);
      }
    };
  }, []);

  // Derived state
  const isWaitingToRetry = state.nextRetryIn > 0;
  const nextRetryInSeconds = Math.ceil(state.nextRetryIn / 1000);
  const hasReachedMaxRetries = state.retryCount >= opts.maxRetries;
  const failureRate = failureCountRef.current / Math.max(state.retryCount + 1, 1);

  // Get retry status message
  const getStatusMessage = (): string => {
    if (state.isCircuitOpen) {
      return 'Service temporarily unavailable. Please try again later.';
    }
    if (state.isRetrying && !isWaitingToRetry) {
      return 'Retrying...';
    }
    if (isWaitingToRetry) {
      return `Retrying in ${nextRetryInSeconds} second${nextRetryInSeconds !== 1 ? 's' : ''}...`;
    }
    if (hasReachedMaxRetries) {
      return 'Maximum retry attempts reached.';
    }
    if (state.lastError) {
      return `Failed: ${state.lastError.message}`;
    }
    return 'Ready';
  };

  return {
    // State
    ...state,
    isWaitingToRetry,
    nextRetryInSeconds,
    hasReachedMaxRetries,
    failureRate,
    statusMessage: getStatusMessage(),
    
    // Actions
    execute,
    retry,
    reset,
    cancel,
    
    // Metadata
    totalFailures: failureCountRef.current,
    lastFailureTime: lastFailureTimeRef.current,
  };
};

export default useRetryMechanism;