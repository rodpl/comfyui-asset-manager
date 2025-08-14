import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../../utils/i18n';
import ModelCard from '../ModelCard';
import { ExternalModel, ComfyUIModelType } from '../../types';

// Mock i18n for tests
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: {
        changeLanguage: () => new Promise(() => {}),
      },
    }),
  };
});

const createMockModel = (overrides: Partial<ExternalModel> = {}): ExternalModel => ({
  id: 'test-model-1',
  name: 'Test Model',
  description: 'A test model for unit testing',
  author: 'Test Author',
  platform: 'civitai',
  thumbnailUrl: 'https://example.com/thumbnail.jpg',
  tags: ['test', 'model', 'checkpoint'],
  downloadCount: 1500,
  rating: 4.5,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-02T00:00:00Z',
  metadata: {},
  comfyuiCompatibility: {
    isCompatible: true,
    modelFolder: 'checkpoints',
    compatibilityNotes: 'Fully compatible',
    requiredNodes: []
  },
  modelType: ComfyUIModelType.CHECKPOINT,
  baseModel: 'SD 1.5',
  fileSize: 2048000000, // 2GB
  fileFormat: 'safetensors',
  ...overrides
});

const renderModelCard = (props: Partial<React.ComponentProps<typeof ModelCard>> = {}) => {
  const defaultProps = {
    model: createMockModel(),
    ...props
  };

  return render(
    <I18nextProvider i18n={i18n}>
      <ModelCard {...defaultProps} />
    </I18nextProvider>
  );
};

