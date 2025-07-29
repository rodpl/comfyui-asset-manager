import { describe, it, expect } from 'vitest';
import type {
  Output,
  OutputResponse,
  ViewMode,
  SortOption,
  ContextMenuAction,
  ImageDimensions,
  FileInfo,
} from '../types';

describe('Output Types', () => {
  describe('Output interface', () => {
    it('should define correct Output structure', () => {
      const output: Output = {
        id: 'output-1',
        filename: 'test_image.png',
        filePath: '/path/to/test_image.png',
        fileSize: 1024000,
        createdAt: new Date('2024-01-01T12:00:00Z'),
        modifiedAt: new Date('2024-01-01T12:30:00Z'),
        imageWidth: 1920,
        imageHeight: 1080,
        fileFormat: 'png',
        thumbnailPath: '/path/to/thumbnail.jpg',
        workflowMetadata: { workflowId: 'test-workflow' },
      };

      expect(output.id).toBe('output-1');
      expect(output.filename).toBe('test_image.png');
      expect(output.fileSize).toBe(1024000);
      expect(output.imageWidth).toBe(1920);
      expect(output.imageHeight).toBe(1080);
      expect(output.fileFormat).toBe('png');
    });

    it('should allow optional fields to be undefined', () => {
      const output: Output = {
        id: 'output-1',
        filename: 'test_image.png',
        filePath: '/path/to/test_image.png',
        fileSize: 1024000,
        createdAt: new Date(),
        modifiedAt: new Date(),
        imageWidth: 1920,
        imageHeight: 1080,
        fileFormat: 'png',
        // thumbnailPath and workflowMetadata are optional
      };

      expect(output.thumbnailPath).toBeUndefined();
      expect(output.workflowMetadata).toBeUndefined();
    });
  });

  describe('OutputResponse interface', () => {
    it('should define correct OutputResponse structure', () => {
      const response: OutputResponse = {
        id: 'output-1',
        filename: 'test_image.png',
        filePath: '/path/to/test_image.png',
        fileSize: 1024000,
        createdAt: '2024-01-01T12:00:00Z',
        modifiedAt: '2024-01-01T12:30:00Z',
        imageWidth: 1920,
        imageHeight: 1080,
        fileFormat: 'png',
      };

      expect(response.createdAt).toBe('2024-01-01T12:00:00Z');
      expect(response.modifiedAt).toBe('2024-01-01T12:30:00Z');
    });
  });

  describe('ViewMode type', () => {
    it('should accept valid view modes', () => {
      const gridMode: ViewMode = 'grid';
      const listMode: ViewMode = 'list';

      expect(gridMode).toBe('grid');
      expect(listMode).toBe('list');
    });
  });

  describe('SortOption type', () => {
    it('should accept valid sort options', () => {
      const sortOptions: SortOption[] = [
        'date-desc',
        'date-asc',
        'name-asc',
        'name-desc',
        'size-desc',
        'size-asc',
      ];

      expect(sortOptions).toHaveLength(6);
      expect(sortOptions).toContain('date-desc');
      expect(sortOptions).toContain('name-asc');
      expect(sortOptions).toContain('size-desc');
    });
  });

  describe('ContextMenuAction type', () => {
    it('should accept valid context menu actions', () => {
      const actions: ContextMenuAction[] = ['copy-path', 'open-system', 'show-folder'];

      expect(actions).toHaveLength(3);
      expect(actions).toContain('copy-path');
      expect(actions).toContain('open-system');
      expect(actions).toContain('show-folder');
    });
  });

  describe('ImageDimensions interface', () => {
    it('should define correct ImageDimensions structure', () => {
      const dimensions: ImageDimensions = {
        width: 1920,
        height: 1080,
        aspectRatio: 1.777,
      };

      expect(dimensions.width).toBe(1920);
      expect(dimensions.height).toBe(1080);
      expect(dimensions.aspectRatio).toBeCloseTo(1.777, 3);
    });
  });

  describe('FileInfo interface', () => {
    it('should define correct FileInfo structure', () => {
      const fileInfo: FileInfo = {
        size: 1024000,
        format: 'png',
        createdAt: new Date('2024-01-01T12:00:00Z'),
        modifiedAt: new Date('2024-01-01T12:30:00Z'),
        sizeFormatted: '1000.0 KB',
      };

      expect(fileInfo.size).toBe(1024000);
      expect(fileInfo.format).toBe('png');
      expect(fileInfo.sizeFormatted).toBe('1000.0 KB');
    });
  });
});
