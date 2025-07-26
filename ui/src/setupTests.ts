// Import jest-dom matchers
import type { ComfyApp } from '@comfyorg/comfyui-frontend-types';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.app for ComfyUI integration testing
globalThis.window.app = {
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
