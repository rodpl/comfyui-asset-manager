/**
 * TypeScript interfaces for external model browser feature
 */

// Core external model interface
export interface ExternalModel {
  id: string;
  name: string;
  description: string;
  author: string;
  platform: 'civitai' | 'huggingface';
  thumbnailUrl?: string;
  tags: string[];
  downloadCount: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, any>;
  // ComfyUI-specific fields
  comfyuiCompatibility: ComfyUICompatibility;
  modelType?: ComfyUIModelType;
  baseModel?: string;
  fileSize?: number;
  fileFormat?: string;
}

// ComfyUI compatibility information
export interface ComfyUICompatibility {
  isCompatible: boolean;
  modelFolder?: string; // checkpoints, loras, vae, etc.
  compatibilityNotes?: string;
  requiredNodes: string[];
}

// ComfyUI model types enum
export enum ComfyUIModelType {
  CHECKPOINT = 'checkpoint',
  LORA = 'lora',
  VAE = 'vae',
  EMBEDDING = 'embedding',
  CONTROLNET = 'controlnet',
  UPSCALER = 'upscaler',
  UNKNOWN = 'unknown'
}

// Model search parameters
export interface ModelSearchParams {
  query?: string;
  platform?: 'civitai' | 'huggingface';
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

// Model search response
export interface ModelSearchResponse {
  models: ExternalModel[];
  total: number;
  hasMore: boolean;
  nextOffset?: number;
}

// Platform-specific metadata interfaces

// CivitAI metadata
export interface CivitAIMetadata {
  modelType: string;
  baseModel: string;
  nsfw: boolean;
  allowCommercialUse: string;
  favoriteCount: number;
  commentCount: number;
  versions: CivitAIVersion[];
  // ComfyUI-specific mappings
  comfyuiModelType: ComfyUIModelType;
  comfyuiFolder: string;
  compatibilityScore: number; // 0-1 based on ComfyUI compatibility
}

export interface CivitAIVersion {
  id: number;
  name: string;
  downloadUrl: string;
  files: CivitAIFile[];
}

export interface CivitAIFile {
  name: string;
  sizeKB: number;
  type: string;
  format: string; // safetensors, ckpt, etc.
}

// HuggingFace metadata
export interface HuggingFaceMetadata {
  library: string;
  pipelineTag: string;
  license: string;
  languages: string[];
  datasets: string[];
  metrics: string[];
  siblings: HuggingFaceSibling[];
  // ComfyUI-specific mappings
  comfyuiCompatible: boolean;
  comfyuiModelType: ComfyUIModelType;
  supportedFormats: string[];
  diffusionType: string; // stable-diffusion, stable-diffusion-xl, etc.
}

export interface HuggingFaceSibling {
  rfilename: string;
  size: number;
}

// API response types for external services

// CivitAI API response types
export interface CivitAIModelResponse {
  id: number;
  name: string;
  description: string;
  type: string;
  poi: boolean;
  nsfw: boolean;
  allowNoCredit: boolean;
  allowCommercialUse: string;
  allowDerivatives: boolean;
  allowDifferentLicense: boolean;
  stats: {
    downloadCount: number;
    favoriteCount: number;
    commentCount: number;
    ratingCount: number;
    rating: number;
  };
  creator: {
    username: string;
    image?: string;
  };
  tags: string[];
  modelVersions: Array<{
    id: number;
    name: string;
    description: string;
    baseModel: string;
    images: Array<{
      url: string;
      nsfw: boolean;
      width: number;
      height: number;
    }>;
    files: Array<{
      id: number;
      sizeKB: number;
      name: string;
      type: string;
      format: string;
      pickleScanResult: string;
      pickleScanMessage?: string;
      virusScanResult: string;
      scannedAt: string;
      hashes: {
        AutoV1?: string;
        AutoV2?: string;
        SHA256?: string;
        CRC32?: string;
        BLAKE3?: string;
      };
      downloadUrl: string;
    }>;
  }>;
}

export interface CivitAISearchResponse {
  items: CivitAIModelResponse[];
  metadata: {
    totalItems: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
    nextPage?: string;
    prevPage?: string;
  };
}

// HuggingFace API response types
export interface HuggingFaceModelResponse {
  id: string;
  author: string;
  sha: string;
  created_at: string;
  last_modified: string;
  private: boolean;
  disabled: boolean;
  downloads: number;
  likes: number;
  tags: string[];
  pipeline_tag?: string;
  library_name?: string;
  model_index?: Record<string, any>;
  config?: Record<string, any>;
  cardData?: {
    license?: string;
    language?: string[];
    datasets?: string[];
    metrics?: string[];
    [key: string]: any;
  };
  siblings: Array<{
    rfilename: string;
    size?: number;
  }>;
}

export interface HuggingFaceSearchResponse {
  models: HuggingFaceModelResponse[];
  numItemsOnPage: number;
  numTotalItems: number;
}

// Model type mapping utilities
export interface ModelTypeMapping {
  civitaiType: string;
  huggingfaceTag: string;
  comfyuiType: ComfyUIModelType;
  comfyuiFolder: string;
  description: string;
}

// Filter options for each platform
export interface CivitAIFilters {
  types?: string[];
  sort?: 'Highest Rated' | 'Most Downloaded' | 'Newest' | 'Most Liked';
  period?: 'AllTime' | 'Year' | 'Month' | 'Week' | 'Day';
  rating?: number;
  username?: string;
  tag?: string;
  nsfw?: boolean;
  baseModels?: string[];
}

export interface HuggingFaceFilters {
  author?: string;
  library?: string[];
  language?: string[];
  license?: string[];
  task?: string[];
  sort?: 'downloads' | 'likes' | 'updated' | 'created';
  direction?: 'asc' | 'desc';
}

// Error types
export interface ExternalModelError {
  code: string;
  message: string;
  platform?: string;
  details?: Record<string, any>;
}