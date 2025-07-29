import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FolderNavigation from './FolderNavigation';
import { ModelGrid, SearchFilterBar, SearchEmptyState, ModelDetailModal } from './components';
import { ModelFolder, ModelType, ModelInfo, FilterOptions, EnrichedModelInfo } from './types';
import { filterModels } from './utils/searchUtils';
import { apiClient } from '../../services/api';
import './LocalAssetsTab.css';

// Mock data for demonstration
const mockFolders: ModelFolder[] = [
  {
    id: 'checkpoints',
    name: 'checkpoints',
    path: '/models/checkpoints',
    modelType: ModelType.CHECKPOINT,
    modelCount: 15,
  },
  {
    id: 'loras',
    name: 'loras',
    path: '/models/loras',
    modelType: ModelType.LORA,
    modelCount: 8,
  },
  {
    id: 'vae',
    name: 'vae',
    path: '/models/vae',
    modelType: ModelType.VAE,
    modelCount: 3,
  },
  {
    id: 'embeddings',
    name: 'embeddings',
    path: '/models/embeddings',
    modelType: ModelType.EMBEDDING,
    modelCount: 12,
  },
  {
    id: 'controlnet',
    name: 'controlnet',
    path: '/models/controlnet',
    modelType: ModelType.CONTROLNET,
    modelCount: 5,
  },
  {
    id: 'upscaler',
    name: 'upscaler',
    path: '/models/upscaler',
    modelType: ModelType.UPSCALER,
    modelCount: 2,
  },
];

// Mock enriched model data for demonstration
const mockEnrichedModels: Record<string, EnrichedModelInfo[]> = {
  checkpoints: [
    {
      id: '1',
      name: 'Realistic Vision V5.1',
      filePath: '/models/checkpoints/realisticVisionV51.safetensors',
      fileSize: 2147483648, // 2GB
      createdAt: new Date('2024-01-01'),
      modifiedAt: new Date('2024-01-15'),
      modelType: ModelType.CHECKPOINT,
      hash: 'abc123def456ghi789',
      folder: 'checkpoints',
      thumbnail:
        'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/78fd2a0a-42b6-42b0-9c7c-9f4d5a5c5c5c/width=450/00001-28328.jpeg',
      externalMetadata: {
        civitai: {
          modelId: 4201,
          name: 'Realistic Vision V5.1',
          description:
            'Realistic Vision V5.1 is a photorealistic model that produces high-quality, detailed images with excellent lighting and composition. Perfect for portrait photography, landscapes, and realistic scenes.',
          tags: ['photorealistic', 'portrait', 'photography', 'realistic', 'detailed'],
          images: [
            'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/78fd2a0a-42b6-42b0-9c7c-9f4d5a5c5c5c/width=450/00001-28328.jpeg',
          ],
          downloadCount: 125000,
          rating: 4.8,
          creator: 'SG_161222',
        },
      },
      userMetadata: {
        tags: ['favorite', 'portraits', 'main-checkpoint'],
        description: 'My go-to checkpoint for realistic portraits and photography-style images.',
        rating: 5,
      },
    },
    {
      id: '2',
      name: 'DreamShaper XL',
      filePath: '/models/checkpoints/dreamshaperXL.safetensors',
      fileSize: 6442450944, // 6GB
      createdAt: new Date('2024-01-02'),
      modifiedAt: new Date('2024-01-16'),
      modelType: ModelType.CHECKPOINT,
      hash: 'def456ghi789jkl012',
      folder: 'checkpoints',
      externalMetadata: {
        huggingface: {
          modelId: 'Lykon/DreamShaper',
          description:
            "DreamShaper is a general purpose SD model that aims at doing everything well, photos, art, anime, manga. It's designed to match Midjourney and DALL-E.",
          tags: ['stable-diffusion', 'text-to-image', 'art', 'anime', 'photography'],
          downloads: 89000,
          likes: 1200,
          library: 'diffusers',
        },
      },
    },
  ],
  loras: [
    {
      id: '3',
      name: 'Detail Tweaker LoRA',
      filePath: '/models/loras/detail_tweaker.safetensors',
      fileSize: 134217728, // 128MB
      createdAt: new Date('2024-01-03'),
      modifiedAt: new Date('2024-01-17'),
      modelType: ModelType.LORA,
      hash: 'ghi789jkl012mno345',
      folder: 'loras',
      userMetadata: {
        tags: ['enhancement', 'detail'],
        description: 'Enhances fine details in generated images.',
        rating: 4,
      },
    },
    {
      id: '4',
      name: 'Style Enhancement LoRA',
      filePath: '/models/loras/style_enhancement.safetensors',
      fileSize: 67108864, // 64MB
      createdAt: new Date('2024-01-04'),
      modifiedAt: new Date('2024-01-18'),
      modelType: ModelType.LORA,
      hash: 'jkl012mno345pqr678',
      folder: 'loras',
    },
  ],
  vae: [
    {
      id: '5',
      name: 'VAE-ft-mse-840000-ema-pruned',
      filePath: '/models/vae/vae-ft-mse-840000-ema-pruned.safetensors',
      fileSize: 335544320, // 320MB
      createdAt: new Date('2024-01-05'),
      modifiedAt: new Date('2024-01-19'),
      modelType: ModelType.VAE,
      hash: 'mno345pqr678stu901',
      folder: 'vae',
    },
  ],
  embeddings: [
    {
      id: '6',
      name: 'BadDream Negative Embedding',
      filePath: '/models/embeddings/baddream.pt',
      fileSize: 25600, // 25KB
      createdAt: new Date('2024-01-06'),
      modifiedAt: new Date('2024-01-20'),
      modelType: ModelType.EMBEDDING,
      hash: 'pqr678stu901vwx234',
      folder: 'embeddings',
    },
  ],
  controlnet: [
    {
      id: '7',
      name: 'ControlNet Canny',
      filePath: '/models/controlnet/control_canny.safetensors',
      fileSize: 1431655765, // 1.33GB
      createdAt: new Date('2024-01-07'),
      modifiedAt: new Date('2024-01-21'),
      modelType: ModelType.CONTROLNET,
      hash: 'stu901vwx234yza567',
      folder: 'controlnet',
    },
  ],
  upscaler: [
    {
      id: '8',
      name: 'Real-ESRGAN 4x+',
      filePath: '/models/upscaler/RealESRGAN_x4plus.pth',
      fileSize: 67108864, // 64MB
      createdAt: new Date('2024-01-08'),
      modifiedAt: new Date('2024-01-22'),
      modelType: ModelType.UPSCALER,
      hash: 'vwx234yza567bcd890',
      folder: 'upscaler',
    },
  ],
};

