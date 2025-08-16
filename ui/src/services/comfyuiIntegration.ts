/**
 * ComfyUI Integration Service
 * Handles workflow integration, drag-and-drop, and usage tracking
 */

import { ModelInfo, ModelType } from '../features/local-assets/types';
import type { LiteGraphNode } from '../types/comfyui';

// ComfyUI types are imported from types/comfyui.ts

// Node type mappings for different model types
const NODE_TYPE_MAPPINGS: Record<ModelType, string[]> = {
  [ModelType.CHECKPOINT]: ['CheckpointLoaderSimple', 'CheckpointLoader'],
  [ModelType.LORA]: ['LoraLoader', 'LoraLoaderModelOnly'],
  [ModelType.VAE]: ['VAELoader'],
  [ModelType.EMBEDDING]: ['CLIPTextEncode'],
  [ModelType.CONTROLNET]: ['ControlNetLoader'],
  [ModelType.UPSCALER]: ['UpscaleModelLoader'],
};

// Widget name mappings for setting model paths
const WIDGET_NAME_MAPPINGS: Record<ModelType, string[]> = {
  [ModelType.CHECKPOINT]: ['ckpt_name', 'checkpoint_name'],
  [ModelType.LORA]: ['lora_name', 'model_name'],
  [ModelType.VAE]: ['vae_name', 'model_name'],
  [ModelType.EMBEDDING]: ['text'],
  [ModelType.CONTROLNET]: ['control_net_name', 'model_name'],
  [ModelType.UPSCALER]: ['model_name', 'upscale_model'],
};

// Usage tracking interface
interface UsageRecord {
  modelId: string;
  modelPath: string;
  timestamp: Date;
  nodeType: string;
  workflowId?: string;
}

// Drag data interface
interface ModelDragData {
  type: 'comfyui-asset-manager-model';
  model: ModelInfo;
  sourceId: string;
}

/**
 * ComfyUI Integration Service
 */
export class ComfyUIIntegrationService {
  private usageHistory: UsageRecord[] = [];
  private currentlyUsedModels: Set<string> = new Set();
  private usageCallbacks: Set<(usedModels: string[]) => void> = new Set();

  constructor() {
    this.loadUsageHistory();
    this.setupUsageTracking();
  }

  /**
   * Check if ComfyUI APIs are available
   */
  public isComfyUIAvailable(): boolean {
    return !!(window.app && window.LiteGraph);
  }

  /**
   * Get compatible node types for a model type
   */
  public getCompatibleNodeTypes(modelType: ModelType): string[] {
    return NODE_TYPE_MAPPINGS[modelType] || [];
  }

