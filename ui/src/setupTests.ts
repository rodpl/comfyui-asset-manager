// Import jest-dom matchers
import type { ComfyApp } from '@comfyorg/comfyui-frontend-types';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Ensure window exists in the global scope for testing
if (typeof globalThis.window === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).window = {};
}

// Mock window.app for ComfyUI integration testing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis.window as any).app = {
  graph: {
    _nodes: [],
    setDirtyCanvas: vi.fn(),
    clear: vi.fn(),
  },
  api: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    queuePrompt: vi.fn(),
  },
  canvas: {
    centerOnNode: vi.fn(),
  },
  extensionManager: {
    registerSidebarTab: vi.fn(),
    dialog: {
      prompt: vi.fn(),
      confirm: vi.fn(),
    },
    toast: {
      add: vi.fn(),
    },
  },
  registerExtension: vi.fn(),
  queuePrompt: vi.fn(),
} as unknown as ComfyApp;
