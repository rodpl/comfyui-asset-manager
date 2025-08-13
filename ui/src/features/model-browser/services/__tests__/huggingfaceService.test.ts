/**
 * Unit tests for HuggingFace API service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HuggingFaceService, HuggingFaceUtils } from '../huggingfaceService';
import { ComfyUIModelType } from '../../types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('HuggingFaceService', () => {
  let service: HuggingFaceService;

  beforeEach(() => {
    service = new HuggingFaceService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchModels', () => {
    it('should search models with basic parameters', async () => {
      const mockResponse = {
        models: [
          {
            id: 'runwayml/stable-diffusion-v1-5',
            author: 'runwayml',
            sha: 'abc123',
            created_at: '2023-01-01T00:00:00Z',
            last_modified: '2023-01-02T00:00:00Z',
            private: false,
            disabled: false,
            downloads: 50000,
            likes: 1000,
            tags: ['stable-diffusion', 'text-to-image', 'diffusion'],
            pipeline_tag: 'text-to-image',
            library_name: 'diffusers',
            cardData: {
              license: 'openrail',
              language: ['en'],
              datasets: ['laion-2b'],
              base_model: 'stable-diffusion-1-5',
            },
            siblings: [
              {
                rfilename: 'model.safetensors',
                size: 4265146304,
              },
              {
                rfilename: 'config.json',
                size: 1024,
              },
            ],
          },
        ],
        numItemsOnPage: 1,
        numTotalItems: 100,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await service.searchModels({
        query: 'stable-diffusion',
        limit: 20,
        offset: 0,
      });

      expect(result.models).toHaveLength(1);
      expect(result.models[0].name).toBe('stable-diffusion-v1-5');
      expect(result.models[0].platform).toBe('huggingface');
      expect(result.models[0].author).toBe('runwayml');
      expect(result.models[0].comfyuiCompatibility.isCompatible).toBe(true);
      expect(result.total).toBe(100);
      expect(result.hasMore).toBe(false); // Only 1 item returned, less than limit
    });

    it('should handle search with filters', async () => {
      const mockResponse = {
        models: [],
        numItemsOnPage: 0,
        numTotalItems: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await service.searchModels({
        query: 'diffusion',
        filters: {
          library: ['diffusers'],
          task: ['text-to-image'],
          sort: 'downloads',
          direction: 'desc',
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('library=diffusers'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('pipeline_tag=text-to-image'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('sort=downloads'),
        expect.any(Object)
      );
    });

    it('should apply default ComfyUI-compatible filters', async () => {
      const mockResponse = {
        models: [],
        numItemsOnPage: 0,
        numTotalItems: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await service.searchModels({ query: 'test' });

      const fetchCall = mockFetch.mock.calls[0][0];
      expect(fetchCall).toContain('pipeline_tag=text-to-image');
      expect(fetchCall).toContain('pipeline_tag=image-to-image');
      expect(fetchCall).toContain('library=diffusers');
      expect(fetchCall).toContain('library=transformers');
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.searchModels({ query: 'test' })).rejects.toThrow('Max retries exceeded');
    }, 10000);

    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      await expect(service.searchModels({ query: 'test' })).rejects.toThrow('Max retries exceeded');
    }, 10000);
  });

  describe('getModelDetails', () => {
    it('should fetch model details', async () => {
      const mockModel = {
        id: 'stabilityai/stable-diffusion-xl-base-1.0',
        author: 'stabilityai',
        sha: 'def456',
        created_at: '2023-06-01T00:00:00Z',
        last_modified: '2023-06-02T00:00:00Z',
        private: false,
        disabled: false,
        downloads: 100000,
        likes: 2000,
        tags: ['stable-diffusion-xl', 'text-to-image', 'diffusion'],
        pipeline_tag: 'text-to-image',
        library_name: 'diffusers',
        cardData: {
          license: 'openrail++',
          language: ['en'],
          base_model: 'stable-diffusion-xl',
        },
        siblings: [
          {
            rfilename: 'unet/diffusion_pytorch_model.safetensors',
            size: 5136043520,
          },
          {
            rfilename: 'vae/diffusion_pytorch_model.safetensors',
            size: 334695424,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModel),
      });

      const result = await service.getModelDetails('stabilityai/stable-diffusion-xl-base-1.0');

      expect(result.id).toBe('stabilityai/stable-diffusion-xl-base-1.0');
      expect(result.name).toBe('stable-diffusion-xl-base-1.0');
      expect(result.author).toBe('stabilityai');
      expect(result.modelType).toBe(ComfyUIModelType.CHECKPOINT);
      expect(result.comfyuiCompatibility.modelFolder).toBe('checkpoints');
      expect(result.baseModel).toBe('STABLE DIFFUSION XL');
    });
  });

  describe('ComfyUI compatibility assessment', () => {
    it('should correctly assess text-to-image model compatibility', async () => {
      const mockModel = {
        id: 'test/text-to-image-model',
        author: 'test',
        sha: 'abc123',
        created_at: '2023-01-01T00:00:00Z',
        last_modified: '2023-01-02T00:00:00Z',
        private: false,
        disabled: false,
        downloads: 1000,
        likes: 100,
        tags: ['stable-diffusion', 'text-to-image'],
        pipeline_tag: 'text-to-image',
        library_name: 'diffusers',
        siblings: [
          {
            rfilename: 'model.safetensors',
            size: 4000000000,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModel),
      });

      const result = await service.getModelDetails('test/text-to-image-model');

      expect(result.comfyuiCompatibility.isCompatible).toBe(true);
      expect(result.modelType).toBe(ComfyUIModelType.CHECKPOINT);
      expect(result.comfyuiCompatibility.modelFolder).toBe('checkpoints');
    });

    it('should handle ControlNet models', async () => {
      const mockModel = {
        id: 'test/controlnet-model',
        author: 'test',
        sha: 'abc123',
        created_at: '2023-01-01T00:00:00Z',
        last_modified: '2023-01-02T00:00:00Z',
        private: false,
        disabled: false,
        downloads: 500,
        likes: 50,
        tags: ['controlnet', 'stable-diffusion'],
        pipeline_tag: 'image-to-image',
        library_name: 'diffusers',
        siblings: [
          {
            rfilename: 'diffusion_pytorch_model.safetensors',
            size: 1400000000,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModel),
      });

      const result = await service.getModelDetails('test/controlnet-model');

      expect(result.modelType).toBe(ComfyUIModelType.CONTROLNET);
      expect(result.comfyuiCompatibility.modelFolder).toBe('controlnet');
      expect(result.comfyuiCompatibility.requiredNodes).toContain('ControlNet');
    });

    it('should handle LoRA models', async () => {
      const mockModel = {
        id: 'test/lora-model',
        author: 'test',
        sha: 'abc123',
        created_at: '2023-01-01T00:00:00Z',
        last_modified: '2023-01-02T00:00:00Z',
        private: false,
        disabled: false,
        downloads: 200,
        likes: 20,
        tags: ['lora', 'stable-diffusion'],
        pipeline_tag: 'text-to-image',
        library_name: 'diffusers',
        siblings: [
          {
            rfilename: 'pytorch_lora_weights.safetensors',
            size: 144000000,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModel),
      });

      const result = await service.getModelDetails('test/lora-model');

      expect(result.modelType).toBe(ComfyUIModelType.LORA);
      expect(result.comfyuiCompatibility.modelFolder).toBe('loras');
    });

    it('should handle incompatible models', async () => {
      const mockModel = {
        id: 'test/incompatible-model',
        author: 'test',
        sha: 'abc123',
        created_at: '2023-01-01T00:00:00Z',
        last_modified: '2023-01-02T00:00:00Z',
        private: false,
        disabled: false,
        downloads: 100,
        likes: 10,
        tags: ['nlp', 'text-classification'],
        pipeline_tag: 'text-classification',
        library_name: 'transformers',
        siblings: [
          {
            rfilename: 'pytorch_model.bin',
            size: 500000000,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModel),
      });

      const result = await service.getModelDetails('test/incompatible-model');

      expect(result.comfyuiCompatibility.isCompatible).toBe(true); // Has compatible format (bin)
      expect(result.modelType).toBe(ComfyUIModelType.UNKNOWN);
      expect(result.comfyuiCompatibility.compatibilityNotes).toContain(
        'Pipeline tag may not be supported'
      );
    });
  });

  describe('description extraction', () => {
    it('should extract description from card data', async () => {
      const mockModel = {
        id: 'test/model-with-description',
        author: 'test',
        sha: 'abc123',
        created_at: '2023-01-01T00:00:00Z',
        last_modified: '2023-01-02T00:00:00Z',
        private: false,
        disabled: false,
        downloads: 100,
        likes: 10,
        tags: ['stable-diffusion'],
        pipeline_tag: 'text-to-image',
        library_name: 'diffusers',
        cardData: {
          description: 'This is a test model for generating images',
        },
        siblings: [
          {
            rfilename: 'model.safetensors',
            size: 4000000000,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModel),
      });

      const result = await service.getModelDetails('test/model-with-description');

      expect(result.description).toBe('This is a test model for generating images');
    });

    it('should generate description from model name and tags', async () => {
      const mockModel = {
        id: 'test/model-without-description',
        author: 'test',
        sha: 'abc123',
        created_at: '2023-01-01T00:00:00Z',
        last_modified: '2023-01-02T00:00:00Z',
        private: false,
        disabled: false,
        downloads: 100,
        likes: 10,
        tags: ['stable-diffusion', 'anime', 'art'],
        pipeline_tag: 'text-to-image',
        library_name: 'diffusers',
        siblings: [
          {
            rfilename: 'model.safetensors',
            size: 4000000000,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModel),
      });

      const result = await service.getModelDetails('test/model-without-description');

      expect(result.description).toBe('model-without-description - stable-diffusion, anime, art');
    });
  });
});

describe('HuggingFaceUtils', () => {
  describe('isComfyUICompatible', () => {
    it('should return true for compatible combinations', () => {
      const siblings = [{ rfilename: 'model.safetensors' }];

      expect(HuggingFaceUtils.isComfyUICompatible('text-to-image', 'diffusers', siblings)).toBe(
        true
      );
      expect(HuggingFaceUtils.isComfyUICompatible('image-to-image', 'transformers', siblings)).toBe(
        true
      );
    });

    it('should return false for incompatible combinations', () => {
      const siblings = [{ rfilename: 'model.unknown' }];

      expect(
        HuggingFaceUtils.isComfyUICompatible('text-classification', 'diffusers', siblings)
      ).toBe(false);
      expect(HuggingFaceUtils.isComfyUICompatible('text-to-image', 'unknown', siblings)).toBe(
        false
      );
      expect(HuggingFaceUtils.isComfyUICompatible('text-to-image', 'diffusers', siblings)).toBe(
        false
      );
    });
  });

  describe('getComfyUIFolder', () => {
    it('should return correct folders based on tags', () => {
      expect(HuggingFaceUtils.getComfyUIFolder('text-to-image', ['controlnet'])).toBe('controlnet');
      expect(HuggingFaceUtils.getComfyUIFolder('text-to-image', ['lora'])).toBe('loras');
      expect(HuggingFaceUtils.getComfyUIFolder('text-to-image', ['vae'])).toBe('vae');
      expect(HuggingFaceUtils.getComfyUIFolder('text-to-image', [])).toBe('checkpoints');
      expect(HuggingFaceUtils.getComfyUIFolder('unknown-pipeline', [])).toBe('models');
    });
  });

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(HuggingFaceUtils.formatFileSize(500)).toBe('500 B');
      expect(HuggingFaceUtils.formatFileSize(1536)).toBe('1.5 KB');
      expect(HuggingFaceUtils.formatFileSize(1572864)).toBe('1.5 MB');
      expect(HuggingFaceUtils.formatFileSize(1610612736)).toBe('1.5 GB');
    });
  });

  describe('getPipelineTagBadgeColor', () => {
    it('should return appropriate colors for pipeline tags', () => {
      expect(HuggingFaceUtils.getPipelineTagBadgeColor('text-to-image')).toBe('blue');
      expect(HuggingFaceUtils.getPipelineTagBadgeColor('image-to-image')).toBe('green');
      expect(HuggingFaceUtils.getPipelineTagBadgeColor('unconditional-image-generation')).toBe(
        'purple'
      );
      expect(HuggingFaceUtils.getPipelineTagBadgeColor('unknown-pipeline')).toBe('gray');
    });
  });

  describe('extractModelName', () => {
    it('should extract model name from ID', () => {
      expect(HuggingFaceUtils.extractModelName('runwayml/stable-diffusion-v1-5')).toBe(
        'stable-diffusion-v1-5'
      );
      expect(HuggingFaceUtils.extractModelName('single-name')).toBe('single-name');
      expect(HuggingFaceUtils.extractModelName('org/sub/model-name')).toBe('model-name');
    });
  });

  describe('hasCapability', () => {
    it('should check for capabilities in tags', () => {
      const tags = ['stable-diffusion', 'controlnet', 'text-to-image'];

      expect(HuggingFaceUtils.hasCapability(tags, 'controlnet')).toBe(true);
      expect(HuggingFaceUtils.hasCapability(tags, 'ControlNet')).toBe(true);
      expect(HuggingFaceUtils.hasCapability(tags, 'lora')).toBe(false);
    });
  });
});
