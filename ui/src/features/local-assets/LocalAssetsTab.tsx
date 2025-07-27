import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import FolderNavigation from './FolderNavigation';
import { ModelGrid, SearchFilterBar, SearchEmptyState } from './components';
import { ModelFolder, ModelType, ModelInfo, FilterOptions } from './types';
import { filterModels } from './utils/searchUtils';
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

// Mock model data for demonstration
const mockModels: Record<string, ModelInfo[]> = {
  checkpoints: [
    {
      id: '1',
      name: 'Realistic Vision V5.1',
      filePath: '/models/checkpoints/realisticVisionV51.safetensors',
      fileSize: 2147483648, // 2GB
      createdAt: new Date('2024-01-01'),
      modifiedAt: new Date('2024-01-15'),
      modelType: ModelType.CHECKPOINT,
      hash: 'abc123',
      folder: 'checkpoints',
      thumbnail:
        'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/78fd2a0a-42b6-42b0-9c7c-9f4d5a5c5c5c/width=450/00001-28328.jpeg',
    },
    {
      id: '2',
      name: 'DreamShaper XL',
      filePath: '/models/checkpoints/dreamshaperXL.safetensors',
      fileSize: 6442450944, // 6GB
      createdAt: new Date('2024-01-02'),
      modifiedAt: new Date('2024-01-16'),
      modelType: ModelType.CHECKPOINT,
      hash: 'def456',
      folder: 'checkpoints',
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
      hash: 'ghi789',
      folder: 'loras',
    },
    {
      id: '4',
      name: 'Style Enhancement LoRA',
      filePath: '/models/loras/style_enhancement.safetensors',
      fileSize: 67108864, // 64MB
      createdAt: new Date('2024-01-04'),
      modifiedAt: new Date('2024-01-18'),
      modelType: ModelType.LORA,
      hash: 'jkl012',
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
      hash: 'mno345',
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
      hash: 'pqr678',
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
      hash: 'stu901',
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
      hash: 'vwx234',
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
  const [filters, setFilters] = useState<FilterOptions>({
    modelTypes: [],
    fileSizeRange: undefined,
    dateRange: undefined,
    hasMetadata: undefined,
    hasThumbnail: undefined,
  });

  const handleFolderSelect = (folderId: string) => {
    setSelectedFolder(folderId);
    setModelsLoading(true);

    // Simulate loading delay
    setTimeout(() => {
      setModelsLoading(false);
    }, 500);
  };

  const handleModelSelect = (model: ModelInfo) => {
    console.log('Selected model:', model);
    // TODO: Open model detail modal
  };

  const handleModelDrag = (model: ModelInfo) => {
    console.log('Dragging model:', model);
    // TODO: Handle drag to ComfyUI workflow
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleClearFilters = () => {
    setFilters({
      modelTypes: [],
      fileSizeRange: undefined,
      dateRange: undefined,
      hasMetadata: undefined,
      hasThumbnail: undefined,
    });
  };

  const currentModels = mockModels[selectedFolder] || [];

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

  return (
    <div className="tab-panel">
      <div className="tab-panel-header">
        <h3>{t('tabs.localAssets')}</h3>
        <p>{t('tabs.localAssetsDescription')}</p>
      </div>
      <div className="tab-panel-content">
        <div className="local-assets-container">
          <div className="local-assets-layout">
            <FolderNavigation
              folders={mockFolders}
              selectedFolder={selectedFolder}
              onFolderSelect={handleFolderSelect}
              loading={loading}
            />
            <div className="local-assets-main">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalAssetsTab;
