import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FolderNavigation from './FolderNavigation';
import { ModelGrid, SearchFilterBar, SearchEmptyState, ModelDetailModal } from './components';
import { ModelFolder, ModelInfo, FilterOptions, EnrichedModelInfo } from './types';
import { filterModels } from './utils/searchUtils';
import { apiClient } from '../../services/api';
import { useComfyUIIntegration } from '../../hooks/useComfyUIIntegration';
import './LocalAssetsTab.css';

const LocalAssetsTab: React.FC = () => {
  const { t } = useTranslation();
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [folders, setFolders] = useState<ModelFolder[]>([]);
  const [foldersLoading, setFoldersLoading] = useState<boolean>(true);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelsLoading, setModelsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<EnrichedModelInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    modelTypes: [],
    fileSizeRange: undefined,
    dateRange: undefined,
    hasMetadata: undefined,
    hasThumbnail: undefined,
  });

  // ComfyUI integration
  const {
    isComfyUIAvailable,
    currentlyUsedModels,
    addModelToWorkflow,
    setupModelDrag,
    updateCurrentlyUsedModels
  } = useComfyUIIntegration();

  // Load folders on component mount
  useEffect(() => {
    const loadFolders = async () => {
      try {
        setFoldersLoading(true);
        setError(null);
        const foldersData = await apiClient.getFolders();
        setFolders(foldersData);
        
        // Select first folder by default if none selected
        if (foldersData.length > 0 && !selectedFolder) {
          setSelectedFolder(foldersData[0].id);
        }
      } catch (err) {
        console.error('Error loading folders:', err);
        setError(t('localAssets.errors.foldersLoadFailed'));
      } finally {
        setFoldersLoading(false);
      }
    };

    loadFolders();
  }, [selectedFolder, t]);

  // Load models when folder changes
  useEffect(() => {
    const loadModels = async () => {
      if (!selectedFolder) return;

      try {
        setModelsLoading(true);
        setError(null);
        const modelsData = await apiClient.getModelsInFolder(selectedFolder);
        setModels(modelsData);
      } catch (err) {
        console.error('Error loading models:', err);
        setError(t('localAssets.errors.modelsLoadFailed'));
      } finally {
        setModelsLoading(false);
      }
    };

    loadModels();
  }, [selectedFolder, t]);

  const handleFolderSelect = useCallback((folderId: string) => {
    setSelectedFolder(folderId);
  }, []);

  const handleModelSelect = useCallback(
    async (model: ModelInfo) => {
      try {
        setError(null);
        // Fetch detailed model information from API
        const enrichedModel = await apiClient.getModelDetails(model.id);
        setSelectedModel(enrichedModel);
        setIsModalOpen(true);
      } catch (err) {
        console.error('Error selecting model:', err);
        setError(t('localAssets.errors.modelSelectFailed'));
      }
    },
    [t]
  );

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedModel(null);
  }, []);

  const handleAddToWorkflow = useCallback(
    async (model: EnrichedModelInfo) => {
      try {
        console.log('Adding model to workflow:', model);
        
        if (!isComfyUIAvailable) {
          // Fallback: copy file path to clipboard
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(model.filePath);
            setError(t('localAssets.info.pathCopied'));
          } else {
            setError(t('localAssets.errors.comfyuiNotAvailable'));
          }
          return;
        }

        // Add model to ComfyUI workflow
        const success = await addModelToWorkflow(model);
        if (success) {
          // Update currently used models after successful addition
          setTimeout(() => updateCurrentlyUsedModels(), 1000);
        }
      } catch (err) {
        console.error('Error adding model to workflow:', err);
        setError(t('localAssets.errors.workflowAddFailed'));
      }
    },
    [t, isComfyUIAvailable, addModelToWorkflow, updateCurrentlyUsedModels]
  );

  const handleUpdateMetadata = useCallback(
    async (modelId: string, metadata: { tags: string[]; description: string; rating: number }) => {
      try {
        const updatedModel = await apiClient.updateModelMetadata(modelId, metadata);

        // Update the selected model if it's the one being updated
        if (selectedModel && selectedModel.id === modelId) {
          setSelectedModel(updatedModel);
        }

        // Update the models list in the current folder
        setModels(prevModels => 
          prevModels.map(model => 
            model.id === modelId 
              ? { ...model, ...updatedModel }
              : model
          )
        );
      } catch (err) {
        console.error('Error updating model metadata:', err);
        setError(t('localAssets.errors.metadataUpdateFailed'));
        throw err; // Re-throw to let the modal handle the error
      }
    },
    [selectedModel, t]
  );

  const handleModelDrag = useCallback((model: ModelInfo, event: DragEvent) => {
    console.log('Dragging model:', model);
    
    if (isComfyUIAvailable) {
      // Setup ComfyUI-specific drag data
      setupModelDrag(model, event);
    } else {
      // Fallback: set basic drag data
      event.dataTransfer?.setData('text/plain', model.filePath);
      event.dataTransfer?.setData('application/json', JSON.stringify({
        type: 'model',
        model: model
      }));
    }
  }, [isComfyUIAvailable, setupModelDrag]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleFilterChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      modelTypes: [],
      fileSizeRange: undefined,
      dateRange: undefined,
      hasMetadata: undefined,
      hasThumbnail: undefined,
    });
  }, []);

  // Apply search and filters
  const filteredModels = useMemo(() => {
    return filterModels(models, searchQuery, filters);
  }, [models, searchQuery, filters]);

  const hasActiveFilters =
    filters.modelTypes.length > 0 ||
    filters.fileSizeRange ||
    filters.dateRange ||
    filters.hasMetadata !== undefined ||
    filters.hasThumbnail !== undefined;

  const showEmptyState =
    !modelsLoading && filteredModels.length === 0 && (searchQuery || hasActiveFilters);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Close modal with Escape key
      if (event.key === 'Escape' && isModalOpen) {
        handleModalClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen, handleModalClose]);

  // Error auto-dismiss
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="tab-panel" role="tabpanel" aria-labelledby="local-assets-tab">
      <div className="tab-panel-header">
        <h3 id="local-assets-tab">{t('tabs.localAssets')}</h3>
        <p>{t('tabs.localAssetsDescription')}</p>
      </div>

      {error && (
        <div className="error-banner" role="alert" aria-live="polite">
          <div className="error-content">
            <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{error}</span>
            <button
              className="error-dismiss"
              onClick={() => setError(null)}
              aria-label={t('localAssets.errors.dismiss')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="tab-panel-content">
        <div className="local-assets-container">
          <div className="local-assets-layout">
            <aside
              className="local-assets-sidebar"
              role="navigation"
              aria-label={t('localAssets.navigation.folders')}
            >
              <FolderNavigation
                folders={folders}
                selectedFolder={selectedFolder}
                onFolderSelect={handleFolderSelect}
                loading={foldersLoading}
              />
            </aside>
            <main className="local-assets-main" role="main">
              <SearchFilterBar
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                filters={filters}
                onFilterChange={handleFilterChange}
                totalResults={filteredModels.length}
                loading={modelsLoading}
              />
              {showEmptyState ? (
                <SearchEmptyState
                  searchQuery={searchQuery}
                  hasFilters={Boolean(hasActiveFilters)}
                  onClearSearch={handleClearSearch}
                  onClearFilters={handleClearFilters}
                />
              ) : (
                <ModelGrid
                  models={filteredModels}
                  loading={modelsLoading}
                  onModelSelect={handleModelSelect}
                  onModelDrag={handleModelDrag}
                  searchQuery={searchQuery}
                  currentlyUsedModels={currentlyUsedModels}
                />
              )}
            </main>
          </div>
        </div>
      </div>

      {selectedModel && (
        <ModelDetailModal
          model={selectedModel}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onAddToWorkflow={handleAddToWorkflow}
          onUpdateMetadata={handleUpdateMetadata}
        />
      )}
    </div>
  );
};

export default LocalAssetsTab;