describe('ModelCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders model card with basic information', () => {
      const model = createMockModel();
      renderModelCard({ model });

      expect(screen.getByText('Test Model')).toBeInTheDocument();
      expect(screen.getByText('by Test Author')).toBeInTheDocument();
      expect(screen.getByText('A test model for unit testing')).toBeInTheDocument();
      expect(screen.getByText('civitai')).toBeInTheDocument();
    });

    it('renders model type badge with correct color', () => {
      const model = createMockModel({ modelType: ComfyUIModelType.LORA });
      renderModelCard({ model });

      const badge = screen.getByText('LoRA');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('model-type-badge');
    });

    it('renders platform badge', () => {
      const model = createMockModel({ platform: 'huggingface' });
      renderModelCard({ model });

      expect(screen.getByText('huggingface')).toBeInTheDocument();
    });

    it('renders compatibility indicator for compatible models', () => {
      const model = createMockModel({
        comfyuiCompatibility: {
          isCompatible: true,
          modelFolder: 'checkpoints',
          requiredNodes: []
        }
      });
      renderModelCard({ model });

      const indicator = document.querySelector('.compatibility-indicator.compatible');
      expect(indicator).toBeInTheDocument();
    });

    it('renders compatibility indicator for incompatible models', () => {
      const model = createMockModel({
        comfyuiCompatibility: {
          isCompatible: false,
          requiredNodes: ['custom-node']
        }
      });
      renderModelCard({ model });

      const indicator = document.querySelector('.compatibility-indicator.incompatible');
      expect(indicator).toBeInTheDocument();
      expect(document.querySelector('.external-model-card.incompatible')).toBeInTheDocument();
    });
  });

  describe('Image Handling', () => {
    it('renders thumbnail image when available', () => {
      const model = createMockModel({ thumbnailUrl: 'https://example.com/image.jpg' });
      renderModelCard({ model });

      const image = screen.getByAltText('Test Model preview');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('shows placeholder when no thumbnail URL', () => {
      const model = createMockModel({ thumbnailUrl: undefined });
      renderModelCard({ model });

      expect(screen.queryByAltText('Test Model preview')).not.toBeInTheDocument();
      expect(document.querySelector('.model-thumbnail-placeholder')).toBeInTheDocument();
    });

    it('shows loading skeleton initially', () => {
      renderModelCard();

      expect(document.querySelector('.model-thumbnail-skeleton')).toBeInTheDocument();
      expect(document.querySelector('.skeleton-shimmer')).toBeInTheDocument();
    });

    it('handles image load event', async () => {
      renderModelCard();

      const image = screen.getByAltText('Test Model preview');
      fireEvent.load(image);

      await waitFor(() => {
        expect(document.querySelector('.model-thumbnail-skeleton')).not.toBeInTheDocument();
        expect(image).not.toHaveClass('loading');
      });
    });

    it('handles image error event', async () => {
      renderModelCard();

      const image = screen.getByAltText('Test Model preview');
      fireEvent.error(image);

      await waitFor(() => {
        expect(document.querySelector('.model-thumbnail-skeleton')).not.toBeInTheDocument();
        expect(document.querySelector('.model-thumbnail-placeholder')).toBeInTheDocument();
      });
    });
  });

  describe('Statistics and Metadata', () => {
    it('formats download count correctly', () => {
      const testCases = [
        { count: 500, expected: '500' },
        { count: 1500, expected: '1.5K' },
        { count: 1500000, expected: '1.5M' }
      ];

      testCases.forEach(({ count, expected }) => {
        const model = createMockModel({ downloadCount: count });
        const { unmount } = renderModelCard({ model });
        expect(screen.getByText(expected)).toBeInTheDocument();
        unmount();
      });
    });

    it('formats file size correctly', () => {
      const testCases = [
        { size: 1024, expected: '1.0 KB' },
        { size: 1048576, expected: '1.0 MB' },
        { size: 1073741824, expected: '1.0 GB' }
      ];

      testCases.forEach(({ size, expected }) => {
        const model = createMockModel({ fileSize: size });
        const { unmount } = renderModelCard({ model });
        expect(screen.getByText(expected)).toBeInTheDocument();
        unmount();
      });
    });

    it('shows unknown size when fileSize is not provided', () => {
      const model = createMockModel({ fileSize: undefined });
      renderModelCard({ model });

      expect(screen.getByText('Unknown size')).toBeInTheDocument();
    });

    it('renders rating when available', () => {
      const model = createMockModel({ rating: 4.7 });
      renderModelCard({ model });

      expect(screen.getByText('4.7')).toBeInTheDocument();
    });

    it('does not render rating when not available', () => {
      const model = createMockModel({ rating: undefined });
      renderModelCard({ model });

      expect(document.querySelector('.stat-item .pi-star-fill')).not.toBeInTheDocument();
    });
  });

  describe('Technical Information', () => {
    it('renders file format badge', () => {
      const model = createMockModel({ fileFormat: 'safetensors' });
      renderModelCard({ model });

      expect(screen.getByText('SAFETENSORS')).toBeInTheDocument();
    });

    it('renders base model information', () => {
      const model = createMockModel({ baseModel: 'SDXL 1.0' });
      renderModelCard({ model });

      expect(screen.getByText('SDXL 1.0')).toBeInTheDocument();
    });

    it('renders ComfyUI folder information', () => {
      const model = createMockModel({
        comfyuiCompatibility: {
          isCompatible: true,
          modelFolder: 'loras',
          requiredNodes: []
        }
      });
      renderModelCard({ model });

      expect(screen.getByText('→ loras/')).toBeInTheDocument();
    });
  });

  describe('Tags', () => {
    it('renders up to 3 tags', () => {
      const model = createMockModel({ tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'] });
      renderModelCard({ model });

      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.getByText('tag3')).toBeInTheDocument();
      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('renders all tags when 3 or fewer', () => {
      const model = createMockModel({ tags: ['tag1', 'tag2'] });
      renderModelCard({ model });

      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
    });

    it('does not render tags section when no tags', () => {
      const model = createMockModel({ tags: [] });
      renderModelCard({ model });

      expect(document.querySelector('.model-tags')).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onClick when card is clicked', () => {
      const onClick = vi.fn();
      const model = createMockModel();
      renderModelCard({ model, onClick });

      fireEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledWith(model);
    });

    it('calls onClick when Enter key is pressed', () => {
      const onClick = vi.fn();
      const model = createMockModel();
      renderModelCard({ model, onClick });

      fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
      expect(onClick).toHaveBeenCalledWith(model);
    });

    it('calls onClick when Space key is pressed', () => {
      const onClick = vi.fn();
      const model = createMockModel();
      renderModelCard({ model, onClick });

      fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
      expect(onClick).toHaveBeenCalledWith(model);
    });

    it('does not call onClick for other keys', () => {
      const onClick = vi.fn();
      const model = createMockModel();
      renderModelCard({ model, onClick });

      fireEvent.keyDown(screen.getByRole('button'), { key: 'Tab' });
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('Drag and Drop', () => {
    it('sets draggable attribute when draggable prop is true', () => {
      renderModelCard({ draggable: true });

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('draggable', 'true');
    });

    it('does not set draggable attribute when draggable prop is false', () => {
      renderModelCard({ draggable: false });

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('draggable', 'false');
    });

    it('calls onDragStart when drag starts', () => {
      const onDragStart = vi.fn();
      const model = createMockModel();
      renderModelCard({ model, onDragStart, draggable: true });

      const card = screen.getByRole('button');
      const mockDataTransfer = {
        setData: vi.fn()
      };
      
      fireEvent.dragStart(card, { dataTransfer: mockDataTransfer });
      
      expect(onDragStart).toHaveBeenCalledWith(model);
      expect(mockDataTransfer.setData).toHaveBeenCalledWith(
        'text/plain',
        JSON.stringify({
          type: 'external-model',
          platform: model.platform,
          modelId: model.id,
          modelType: model.modelType,
          name: model.name
        })
      );
    });

    it('does not call onDragStart when not draggable', () => {
      const onDragStart = vi.fn();
      const model = createMockModel();
      renderModelCard({ model, onDragStart, draggable: false });

      const card = screen.getByRole('button');
      fireEvent.dragStart(card);
      
      expect(onDragStart).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA label', () => {
      const model = createMockModel();
      renderModelCard({ model });

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-label', 'Test Model by Test Author on civitai');
    });

    it('has proper tabIndex for keyboard navigation', () => {
      renderModelCard();

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabindex', '0');
    });

    it('has proper alt text for thumbnail image', () => {
      const model = createMockModel({ name: 'Custom Model Name' });
      renderModelCard({ model });

      const image = screen.getByAltText('Custom Model Name preview');
      expect(image).toBeInTheDocument();
    });

    it('has proper title attributes for truncated text', () => {
      const model = createMockModel({
        name: 'Very Long Model Name That Might Be Truncated',
        author: 'Very Long Author Name',
        description: 'Very long description that might be truncated in the UI'
      });
      renderModelCard({ model });

      expect(screen.getByTitle('Very Long Model Name That Might Be Truncated')).toBeInTheDocument();
      expect(screen.getByTitle('Very Long Author Name')).toBeInTheDocument();
      expect(screen.getByTitle('Very long description that might be truncated in the UI')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      renderModelCard({ className: 'custom-class' });

      const card = screen.getByRole('button');
      expect(card).toHaveClass('custom-class');
    });

    it('applies loading class when image is loading', () => {
      renderModelCard();

      const card = screen.getByRole('button');
      expect(card).toHaveClass('loading');
    });
  });

  describe('Edge Cases', () => {
    it('handles missing optional fields gracefully', () => {
      const model = createMockModel({
        thumbnailUrl: undefined,
        rating: undefined,
        fileSize: undefined,
        fileFormat: undefined,
        baseModel: undefined,
        description: undefined,
        tags: [],
        comfyuiCompatibility: {
          isCompatible: true,
          requiredNodes: []
        }
      });

      expect(() => renderModelCard({ model })).not.toThrow();
      expect(screen.getByText('Test Model')).toBeInTheDocument();
    });

    it('handles unknown model type', () => {
      const model = createMockModel({ modelType: ComfyUIModelType.UNKNOWN });
      renderModelCard({ model });

      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('handles very long text content', () => {
      const model = createMockModel({
        name: 'A'.repeat(100),
        description: 'B'.repeat(500),
        author: 'C'.repeat(50)
      });

      expect(() => renderModelCard({ model })).not.toThrow();
    });
  });
});