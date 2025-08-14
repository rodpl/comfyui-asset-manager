/**
 * HuggingFace API service for model search and details
 */

import {
  ExternalModel,
  ModelSearchParams,
  ModelSearchResponse,
  HuggingFaceModelResponse,
  HuggingFaceSearchResponse,
  HuggingFaceFilters,
  ComfyUIModelType,
  ExternalModelError
} from '../types';

// HuggingFace API configuration (proxied via backend to avoid CORS)
const HUGGINGFACE_BASE_URL = '/asset_manager/proxy/huggingface';
const DEFAULT_LIMIT = 20;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Rate limiting configuration
const RATE_LIMIT_DELAY = 100; // 100ms between requests
let lastRequestTime = 0;

/**
 * HuggingFace API service class
 */
export class HuggingFaceService {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  /**
   * Search models on HuggingFace
   */
  async searchModels(params: ModelSearchParams): Promise<ModelSearchResponse> {
    try {
      await this.enforceRateLimit();

      const searchParams = this.buildSearchParams(params);
      const url = `${HUGGINGFACE_BASE_URL}/models?${searchParams.toString()}`;

      const response = await this.fetchWithRetry(url);
      const data: HuggingFaceSearchResponse | HuggingFaceModelResponse[] = await response.json();

      // Transform initial response
      let result = this.transformSearchResponse(data, params);

      // Best-effort enrichment to obtain thumbnails (search API often lacks file list)
      const modelsNeedingThumb = result.models
        .filter(m => !m.thumbnailUrl)
        .slice(0, 12);

      if (modelsNeedingThumb.length > 0) {
        const enriched = await Promise.allSettled(
          modelsNeedingThumb.map(m => this.getModelDetails(m.id))
        );

        const enrichedById = new Map<string, ExternalModel>();
        enriched.forEach((p, idx) => {
          if (p.status === 'fulfilled' && p.value) {
            enrichedById.set(modelsNeedingThumb[idx].id, p.value);
          }
        });

        if (enrichedById.size > 0) {
          result = {
            ...result,
            models: result.models.map(m => enrichedById.get(m.id) || m),
          };
        }
      }

      return result;
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

      const url = `${HUGGINGFACE_BASE_URL}/models/${modelId}`;
      const response = await this.fetchWithRetry(url);
      const data: HuggingFaceModelResponse = await response.json();

      return this.transformModelResponse(data);
    } catch (error) {
      throw this.handleError(error, 'getModelDetails');
    }
  }

  /**
   * Build search parameters for HuggingFace API
   */
  private buildSearchParams(params: ModelSearchParams): URLSearchParams {
    const searchParams = new URLSearchParams();

    // Basic parameters
    if (params.query) {
      searchParams.append('search', params.query);
    }

    searchParams.append('limit', (params.limit || DEFAULT_LIMIT).toString());
    
    // Calculate page offset
    const page = Math.floor((params.offset || 0) / (params.limit || DEFAULT_LIMIT));
    if (page > 0) {
      searchParams.append('skip', (page * (params.limit || DEFAULT_LIMIT)).toString());
    }

    // HuggingFace-specific filters
    const filters = params.filters as HuggingFaceFilters;
    if (filters) {
      if (filters.author) {
        searchParams.append('author', filters.author);
      }

      if (filters.library && filters.library.length > 0) {
        filters.library.forEach(lib => searchParams.append('library', lib));
      }

      if (filters.language && filters.language.length > 0) {
        filters.language.forEach(lang => searchParams.append('language', lang));
      }

      if (filters.license && filters.license.length > 0) {
        filters.license.forEach(license => searchParams.append('license', license));
      }

      if (filters.task && filters.task.length > 0) {
        filters.task.forEach(task => searchParams.append('pipeline_tag', task));
      }

      if (filters.sort) {
        searchParams.append('sort', filters.sort);
      }

      if (filters.direction) {
        // HuggingFace API expects -1 (desc) or 1 (asc)
        const directionValue = filters.direction === 'desc' ? '-1' : '1';
        searchParams.append('direction', directionValue);
      }
    }

    // Add ComfyUI-compatible filtering by default
    if (!filters?.task) {
      // Focus on diffusion models and ComfyUI-compatible tasks
      const compatibleTasks = [
        'text-to-image',
        'image-to-image',
        'unconditional-image-generation',
        'image-classification',
        'feature-extraction'
      ];
      compatibleTasks.forEach(task => searchParams.append('pipeline_tag', task));
    }

    if (!filters?.library) {
      // Focus on libraries commonly used with ComfyUI
      const compatibleLibraries = ['diffusers', 'transformers', 'pytorch'];
      compatibleLibraries.forEach(lib => searchParams.append('library', lib));
    }

    return searchParams;
  }

