/**
 * Utility functions for model data processing and ComfyUI integration
 */

import { ComfyUIModelType, ExternalModel, ModelTypeMapping } from '../types';

// Model type mappings for different platforms
export const CIVITAI_TYPE_MAPPINGS: Record<string, ModelTypeMapping> = {
  'Checkpoint': {
    civitaiType: 'Checkpoint',
    huggingfaceTag: 'text-to-image',
    comfyuiType: ComfyUIModelType.CHECKPOINT,
    comfyuiFolder: 'checkpoints',
    description: 'Full model checkpoint'
  },
  'LORA': {
    civitaiType: 'LORA',
    huggingfaceTag: '',
    comfyuiType: ComfyUIModelType.LORA,
    comfyuiFolder: 'loras',
    description: 'Low-Rank Adaptation model'
  },
  'TextualInversion': {
    civitaiType: 'TextualInversion',
    huggingfaceTag: '',
    comfyuiType: ComfyUIModelType.EMBEDDING,
    comfyuiFolder: 'embeddings',
    description: 'Textual Inversion embedding'
  },
  'Hypernetwork': {
    civitaiType: 'Hypernetwork',
    huggingfaceTag: '',
    comfyuiType: ComfyUIModelType.UNKNOWN,
    comfyuiFolder: 'hypernetworks',
    description: 'Hypernetwork model'
  },
  'AestheticGradient': {
    civitaiType: 'AestheticGradient',
    huggingfaceTag: '',
    comfyuiType: ComfyUIModelType.UNKNOWN,
    comfyuiFolder: 'embeddings',
    description: 'Aesthetic gradient'
  },
  'Controlnet': {
    civitaiType: 'Controlnet',
    huggingfaceTag: 'image-to-image',
    comfyuiType: ComfyUIModelType.CONTROLNET,
    comfyuiFolder: 'controlnet',
    description: 'ControlNet model'
  },
  'Poses': {
    civitaiType: 'Poses',
    huggingfaceTag: '',
    comfyuiType: ComfyUIModelType.CONTROLNET,
    comfyuiFolder: 'controlnet',
    description: 'Pose control model'
  },
  'VAE': {
    civitaiType: 'VAE',
    huggingfaceTag: '',
    comfyuiType: ComfyUIModelType.VAE,
    comfyuiFolder: 'vae',
    description: 'Variational Autoencoder'
  },
  'Upscaler': {
    civitaiType: 'Upscaler',
    huggingfaceTag: '',
    comfyuiType: ComfyUIModelType.UPSCALER,
    comfyuiFolder: 'upscale_models',
    description: 'Image upscaling model'
  }
};

export const HUGGINGFACE_PIPELINE_MAPPINGS: Record<string, ModelTypeMapping> = {
  'text-to-image': {
    civitaiType: 'Checkpoint',
    huggingfaceTag: 'text-to-image',
    comfyuiType: ComfyUIModelType.CHECKPOINT,
    comfyuiFolder: 'checkpoints',
    description: 'Text-to-image diffusion model'
  },
  'image-to-image': {
    civitaiType: 'Checkpoint',
    huggingfaceTag: 'image-to-image',
    comfyuiType: ComfyUIModelType.CHECKPOINT,
    comfyuiFolder: 'checkpoints',
    description: 'Image-to-image diffusion model'
  },
  'unconditional-image-generation': {
    civitaiType: 'Checkpoint',
    huggingfaceTag: 'unconditional-image-generation',
    comfyuiType: ComfyUIModelType.CHECKPOINT,
    comfyuiFolder: 'checkpoints',
    description: 'Unconditional image generation model'
  }
};

// Supported file formats for ComfyUI
export const SUPPORTED_FILE_FORMATS = new Set([
  'safetensors',
  'ckpt',
  'pt',
  'pth',
  'bin',
  'pkl'
]);

// Known base models
export const KNOWN_BASE_MODELS = new Set([
  'SD 1.5',
  'SDXL 1.0',
  'SD 2.1',
  'SD 2.0',
  'SDXL Turbo',
  'SD 1.4'
]);

/**
 * Get ComfyUI model type from CivitAI type
 */
export function getComfyUITypeFromCivitAI(civitaiType: string): ComfyUIModelType {
  const mapping = CIVITAI_TYPE_MAPPINGS[civitaiType];
  return mapping?.comfyuiType || ComfyUIModelType.UNKNOWN;
}

/**
 * Get ComfyUI folder from CivitAI type
 */
export function getComfyUIFolderFromCivitAI(civitaiType: string): string {
  const mapping = CIVITAI_TYPE_MAPPINGS[civitaiType];
  return mapping?.comfyuiFolder || 'models';
}

/**
 * Get ComfyUI model type from HuggingFace pipeline tag
 */
export function getComfyUITypeFromHuggingFace(pipelineTag: string): ComfyUIModelType {
  const mapping = HUGGINGFACE_PIPELINE_MAPPINGS[pipelineTag];
  return mapping?.comfyuiType || ComfyUIModelType.UNKNOWN;
}

