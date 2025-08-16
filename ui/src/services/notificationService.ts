/**
 * ComfyUI Toast Notification Service
 * Integrates with ComfyUI's native toast system with fallback support
 */

export type NotificationType = 'info' | 'success' | 'error' | 'warning';

// ComfyUI window interface extension (uses existing interface from main.tsx)
// Note: Global Window interface is declared in main.tsx

export interface NotificationOptions {
  type?: NotificationType;
  title?: string;
  duration?: number;
  persistent?: boolean;
}

export interface ToastNotification {
  id: string;
  message: string;
  type: NotificationType;
  title?: string;
  duration: number;
  timestamp: number;
}

// Fallback toast manager for when ComfyUI toast is not available
class FallbackToastManager {
  private toasts: Map<string, ToastNotification> = new Map();
  private listeners: Set<(toasts: ToastNotification[]) => void> = new Set();
  private nextId = 1;

  public show(message: string, options: NotificationOptions = {}): string {
    const id = `toast-${this.nextId++}`;
    const toast: ToastNotification = {
      id,
      message,
      type: options.type || 'info',
      title: options.title,
      duration: options.persistent ? 0 : options.duration || 5000,
      timestamp: Date.now(),
    };

    this.toasts.set(id, toast);
    this.notifyListeners();

    // Auto-remove non-persistent toasts
    if (!options.persistent && toast.duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, toast.duration);
    }

