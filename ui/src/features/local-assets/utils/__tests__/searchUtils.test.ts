import { describe, it, expect } from 'vitest';
import { filterModels } from '../searchUtils';
import { ModelType, EnrichedModelInfo } from '../../types';

const mockModels: EnrichedModelInfo[] = [
  {
    id: '1',
    name: 'Realistic Vision V5.1',
    filePath: '/models/checkpoints/realisticVisionV51.safetensors',
    fileSize: 2147483648,
    createdAt: new Date('2024-01-01'),
    modifiedAt: new Date('2024-01-15'),
    modelType: ModelType.CHECKPOINT,
    hash: 'abc123def456ghi789',
    folder: 'checkpoints',
    thumbnail: 'https://example.com/thumb1.jpg',
  },
  {
    id: '2',
    name: 'DreamShaper XL',
    filePath: '/models/checkpoints/dreamshaperXL.safetensors',
    fileSize: 6442450944,
    createdAt: new Date('2024-01-02'),
    modifiedAt: new Date('2024-01-16'),
    modelType: ModelType.CHECKPOINT,
    hash: 'def456ghi789jkl012',
    folder: 'checkpoints',
  },
];

describe('searchUtils', () => {
  describe('filterModels', () => {
    it('should filter models by search query', () => {
      const result = filterModels(mockModels, 'Realistic', {
        modelTypes: [],
        fileSizeRange: undefined,
        dateRange: undefined,
        hasMetadata: undefined,
        hasThumbnail: undefined,
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Realistic Vision V5.1');
    });

    it('should return all models when no search query', () => {
      const result = filterModels(mockModels, '', {
        modelTypes: [],
        fileSizeRange: undefined,
        dateRange: undefined,
        hasMetadata: undefined,
        hasThumbnail: undefined,
      });

      expect(result).toHaveLength(2);
    });

    it('should return empty array when no matches', () => {
      const result = filterModels(mockModels, 'NonexistentModel', {
        modelTypes: [],
        fileSizeRange: undefined,
        dateRange: undefined,
        hasMetadata: undefined,
        hasThumbnail: undefined,
      });

      expect(result).toHaveLength(0);
    });
  });
});