/**
 * Get ComfyUI folder from HuggingFace pipeline tag
 */
export function getComfyUIFolderFromHuggingFace(pipelineTag: string): string {
  const mapping = HUGGINGFACE_PIPELINE_MAPPINGS[pipelineTag];
  return mapping?.comfyuiFolder || 'models';
}

/**
 * Check if a file format is supported by ComfyUI
 */
export function isFormatSupported(fileFormat: string): boolean {
  return SUPPORTED_FILE_FORMATS.has(fileFormat.toLowerCase());
}

/**
 * Calculate compatibility score for ComfyUI (0-1)
 */
export function getCompatibilityScore(
  modelType: string,
  fileFormat: string,
  baseModel: string,
  platform: 'civitai' | 'huggingface'
): number {
  let score = 0.0;

  // Base score for known model types
  const mappings = platform === 'civitai' ? CIVITAI_TYPE_MAPPINGS : HUGGINGFACE_PIPELINE_MAPPINGS;
  if (mappings[modelType]) {
    score += 0.4;
  }

  // Bonus for supported file formats
  if (isFormatSupported(fileFormat)) {
    score += 0.3;
    // Extra bonus for safetensors
    if (fileFormat.toLowerCase() === 'safetensors') {
      score += 0.1;
    }
  }

  // Bonus for known base models
  if (KNOWN_BASE_MODELS.has(baseModel)) {
    score += 0.2;
  }

  return Math.min(score, 1.0);
}

/**
 * Format file size for display
 */
export function formatFileSize(sizeInBytes?: number): string {
  if (!sizeInBytes) return 'Unknown';

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = sizeInBytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Get model type display name
 */
export function getModelTypeDisplayName(modelType: ComfyUIModelType): string {
  const displayNames: Record<ComfyUIModelType, string> = {
    [ComfyUIModelType.CHECKPOINT]: 'Checkpoint',
    [ComfyUIModelType.LORA]: 'LoRA',
    [ComfyUIModelType.VAE]: 'VAE',
    [ComfyUIModelType.EMBEDDING]: 'Embedding',
    [ComfyUIModelType.CONTROLNET]: 'ControlNet',
    [ComfyUIModelType.UPSCALER]: 'Upscaler',
    [ComfyUIModelType.UNKNOWN]: 'Unknown'
  };

  return displayNames[modelType] || 'Unknown';
}

/**
 * Get model type color for UI display
 */
export function getModelTypeColor(modelType: ComfyUIModelType): string {
  const colors: Record<ComfyUIModelType, string> = {
    [ComfyUIModelType.CHECKPOINT]: '#3b82f6', // blue
    [ComfyUIModelType.LORA]: '#10b981', // green
    [ComfyUIModelType.VAE]: '#f59e0b', // yellow
    [ComfyUIModelType.EMBEDDING]: '#8b5cf6', // purple
    [ComfyUIModelType.CONTROLNET]: '#ef4444', // red
    [ComfyUIModelType.UPSCALER]: '#06b6d4', // cyan
    [ComfyUIModelType.UNKNOWN]: '#6b7280' // gray
  };

  return colors[modelType] || '#6b7280';
}

/**
 * Check if model has specific tag (case-insensitive)
 */
export function modelHasTag(model: ExternalModel, tag: string): boolean {
  return model.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()));
}

/**
 * Filter models by compatibility
 */
export function filterCompatibleModels(models: ExternalModel[]): ExternalModel[] {
  return models.filter(model => model.comfyuiCompatibility.isCompatible);
}

/**
 * Sort models by compatibility score
 */
export function sortModelsByCompatibility(models: ExternalModel[]): ExternalModel[] {
  return [...models].sort((a, b) => {
    // Compatible models first
    if (a.comfyuiCompatibility.isCompatible !== b.comfyuiCompatibility.isCompatible) {
      return a.comfyuiCompatibility.isCompatible ? -1 : 1;
    }

    // Then by download count
    return b.downloadCount - a.downloadCount;
  });
}

/**
 * Get platform-specific model URL
 */
export function getModelUrl(model: ExternalModel): string {
  if (model.platform === 'civitai') {
    return `https://civitai.com/models/${model.id}`;
  } else if (model.platform === 'huggingface') {
    return `https://huggingface.co/${model.id}`;
  }
  return '';
}

/**
 * Validate external model data
 */
export function validateExternalModel(model: Partial<ExternalModel>): string[] {
  const errors: string[] = [];

  if (!model.id) errors.push('Model ID is required');
  if (!model.name) errors.push('Model name is required');
  if (!model.author) errors.push('Model author is required');
  if (!model.platform || !['civitai', 'huggingface'].includes(model.platform)) {
    errors.push('Valid platform (civitai or huggingface) is required');
  }
  if (model.rating !== undefined && (model.rating < 0 || model.rating > 5)) {
    errors.push('Rating must be between 0 and 5');
  }
  if (model.downloadCount !== undefined && model.downloadCount < 0) {
    errors.push('Download count cannot be negative');
  }

  return errors;
}