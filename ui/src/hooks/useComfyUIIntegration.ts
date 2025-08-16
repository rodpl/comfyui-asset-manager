/**
 * React hook for ComfyUI integration
 */

import { useState, useEffect, useCallback } from 'react';
import { comfyuiIntegration, UsageRecord } from '../services/comfyuiIntegration';
import { ModelInfo } from '../features/local-assets/types';

interface ComfyUIIntegrationState {
  isAvailable: boolean;
  currentlyUsedModels: string[];
  recentModels: UsageRecord[];
}

export const useComfyUIIntegration = () => {
  const [state, setState] = useState<ComfyUIIntegrationState>({
    isAvailable: false,
    currentlyUsedModels: [],
    recentModels: []
  });

  // Update state from integration service
  const updateState = useCallback(() => {
    setState({
      isAvailable: comfyuiIntegration.isComfyUIAvailable(),
      currentlyUsedModels: comfyuiIntegration.getCurrentlyUsedModels(),
      recentModels: comfyuiIntegration.getRecentModels()
    });
  }, []);

  // Setup usage tracking subscription
  useEffect(() => {
    // Initial state update
    updateState();

    // Subscribe to usage changes
    const unsubscribe = comfyuiIntegration.onUsageChange(() => {
      updateState();
    });

    // Check availability periodically
    const availabilityCheck = setInterval(() => {
      const newAvailable = comfyuiIntegration.isComfyUIAvailable();
      if (newAvailable !== state.isAvailable) {
        updateState();
      }
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(availabilityCheck);
    };
  }, [updateState, state.isAvailable]);

  // Add model to workflow
  const addModelToWorkflow = useCallback(
    async (model: ModelInfo, position?: [number, number]): Promise<boolean> => {
      return comfyuiIntegration.addModelToWorkflow(model, position);
    },
    []
  );

  // Setup model drag
  const setupModelDrag = useCallback(
    (model: ModelInfo, event: DragEvent): void => {
      comfyuiIntegration.setupModelDrag(model, event);
    },
    []
  );

  // Get compatible node types
  const getCompatibleNodeTypes = useCallback(
    (modelType: ModelInfo['modelType']): string[] => {
      return comfyuiIntegration.getCompatibleNodeTypes(modelType);
    },
    []
  );

  // Check if model is currently used
  const isModelCurrentlyUsed = useCallback(
    (modelId: string): boolean => {
      return state.currentlyUsedModels.includes(modelId);
    },
    [state.currentlyUsedModels]
  );

  // Get model usage statistics
  const getModelUsageStats = useCallback(
    (modelId: string) => {
      return comfyuiIntegration.getModelUsageStats(modelId);
    },
    []
  );

  // Clear usage history
  const clearUsageHistory = useCallback(() => {
    comfyuiIntegration.clearUsageHistory();
  }, []);

  // Update currently used models manually
  const updateCurrentlyUsedModels = useCallback(() => {
    comfyuiIntegration.updateCurrentlyUsedModels();
  }, []);

  return {
    // State
    isComfyUIAvailable: state.isAvailable,
    currentlyUsedModels: state.currentlyUsedModels,
    recentModels: state.recentModels,

    // Actions
    addModelToWorkflow,
    setupModelDrag,
    getCompatibleNodeTypes,
    isModelCurrentlyUsed,
    getModelUsageStats,
    clearUsageHistory,
    updateCurrentlyUsedModels
  };
};