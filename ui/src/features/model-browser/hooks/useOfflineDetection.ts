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
  maxRetries: 3,
  retryDelay: 2000, // 2 seconds
  endpoints: ['/asset_manager/health', '/asset_manager/external/models'],
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

  // Check API health
  const checkApiHealth = useCallback(async (retryCount = 0): Promise<boolean> => {
    if (!state.isOnline) {
      return false;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      // Try multiple endpoints
      const healthChecks = opts.endpoints.map(async (endpoint) => {
        const response = await fetch(endpoint, {
          method: 'HEAD',
          signal: abortControllerRef.current!.signal,
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

      // Consider API healthy if at least one endpoint responds
      const isHealthy = healthyCount > 0;

      setState(prev => ({
        ...prev,
        isApiHealthy: isHealthy,
        retryCount: isHealthy ? 0 : retryCount,
      }));

      return isHealthy;

    } catch (error) {
      // Handle abort errors gracefully
      if (error instanceof Error && error.name === 'AbortError') {
        return state.isApiHealthy;
      }

      console.warn('API health check failed:', error);

      // Retry logic
      if (retryCount < opts.maxRetries) {
        const nextRetryCount = retryCount + 1;
        setState(prev => ({ ...prev, retryCount: nextRetryCount }));

        retryTimeoutRef.current = setTimeout(() => {
          checkApiHealth(nextRetryCount);
        }, opts.retryDelay * Math.pow(2, retryCount)); // Exponential backoff

        return state.isApiHealthy;
      }

      setState(prev => ({
        ...prev,
        isApiHealthy: false,
        retryCount: 0,
      }));

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

    // Initial API health check
    if (navigator.onLine) {
      checkApiHealth();
    }

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