  /**
   * Transform HuggingFace search response to our format
   */
  private transformSearchResponse(
    data: HuggingFaceSearchResponse | HuggingFaceModelResponse[], 
    params: ModelSearchParams
  ): ModelSearchResponse {
    const limit = params.limit || DEFAULT_LIMIT;
    const currentOffset = params.offset || 0;

    // API sometimes returns an array of models directly
    const items: HuggingFaceModelResponse[] = Array.isArray(data)
      ? data
      : (data?.models ?? []);

    const models = items.map(item => this.transformModelResponse(item));
    const numItemsOnPage = Array.isArray(data) ? items.length : (data?.numItemsOnPage ?? items.length);
    const total = Array.isArray(data) ? (currentOffset + items.length) : (data?.numTotalItems ?? items.length);

    return {
      models,
      total,
      hasMore: numItemsOnPage === limit && models.length === limit,
      nextOffset: numItemsOnPage === limit ? currentOffset + limit : undefined
    };
  }

  /**
   * Transform HuggingFace model response to ExternalModel
   */
  private transformModelResponse(data: HuggingFaceModelResponse): ExternalModel {
    const compatibility = this.assessComfyUICompatibility(data);
    
    const siblings = data.siblings || [];
    // Calculate total file size from siblings
    const totalSize = siblings.reduce((sum, sibling) => sum + (sibling.size || 0), 0);
    
    // Get the main model file (usually the largest or a specific format)
    const modelFiles = siblings.filter(s => 
      s.rfilename.endsWith('.safetensors') || 
      s.rfilename.endsWith('.bin') || 
      s.rfilename.endsWith('.ckpt') ||
      s.rfilename.endsWith('.pt')
    );
    const mainFile = modelFiles.reduce((largest, file) => 
      (file.size || 0) > (largest?.size || 0) ? file : largest, modelFiles[0]);

    // Extract file format from main file
    const fileFormat = mainFile ? mainFile.rfilename.split('.').pop() : undefined;

    // Derive thumbnail URL from repo assets if available
    const imageSiblings = siblings.filter(s => 
      /\.(png|jpg|jpeg|webp)$/i.test(s.rfilename)
    );
    const preferredImage = imageSiblings.find(s => /thumbnail|preview|cover|logo/i.test(s.rfilename)) || imageSiblings[0];
    const revision = data.sha || 'main';
    const remoteThumb = preferredImage
      ? `https://huggingface.co/${encodeURIComponent(data.id)}/resolve/${encodeURIComponent(revision)}/${preferredImage.rfilename.split('/').map(encodeURIComponent).join('/')}`
      : undefined;
    const thumbnailUrl = remoteThumb
      ? `/asset_manager/proxy/huggingface/file?url=${encodeURIComponent(remoteThumb)}`
      : undefined;

    return {
      id: data.id,
      name: data.id.split('/').pop() || data.id, // Use model name from ID
      description: this.extractDescription(data),
      author: data.author,
      platform: 'huggingface',
      thumbnailUrl,
      tags: data.tags || [],
      downloadCount: data.downloads,
      rating: undefined, // HuggingFace uses likes instead of ratings
      createdAt: data.created_at,
      updatedAt: data.last_modified,
      metadata: {
        library: data.library_name || '',
        pipelineTag: data.pipeline_tag || '',
        license: data.cardData?.license || '',
        languages: data.cardData?.language || [],
        datasets: data.cardData?.datasets || [],
        metrics: data.cardData?.metrics || [],
        siblings: siblings.map(sibling => ({
          rfilename: sibling.rfilename,
          size: sibling.size || 0
        })),
        comfyuiCompatible: compatibility.isCompatible,
        comfyuiModelType: compatibility.modelType,
        supportedFormats: this.getSupportedFormats(siblings),
        diffusionType: this.getDiffusionType(data)
      },
      comfyuiCompatibility: {
        isCompatible: compatibility.isCompatible,
        modelFolder: compatibility.folder,
        compatibilityNotes: compatibility.notes,
        requiredNodes: compatibility.requiredNodes
      },
      modelType: compatibility.modelType,
      baseModel: this.extractBaseModel(data),
      fileSize: totalSize || undefined,
      fileFormat
    };
  }