const LocalAssetsTab: React.FC = () => {
  const { t } = useTranslation();
  const [selectedFolder, setSelectedFolder] = useState<string>('checkpoints');
  const [loading] = useState<boolean>(false);
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

  const handleFolderSelect = useCallback((folderId: string) => {
    setSelectedFolder(folderId);
    setModelsLoading(true);
    setError(null);

    // Simulate loading delay - in real implementation this would be an API call
    setTimeout(() => {
      setModelsLoading(false);
    }, 500);
  }, []);

  const handleModelSelect = useCallback(
    (model: ModelInfo) => {
      try {
        // Find the enriched model data
        const enrichedModel = mockEnrichedModels[selectedFolder]?.find((m) => m.id === model.id);
        if (enrichedModel) {
          setSelectedModel(enrichedModel);
          setIsModalOpen(true);
        }
      } catch (err) {
        console.error('Error selecting model:', err);
        setError(t('localAssets.errors.modelSelectFailed'));
      }
    },
    [selectedFolder, t]
  );

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedModel(null);
  }, []);

  const handleAddToWorkflow = useCallback(
    (model: EnrichedModelInfo) => {
      try {
        console.log('Adding model to workflow:', model);
        // TODO: Implement ComfyUI workflow integration
        // This would typically involve communicating with ComfyUI's API
        // to add the model to the current workflow

        // For now, copy the file path to clipboard as a fallback
        if (navigator.clipboard) {
          navigator.clipboard.writeText(model.filePath);
          // In a real implementation, you'd show a success toast here
        }
      } catch (err) {
        console.error('Error adding model to workflow:', err);
        setError(t('localAssets.errors.workflowAddFailed'));
      }
    },
    [t]
  );

  const handleUpdateMetadata = useCallback(
    async (modelId: string, metadata: { tags: string[]; description: string; rating: number }) => {
      try {
        const updatedModel = await apiClient.updateModelMetadata(modelId, metadata);
        
        // Update the selected model if it's the one being updated
        if (selectedModel && selectedModel.id === modelId) {
          setSelectedModel(updatedModel);
        }
        
        // TODO: Update the models list in the current folder
        // This would require refactoring to use real API data instead of mock data
        
      } catch (err) {
        console.error('Error updating model metadata:', err);
        setError(t('localAssets.errors.metadataUpdateFailed'));
        throw err; // Re-throw to let the modal handle the error
      }
    },
    [selectedModel, t]
  );

  const handleModelDrag = useCallback((model: ModelInfo) => {
    console.log('Dragging model:', model);
    // TODO: Handle drag to ComfyUI workflow
    // This would set up the drag data for ComfyUI to consume
  }, []);

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

  const currentModels = mockEnrichedModels[selectedFolder] || [];

  // Apply search and filters
  const filteredModels = useMemo(() => {
    return filterModels(currentModels, searchQuery, filters);
  }, [currentModels, searchQuery, filters]);

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
                folders={mockFolders}
                selectedFolder={selectedFolder}
                onFolderSelect={handleFolderSelect}
                loading={loading}
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
