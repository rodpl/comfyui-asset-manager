// Type definitions for Local Assets feature

export enum ModelType {
  CHECKPOINT = 'checkpoint',
  LORA = 'lora',
  VAE = 'vae',
  EMBEDDING = 'embedding',
  CONTROLNET = 'controlnet',
  UPSCALER = 'upscaler',
}

export interface ModelFolder {
  id: string;
  name: string;
  path: string;
  modelType: ModelType;
  modelCount: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  filePath: string;
  fileSize: number;
  createdAt: Date;
  modifiedAt: Date;
  modelType: ModelType;
  hash: string;
  thumbnail?: string;
  folder: string;
}

export interface FolderNavigationProps {
  folders: ModelFolder[];
  selectedFolder: string;
  onFolderSelect: (folderId: string) => void;
  loading?: boolean;
}

export interface FilterOptions {
  modelTypes: ModelType[];
  fileSizeRange?: {
    min: number;
    max: number;
  };
  dateRange?: {
    start: Date;
    end: Date;
  };
  hasMetadata?: boolean;
  hasThumbnail?: boolean;
}

export interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  totalResults?: number;
  loading?: boolean;
}

export interface CivitAIMetadata {
  modelId: number;
  name: string;
  description: string;
  tags: string[];
  images: string[];
  downloadCount: number;
  rating: number;
  creator: string;
}

export interface HuggingFaceMetadata {
  modelId: string;
  description: string;
  tags: string[];
  downloads: number;
  likes: number;
  library: string;
}

export interface EnrichedModelInfo extends ModelInfo {
  externalMetadata?: {
    civitai?: CivitAIMetadata;
    huggingface?: HuggingFaceMetadata;
  };
  userMetadata?: {
    tags: string[];
    description: string;
    rating: number;
  };
}

export interface ModelDetailModalProps {
  model: EnrichedModelInfo;
  isOpen: boolean;
  onClose: () => void;
  onAddToWorkflow: (model: ModelInfo) => void;
}
