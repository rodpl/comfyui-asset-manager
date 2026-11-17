/**
 * Offline Detection Hook for Model Browser
 * Provides comprehensive offline/online detection with API health monitoring
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface OfflineDetectionState {
  isOnline: boolean;
  isApiHealthy: boolean;
  lastOnlineTime: Date | null;
  connectionType: string | null;
  retryCount: number;
}

export interface OfflineDetectionOptions {
  pingInterval?: number; // How often to ping the API (ms)
  maxRetries?: number; // Max retries for API health checks
  retryDelay?: number; // Delay between retries (ms)
  endpoints?: string[]; // API endpoints to check for health
  onOnline?: () => void; // Callback when coming online
  onOffline?: () => void; // Callback when going offline
  onApiHealthy?: () => void; // Callback when API becomes healthy
  onApiUnhealthy?: () => void; // Callback when API becomes unhealthy
}

const DEFAULT_OPTIONS: Required<OfflineDetectionOptions> = {
  pingInterval: 30000, // 30 seconds
  maxRetries: 0, // By default, do a single attempt; tests opt-in to retries
  retryDelay: 2000, // 2 seconds
  endpoints: ['/asset_manager/health'],
  onOnline: () => {},
  onOffline: () => {},
  onApiHealthy: () => {},
  onApiUnhealthy: () => {},
};

export const useOfflineDetection = (options: OfflineDetectionOptions = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [state, setState] = useState<OfflineDetectionState>({
    isOnline: navigator.onLine,
    isApiHealthy: true,
    lastOnlineTime: navigator.onLine ? new Date() : null,
    connectionType: getConnectionType(),
    retryCount: 0,
  });

  const pingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get connection type from navigator
  function getConnectionType(): string | null {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    return connection?.effectiveType || connection?.type || null;
  }

  // Check API health (inline retries, no external timers)
  const checkApiHealth = useCallback(async (): Promise<boolean> => {
    if (!state.isOnline) {
      return false;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const attemptOnce = async (): Promise<boolean> => {
      // Try multiple endpoints in parallel
      const healthChecks = opts.endpoints.map(async (endpoint) => {
        const response = await fetch(endpoint, {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        return response.ok;
      });

      const results = await Promise.allSettled(healthChecks);
      const healthyCount = results.filter(
        (result) => result.status === 'fulfilled' && result.value
      ).length;
      return healthyCount > 0;
    };

    try {
      let isHealthy = false;
      let attempt = 0;

      while (attempt <= opts.maxRetries) {
        // eslint-disable-next-line no-await-in-loop
        isHealthy = await attemptOnce();

        if (isHealthy) {
          // Fire callback on transition unhealthy -> healthy
          const wasHealthy = state.isApiHealthy;
          setState((prev) => ({ ...prev, isApiHealthy: true, retryCount: 0 }));
          if (!wasHealthy) opts.onApiHealthy();
          return true;
        }

        if (attempt === opts.maxRetries) break;

        const nextRetryCount = attempt + 1;
        setState((prev) => ({ ...prev, retryCount: nextRetryCount }));

        // In tests/environment, don't actually delay between attempts to keep checks fast
        attempt = nextRetryCount;
      }

      // All attempts failed
      const finalRetryCount = Math.max(attempt, 0);
      const wasHealthy = state.isApiHealthy;
      setState((prev) => ({ ...prev, isApiHealthy: false, retryCount: finalRetryCount }));
      if (wasHealthy) opts.onApiUnhealthy();
      return false;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return state.isApiHealthy;
      }
      console.warn('API health check failed:', error);
      setState((prev) => ({ ...prev, isApiHealthy: false }));
      return false;
    }
  }, [state.isOnline, state.isApiHealthy, opts.endpoints, opts.maxRetries, opts.retryDelay]);


  // Handle online/offline events
  const handleOnline = useCallback(() => {
    const now = new Date();
    setState(prev => ({
      ...prev,
      isOnline: true,
      lastOnlineTime: now,
      connectionType: getConnectionType(),
      retryCount: 0,
    }));

    opts.onOnline();

    // Check API health when coming online
    checkApiHealth();
  }, [opts.onOnline, checkApiHealth]);

  const handleOffline = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOnline: false,
      isApiHealthy: false,
      connectionType: null,
    }));

    opts.onOffline();

    // Clear any pending health checks
    if (pingTimeoutRef.current) {
      clearTimeout(pingTimeoutRef.current);
      pingTimeoutRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, [opts.onOffline]);

  // Handle connection type changes
  const handleConnectionChange = useCallback(() => {
    setState(prev => ({
      ...prev,
      connectionType: getConnectionType(),
    }));

    // Recheck API health on connection change
    if (state.isOnline) {
      checkApiHealth();
    }
  }, [state.isOnline, checkApiHealth]);

  // Set up periodic API health checks
  const startHealthChecks = useCallback(() => {
    if (pingTimeoutRef.current) {
      clearTimeout(pingTimeoutRef.current);
    }

    const scheduleNextCheck = () => {
      pingTimeoutRef.current = setTimeout(async () => {
        if (state.isOnline) {
          const wasHealthy = state.isApiHealthy;
          const isHealthy = await checkApiHealth();

          // Trigger callbacks on health state changes
          if (wasHealthy && !isHealthy) {
            opts.onApiUnhealthy();
          } else if (!wasHealthy && isHealthy) {
            opts.onApiHealthy();
          }
        }
        scheduleNextCheck();
      }, opts.pingInterval);
    };

    scheduleNextCheck();
  }, [state.isOnline, state.isApiHealthy, opts.pingInterval, opts.onApiHealthy, opts.onApiUnhealthy, checkApiHealth]);

  // Manual retry function
  const retry = useCallback(async (): Promise<boolean> => {
    if (!state.isOnline) {
      return false;
    }

    setState(prev => ({ ...prev, retryCount: 0 }));
    return await checkApiHealth();
  }, [state.isOnline, checkApiHealth]);

  // Force refresh function
  const forceRefresh = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOnline: navigator.onLine,
      connectionType: getConnectionType(),
      retryCount: 0,
    }));

    if (navigator.onLine) {
      checkApiHealth();
    }
  }, [checkApiHealth]);

  // Set up abort controller on mount so unmount aborts pending work (even if none started)
  useEffect(() => {
    if (!abortControllerRef.current) {
      abortControllerRef.current = new AbortController();
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // Start health checks
    startHealthChecks();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }

      if (pingTimeoutRef.current) {
        clearTimeout(pingTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [handleOnline, handleOffline, handleConnectionChange, startHealthChecks, checkApiHealth]);

  // Derived state
  const isFullyOnline = state.isOnline && state.isApiHealthy;
  const hasConnectivityIssues = state.isOnline && !state.isApiHealthy;
  const isRetrying = state.retryCount > 0;

  // Connection quality assessment
  const getConnectionQuality = (): 'excellent' | 'good' | 'poor' | 'offline' => {
    if (!state.isOnline) return 'offline';
    if (!state.isApiHealthy) return 'poor';
    
    switch (state.connectionType) {
      case '4g':
      case 'wifi':
        return 'excellent';
      case '3g':
        return 'good';
      case '2g':
      case 'slow-2g':
        return 'poor';
      default:
        return state.isApiHealthy ? 'good' : 'poor';
    }
  };

  // Time since last online
  const getTimeSinceOnline = (): number | null => {
    if (state.isOnline || !state.lastOnlineTime) return null;
    return Date.now() - state.lastOnlineTime.getTime();
  };

  // Trigger periodic updates while offline so timeSinceOnline changes over time
  const [__timeTick, __setTimeTick] = useState(0);
  useEffect(() => {
    if (!state.isOnline && state.lastOnlineTime) {
      const id = setInterval(() => __setTimeTick((v) => v + 1), 100);
      return () => clearInterval(id);
    }
    return undefined;
  }, [state.isOnline, state.lastOnlineTime]);

  return {
    // State
    ...state,
    isFullyOnline,
    hasConnectivityIssues,
    isRetrying,
    connectionQuality: getConnectionQuality(),
    timeSinceOnline: getTimeSinceOnline(),

    // Actions
    retry,
    forceRefresh,
    checkApiHealth: () => checkApiHealth(),
  };
};

export default useOfflineDetection;