  /**
   * Assess ComfyUI compatibility for a HuggingFace model
   */
  private assessComfyUICompatibility(data: HuggingFaceModelResponse): {
    isCompatible: boolean;
    modelType: ComfyUIModelType;
    folder: string;
    score: number;
    notes?: string;
    requiredNodes: string[];
  } {
    const pipelineTag = data.pipeline_tag || '';
    const library = data.library_name || '';
    const tags = data.tags || [];
    const siblings = data.siblings || [];

    // Map HuggingFace pipeline tags to ComfyUI types
    const pipelineMapping: Record<string, { type: ComfyUIModelType; folder: string }> = {
      'text-to-image': { type: ComfyUIModelType.CHECKPOINT, folder: 'checkpoints' },
      'image-to-image': { type: ComfyUIModelType.CHECKPOINT, folder: 'checkpoints' },
      'unconditional-image-generation': { type: ComfyUIModelType.CHECKPOINT, folder: 'checkpoints' },
      'image-classification': { type: ComfyUIModelType.UNKNOWN, folder: 'models' },
      'feature-extraction': { type: ComfyUIModelType.UNKNOWN, folder: 'models' }
    };

    const mapping = pipelineMapping[pipelineTag] || { type: ComfyUIModelType.UNKNOWN, folder: 'models' };
    
    let score = 0;
    let notes: string[] = [];
    let requiredNodes: string[] = [];

    // Pipeline tag compatibility
    if (mapping.type !== ComfyUIModelType.UNKNOWN) {
      score += 0.3;
    } else {
      notes.push(`Pipeline tag may not be supported: ${pipelineTag}`);
    }

    // Library compatibility
    const compatibleLibraries = ['diffusers', 'transformers'];
    if (compatibleLibraries.includes(library)) {
      score += 0.2;
    } else if (library) {
      notes.push(`Library may not be fully supported: ${library}`);
    }

    // File format compatibility
    const supportedFormats = ['safetensors', 'bin', 'ckpt', 'pt'];
    const hasCompatibleFormat = siblings.some(sibling => 
      supportedFormats.some(format => sibling.rfilename.endsWith(`.${format}`))
    );
    
    if (hasCompatibleFormat) {
      score += 0.3;
      // Bonus for safetensors
      if (siblings.some(s => s.rfilename.endsWith('.safetensors'))) {
        score += 0.1;
      }
    } else {
      notes.push('No compatible file formats found');
    }

    // Tag-based compatibility checks
    const diffusionTags = ['stable-diffusion', 'diffusion', 'text-to-image', 'image-generation'];
    if (tags.some(tag => diffusionTags.some(dt => tag.includes(dt)))) {
      score += 0.1;
    }

    // Special handling for specific model types
    if (tags.includes('controlnet')) {
      mapping.type = ComfyUIModelType.CONTROLNET;
      mapping.folder = 'controlnet';
      requiredNodes.push('ControlNet');
      score += 0.1;
    }

    if (tags.includes('lora')) {
      mapping.type = ComfyUIModelType.LORA;
      mapping.folder = 'loras';
      score += 0.1;
    }

    const isCompatible = score >= 0.5; // Require at least 50% compatibility for HF models
    
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
   * Extract description from model data
   */
  private extractDescription(data: HuggingFaceModelResponse): string {
    // Try to get description from card data or use model ID
    if (data.cardData && typeof data.cardData === 'object') {
      // Look for common description fields
      const descFields = ['description', 'summary', 'model_description'];
      for (const field of descFields) {
        if (data.cardData[field] && typeof data.cardData[field] === 'string') {
          return data.cardData[field];
        }
      }
    }
    
    // Fallback to generating description from model ID and tags
    const modelName = data.id.split('/').pop() || data.id;
    const tags = data.tags || [];
    const relevantTags = tags.slice(0, 3).join(', ');
    
    return relevantTags ? 
      `${modelName} - ${relevantTags}` : 
      `HuggingFace model: ${modelName}`;
  }

  /**
   * Extract base model information from tags and metadata
   */
  private extractBaseModel(data: HuggingFaceModelResponse): string | undefined {
    const tags = data.tags || [];
    
    // Look for base model indicators in tags
    const baseModelTags = [
      'stable-diffusion-xl',
      'stable-diffusion-2-1',
      'stable-diffusion-2',
      'stable-diffusion-1-5',
      'stable-diffusion'
    ];

    for (const baseTag of baseModelTags) {
      if (tags.some(tag => tag.includes(baseTag))) {
        return baseTag.replace(/-/g, ' ').toUpperCase();
      }
    }

    // Check in card data
    if (data.cardData?.base_model) {
      return data.cardData.base_model;
    }

    return undefined;
  }

  /**
   * Get supported file formats from siblings
   */
  private getSupportedFormats(siblings: Array<{ rfilename: string }>): string[] {
    const formats = new Set<string>();
    
    siblings.forEach(sibling => {
      const extension = sibling.rfilename.split('.').pop()?.toLowerCase();
      if (extension && ['safetensors', 'bin', 'ckpt', 'pt', 'pth'].includes(extension)) {
        formats.add(extension);
      }
    });

    return Array.from(formats);
  }

  /**
   * Determine diffusion type from model data
   */
  private getDiffusionType(data: HuggingFaceModelResponse): string {
    const tags = data.tags || [];
    
    if (tags.some(tag => tag.includes('stable-diffusion-xl'))) {
      return 'stable-diffusion-xl';
    }
    
    if (tags.some(tag => tag.includes('stable-diffusion-2'))) {
      return 'stable-diffusion-2';
    }
    
    if (tags.some(tag => tag.includes('stable-diffusion'))) {
      return 'stable-diffusion';
    }

    if (data.pipeline_tag === 'text-to-image') {
      return 'text-to-image';
    }

    return 'unknown';
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
          throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
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
    console.error(`HuggingFace API error in ${operation}:`, error);
    const message = error instanceof Error ? error.message : String(error);

    return {
      code: 'HUGGINGFACE_API_ERROR',
      message: message || 'An error occurred while fetching data from HuggingFace',
      platform: 'huggingface',
      details: {
        operation,
        originalError: String(error)
      }
    };
  }
}

// Export singleton instance
export const huggingfaceService = new HuggingFaceService();

// Export utility functions
export const HuggingFaceUtils = {
  /**
   * Check if a model is ComfyUI compatible based on pipeline tag and library
   */
  isComfyUICompatible(pipelineTag: string, library: string, siblings: Array<{ rfilename: string }>): boolean {
    const compatiblePipelines = ['text-to-image', 'image-to-image', 'unconditional-image-generation'];
    const compatibleLibraries = ['diffusers', 'transformers'];
    const supportedFormats = ['safetensors', 'bin', 'ckpt', 'pt'];
    
    const hasPipeline = compatiblePipelines.includes(pipelineTag);
    const hasLibrary = compatibleLibraries.includes(library);
    const hasFormat = siblings.some(sibling => 
      supportedFormats.some(format => sibling.rfilename.endsWith(`.${format}`))
    );
    
    return hasPipeline && hasLibrary && hasFormat;
  },

  /**
   * Get ComfyUI model folder for a HuggingFace model
   */
  getComfyUIFolder(pipelineTag: string, tags: string[]): string {
    if (tags.includes('controlnet')) {
      return 'controlnet';
    }
    
    if (tags.includes('lora')) {
      return 'loras';
    }

    if (tags.includes('vae')) {
      return 'vae';
    }

    const folderMapping: Record<string, string> = {
      'text-to-image': 'checkpoints',
      'image-to-image': 'checkpoints',
      'unconditional-image-generation': 'checkpoints'
    };

    return folderMapping[pipelineTag] || 'models';
  },

  /**
   * Format file size for display
   */
  formatFileSize(sizeBytes: number): string {
    if (sizeBytes < 1024) {
      return `${sizeBytes} B`;
    } else if (sizeBytes < 1024 * 1024) {
      return `${(sizeBytes / 1024).toFixed(1)} KB`;
    } else if (sizeBytes < 1024 * 1024 * 1024) {
      return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      return `${(sizeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
  },

  /**
   * Get pipeline tag badge color
   */
  getPipelineTagBadgeColor(pipelineTag: string): string {
    const colorMapping: Record<string, string> = {
      'text-to-image': 'blue',
      'image-to-image': 'green',
      'unconditional-image-generation': 'purple',
      'image-classification': 'orange',
      'feature-extraction': 'teal'
    };

    return colorMapping[pipelineTag] || 'gray';
  },

  /**
   * Extract model name from HuggingFace model ID
   */
  extractModelName(modelId: string): string {
    return modelId.split('/').pop() || modelId;
  },

  /**
   * Check if model has specific capability based on tags
   */
  hasCapability(tags: string[], capability: string): boolean {
    return tags.some(tag => tag.toLowerCase().includes(capability.toLowerCase()));
  }
};