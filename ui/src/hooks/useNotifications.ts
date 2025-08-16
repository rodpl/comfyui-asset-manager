/**
 * React hook for ComfyUI toast notifications
 * Provides easy access to notification service from React components
 */

import { useEffect, useState, useCallback } from 'react';
import {
  notificationService,
  NotificationOptions,
  ToastNotification,
} from '../services/notificationService';

export interface UseNotificationsReturn {
  // Notification methods
  show: (message: string, options?: NotificationOptions) => string;
  showSuccess: (message: string, options?: Omit<NotificationOptions, 'type'>) => string;
  showError: (message: string, options?: Omit<NotificationOptions, 'type'>) => string;
  showWarning: (message: string, options?: Omit<NotificationOptions, 'type'>) => string;
  showInfo: (message: string, options?: Omit<NotificationOptions, 'type'>) => string;

  // Management methods
  remove: (id: string) => void;
  clear: () => void;

  // State and capabilities
  fallbackToasts: ToastNotification[];
  isComfyUIAvailable: boolean;
  capabilities: {
    hasExtensionToast: boolean;
    hasUIDialog: boolean;
    hasNativeToast: boolean;
  };
  comfyUIVersion: string | null;

  // Testing
  testIntegration: () => Promise<{
    success: boolean;
    method: string;
    capabilities: unknown;
    version: string | null;
  }>;
}

/**
 * Hook for using ComfyUI toast notifications
 */
export const useNotifications = (): UseNotificationsReturn => {
  const [fallbackToasts, setFallbackToasts] = useState<ToastNotification[]>([]);
  const [isComfyUIAvailable, setIsComfyUIAvailable] = useState(false);
  const [capabilities, setCapabilities] = useState(notificationService.getCapabilities());
  const [comfyUIVersion, setComfyUIVersion] = useState<string | null>(null);

  // Update state when service capabilities change
  const refreshState = useCallback(() => {
    setIsComfyUIAvailable(notificationService.isComfyUIToastAvailable());
    setCapabilities(notificationService.getCapabilities());
    setComfyUIVersion(notificationService.getComfyUIVersion());
  }, []);

  // Subscribe to fallback toast changes
  useEffect(() => {
    const unsubscribe = notificationService.subscribeFallbackToasts(setFallbackToasts);

    // Initial state update
    refreshState();
    setFallbackToasts(notificationService.getFallbackToasts());

    return unsubscribe;
  }, [refreshState]);

  // Periodically check for ComfyUI availability (in case it loads after our component)
  useEffect(() => {
    const interval = setInterval(() => {
      const wasAvailable = isComfyUIAvailable;
      notificationService.refreshCapabilities();
      refreshState();

      // Log when ComfyUI becomes available
      const nowAvailable = notificationService.isComfyUIToastAvailable();
      if (!wasAvailable && nowAvailable) {
        console.log('[useNotifications] ComfyUI toast system became available');
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [isComfyUIAvailable, refreshState]);

  // Notification methods
  const show = useCallback((message: string, options?: NotificationOptions) => {
    return notificationService.show(message, options);
  }, []);

  const showSuccess = useCallback(
    (message: string, options?: Omit<NotificationOptions, 'type'>) => {
      return notificationService.showSuccess(message, options);
    },
    []
  );

  const showError = useCallback((message: string, options?: Omit<NotificationOptions, 'type'>) => {
    return notificationService.showError(message, options);
  }, []);

  const showWarning = useCallback(
    (message: string, options?: Omit<NotificationOptions, 'type'>) => {
      return notificationService.showWarning(message, options);
    },
    []
  );

  const showInfo = useCallback((message: string, options?: Omit<NotificationOptions, 'type'>) => {
    return notificationService.showInfo(message, options);
  }, []);

  // Management methods
  const remove = useCallback((id: string) => {
    notificationService.remove(id);
  }, []);

  const clear = useCallback(() => {
    notificationService.clear();
  }, []);

  // Testing method
  const testIntegration = useCallback(async () => {
    return notificationService.testIntegration();
  }, []);

  return {
    show,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    remove,
    clear,
    fallbackToasts,
    isComfyUIAvailable,
    capabilities,
    comfyUIVersion,
    testIntegration,
  };
};

/**
 * Hook for quick notification methods (most common use case)
 */
export const useToast = () => {
  const { showSuccess, showError, showWarning, showInfo } = useNotifications();

  return {
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
  };
};

export default useNotifications;
