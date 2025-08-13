/**
 * Unit tests for CivitAI API service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CivitAIService, CivitAIUtils } from '../civitaiService';
import { ComfyUIModelType } from '../../types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('CivitAIService', () => {
  let service: CivitAIService;

  beforeEach(() => {
    service = new CivitAIService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchModels', () => {
    it('should search models with basic parameters', async () => {
      const mockResponse = {
        items: [
          {
            id: 123,
            name: 'Test Model',
            description: 'A test model',
            type: 'Checkpoint',
            nsfw: false,
            allowCommercialUse: 'Sell',
            stats: {
              downloadCount: 1000,
              favoriteCount: 50,
              commentCount: 10,
              rating: 4.5,
            },
            creator: {
              username: 'testuser',
            },
            tags: ['anime', 'realistic'],
            modelVersions: [
              {
                id: 456,
                name: 'v1.0',
                baseModel: 'SD 1.5',
                images: [
                  {
                    url: 'https://example.com/image.jpg',
                    nsfw: false,
                    width: 512,
                    height: 512,
                  },
                ],
                files: [
                  {
                    id: 789,
                    name: 'model.safetensors',
                    sizeKB: 2048000,
                    type: 'Model',
                    format: 'SafeTensor',
                    downloadUrl: 'https://example.com/download',
                  },
                ],
              },
            ],
          },
        ],
        metadata: {
          totalItems: 100,
          currentPage: 1,
          pageSize: 20,
          totalPages: 5,
          nextPage: 'https://example.com/next',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await service.searchModels({
        query: 'anime',
        limit: 20,
        offset: 0,
      });

      expect(result.models).toHaveLength(1);
      expect(result.models[0].name).toBe('Test Model');
      expect(result.models[0].platform).toBe('civitai');
      expect(result.models[0].comfyuiCompatibility.isCompatible).toBe(true);
      expect(result.total).toBe(100);
      expect(result.hasMore).toBe(true);
    });

    it('should handle search with filters', async () => {
      const mockResponse = {
        items: [],
        metadata: {
          totalItems: 0,
          currentPage: 1,
          pageSize: 20,
          totalPages: 0,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await service.searchModels({
        query: 'test',
        filters: {
          types: ['Checkpoint', 'LORA'],
          sort: 'Highest Rated',
          nsfw: false,
          baseModels: ['SD 1.5'],
        },
      });

      const fetchCall = mockFetch.mock.calls[0][0];
      expect(fetchCall).toContain('types=Checkpoint');
      expect(fetchCall).toContain('types=LORA');
      expect(fetchCall).toContain('sort=Highest+Rated');
      expect(fetchCall).toContain('nsfw=false');
      expect(fetchCall).toContain('baseModels=SD+1.5');
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.searchModels({ query: 'test' })).rejects.toThrow('Max retries exceeded');
    }, 10000);

    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Not found' }),
      });

      await expect(service.searchModels({ query: 'test' })).rejects.toThrow('Max retries exceeded');
    }, 10000);

    it('should retry on rate limiting', async () => {
      // First call returns 429, second call succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Map([['Retry-After', '1']]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              items: [],
              metadata: { totalItems: 0, currentPage: 1, pageSize: 20, totalPages: 0 },
            }),
        });

      const result = await service.searchModels({ query: 'test' });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.models).toHaveLength(0);
    });
  });

  describe('getModelDetails', () => {
    it('should fetch model details', async () => {
      const mockModel = {
        id: 123,
        name: 'Detailed Model',
        description: 'A detailed model',
        type: 'LORA',
        nsfw: false,
        allowCommercialUse: 'Sell',
        stats: {
          downloadCount: 500,
          favoriteCount: 25,
          commentCount: 5,
          rating: 4.0,
        },
        creator: {
          username: 'creator',
        },
        tags: ['style', 'character'],
        modelVersions: [
          {
            id: 456,
            name: 'v2.0',
            baseModel: 'SDXL 1.0',
            images: [],
            files: [
              {
                id: 789,
                name: 'lora.safetensors',
                sizeKB: 144000,
                type: 'Model',
                format: 'SafeTensor',
                downloadUrl: 'https://example.com/lora',
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModel),
      });

      const result = await service.getModelDetails('123');

      expect(result.id).toBe('123');
      expect(result.name).toBe('Detailed Model');
      expect(result.modelType).toBe(ComfyUIModelType.LORA);
      expect(result.comfyuiCompatibility.modelFolder).toBe('loras');
    });
  });

  describe('ComfyUI compatibility assessment', () => {
    it('should correctly assess checkpoint compatibility', async () => {
      const mockModel = {
        id: 123,
        name: 'Checkpoint Model',
        description: 'Test checkpoint',
        type: 'Checkpoint',
        nsfw: false,
        allowCommercialUse: 'Sell',
        stats: { downloadCount: 1000, favoriteCount: 50, commentCount: 10, rating: 4.5 },
        creator: { username: 'user' },
        tags: [],
        modelVersions: [
          {
            id: 456,
            name: 'v1.0',
            baseModel: 'SD 1.5',
            images: [],
            files: [
              {
                id: 789,
                name: 'model.safetensors',
                sizeKB: 2048000,
                type: 'Model',
                format: 'SafeTensor',
                downloadUrl: 'https://example.com/model',
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModel),
      });

      const result = await service.getModelDetails('123');

      expect(result.comfyuiCompatibility.isCompatible).toBe(true);
      expect(result.modelType).toBe(ComfyUIModelType.CHECKPOINT);
      expect(result.comfyuiCompatibility.modelFolder).toBe('checkpoints');
      expect(result.fileFormat).toBe('SafeTensor');
    });

    it('should handle unknown model types', async () => {
      const mockModel = {
        id: 123,
        name: 'Unknown Model',
        description: 'Unknown type',
        type: 'UnknownType',
        nsfw: false,
        allowCommercialUse: 'Sell',
        stats: { downloadCount: 100, favoriteCount: 5, commentCount: 1, rating: 3.0 },
        creator: { username: 'user' },
        tags: [],
        modelVersions: [
          {
            id: 456,
            name: 'v1.0',
            baseModel: 'Unknown',
            images: [],
            files: [
              {
                id: 789,
                name: 'model.unknown',
                sizeKB: 1000,
                type: 'Model',
                format: 'Unknown',
                downloadUrl: 'https://example.com/model',
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModel),
      });

      const result = await service.getModelDetails('123');

      expect(result.comfyuiCompatibility.isCompatible).toBe(false);
      expect(result.modelType).toBe(ComfyUIModelType.UNKNOWN);
      expect(result.comfyuiCompatibility.compatibilityNotes).toContain('Unknown model type');
    });
  });
});

describe('CivitAIUtils', () => {
  describe('isComfyUICompatible', () => {
    it('should return true for compatible model types and formats', () => {
      expect(CivitAIUtils.isComfyUICompatible('Checkpoint', 'safetensors')).toBe(true);
      expect(CivitAIUtils.isComfyUICompatible('LORA', 'ckpt')).toBe(true);
      expect(CivitAIUtils.isComfyUICompatible('VAE', 'pt')).toBe(true);
    });

    it('should return false for incompatible combinations', () => {
      expect(CivitAIUtils.isComfyUICompatible('UnknownType', 'safetensors')).toBe(false);
      expect(CivitAIUtils.isComfyUICompatible('Checkpoint', 'unknown')).toBe(false);
      expect(CivitAIUtils.isComfyUICompatible('UnknownType', 'unknown')).toBe(false);
    });
  });

  describe('getComfyUIFolder', () => {
    it('should return correct folders for model types', () => {
      expect(CivitAIUtils.getComfyUIFolder('Checkpoint')).toBe('checkpoints');
      expect(CivitAIUtils.getComfyUIFolder('LORA')).toBe('loras');
      expect(CivitAIUtils.getComfyUIFolder('TextualInversion')).toBe('embeddings');
      expect(CivitAIUtils.getComfyUIFolder('Controlnet')).toBe('controlnet');
      expect(CivitAIUtils.getComfyUIFolder('VAE')).toBe('vae');
      expect(CivitAIUtils.getComfyUIFolder('Upscaler')).toBe('upscale_models');
      expect(CivitAIUtils.getComfyUIFolder('UnknownType')).toBe('models');
    });
  });

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(CivitAIUtils.formatFileSize(500)).toBe('500 KB');
      expect(CivitAIUtils.formatFileSize(1536)).toBe('1.5 MB');
      expect(CivitAIUtils.formatFileSize(2048000)).toBe('2.0 GB');
    });
  });

  describe('getModelTypeBadgeColor', () => {
    it('should return appropriate colors for model types', () => {
      expect(CivitAIUtils.getModelTypeBadgeColor('Checkpoint')).toBe('blue');
      expect(CivitAIUtils.getModelTypeBadgeColor('LORA')).toBe('green');
      expect(CivitAIUtils.getModelTypeBadgeColor('TextualInversion')).toBe('purple');
      expect(CivitAIUtils.getModelTypeBadgeColor('UnknownType')).toBe('gray');
    });
  });
});
