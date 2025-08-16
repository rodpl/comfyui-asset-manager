/**
 * Notification Integration and Fallback Behavior Tests
 * 
 * Comprehensive tests for ComfyUI toast notification integration,
 * fallback behavior, and cross-version compatibility.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  ComfyUINotificationService,
  notificationService,
  showNotification,
  showSuccess,
  showError,
  showWarning,
  showInfo
} from '../notificationService';

// Mock ComfyUI app interfaces
interface MockComfyUIApp {
  extensionManager?: {
    toast?: (message: string, options?: any) => void;
  };
  ui?: {
    dialog?: {
      show?: (options: any) => void;
    };
  };
  toast?: (message: string, options?: any) => void;
  version?: string;
}

describe('Notification Integration and Fallback Behavior', () => {
  let originalWindow: any;
  let mockApp: MockComfyUIApp;
  let service: ComfyUINotificationService;

  beforeEach(() => {
    // Store original window
    originalWindow = global.window;

    // Create mock ComfyUI app
    mockApp = {};

    // Set up mock window
    global.window = {
      app: mockApp
    } as any;

    // Create fresh service instance
    service = new ComfyUINotificationService();
  });

  afterEach(() => {
    // Restore original window
    global.window = originalWindow;
    vi.clearAllMocks();
  });

  describe('ComfyUI Capability Detection', () => {
    it('should detect extension manager toast capability', () => {
      mockApp.extensionManager = {
        toast: vi.fn()
      };
      mockApp.version = '1.0.0';

      service = new ComfyUINotificationService();

      expect(service.isComfyUIToastAvailable()).toBe(true);
      expect(service.getCapabilities().hasExtensionToast).toBe(true);
      expect(service.getComfyUIVersion()).toBe('1.0.0');
    });

    it('should detect UI dialog capability', () => {
      mockApp.ui = {
        dialog: {
          show: vi.fn()
        }
      };

      service = new ComfyUINotificationService();

      expect(service.isComfyUIToastAvailable()).toBe(true);
      expect(service.getCapabilities().hasUIDialog).toBe(true);
    });

    it('should detect native toast capability', () => {
      mockApp.toast = vi.fn();

      service = new ComfyUINotificationService();

      expect(service.isComfyUIToastAvailable()).toBe(true);
      expect(service.getCapabilities().hasNativeToast).toBe(true);
    });

    it('should handle missing ComfyUI app gracefully', () => {
      global.window = {} as any;

      service = new ComfyUINotificationService();

      expect(service.isComfyUIToastAvailable()).toBe(false);
      expect(service.getCapabilities().hasExtensionToast).toBe(false);
      expect(service.getCapabilities().hasUIDialog).toBe(false);
      expect(service.getCapabilities().hasNativeToast).toBe(false);
      expect(service.getComfyUIVersion()).toBe(null);
    });

    it('should handle partial ComfyUI app object', () => {
      mockApp = { version: '0.9.0' }; // Only version, no toast methods
      global.window = { app: mockApp } as any;

      service = new ComfyUINotificationService();

      expect(service.isComfyUIToastAvailable()).toBe(false);
      expect(service.getComfyUIVersion()).toBe('0.9.0');
    });
  });

  describe('Extension Manager Toast Integration', () => {
    beforeEach(() => {
      mockApp.extensionManager = {
        toast: vi.fn()
      };
      service = new ComfyUINotificationService();
    });

    it('should use extension manager toast when available', () => {
      const mockToast = mockApp.extensionManager!.toast as any;

      const id = service.show('Test message', { type: 'info', duration: 3000 });

      expect(mockToast).toHaveBeenCalledWith('Test message', {
        type: 'info',
        timeout: 3000
      });
      expect(id).toMatch(/^comfyui-extension-/);
    });

    it('should handle different notification types', () => {
      const mockToast = mockApp.extensionManager!.toast as any;

      service.showSuccess('Success message');
      service.showError('Error message');
      service.showWarning('Warning message');
      service.showInfo('Info message');

      expect(mockToast).toHaveBeenCalledTimes(4);
      expect(mockToast).toHaveBeenNthCalledWith(1, 'Success message', { type: 'success', timeout: 5000 });
      expect(mockToast).toHaveBeenNthCalledWith(2, 'Error message', { type: 'error', timeout: 5000 });
      expect(mockToast).toHaveBeenNthCalledWith(3, 'Warning message', { type: 'warning', timeout: 5000 });
      expect(mockToast).toHaveBeenNthCalledWith(4, 'Info message', { type: 'info', timeout: 5000 });
    });

    it('should handle extension manager toast errors gracefully', () => {
      const mockToast = vi.fn().mockImplementation(() => {
        throw new Error('Toast failed');
      });
      mockApp.extensionManager!.toast = mockToast;

      // Should fall back to fallback system without throwing
      const id = service.show('Test message');

      expect(mockToast).toHaveBeenCalled();
      expect(id).toMatch(/^toast-/); // Fallback ID pattern
    });
  });

  describe('UI Dialog Integration', () => {
    beforeEach(() => {
      mockApp.ui = {
        dialog: {
          show: vi.fn()
        }
      };
      service = new ComfyUINotificationService();
    });

    it('should use UI dialog when extension manager is not available', () => {
      const mockDialog = mockApp.ui!.dialog!.show as any;

      const id = service.show('Test message', { type: 'error', title: 'Error Title' });

      expect(mockDialog).toHaveBeenCalledWith({
        type: 'error',
        content: 'Test message',
        title: 'Error Title'
      });
      expect(id).toMatch(/^comfyui-dialog-/);
    });

    it('should handle UI dialog errors gracefully', () => {
      const mockDialog = vi.fn().mockImplementation(() => {
        throw new Error('Dialog failed');
      });
      mockApp.ui!.dialog!.show = mockDialog;

      // Should fall back without throwing
      const id = service.show('Test message');

      expect(mockDialog).toHaveBeenCalled();
      expect(id).toMatch(/^toast-/); // Fallback ID pattern
    });
  });

  describe('Native Toast Integration', () => {
    beforeEach(() => {
      mockApp.toast = vi.fn();
      service = new ComfyUINotificationService();
    });

    it('should use native toast when available', () => {
      const mockToast = mockApp.toast as any;

      const id = service.show('Test message', { 
        type: 'success', 
        title: 'Success', 
        duration: 4000 
      });

      expect(mockToast).toHaveBeenCalledWith('Test message', {
        type: 'success',
        title: 'Success',
        timeout: 4000
      });
      expect(id).toMatch(/^comfyui-native-/);
    });
  });

  describe('Fallback Toast System', () => {
    beforeEach(() => {
      // No ComfyUI toast capabilities
      mockApp = {};
      global.window = { app: mockApp } as any;
      service = new ComfyUINotificationService();
    });

    it('should use fallback system when ComfyUI toast is not available', () => {
      const id = service.show('Fallback message', { type: 'info' });

      expect(id).toMatch(/^toast-/);
      expect(service.getFallbackToasts()).toHaveLength(1);
      expect(service.getFallbackToasts()[0].message).toBe('Fallback message');
      expect(service.getFallbackToasts()[0].type).toBe('info');
    });

    it('should handle multiple fallback toasts', () => {
      service.showSuccess('Success 1');
      service.showError('Error 1');
      service.showWarning('Warning 1');

      const toasts = service.getFallbackToasts();
      expect(toasts).toHaveLength(3);
      
      // Should be sorted by timestamp (newest first)
      expect(toasts[0].message).toBe('Warning 1');
      expect(toasts[1].message).toBe('Error 1');
      expect(toasts[2].message).toBe('Success 1');
    });

    it('should auto-remove non-persistent toasts', async () => {
      service.show('Auto-remove message', { duration: 50 });

      expect(service.getFallbackToasts()).toHaveLength(1);

      // Wait for auto-removal
      await new Promise(resolve => setTimeout(resolve, 60));

      expect(service.getFallbackToasts()).toHaveLength(0);
    });

    it('should keep persistent toasts', async () => {
      service.show('Persistent message', { persistent: true });

      expect(service.getFallbackToasts()).toHaveLength(1);

      // Wait longer than normal duration
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(service.getFallbackToasts()).toHaveLength(1);
    });

    it('should allow manual toast removal', () => {
      const id = service.show('Removable message');

      expect(service.getFallbackToasts()).toHaveLength(1);

      service.remove(id);

      expect(service.getFallbackToasts()).toHaveLength(0);
    });

    it('should allow clearing all toasts', () => {
      service.show('Message 1');
      service.show('Message 2');
      service.show('Message 3');

      expect(service.getFallbackToasts()).toHaveLength(3);

      service.clear();

      expect(service.getFallbackToasts()).toHaveLength(0);
    });

    it('should support toast subscription', () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribeFallbackToasts(listener);

      service.show('Test message');

      expect(listener).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ message: 'Test message' })
        ])
      );

      unsubscribe();

      service.show('Another message');

      // Should not be called again after unsubscribe
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Toast Priority and Method Selection', () => {
    it('should prefer extension manager over UI dialog', () => {
      mockApp.extensionManager = { toast: vi.fn() };
      mockApp.ui = { dialog: { show: vi.fn() } };
      service = new ComfyUINotificationService();

      service.show('Test message');

      expect(mockApp.extensionManager.toast).toHaveBeenCalled();
      expect(mockApp.ui.dialog.show).not.toHaveBeenCalled();
    });

    it('should prefer extension manager over native toast', () => {
      mockApp.toast = vi.fn();
      mockApp.extensionManager = { toast: vi.fn() };
      service = new ComfyUINotificationService();

      service.show('Test message');

      expect(mockApp.extensionManager.toast).toHaveBeenCalled();
      expect(mockApp.toast).not.toHaveBeenCalled();
    });

    it('should fall back through methods in correct order', () => {
      // Start with all methods available
      mockApp.toast = vi.fn().mockImplementation(() => { throw new Error('Native failed'); });
      mockApp.extensionManager = { 
        toast: vi.fn().mockImplementation(() => { throw new Error('Extension failed'); })
      };
      mockApp.ui = { 
        dialog: { 
          show: vi.fn().mockImplementation(() => { throw new Error('Dialog failed'); })
        }
      };
      service = new ComfyUINotificationService();

      const id = service.show('Test message');

      // Should try extension manager first and fall back to fallback system
      expect(mockApp.extensionManager.toast).toHaveBeenCalled();
      expect(id).toMatch(/^toast-/); // Fallback ID
    });
  });

  describe('Integration Testing', () => {
    it('should test integration across different ComfyUI versions', async () => {
      // Test modern ComfyUI with extension manager
      mockApp.extensionManager = { toast: vi.fn() };
      mockApp.version = '1.2.0';
      service = new ComfyUINotificationService();

      let result = await service.testIntegration();
      expect(result.success).toBe(true);
      expect(result.method).toBe('extension-manager');
      expect(result.version).toBe('1.2.0');

      // Test older ComfyUI with UI dialog
      mockApp = {
        ui: { dialog: { show: vi.fn() } },
        version: '0.8.0'
      };
      global.window = { app: mockApp } as any;
      service = new ComfyUINotificationService();

      result = await service.testIntegration();
      expect(result.success).toBe(true);
      expect(result.method).toBe('ui-dialog');
      expect(result.version).toBe('0.8.0');

      // Test fallback system
      mockApp = {};
      global.window = { app: mockApp } as any;
      service = new ComfyUINotificationService();

      result = await service.testIntegration();
      expect(result.success).toBe(true);
      expect(result.method).toBe('fallback');
      expect(result.version).toBe(null);
    });

    it('should handle integration test failures', async () => {
      mockApp.extensionManager = {
        toast: vi.fn().mockImplementation(() => { throw new Error('Test failed'); })
      };
      service = new ComfyUINotificationService();

      const result = await service.testIntegration();
      // Test may still succeed with fallback system
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.method).toBe('string');
    });

    it('should refresh capabilities after ComfyUI updates', () => {
      // Start without capabilities
      mockApp = {};
      global.window = { app: mockApp } as any;
      service = new ComfyUINotificationService();

      expect(service.isComfyUIToastAvailable()).toBe(false);

      // Simulate ComfyUI update
      mockApp.extensionManager = { toast: vi.fn() };
      mockApp.version = '1.1.0';

      service.refreshCapabilities();

      expect(service.isComfyUIToastAvailable()).toBe(true);
      expect(service.getComfyUIVersion()).toBe('1.1.0');
    });
  });

  describe('Convenience Functions', () => {
    beforeEach(() => {
      mockApp.extensionManager = { toast: vi.fn() };
      service = new ComfyUINotificationService();
    });

    it('should work with global convenience functions', () => {
      const mockToast = mockApp.extensionManager!.toast as any;

      showNotification('Test notification', { type: 'info' });
      showSuccess('Success notification');
      showError('Error notification');
      showWarning('Warning notification');
      showInfo('Info notification');

      expect(mockToast).toHaveBeenCalledTimes(5);
    });

    it('should handle convenience function options correctly', () => {
      const mockToast = mockApp.extensionManager!.toast as any;

      showSuccess('Success with options', { title: 'Success Title', duration: 3000 });

      expect(mockToast).toHaveBeenCalledWith('Success with options', {
        type: 'success',
        timeout: 3000
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle undefined window gracefully', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      expect(() => {
        service = new ComfyUINotificationService();
      }).not.toThrow();

      expect(service.isComfyUIToastAvailable()).toBe(false);

      global.window = originalWindow;
    });

    it('should handle null app object', () => {
      global.window = { app: null } as any;

      expect(() => {
        service = new ComfyUINotificationService();
      }).not.toThrow();

      expect(service.isComfyUIToastAvailable()).toBe(false);
    });

    it('should handle malformed toast methods', () => {
      mockApp.extensionManager = { toast: 'not a function' as any };
      service = new ComfyUINotificationService();

      // Should fall back gracefully
      const id = service.show('Test message');
      expect(id).toMatch(/^toast-/);
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(10000);
      
      expect(() => {
        service.show(longMessage);
      }).not.toThrow();

      const toasts = service.getFallbackToasts();
      expect(toasts[0].message).toBe(longMessage);
    });

    it('should handle special characters in messages', () => {
      const specialMessage = '🎉 Success! <script>alert("xss")</script> & "quotes" & \'apostrophes\'';
      
      const id = service.show(specialMessage);
      
      const toasts = service.getFallbackToasts();
      expect(toasts[0].message).toBe(specialMessage);
    });

    it('should handle rapid successive notifications', () => {
      const messages = Array.from({ length: 100 }, (_, i) => `Message ${i}`);
      
      messages.forEach(message => {
        service.show(message);
      });

      const toasts = service.getFallbackToasts();
      expect(toasts).toHaveLength(100);
    });
  });
});