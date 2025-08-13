/**
 * CivitAI API service for model search and details
 */

import {
  ExternalModel,
  ModelSearchParams,
  ModelSearchResponse,
  CivitAIModelResponse,
  CivitAISearchResponse,
  CivitAIFilters,
  ComfyUIModelType,
  ComfyUICompatibility,
  ExternalModelError
} from '../types';

// CivitAI API configuration
const CIVITAI_BASE_URL = 'https://civitai.com/api/v1';
const DEFAULT_LIMIT = 20;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Rate limiting configuration
const RATE_LIMIT_DELAY = 100; // 100ms between requests
let lastRequestTime = 0;

/**
 * CivitAI API service class
 */
export class CivitAIService {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  /**
   * Search models on CivitAI
   */
  async searchModels(params: ModelSearchParams): Promise<ModelSearchResponse> {
    try {
      await this.enforceRateLimit();

      const searchParams = this.buildSearchParams(params);
      const url = `${CIVITAI_BASE_URL}/models?${searchParams.toString()}`;

      const response = await this.fetchWithRetry(url);
      const data: CivitAISearchResponse = await response.json();

      return this.transformSearchResponse(data);
    } catch (error) {
      throw this.handleError(error, 'searchModels');
    }
  }

  /**
   * Get detailed model information
   */
  async getModelDetails(modelId: string): Promise<ExternalModel> {
    try {
      await this.enforceRateLimit();

      const url = `${CIVITAI_BASE_URL}/models/${modelId}`;
      const response = await this.fetchWithRetry(url);
      const data: CivitAIModelResponse = await response.json();

      return this.transformModelResponse(data);
    } catch (error) {
      throw this.handleError(error, 'getModelDetails');
    }
  }

  /**
   * Build search parameters for CivitAI API
   */
  private buildSearchParams(params: ModelSearchParams): URLSearchParams {
    const searchParams = new URLSearchParams();

    // Basic parameters
    if (params.query) {
      searchParams.append('query', params.query);
    }

    searchParams.append('limit', (params.limit || DEFAULT_LIMIT).toString());
    searchParams.append('page', Math.floor((params.offset || 0) / (params.limit || DEFAULT_LIMIT) + 1).toString());

    // CivitAI-specific filters
    const filters = params.filters as CivitAIFilters;
    if (filters) {
      if (filters.types && filters.types.length > 0) {
        filters.types.forEach(type => searchParams.append('types', type));
      }

      if (filters.sort) {
        searchParams.append('sort', filters.sort);
      }

      if (filters.period) {
        searchParams.append('period', filters.period);
      }

      if (filters.rating !== undefined) {
        searchParams.append('rating', filters.rating.toString());
      }

      if (filters.username) {
        searchParams.append('username', filters.username);
      }

      if (filters.tag) {
        searchParams.append('tag', filters.tag);
      }

      if (filters.nsfw !== undefined) {
        searchParams.append('nsfw', filters.nsfw.toString());
      }

      if (filters.baseModels && filters.baseModels.length > 0) {
        filters.baseModels.forEach(model => searchParams.append('baseModels', model));
      }
    }

    // Add ComfyUI-compatible filtering
    if (!filters?.types) {
      // Default to ComfyUI-compatible model types
      const compatibleTypes = ['Checkpoint', 'LORA', 'TextualInversion', 'Controlnet', 'VAE', 'Upscaler'];
      compatibleTypes.forEach(type => searchParams.append('types', type));
    }

    return searchParams;
  }

  /**
   * Transform CivitAI search response to our format
   */
  private transformSearchResponse(data: CivitAISearchResponse): ModelSearchResponse {
    const models = data.items.map(item => this.transformModelResponse(item));
    
    return {
      models,
      total: data.metadata.totalItems,
      hasMore: data.metadata.currentPage < data.metadata.totalPages,
      nextOffset: data.metadata.nextPage ? 
        (data.metadata.currentPage * data.metadata.pageSize) : undefined
    };
  }