    return id;
  }

  public remove(id: string): void {
    if (this.toasts.delete(id)) {
      this.notifyListeners();
    }
  }

  public clear(): void {
    this.toasts.clear();
    this.notifyListeners();
  }

  public getToasts(): ToastNotification[] {
    return Array.from(this.toasts.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  public subscribe(listener: (toasts: ToastNotification[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const toasts = this.getToasts();
    this.listeners.forEach((listener) => listener(toasts));
  }
}

/**
 * ComfyUI Toast Notification Service
 * Provides unified interface for showing notifications with ComfyUI integration
 */
export class ComfyUINotificationService {
  private fallbackManager = new FallbackToastManager();
  private comfyUIVersion: string | null = null;
  private capabilities: {
    hasExtensionToast: boolean;
    hasUIDialog: boolean;
    hasNativeToast: boolean;
  } = {
    hasExtensionToast: false,
    hasUIDialog: false,
    hasNativeToast: false,
  };

  constructor() {
    this.detectComfyUICapabilities();
  }

  /**
   * Detect available ComfyUI toast/notification capabilities
   */
  private detectComfyUICapabilities(): void {
    try {
      // Check for ComfyUI app object
      if (typeof window !== 'undefined' && window.app) {
        // Check for extension manager toast (newer ComfyUI versions)
        this.capabilities.hasExtensionToast = !!window.app.extensionManager?.toast;

        // Check for UI dialog system (older ComfyUI versions)
        this.capabilities.hasUIDialog = !!window.app.ui?.dialog?.show;

        // Check for native toast system (future ComfyUI versions)
        this.capabilities.hasNativeToast = !!window.app.toast;

        // Try to detect ComfyUI version if available
        this.comfyUIVersion = window.app.version || null;

        console.log('[NotificationService] ComfyUI capabilities detected:', {
          version: this.comfyUIVersion,
          capabilities: this.capabilities,
        });
      } else {
        console.log('[NotificationService] ComfyUI app not available, using fallback');
      }
    } catch (error) {
      console.warn('[NotificationService] Error detecting ComfyUI capabilities:', error);
    }
  }

  /**
   * Check if ComfyUI toast system is available
   */
  public isComfyUIToastAvailable(): boolean {
    return (
      this.capabilities.hasExtensionToast ||
      this.capabilities.hasUIDialog ||
      this.capabilities.hasNativeToast
    );
  }

  /**
   * Get ComfyUI version information
   */
  public getComfyUIVersion(): string | null {
    return this.comfyUIVersion;
  }

  /**
   * Get detected capabilities
   */
  public getCapabilities(): typeof this.capabilities {
    return { ...this.capabilities };
  }

  /**
   * Show notification using best available method
   */
  public show(message: string, options: NotificationOptions = {}): string {
    const type = options.type || 'info';
    const title = options.title;
    const duration = options.duration || 5000;

    try {
      // Try ComfyUI extension manager toast first (most modern)
      if (this.capabilities.hasExtensionToast && window.app?.extensionManager?.toast) {
        window.app.extensionManager.toast(message, {
          type,
          timeout: duration,
        });
        return `comfyui-extension-${Date.now()}`;
      }

      // Try native ComfyUI toast (future versions)
      if (this.capabilities.hasNativeToast && window.app?.toast) {
        window.app.toast(message, {
          type,
          title,
          timeout: duration,
        });
        return `comfyui-native-${Date.now()}`;
      }

      // Try ComfyUI UI dialog system (older versions)
      if (this.capabilities.hasUIDialog && window.app?.ui?.dialog?.show) {
        window.app.ui.dialog.show({
          type,
          content: message,
          title,
        });
        return `comfyui-dialog-${Date.now()}`;
      }

      // Fallback to our custom toast system
      console.log('[NotificationService] Using fallback toast system');
      return this.fallbackManager.show(message, options);
    } catch (error) {
      console.error('[NotificationService] Error showing ComfyUI toast, using fallback:', error);
      return this.fallbackManager.show(message, options);
    }
  }

  /**
   * Show success notification
   */
  public showSuccess(message: string, options: Omit<NotificationOptions, 'type'> = {}): string {
    return this.show(message, { ...options, type: 'success' });
  }

  /**
   * Show error notification
   */
  public showError(message: string, options: Omit<NotificationOptions, 'type'> = {}): string {
    return this.show(message, { ...options, type: 'error' });
  }

  /**
   * Show warning notification
   */
  public showWarning(message: string, options: Omit<NotificationOptions, 'type'> = {}): string {
    return this.show(message, { ...options, type: 'warning' });
  }

  /**
   * Show info notification
   */
  public showInfo(message: string, options: Omit<NotificationOptions, 'type'> = {}): string {
    return this.show(message, { ...options, type: 'info' });
  }

  /**
   * Remove notification (only works with fallback system)
   */
  public remove(id: string): void {
    if (id.startsWith('toast-')) {
      this.fallbackManager.remove(id);
    }
    // ComfyUI native toasts are auto-managed, can't be manually removed
  }

  /**
   * Clear all notifications (only works with fallback system)
   */
  public clear(): void {
    this.fallbackManager.clear();
  }

  /**
   * Get current fallback toasts (for rendering)
   */
  public getFallbackToasts(): ToastNotification[] {
    return this.fallbackManager.getToasts();
  }

  /**
   * Subscribe to fallback toast changes
   */
  public subscribeFallbackToasts(listener: (toasts: ToastNotification[]) => void): () => void {
    return this.fallbackManager.subscribe(listener);
  }

  /**
   * Test notification integration across different ComfyUI versions
   */
  public async testIntegration(): Promise<{
    success: boolean;
    method: string;
    capabilities: {
      hasExtensionToast: boolean;
      hasUIDialog: boolean;
      hasNativeToast: boolean;
    };
    version: string | null;
  }> {
    const testMessage = 'ComfyUI Toast Integration Test';

    try {
      const id = this.show(testMessage, {
        type: 'info',
        title: 'Integration Test',
        duration: 2000,
      });

      let method = 'fallback';
      if (id.startsWith('comfyui-extension-')) method = 'extension-manager';
      else if (id.startsWith('comfyui-native-')) method = 'native-toast';
      else if (id.startsWith('comfyui-dialog-')) method = 'ui-dialog';

      return {
        success: true,
        method,
        capabilities: this.capabilities,
        version: this.comfyUIVersion,
      };
    } catch (error) {
      return {
        success: false,
        method: 'error',
        capabilities: this.capabilities,
        version: this.comfyUIVersion,
      };
    }
  }

  /**
   * Re-detect ComfyUI capabilities (useful after ComfyUI updates)
   */
  public refreshCapabilities(): void {
    this.detectComfyUICapabilities();
  }
}

// Create singleton instance
export const notificationService = new ComfyUINotificationService();

// Export convenience functions
export const showNotification = (message: string, options?: NotificationOptions) =>
  notificationService.show(message, options);

export const showSuccess = (message: string, options?: Omit<NotificationOptions, 'type'>) =>
  notificationService.showSuccess(message, options);

export const showError = (message: string, options?: Omit<NotificationOptions, 'type'>) =>
  notificationService.showError(message, options);

export const showWarning = (message: string, options?: Omit<NotificationOptions, 'type'>) =>
  notificationService.showWarning(message, options);

export const showInfo = (message: string, options?: Omit<NotificationOptions, 'type'>) =>
  notificationService.showInfo(message, options);
