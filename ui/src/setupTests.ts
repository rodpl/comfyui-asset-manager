// Import jest-dom matchers
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.app for ComfyUI integration testing
global.window.app = {
  graph: {
    _nodes: []
  },
  api: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  },
  canvas: {
    centerOnNode: vi.fn()
  }
};

