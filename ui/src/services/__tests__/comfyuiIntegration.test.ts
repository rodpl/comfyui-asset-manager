/**
 * Tests for ComfyUI Integration Service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComfyUIIntegrationService } from '../comfyuiIntegration';
import { ModelType } from '../../features/local-assets/types';

// Mock the API client
vi.mock('../api', () => ({
  apiClient: {
    trackModelUsage: vi.fn().mockResolvedValue({ success: true })
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock ComfyUI globals
const mockLiteGraph = {
  createNode: vi.fn()
};

const mockApp = {
  graph: {
    add: vi.fn(),
    setDirtyCanvas: vi.fn(),
    nodes: []
  },
  extensionManager: {
    toast: vi.fn()
  },
  ui: {
    dialog: {
      show: vi.fn()
    }
  },
  canvas: {
    canvas: { width: 800, height: 600 },
    ds: { offset: [0, 0], scale: 1 }
  }
};

describe('ComfyUIIntegrationService', () => {
  let service: ComfyUIIntegrationService;
  let mockModel: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Setup global mocks
    (global as any).window = {
      ...global.window,
      app: mockApp,
      LiteGraph: mockLiteGraph,
      localStorage: localStorageMock
    };

    service = new ComfyUIIntegrationService();
    
    mockModel = {
      id: 'test-model-1',
      name: 'Test Model',
      filePath: '/models/test-model.safetensors',
      modelType: ModelType.CHECKPOINT,
      fileSize: 1024,
      hash: 'abc123',
      folder: 'checkpoints',
      createdAt: new Date(),
      modifiedAt: new Date()
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('isComfyUIAvailable', () => {
    it('should return true when ComfyUI app and LiteGraph are available', () => {
      expect(service.isComfyUIAvailable()).toBe(true);
    });

    it('should return false when ComfyUI app is not available', () => {
      (global as any).window.app = undefined;
      expect(service.isComfyUIAvailable()).toBe(false);
    });

    it('should return false when LiteGraph is not available', () => {
      (global as any).window.LiteGraph = undefined;
      expect(service.isComfyUIAvailable()).toBe(false);
    });
  });

  describe('getCompatibleNodeTypes', () => {
    it('should return correct node types for checkpoint models', () => {
      const nodeTypes = service.getCompatibleNodeTypes(ModelType.CHECKPOINT);
      expect(nodeTypes).toEqual(['CheckpointLoaderSimple', 'CheckpointLoader']);
    });

    it('should return correct node types for LoRA models', () => {
      const nodeTypes = service.getCompatibleNodeTypes(ModelType.LORA);
      expect(nodeTypes).toEqual(['LoraLoader', 'LoraLoaderModelOnly']);
    });

    it('should return correct node types for VAE models', () => {
      const nodeTypes = service.getCompatibleNodeTypes(ModelType.VAE);
      expect(nodeTypes).toEqual(['VAELoader']);
    });

    it('should return empty array for unknown model types', () => {
      const nodeTypes = service.getCompatibleNodeTypes('unknown' as ModelType);
      expect(nodeTypes).toEqual([]);
    });
  });

  describe('addModelToWorkflow', () => {
    beforeEach(() => {
      const mockNode = {
        title: '',
        pos: [0, 0],
        widgets: [
          { name: 'ckpt_name', value: '', type: 'string' }
        ]
      };
      mockLiteGraph.createNode.mockReturnValue(mockNode);
    });

    it('should successfully add a checkpoint model to workflow', async () => {
      const result = await service.addModelToWorkflow(mockModel);
      
      expect(result).toBe(true);
      expect(mockLiteGraph.createNode).toHaveBeenCalledWith('CheckpointLoaderSimple');
      expect(mockApp.graph.add).toHaveBeenCalled();
      expect(mockApp.graph.setDirtyCanvas).toHaveBeenCalledWith(true);
    });

    it('should set correct model path in node widget', async () => {
      const mockNode = {
        title: '',
        pos: [0, 0],
        widgets: [
          { name: 'ckpt_name', value: '', type: 'string' }
        ]
      };
      mockLiteGraph.createNode.mockReturnValue(mockNode);

      await service.addModelToWorkflow(mockModel);
      
      expect(mockNode.widgets[0].value).toBe('test-model.safetensors');
      expect(mockNode.title).toBe('Load Test Model');
    });

    it('should position node at specified coordinates', async () => {
      const mockNode = {
        title: '',
        pos: [0, 0],
        widgets: [{ name: 'ckpt_name', value: '', type: 'string' }]
      };
      mockLiteGraph.createNode.mockReturnValue(mockNode);

      const position: [number, number] = [100, 200];
      await service.addModelToWorkflow(mockModel, position);
      
      expect(mockNode.pos).toEqual(position);
    });

    it('should return false when ComfyUI is not available', async () => {
      (global as any).window.app = undefined;
      
      const result = await service.addModelToWorkflow(mockModel);
      
      expect(result).toBe(false);
      expect(mockLiteGraph.createNode).not.toHaveBeenCalled();
    });

    it('should return false when no compatible nodes exist', async () => {
      const incompatibleModel = { ...mockModel, modelType: 'unknown' as ModelType };
      
      const result = await service.addModelToWorkflow(incompatibleModel);
      
      expect(result).toBe(false);
      expect(mockLiteGraph.createNode).not.toHaveBeenCalled();
    });

    it('should return false when node creation fails', async () => {
      mockLiteGraph.createNode.mockReturnValue(null);
      
      const result = await service.addModelToWorkflow(mockModel);
      
      expect(result).toBe(false);
      expect(mockApp.graph.add).not.toHaveBeenCalled();
    });
  });

  describe('setupModelDrag', () => {
    it('should set correct drag data', () => {
      const mockEvent = {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: ''
        }
      } as any;

      service.setupModelDrag(mockModel, mockEvent);

      expect(mockEvent.dataTransfer.setData).toHaveBeenCalledWith(
        'application/json',
        expect.stringContaining('"type":"comfyui-asset-manager-model"')
      );
      expect(mockEvent.dataTransfer.setData).toHaveBeenCalledWith(
        'text/plain',
        mockModel.filePath
      );
      expect(mockEvent.dataTransfer.setData).toHaveBeenCalledWith(
        'comfyui/model',
        expect.stringContaining('"type":"checkpoint"')
      );
      expect(mockEvent.dataTransfer.effectAllowed).toBe('copy');
    });

    it('should handle missing dataTransfer gracefully', () => {
      const mockEvent = {} as any;
      
      expect(() => service.setupModelDrag(mockModel, mockEvent)).not.toThrow();
    });
  });

  describe('usage tracking', () => {
    it('should track model usage and update state', async () => {
      await service.addModelToWorkflow(mockModel);
      
      const currentlyUsed = service.getCurrentlyUsedModels();
      expect(currentlyUsed).toContain(mockModel.id);
      
      const recentModels = service.getRecentModels();
      expect(recentModels).toHaveLength(1);
      expect(recentModels[0].modelId).toBe(mockModel.id);
    });

    it('should save usage history to localStorage', async () => {
      await service.addModelToWorkflow(mockModel);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'comfyui-asset-manager-usage',
        expect.any(String)
      );
    });

    it('should load usage history from localStorage', () => {
      const mockHistory = JSON.stringify([
        {
          modelId: 'test-model',
          modelPath: '/path/to/model.safetensors',
          timestamp: new Date().toISOString(),
          nodeType: 'CheckpointLoader'
        }
      ]);
      localStorageMock.getItem.mockReturnValue(mockHistory);
      
      const newService = new ComfyUIIntegrationService();
      const recentModels = newService.getRecentModels();
      
      expect(recentModels).toHaveLength(1);
      expect(recentModels[0].modelId).toBe('test-model');
    });

    it('should limit usage history to 100 records', async () => {
      // Add 101 models to exceed the limit
      for (let i = 0; i < 101; i++) {
        const model = { ...mockModel, id: `model-${i}` };
        await service.addModelToWorkflow(model);
      }
      
      const recentModels = service.getRecentModels();
      expect(recentModels.length).toBeLessThanOrEqual(100);
    });

    it('should provide usage statistics for a model', async () => {
      // Add the same model multiple times
      await service.addModelToWorkflow(mockModel);
      await service.addModelToWorkflow(mockModel);
      
      const stats = service.getModelUsageStats(mockModel.id);
      expect(stats.totalUsage).toBe(2);
      expect(stats.lastUsed).toBeInstanceOf(Date);
      expect(stats.nodeTypes).toContain('CheckpointLoaderSimple');
    });

    it('should notify usage change callbacks', async () => {
      const callback = vi.fn();
      const unsubscribe = service.onUsageChange(callback);
      
      await service.addModelToWorkflow(mockModel);
      
      expect(callback).toHaveBeenCalledWith([mockModel.id]);
      
      unsubscribe();
    });

    it('should clear usage history', () => {
      service.clearUsageHistory();
      
      expect(service.getCurrentlyUsedModels()).toHaveLength(0);
      expect(service.getRecentModels()).toHaveLength(0);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'comfyui-asset-manager-usage',
        '[]'
      );
    });
  });

  describe('notifications', () => {
    it('should show success notification when model is added', async () => {
      const mockNode = {
        title: '',
        pos: [0, 0],
        widgets: [{ name: 'ckpt_name', value: '', type: 'string' }]
      };
      mockLiteGraph.createNode.mockReturnValue(mockNode);

      await service.addModelToWorkflow(mockModel);
      
      expect(mockApp.extensionManager.toast).toHaveBeenCalledWith(
        'Added Test Model to workflow',
        { type: 'success', timeout: 3000 }
      );
    });

    it('should show error notification when ComfyUI is not available', async () => {
      (global as any).window.app = undefined;
      
      await service.addModelToWorkflow(mockModel);
      
      // Should fall back to console.log since no notification system is available
      expect(mockApp.extensionManager.toast).not.toHaveBeenCalled();
    });

    it('should fall back to UI dialog when extension toast is not available', async () => {
      const mockNode = {
        title: '',
        pos: [0, 0],
        widgets: [{ name: 'ckpt_name', value: '', type: 'string' }]
      };
      mockLiteGraph.createNode.mockReturnValue(mockNode);
      
      // Remove extension manager toast
      (global as any).window.app.extensionManager.toast = undefined;
      
      await service.addModelToWorkflow(mockModel);
      
      expect(mockApp.ui.dialog.show).toHaveBeenCalledWith({
        type: 'success',
        content: 'Added Test Model to workflow',
        title: 'Asset Manager'
      });
    });
  });
});