  /**
   * Transform CivitAI model response to ExternalModel
   */
  private transformModelResponse(data: CivitAIModelResponse): ExternalModel {
    const latestVersion = data.modelVersions[0];
    const compatibility = this.assessComfyUICompatibility(data);
    
    // Get the best thumbnail from the latest version
    const thumbnail = latestVersion?.images?.[0]?.url;
    
    // Calculate file size from the largest file in the latest version
    const files = latestVersion?.files || [];
    const largestFile = files.reduce((largest, file) => 
      file.sizeKB > (largest?.sizeKB || 0) ? file : largest, files[0]);

    return {
      id: data.id.toString(),
      name: data.name,
      description: data.description || '',
      author: data.creator.username,
      platform: 'civitai',
      thumbnailUrl: thumbnail,
      tags: data.tags || [],
      downloadCount: data.stats.downloadCount,
      rating: data.stats.rating,
      createdAt: new Date().toISOString(), // CivitAI doesn't provide creation date in this format
      updatedAt: new Date().toISOString(),
      metadata: {
        modelType: data.type,
        baseModel: latestVersion?.baseModel || '',
        nsfw: data.nsfw,
        allowCommercialUse: data.allowCommercialUse,
        favoriteCount: data.stats.favoriteCount,
        commentCount: data.stats.commentCount,
        versions: data.modelVersions.map(version => ({
          id: version.id,
          name: version.name,
          downloadUrl: version.files[0]?.downloadUrl || '',
          files: version.files.map(file => ({
            name: file.name,
            sizeKB: file.sizeKB,
            type: file.type,
            format: file.format
          }))
        })),
        comfyuiModelType: compatibility.modelType,
        comfyuiFolder: compatibility.folder,
        compatibilityScore: compatibility.score
      },
      comfyuiCompatibility: {
        isCompatible: compatibility.isCompatible,
        modelFolder: compatibility.folder,
        compatibilityNotes: compatibility.notes,
        requiredNodes: compatibility.requiredNodes
      },
      modelType: compatibility.modelType,
      baseModel: latestVersion?.baseModel,
      fileSize: largestFile ? largestFile.sizeKB * 1024 : undefined, // Convert KB to bytes
      fileFormat: largestFile?.format
    };
  }

  /**
   * Assess ComfyUI compatibility for a CivitAI model
   */
  private assessComfyUICompatibility(data: CivitAIModelResponse): {
    isCompatible: boolean;
    modelType: ComfyUIModelType;
    folder: string;
    score: number;
    notes?: string;
    requiredNodes: string[];
  } {
    const modelType = data.type;
    const latestVersion = data.modelVersions[0];
    const baseModel = latestVersion?.baseModel || '';
    const files = latestVersion?.files || [];
    
    // Get the primary file (usually the largest or first)
    const primaryFile = files.find(f => f.type === 'Model') || files[0];
    const fileFormat = primaryFile?.format || '';

    // Map CivitAI type to ComfyUI type
    const typeMapping: Record<string, { type: ComfyUIModelType; folder: string }> = {
      'Checkpoint': { type: ComfyUIModelType.CHECKPOINT, folder: 'checkpoints' },
      'LORA': { type: ComfyUIModelType.LORA, folder: 'loras' },
      'TextualInversion': { type: ComfyUIModelType.EMBEDDING, folder: 'embeddings' },
      'Controlnet': { type: ComfyUIModelType.CONTROLNET, folder: 'controlnet' },
      'VAE': { type: ComfyUIModelType.VAE, folder: 'vae' },
      'Upscaler': { type: ComfyUIModelType.UPSCALER, folder: 'upscale_models' }
    };

    const mapping = typeMapping[modelType] || { type: ComfyUIModelType.UNKNOWN, folder: 'models' };
    
    // Calculate compatibility score
    let score = 0;
    let notes: string[] = [];
    let requiredNodes: string[] = [];

    // Base score for known model types
    if (mapping.type !== ComfyUIModelType.UNKNOWN) {
      score += 0.4;
    } else {
      notes.push(`Unknown model type: ${modelType}`);
    }

    // File format compatibility
    const supportedFormats = ['safetensors', 'ckpt', 'pt', 'pth'];
    if (supportedFormats.includes(fileFormat.toLowerCase())) {
      score += 0.3;
      if (fileFormat.toLowerCase() === 'safetensors') {
        score += 0.1; // Bonus for safetensors
      }
    } else {
      notes.push(`Unsupported file format: ${fileFormat}`);
    }

    // Base model compatibility
    const supportedBaseModels = ['SD 1.5', 'SDXL 1.0', 'SD 2.1', 'SD 2.0', 'SDXL Turbo', 'SDXL Lightning'];
    if (supportedBaseModels.some(supported => baseModel.includes(supported))) {
      score += 0.2;
    } else if (baseModel) {
      notes.push(`Base model may not be fully supported: ${baseModel}`);
    }

    // Special handling for specific model types
    if (modelType === 'Controlnet') {
      requiredNodes.push('ControlNet');
    }

    const isCompatible = score >= 0.5; // Require at least 50% compatibility
    
    return {
      isCompatible,
      modelType: mapping.type,
      folder: mapping.folder,
      score: Math.min(score, 1.0),
      notes: notes.length > 0 ? notes.join('; ') : undefined,
      requiredNodes
    };
  }

