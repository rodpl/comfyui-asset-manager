/**
 * Constants for external model browser feature
 */

import { ComfyUIModelType } from './types';

// ComfyUI model folder mappings
export const COMFYUI_MODEL_FOLDERS: Record<ComfyUIModelType, string> = {
  [ComfyUIModelType.CHECKPOINT]: 'checkpoints',
  [ComfyUIModelType.LORA]: 'loras',
  [ComfyUIModelType.VAE]: 'vae',
  [ComfyUIModelType.EMBEDDING]: 'embeddings',
  [ComfyUIModelType.CONTROLNET]: 'controlnet',
  [ComfyUIModelType.UPSCALER]: 'upscale_models',
  [ComfyUIModelType.UNKNOWN]: 'models'
};

// Model type display names
export const MODEL_TYPE_DISPLAY_NAMES: Record<ComfyUIModelType, string> = {
  [ComfyUIModelType.CHECKPOINT]: 'Checkpoint',
  [ComfyUIModelType.LORA]: 'LoRA',
  [ComfyUIModelType.VAE]: 'VAE',
  [ComfyUIModelType.EMBEDDING]: 'Embedding',
  [ComfyUIModelType.CONTROLNET]: 'ControlNet',
  [ComfyUIModelType.UPSCALER]: 'Upscaler',
  [ComfyUIModelType.UNKNOWN]: 'Unknown'
};

// Model type colors for UI
export const MODEL_TYPE_COLORS: Record<ComfyUIModelType, string> = {
  [ComfyUIModelType.CHECKPOINT]: '#3b82f6', // blue
  [ComfyUIModelType.LORA]: '#10b981', // green
  [ComfyUIModelType.VAE]: '#f59e0b', // yellow
  [ComfyUIModelType.EMBEDDING]: '#8b5cf6', // purple
  [ComfyUIModelType.CONTROLNET]: '#ef4444', // red
  [ComfyUIModelType.UPSCALER]: '#06b6d4', // cyan
  [ComfyUIModelType.UNKNOWN]: '#6b7280' // gray
};

// CivitAI sort options
export const CIVITAI_SORT_OPTIONS = [
  { value: 'Highest Rated', label: 'Highest Rated' },
  { value: 'Most Downloaded', label: 'Most Downloaded' },
  { value: 'Newest', label: 'Newest' },
  { value: 'Most Liked', label: 'Most Liked' }
] as const;

// CivitAI period options
export const CIVITAI_PERIOD_OPTIONS = [
  { value: 'AllTime', label: 'All Time' },
  { value: 'Year', label: 'Year' },
  { value: 'Month', label: 'Month' },
  { value: 'Week', label: 'Week' },
  { value: 'Day', label: 'Day' }
] as const;

// HuggingFace sort options
export const HUGGINGFACE_SORT_OPTIONS = [
  { value: 'downloads', label: 'Most Downloaded' },
  { value: 'likes', label: 'Most Liked' },
  { value: 'updated', label: 'Recently Updated' },
  { value: 'created', label: 'Recently Created' }
] as const;

// Common base models
export const BASE_MODELS = [
  'SD 1.5',
  'SDXL 1.0',
  'SD 2.1',
  'SD 2.0',
  'SDXL Turbo',
  'SD 1.4',
  'Other'
] as const;

// File format priorities (higher number = better)
export const FILE_FORMAT_PRIORITY: Record<string, number> = {
  'safetensors': 10,
  'ckpt': 5,
  'pt': 4,
  'pth': 4,
  'bin': 3,
  'pkl': 1
};

// API endpoints
export const API_ENDPOINTS = {
  EXTERNAL_MODELS: '/asset_manager/external/models',
  CIVITAI_MODELS: '/asset_manager/external/models/civitai',
  HUGGINGFACE_MODELS: '/asset_manager/external/models/huggingface'
} as const;

// Default pagination settings
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Image placeholder for failed loads
export const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NyA3NEg2M0M2MS44OTU0IDc0IDYxIDc0Ljg5NTQgNjEgNzZWMTI0QzYxIDEyNS4xMDUgNjEuODk1NCAxMjYgNjMgMTI2SDg3Qzg4LjEwNDYgMTI2IDg5IDEyNS4xMDUgODkgMTI0Vjc2Qzg5IDc0Ljg5NTQgODguMTA0NiA3NCA4NyA3NFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTEzNyA3NEgxMTNDMTExLjg5NSA3NCAxMTEgNzQuODk1NCAxMTEgNzZWMTI0QzExMSAxMjUuMTA1IDExMS44OTUgMTI2IDExMyAxMjZIMTM3QzEzOC4xMDUgMTI2IDEzOSAxMjUuMTA1IDEzOSAxMjRWNzZDMTM5IDc0Ljg5NTQgMTM4LjEwNSA3NCAxMzcgNzRaIiBmaWxsPSIjRDFENURCIi8+Cjwvc3ZnPgo=';

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  API_ERROR: 'Failed to fetch models. Please try again later.',
  INVALID_RESPONSE: 'Invalid response from server.',
  RATE_LIMITED: 'Too many requests. Please wait before trying again.',
  MODEL_NOT_FOUND: 'Model not found.',
  PLATFORM_UNAVAILABLE: 'Platform is currently unavailable.'
} as const;