/**
 * Asset Manager Context
 * Provides global state management for the Asset Manager
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import {
  ModelFolder,
  ModelInfo,
  EnrichedModelInfo,
  FilterOptions,
} from '../features/local-assets/types';
import { apiClient, ApiClientError } from '../services/api';

// State interface
export interface AssetManagerState {
  // Data
  folders: ModelFolder[];
  models: Record<string, ModelInfo[]>; // keyed by folder ID
  selectedFolder: string | null;
  selectedModel: EnrichedModelInfo | null;

  // UI State
  loading: {
    folders: boolean;
    models: boolean;
    modelDetails: boolean;
  };

  // Search and filters
  searchQuery: string;
  filters: FilterOptions;

  // Error handling
  error: {
    folders: string | null;
    models: string | null;
    modelDetails: string | null;
    general: string | null;
  };

  // Network status
  isOnline: boolean;
  lastSync: Date | null;
}

// Action types
export type AssetManagerAction =
  | { type: 'SET_LOADING'; payload: { key: keyof AssetManagerState['loading']; value: boolean } }
  | { type: 'SET_ERROR'; payload: { key: keyof AssetManagerState['error']; value: string | null } }
  | { type: 'SET_FOLDERS'; payload: ModelFolder[] }
  | { type: 'SET_MODELS'; payload: { folderId: string; models: ModelInfo[] } }
  | { type: 'SET_SELECTED_FOLDER'; payload: string | null }
  | { type: 'SET_SELECTED_MODEL'; payload: EnrichedModelInfo | null }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_FILTERS'; payload: FilterOptions }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'SET_LAST_SYNC'; payload: Date }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: AssetManagerState = {
  folders: [],
  models: {},
  selectedFolder: null,
  selectedModel: null,
  loading: {
    folders: false,
    models: false,
    modelDetails: false,
  },
  searchQuery: '',
  filters: {
    modelTypes: [],
    fileSizeRange: undefined,
    dateRange: undefined,
    hasMetadata: undefined,
    hasThumbnail: undefined,
  },
  error: {
    folders: null,
    models: null,
    modelDetails: null,
    general: null,
  },
  isOnline: navigator.onLine,
  lastSync: null,
};

// Reducer
function assetManagerReducer(
  state: AssetManagerState,
  action: AssetManagerAction
): AssetManagerState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: {
          ...state.error,
          [action.payload.key]: action.payload.value,
        },
      };

    case 'SET_FOLDERS':
      return {
        ...state,
        folders: action.payload,
        error: {
          ...state.error,
          folders: null,
        },
      };

    case 'SET_MODELS':
      return {
        ...state,
        models: {
          ...state.models,
          [action.payload.folderId]: action.payload.models,
        },
        error: {
          ...state.error,
          models: null,
        },
      };

    case 'SET_SELECTED_FOLDER':
      return {
        ...state,
        selectedFolder: action.payload,
      };

    case 'SET_SELECTED_MODEL':
      return {
        ...state,
        selectedModel: action.payload,
        error: {
          ...state.error,
          modelDetails: null,
        },
      };

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload,
      };

    case 'SET_FILTERS':
      return {
        ...state,
        filters: action.payload,
      };

    case 'SET_ONLINE_STATUS':
      return {
        ...state,
        isOnline: action.payload,
      };

    case 'SET_LAST_SYNC':
      return {
        ...state,
        lastSync: action.payload,
      };

    case 'CLEAR_ERRORS':
      return {
        ...state,
        error: {
          folders: null,
          models: null,
          modelDetails: null,
          general: null,
        },
      };

    case 'RESET_STATE':
      return {
        ...initialState,
        isOnline: state.isOnline,
      };

    default:
      return state;
  }
}

// Context interface
export interface AssetManagerContextType {
  state: AssetManagerState;

  // Actions
  loadFolders: () => Promise<void>;
  loadModelsInFolder: (folderId: string) => Promise<void>;
  loadModelDetails: (modelId: string) => Promise<void>;
  searchModels: (query: string, folderId?: string) => Promise<ModelInfo[]>;
  updateModelMetadata: (
    modelId: string,
    metadata: { tags?: string[]; description?: string; rating?: number }
  ) => Promise<void>;

  // UI Actions
  setSelectedFolder: (folderId: string | null) => void;
  setSelectedModel: (model: EnrichedModelInfo | null) => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: FilterOptions) => void;
  clearErrors: () => void;
  resetState: () => void;

  // Utility
  retry: (operation: () => Promise<void>) => Promise<void>;
  batchOperations: (operations: (() => Promise<any>)[], batchSize?: number) => Promise<any[]>;
}

// Create context
const AssetManagerContext = createContext<AssetManagerContextType | undefined>(undefined);

// Provider component
export const AssetManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(assetManagerReducer, initialState);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_ONLINE_STATUS', payload: true });
    const handleOffline = () => dispatch({ type: 'SET_ONLINE_STATUS', payload: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle API health status changes
  useEffect(() => {
    const unsubscribe = apiClient.onHealthChange((isHealthy) => {
      if (!isHealthy && state.isOnline) {
        // API is unhealthy but we're still online - show general error
        dispatch({
          type: 'SET_ERROR',
          payload: {
            key: 'general',
            value: 'Backend service is temporarily unavailable. Retrying...',
          },
        });
      } else if (
        isHealthy &&
        state.error.general?.includes('Backend service is temporarily unavailable')
      ) {
        // API is healthy again - clear the error
        dispatch({
          type: 'SET_ERROR',
          payload: { key: 'general', value: null },
        });
      }
    });

    return unsubscribe;
  }, [state.isOnline, state.error.general]);

  // Error handler utility
  const handleError = useCallback((error: unknown, errorKey: keyof AssetManagerState['error']) => {
    let errorMessage = 'An unexpected error occurred';

    if (error instanceof ApiClientError) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    dispatch({ type: 'SET_ERROR', payload: { key: errorKey, value: errorMessage } });
    console.error(`Asset Manager Error (${errorKey}):`, error);
  }, []);

  // Load folders
  const loadFolders = useCallback(async () => {
    if (!state.isOnline) {
      handleError(new Error('Cannot load folders while offline'), 'folders');
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: { key: 'folders', value: true } });

    try {
      const folders = await apiClient.getFolders();
      dispatch({ type: 'SET_FOLDERS', payload: folders });
      dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
    } catch (error) {
      handleError(error, 'folders');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'folders', value: false } });
    }
  }, [state.isOnline, handleError]);

  // Load models in folder
  const loadModelsInFolder = useCallback(
    async (folderId: string) => {
      if (!state.isOnline) {
        handleError(new Error('Cannot load models while offline'), 'models');
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: { key: 'models', value: true } });

      try {
        const models = await apiClient.getModelsInFolder(folderId);
        dispatch({ type: 'SET_MODELS', payload: { folderId, models } });
        dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
      } catch (error) {
        handleError(error, 'models');
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { key: 'models', value: false } });
      }
    },
    [state.isOnline, handleError]
  );

  // Load model details
  const loadModelDetails = useCallback(
    async (modelId: string) => {
      if (!state.isOnline) {
        handleError(new Error('Cannot load model details while offline'), 'modelDetails');
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: { key: 'modelDetails', value: true } });

      try {
        const model = await apiClient.getModelDetails(modelId);
        dispatch({ type: 'SET_SELECTED_MODEL', payload: model });
        dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
      } catch (error) {
        handleError(error, 'modelDetails');
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { key: 'modelDetails', value: false } });
      }
    },
    [state.isOnline, handleError]
  );

  // Search models
  const searchModels = useCallback(
    async (query: string, folderId?: string): Promise<ModelInfo[]> => {
      if (!state.isOnline) {
        throw new Error('Cannot search models while offline');
      }

      try {
        return await apiClient.searchModels(query, folderId);
      } catch (error) {
        handleError(error, 'general');
        throw error;
      }
    },
    [state.isOnline, handleError]
  );

  // Update model metadata
  const updateModelMetadata = useCallback(
    async (
      modelId: string,
      metadata: { tags?: string[]; description?: string; rating?: number }
    ) => {
      if (!state.isOnline) {
        handleError(new Error('Cannot update metadata while offline'), 'general');
        return;
      }

      try {
        const updatedModel = await apiClient.updateModelMetadata(modelId, metadata);
        dispatch({ type: 'SET_SELECTED_MODEL', payload: updatedModel });

        // Update the model in the models list if it exists
        if (state.selectedFolder && state.models[state.selectedFolder]) {
          const updatedModels = state.models[state.selectedFolder].map((model) =>
            model.id === modelId ? { ...model, ...updatedModel } : model
          );
          dispatch({
            type: 'SET_MODELS',
            payload: { folderId: state.selectedFolder, models: updatedModels },
          });
        }

        dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
      } catch (error) {
        handleError(error, 'general');
        throw error;
      }
    },
    [state.isOnline, state.selectedFolder, state.models, handleError]
  );

  // UI Actions
  const setSelectedFolder = useCallback((folderId: string | null) => {
    dispatch({ type: 'SET_SELECTED_FOLDER', payload: folderId });
  }, []);

  const setSelectedModel = useCallback((model: EnrichedModelInfo | null) => {
    dispatch({ type: 'SET_SELECTED_MODEL', payload: model });
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, []);

  const setFilters = useCallback((filters: FilterOptions) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const clearErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ERRORS' });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  // Auto-retry failed operations when coming back online
  useEffect(() => {
    if (state.isOnline && state.error.folders && state.folders && state.folders.length === 0) {
      // Auto-retry loading folders if we have an error and no data
      loadFolders();
    }
  }, [state.isOnline, state.error.folders, state.folders, loadFolders]);

  // Retry utility
  const retry = useCallback(async (operation: () => Promise<void>) => {
    const maxRetries = 3;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await operation();
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt === maxRetries) {
          throw lastError;
        }

        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }
    }
  }, []);

  // Batch operations utility
  const batchOperations = useCallback(
    async (operations: (() => Promise<any>)[], batchSize: number = 3) => {
      const results: unknown[] = [];

      for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(batch.map((op) => op()));

        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            console.warn('Batch operation failed:', result.reason);
          }
        }
      }

      return results;
    },
    []
  );

  const contextValue: AssetManagerContextType = {
    state,
    loadFolders,
    loadModelsInFolder,
    loadModelDetails,
    searchModels,
    updateModelMetadata,
    setSelectedFolder,
    setSelectedModel,
    setSearchQuery,
    setFilters,
    clearErrors,
    resetState,
    retry,
    batchOperations,
  };

  return (
    <AssetManagerContext.Provider value={contextValue}>{children}</AssetManagerContext.Provider>
  );
};

// Hook to use the context
export const useAssetManager = (): AssetManagerContextType => {
  const context = useContext(AssetManagerContext);
  if (context === undefined) {
    throw new Error('useAssetManager must be used within an AssetManagerProvider');
  }
  return context;
};