  /**
   * Enforce rate limiting
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      const delay = RATE_LIMIT_DELAY - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    lastRequestTime = Date.now();
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'ComfyUI-Asset-Manager/1.0'
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, { headers });

        if (response && response.ok) {
          return response;
        }

        // Handle rate limiting
        if (response && response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : RETRY_DELAY * Math.pow(2, attempt);
          
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }

        // Handle other HTTP errors
        if (response && response.status >= 400) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
        }

      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        
        // Exponential backoff for network errors
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, attempt)));
      }
    }

    throw new Error('Max retries exceeded');
  }

  /**
   * Handle and format errors
   */
  private handleError(error: unknown, operation: string): ExternalModelError {
    console.error(`CivitAI API error in ${operation}:`, error);

    return {
      code: 'CIVITAI_API_ERROR',
      message: error.message || 'An error occurred while fetching data from CivitAI',
      platform: 'civitai',
      details: {
        operation,
        originalError: error.toString()
      }
    };
  }
}

// Export singleton instance
export const civitaiService = new CivitAIService();

// Export utility functions
export const CivitAIUtils = {
  /**
   * Check if a model is ComfyUI compatible based on type and format
   */
  isComfyUICompatible(modelType: string, fileFormat: string): boolean {
    const compatibleTypes = ['Checkpoint', 'LORA', 'TextualInversion', 'Controlnet', 'VAE', 'Upscaler'];
    const compatibleFormats = ['safetensors', 'ckpt', 'pt', 'pth'];
    
    return compatibleTypes.includes(modelType) && 
           compatibleFormats.includes(fileFormat.toLowerCase());
  },

  /**
   * Get ComfyUI model folder for a CivitAI model type
   */
  getComfyUIFolder(modelType: string): string {
    const folderMapping: Record<string, string> = {
      'Checkpoint': 'checkpoints',
      'LORA': 'loras',
      'TextualInversion': 'embeddings',
      'Controlnet': 'controlnet',
      'VAE': 'vae',
      'Upscaler': 'upscale_models'
    };

    return folderMapping[modelType] || 'models';
  },

  /**
   * Format file size for display
   */
  formatFileSize(sizeKB: number): string {
    if (sizeKB < 1024) {
      return `${sizeKB} KB`;
    } else if (sizeKB < 1024 * 1024) {
      return `${(sizeKB / 1024).toFixed(1)} MB`;
    } else {
      return `${(sizeKB / (1024 * 1024)).toFixed(1)} GB`;
    }
  },

  /**
   * Get model type badge color
   */
  getModelTypeBadgeColor(modelType: string): string {
    const colorMapping: Record<string, string> = {
      'Checkpoint': 'blue',
      'LORA': 'green',
      'TextualInversion': 'purple',
      'Controlnet': 'orange',
      'VAE': 'red',
      'Upscaler': 'teal'
    };

    return colorMapping[modelType] || 'gray';
  }
};