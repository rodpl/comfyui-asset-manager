/**
 * Tests for ComfyUI Notification Service
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ComfyUINotificationService } from '../notificationService';

// Mock window.app
const mockApp = {
  extensionManager: {
    toast: vi.fn(),
  },
  ui: {
    dialog: {
      show: vi.fn(),
    },
  },
  version: '1.0.0',
};

describe('ComfyUINotificationService', () => {
  let service: ComfyUINotificationService;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock window object
    Object.defineProperty(window, 'app', {
      value: mockApp,
      writable: true,
    });

    service = new ComfyUINotificationService();
  });

  afterEach(() => {
    // Clean up
    (window as any).app = undefined;
  });

  describe('capability detection', () => {
    it('should detect ComfyUI extension manager toast capability', () => {
      const capabilities = service.getCapabilities();
      expect(capabilities.hasExtensionToast).toBe(true);
      expect(capabilities.hasUIDialog).toBe(true);
      expect(capabilities.hasNativeToast).toBe(false);
    });

    it('should detect ComfyUI version', () => {
      expect(service.getComfyUIVersion()).toBe('1.0.0');
    });

    it('should report ComfyUI as available', () => {
      expect(service.isComfyUIToastAvailable()).toBe(true);
    });
  });

  describe('notification methods', () => {
    it('should use ComfyUI extension manager toast when available', () => {
      const id = service.show('Test message', { type: 'success' });

      expect(mockApp.extensionManager.toast).toHaveBeenCalledWith('Test message', {
        type: 'success',
        timeout: 5000,
      });
      expect(id).toMatch(/^comfyui-extension-/);
    });

    it('should use UI dialog as fallback when extension manager not available', () => {
      // Remove extension manager
      delete (mockApp as any).extensionManager;
      service.refreshCapabilities();

      const id = service.show('Test message', { type: 'error', title: 'Error' });

      expect(mockApp.ui.dialog.show).toHaveBeenCalledWith({
        type: 'error',
        content: 'Test message',
        title: 'Error',
      });
      expect(id).toMatch(/^comfyui-dialog-/);
    });

    it('should use fallback toast when ComfyUI not available', () => {
      // Remove ComfyUI app
      (window as any).app = undefined;
      service.refreshCapabilities();

      const id = service.show('Test message', { type: 'info' });

      expect(id).toMatch(/^toast-/);
      expect(service.getFallbackToasts()).toHaveLength(1);
      expect(service.getFallbackToasts()[0].message).toBe('Test message');
    });

    it('should provide convenience methods', () => {
      // Reset to ensure extension manager is available
      (window as any).app = mockApp;
      service.refreshCapabilities();

      service.showSuccess('Success message');
      expect(mockApp.extensionManager.toast).toHaveBeenCalledWith('Success message', {
        type: 'success',
        timeout: 5000,
      });

      service.showError('Error message');
      expect(mockApp.extensionManager.toast).toHaveBeenCalledWith('Error message', {
        type: 'error',
        timeout: 5000,
      });

      service.showWarning('Warning message');
      expect(mockApp.extensionManager.toast).toHaveBeenCalledWith('Warning message', {
        type: 'warning',
        timeout: 5000,
      });

      service.showInfo('Info message');
      expect(mockApp.extensionManager.toast).toHaveBeenCalledWith('Info message', {
        type: 'info',
        timeout: 5000,
      });
    });
  });

  describe('fallback toast management', () => {
    beforeEach(() => {
      // Remove ComfyUI app to force fallback
      (window as any).app = undefined;
      service.refreshCapabilities();
    });

    it('should manage fallback toasts', () => {
      const id1 = service.show('Message 1');
      service.show('Message 2');

      const toasts = service.getFallbackToasts();
      expect(toasts).toHaveLength(2);
      expect(toasts[0].message).toBe('Message 2'); // Most recent first
      expect(toasts[1].message).toBe('Message 1');

      service.remove(id1);
      expect(service.getFallbackToasts()).toHaveLength(1);
      expect(service.getFallbackToasts()[0].message).toBe('Message 2');

      service.clear();
      expect(service.getFallbackToasts()).toHaveLength(0);
    });

    it('should notify subscribers of toast changes', () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribeFallbackToasts(listener);

      service.show('Test message');
      expect(listener).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ message: 'Test message' })])
      );

      unsubscribe();
      service.show('Another message');
      expect(listener).toHaveBeenCalledTimes(1); // Should not be called after unsubscribe
    });
  });

  describe('integration testing', () => {
    it('should test integration successfully', async () => {
      const result = await service.testIntegration();

      expect(result.success).toBe(true);
      expect(result.method).toBe('ui-dialog');
      expect(result.capabilities).toEqual(service.getCapabilities());
      expect(result.version).toBe('1.0.0');
    });

    it('should handle integration test errors gracefully', async () => {
      // Reset to ensure extension manager is available
      (window as any).app = mockApp;
      service.refreshCapabilities();

      // Make toast method throw error
      mockApp.extensionManager.toast.mockImplementation(() => {
        throw new Error('Toast error');
      });

      const result = await service.testIntegration();

      expect(result.success).toBe(true); // Should still succeed with fallback
      expect(result.method).toBe('fallback');
    });
  });

  describe('error handling', () => {
    it('should handle ComfyUI toast errors gracefully', () => {
      // Reset to ensure extension manager is available
      (window as any).app = mockApp;
      service.refreshCapabilities();

      mockApp.extensionManager.toast.mockImplementation(() => {
        throw new Error('ComfyUI error');
      });

      const id = service.show('Test message');

      // Should fall back to internal toast system
      expect(id).toMatch(/^toast-/);
      expect(service.getFallbackToasts()).toHaveLength(1);
    });

    it('should handle missing ComfyUI gracefully', () => {
      (window as any).app = undefined;
      service.refreshCapabilities();

      expect(service.isComfyUIToastAvailable()).toBe(false);
      expect(service.getComfyUIVersion()).toBe(null);

      const capabilities = service.getCapabilities();
      expect(capabilities.hasExtensionToast).toBe(false);
      expect(capabilities.hasUIDialog).toBe(false);
      expect(capabilities.hasNativeToast).toBe(false);
    });
  });
});