  /**
   * Add model to workflow at specified position
   */
  public async addModelToWorkflow(
    model: ModelInfo,
    position?: [number, number]
  ): Promise<boolean> {
    if (!this.isComfyUIAvailable()) {
      this.showNotification('ComfyUI is not available', 'error');
      return false;
    }

    try {
      const compatibleNodes = this.getCompatibleNodeTypes(model.modelType);
      if (compatibleNodes.length === 0) {
        this.showNotification(
          `No compatible nodes found for ${model.modelType} models`,
          'error'
        );
        return false;
      }

      // Use the first compatible node type
      const nodeType = compatibleNodes[0];
      const node = window.LiteGraph!.createNode(nodeType);

      if (!node) {
        this.showNotification(`Failed to create ${nodeType} node`, 'error');
        return false;
      }

      // Set node title
      node.title = `Load ${model.name}`;

      // Set model path in appropriate widget
      this.setModelPath(node, model, model.modelType);

      // Position the node
      if (position) {
        node.pos = position;
      } else {
        // Default position - center of canvas with some randomization
        const canvas = window.app!.canvas;
        if (canvas?.ds) {
          const centerX = -canvas.ds.offset[0] + (canvas.canvas?.width || 800) / 2 / canvas.ds.scale;
          const centerY = -canvas.ds.offset[1] + (canvas.canvas?.height || 600) / 2 / canvas.ds.scale;
          node.pos = [
            centerX + Math.random() * 100 - 50,
            centerY + Math.random() * 100 - 50
          ];
        } else {
          node.pos = [100 + Math.random() * 200, 100 + Math.random() * 200];
        }
      }

      // Add node to graph
      window.app!.graph!.add(node);

      // Trigger canvas update
      window.app!.graph!.setDirtyCanvas(true);

      // Track usage
      this.trackModelUsage(model, nodeType);

      this.showNotification(`Added ${model.name} to workflow`, 'success');
      return true;
    } catch (error) {
      console.error('Error adding model to workflow:', error);
      this.showNotification(
        `Failed to add ${model.name} to workflow: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
      return false;
    }
  }

  /**
   * Set model path in node widget
   */
  private setModelPath(node: LiteGraphNode, model: ModelInfo, modelType: ModelType): void {
    if (!node.widgets) return;

    const possibleWidgetNames = WIDGET_NAME_MAPPINGS[modelType] || [];
    
    // Extract just the filename from the full path for the widget
    const modelFileName = model.filePath.split('/').pop() || model.name;

    for (const widgetName of possibleWidgetNames) {
      const widget = node.widgets.find(w => w.name === widgetName);
      if (widget) {
        widget.value = modelFileName;
        break;
      }
    }
  }

  /**
   * Setup drag data for ComfyUI integration
   */
  public setupModelDrag(model: ModelInfo, event: DragEvent): void {
    if (!event.dataTransfer) return;

    const dragData: ModelDragData = {
      type: 'comfyui-asset-manager-model',
      model,
      sourceId: 'asset-manager'
    };

    // Set drag data in multiple formats for compatibility
    event.dataTransfer.setData('application/json', JSON.stringify(dragData));
    event.dataTransfer.setData('text/plain', model.filePath);
    
    // Set ComfyUI-specific drag data
    event.dataTransfer.setData('comfyui/model', JSON.stringify({
      type: model.modelType,
      path: model.filePath,
      name: model.name
    }));

    event.dataTransfer.effectAllowed = 'copy';
  }

  /**
   * Track model usage
   */
  private async trackModelUsage(model: ModelInfo, nodeType: string): Promise<void> {
    const usageRecord: UsageRecord = {
      modelId: model.id,
      modelPath: model.filePath,
      timestamp: new Date(),
      nodeType,
      workflowId: this.getCurrentWorkflowId()
    };

    this.usageHistory.unshift(usageRecord);
    
    // Keep only last 100 usage records
    if (this.usageHistory.length > 100) {
      this.usageHistory = this.usageHistory.slice(0, 100);
    }

    this.currentlyUsedModels.add(model.id);
    this.saveUsageHistory();
    this.notifyUsageChange();

    // Track usage on the backend (fire and forget)
    try {
      const { apiClient } = await import('./api');
      await apiClient.trackModelUsage(model.id, nodeType, usageRecord.workflowId);
    } catch (error) {
      console.warn('Failed to track usage on backend:', error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Get currently used models
   */
  public getCurrentlyUsedModels(): string[] {
    return Array.from(this.currentlyUsedModels);
  }

  /**
   * Get recent models (last 10 used)
   */
  public getRecentModels(): UsageRecord[] {
    return this.usageHistory.slice(0, 10);
  }

  /**
   * Subscribe to usage changes
   */
  public onUsageChange(callback: (usedModels: string[]) => void): () => void {
    this.usageCallbacks.add(callback);
    return () => this.usageCallbacks.delete(callback);
  }

  /**
   * Update currently used models by scanning the graph
   */
  public updateCurrentlyUsedModels(): void {
    if (!this.isComfyUIAvailable() || !window.app!.graph?.nodes) {
      return;
    }

    const usedModels = new Set<string>();
    
    try {
      // Scan all nodes in the current graph
      for (const node of window.app!.graph.nodes) {
        if (node.widgets) {
          for (const widget of node.widgets) {
            // Check if widget contains a model path
            if (typeof widget.value === 'string' && widget.value.includes('.')) {
              // Find matching model in usage history
              const matchingRecord = this.usageHistory.find(
                record => record.modelPath.endsWith(widget.value) || 
                         record.modelPath.includes(widget.value)
              );
              if (matchingRecord) {
                usedModels.add(matchingRecord.modelId);
              }
            }
          }
        }
      }

      this.currentlyUsedModels = usedModels;
      this.notifyUsageChange();
    } catch (error) {
      console.error('Error updating currently used models:', error);
    }
  }

  /**
   * Show notification using ComfyUI's notification system
   */
  private showNotification(
    message: string,
    type: 'info' | 'success' | 'error' | 'warning' = 'info'
  ): void {
    try {
      // Try ComfyUI's extension manager toast first
      if (window.app?.extensionManager?.toast) {
        window.app.extensionManager.toast(message, { type, timeout: 3000 });
        return;
      }

      // Fallback to UI dialog
      if (window.app?.ui?.dialog) {
        window.app.ui.dialog.show({
          type,
          content: message,
          title: 'Asset Manager'
        });
        return;
      }

      // Final fallback to console
      console.log(`[Asset Manager] ${type.toUpperCase()}: ${message}`);
    } catch (error) {
      console.error('Error showing notification:', error);
      console.log(`[Asset Manager] ${type.toUpperCase()}: ${message}`);
    }
  }

  /**
   * Get current workflow ID (if available)
   */
  private getCurrentWorkflowId(): string | undefined {
    // This would need to be implemented based on ComfyUI's workflow system
    // For now, return undefined
    return undefined;
  }

  /**
   * Setup usage tracking by monitoring graph changes
   */
  private setupUsageTracking(): void {
    if (typeof window === 'undefined') return;

    // Poll for graph changes every 5 seconds
    setInterval(() => {
      this.updateCurrentlyUsedModels();
    }, 5000);

    // Also update when the window gains focus
    window.addEventListener('focus', () => {
      this.updateCurrentlyUsedModels();
    });
  }

  /**
   * Notify usage change callbacks
   */
  private notifyUsageChange(): void {
    const usedModels = Array.from(this.currentlyUsedModels);
    this.usageCallbacks.forEach(callback => {
      try {
        callback(usedModels);
      } catch (error) {
        console.error('Error in usage change callback:', error);
      }
    });
  }

  /**
   * Load usage history from localStorage
   */
  private loadUsageHistory(): void {
    try {
      const stored = localStorage.getItem('comfyui-asset-manager-usage');
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        if (Array.isArray(parsed)) {
          this.usageHistory = parsed
            .map((record) => {
              if (record && typeof record === 'object') {
                const r = record as {
                  modelId?: string;
                  modelPath?: string;
                  nodeType?: string;
                  workflowId?: string;
                  timestamp?: string | number | Date;
                };
                if (!r.modelId || !r.modelPath || !r.nodeType || !r.timestamp) {
                  return null;
                }
                return {
                  modelId: r.modelId,
                  modelPath: r.modelPath,
                  nodeType: r.nodeType,
                  workflowId: r.workflowId,
                  timestamp: new Date(r.timestamp),
                } as UsageRecord;
              }
              return null;
            })
            .filter((v): v is UsageRecord => v !== null);
        } else {
          this.usageHistory = [];
        }
      }
    } catch (error) {
      console.error('Error loading usage history:', error);
      this.usageHistory = [];
    }
  }

  /**
   * Save usage history to localStorage
   */
  private saveUsageHistory(): void {
    try {
      localStorage.setItem(
        'comfyui-asset-manager-usage',
        JSON.stringify(this.usageHistory)
      );
    } catch (error) {
      console.error('Error saving usage history:', error);
    }
  }

  /**
   * Clear usage history
   */
  public clearUsageHistory(): void {
    this.usageHistory = [];
    this.currentlyUsedModels.clear();
    this.saveUsageHistory();
    this.notifyUsageChange();
  }

  /**
   * Get usage statistics for a model
   */
  public getModelUsageStats(modelId: string): {
    totalUsage: number;
    lastUsed?: Date;
    nodeTypes: string[];
  } {
    const modelRecords = this.usageHistory.filter(record => record.modelId === modelId);
    
    return {
      totalUsage: modelRecords.length,
      lastUsed: modelRecords.length > 0 ? modelRecords[0].timestamp : undefined,
      nodeTypes: [...new Set(modelRecords.map(record => record.nodeType))]
    };
  }
}

// Create singleton instance
export const comfyuiIntegration = new ComfyUIIntegrationService();

// Export types
export type { UsageRecord, ModelDragData };