import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../../utils/i18n';
import ModelGrid, { ModelInfo, ModelType } from '../ModelGrid';

// Mock i18n for tests
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => {
        const translations: Record<string, string> = {
          'modelGrid.modified': 'Modified',
          'modelGrid.ariaLabel': 'Model grid',
          'modelGrid.empty.title': 'No Models Found',
          'modelGrid.empty.description':
            'No models were found in the selected folder. Try selecting a different folder or check your ComfyUI model directories.',
        };
        return translations[key] || key;
      },
    }),
  };
});

const mockModels: ModelInfo[] = [
  {
    id: '1',
    name: 'Test Checkpoint Model',
    filePath: '/models/checkpoints/test-model.safetensors',
    fileSize: 2147483648, // 2GB
    createdAt: new Date('2024-01-01'),
    modifiedAt: new Date('2024-01-15'),
    modelType: ModelType.CHECKPOINT,
    hash: 'abc123',
    folder: 'checkpoints',
    thumbnail: 'https://example.com/thumbnail.jpg',
  },
  {
    id: '2',
    name: 'Test LoRA Model with Very Long Name That Should Be Truncated',
    filePath: '/models/loras/test-lora.safetensors',
    fileSize: 134217728, // 128MB
    createdAt: new Date('2024-01-02'),
    modifiedAt: new Date('2024-01-16'),
    modelType: ModelType.LORA,
    hash: 'def456',
    folder: 'loras',
    // No thumbnail
  },
  {
    id: '3',
    name: 'Test VAE Model',
    filePath: '/models/vae/test-vae.safetensors',
    fileSize: 335544320, // 320MB
    createdAt: new Date('2024-01-03'),
    modifiedAt: new Date('2024-01-17'),
    modelType: ModelType.VAE,
    hash: 'ghi789',
    folder: 'vae',
    thumbnail: 'https://example.com/broken-thumbnail.jpg',
  },
];

const renderModelGrid = (props: Partial<React.ComponentProps<typeof ModelGrid>> = {}) => {
  const defaultProps = {
    models: mockModels,
    loading: false,
    onModelSelect: vi.fn(),
    onModelDrag: vi.fn(),
  };

  return render(
    <I18nextProvider i18n={i18n}>
      <ModelGrid {...defaultProps} {...props} />
    </I18nextProvider>
  );
};

describe('ModelGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display skeleton cards when loading', () => {
      renderModelGrid({ loading: true, models: [] });

      const skeletonCards = screen.getAllByRole('generic');
      expect(skeletonCards.length).toBeGreaterThan(0);

      // Check for skeleton elements
      expect(document.querySelector('.model-card-skeleton')).toBeInTheDocument();
      expect(document.querySelector('.skeleton-shimmer')).toBeInTheDocument();
    });

    it('should not display actual models when loading', () => {
      renderModelGrid({ loading: true });

      expect(screen.queryByText('Test Checkpoint Model')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no models are provided', () => {
      renderModelGrid({ models: [] });

      expect(screen.getByText('No Models Found')).toBeInTheDocument();
      expect(screen.getByText(/No models were found in the selected folder/)).toBeInTheDocument();
      expect(document.querySelector('.pi-folder-open')).toBeInTheDocument();
    });
  });

  describe('Model Display', () => {
    it('should render all provided models', () => {
      renderModelGrid();

      expect(screen.getByText('Test Checkpoint Model')).toBeInTheDocument();
      expect(
        screen.getByText('Test LoRA Model with Very Long Name That Should Be Truncated')
      ).toBeInTheDocument();
      expect(screen.getByText('Test VAE Model')).toBeInTheDocument();
    });

    it('should display model type badges correctly', () => {
      renderModelGrid();

      expect(screen.getByText('CHECKPOINT')).toBeInTheDocument();
      expect(screen.getByText('LORA')).toBeInTheDocument();
      expect(screen.getByText('VAE')).toBeInTheDocument();
    });

    it('should format file sizes correctly', () => {
      renderModelGrid();

      expect(screen.getByText('2 GB')).toBeInTheDocument();
      expect(screen.getByText('128 MB')).toBeInTheDocument();
      expect(screen.getByText('320 MB')).toBeInTheDocument();
    });

    it('should display modified dates', () => {
      renderModelGrid();

      const modifiedTexts = screen.getAllByText(/Modified:/);
      expect(modifiedTexts).toHaveLength(3);
    });

    it('should display correct model type icons', () => {
      renderModelGrid();

      // Check for different model type icons in placeholder thumbnails
      const placeholders = document.querySelectorAll('.model-thumbnail-placeholder');
      expect(placeholders.length).toBeGreaterThan(0);

      // Check that model type icons exist (they appear in placeholders for models without thumbnails)
      const icons = document.querySelectorAll('.model-type-icon');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Thumbnail Handling', () => {
    it('should display thumbnails when available', () => {
      renderModelGrid();

      const thumbnailImage = screen.getByAltText('Test Checkpoint Model');
      expect(thumbnailImage).toBeInTheDocument();
      expect(thumbnailImage).toHaveAttribute('src', 'https://example.com/thumbnail.jpg');
    });

    it('should display placeholder when no thumbnail is available', () => {
      renderModelGrid();

      // The LoRA model has no thumbnail, should show placeholder
      const loraCard = screen
        .getByText('Test LoRA Model with Very Long Name That Should Be Truncated')
        .closest('.model-card');
      expect(loraCard?.querySelector('.model-thumbnail-placeholder')).toBeInTheDocument();
      expect(loraCard?.querySelector('.pi-cog')).toBeInTheDocument();
    });

    it('should handle image load errors gracefully', async () => {
      renderModelGrid();

      const brokenThumbnail = screen.getByAltText('Test VAE Model');

      // Simulate image load error
      fireEvent.error(brokenThumbnail);

      await waitFor(() => {
        const vaeCard = screen.getByText('Test VAE Model').closest('.model-card');
        expect(vaeCard?.querySelector('.model-thumbnail-placeholder')).toBeInTheDocument();
      });
    });

    it('should show loading state for images', () => {
      renderModelGrid();

      const thumbnail = screen.getByAltText('Test Checkpoint Model');
      expect(thumbnail).toHaveClass('loading');

      // Simulate image load
      fireEvent.load(thumbnail);

      expect(thumbnail).not.toHaveClass('loading');
    });
  });

  describe('User Interactions', () => {
    it('should call onModelSelect when a model card is clicked', () => {
      const onModelSelect = vi.fn();
      renderModelGrid({ onModelSelect });

      const modelCard = screen.getByText('Test Checkpoint Model').closest('.model-card');
      fireEvent.click(modelCard!);

      expect(onModelSelect).toHaveBeenCalledWith(mockModels[0]);
    });

    it('should call onModelSelect when Enter key is pressed', () => {
      const onModelSelect = vi.fn();
      renderModelGrid({ onModelSelect });

      const modelCard = screen.getByText('Test Checkpoint Model').closest('.model-card');
      fireEvent.keyDown(modelCard!, { key: 'Enter' });

      expect(onModelSelect).toHaveBeenCalledWith(mockModels[0]);
    });

    it('should call onModelSelect when Space key is pressed', () => {
      const onModelSelect = vi.fn();
      renderModelGrid({ onModelSelect });

      const modelCard = screen.getByText('Test Checkpoint Model').closest('.model-card');
      fireEvent.keyDown(modelCard!, { key: ' ' });

      expect(onModelSelect).toHaveBeenCalledWith(mockModels[0]);
    });

    it('should not call onModelSelect for other keys', () => {
      const onModelSelect = vi.fn();
      renderModelGrid({ onModelSelect });

      const modelCard = screen.getByText('Test Checkpoint Model').closest('.model-card');
      fireEvent.keyDown(modelCard!, { key: 'Tab' });

      expect(onModelSelect).not.toHaveBeenCalled();
    });
  });

  describe('Drag and Drop', () => {
    it('should make cards draggable when onModelDrag is provided', () => {
      const onModelDrag = vi.fn();
      renderModelGrid({ onModelDrag });

      const modelCards = document.querySelectorAll('.model-card');
      modelCards.forEach((card) => {
        expect(card).toHaveAttribute('draggable', 'true');
      });
    });

    it('should not make cards draggable when onModelDrag is not provided', () => {
      renderModelGrid({ onModelDrag: undefined });

      const modelCards = document.querySelectorAll('.model-card');
      modelCards.forEach((card) => {
        expect(card).toHaveAttribute('draggable', 'false');
      });
    });

    it('should handle drag start event correctly', () => {
      const onModelDrag = vi.fn();
      renderModelGrid({ onModelDrag });

      const modelCard = screen.getByText('Test Checkpoint Model').closest('.model-card');

      // Create a mock drag event with dataTransfer
      const mockDataTransfer = {
        setData: vi.fn(),
        effectAllowed: '',
        getData: vi.fn(),
      };

      const dragEvent = {
        dataTransfer: mockDataTransfer,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };

      fireEvent.dragStart(modelCard!, dragEvent);

      expect(onModelDrag).toHaveBeenCalledWith(mockModels[0]);
      expect(mockDataTransfer.setData).toHaveBeenCalledWith(
        'application/json',
        JSON.stringify({
          type: 'model',
          model: mockModels[0],
        })
      );
      expect(mockDataTransfer.effectAllowed).toBe('copy');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderModelGrid();

      expect(screen.getByRole('grid')).toHaveAttribute('aria-label', 'Model grid');
    });

    it('should have proper role and tabindex for model cards', () => {
      renderModelGrid();

      const modelCards = document.querySelectorAll('.model-card');
      modelCards.forEach((card) => {
        expect(card).toHaveAttribute('role', 'button');
        expect(card).toHaveAttribute('tabindex', '0');
      });
    });

    it('should have descriptive aria-labels for model cards', () => {
      renderModelGrid();

      const checkpointCard = screen.getByLabelText('Test Checkpoint Model - checkpoint model');
      expect(checkpointCard).toBeInTheDocument();

      const loraCard = screen.getByLabelText(/Test LoRA Model.*- lora model/);
      expect(loraCard).toBeInTheDocument();
    });

    it('should have proper alt text for thumbnails', () => {
      renderModelGrid();

      const thumbnail = screen.getByAltText('Test Checkpoint Model');
      expect(thumbnail).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should apply responsive grid classes', () => {
      renderModelGrid();

      const grid = document.querySelector('.model-grid');
      expect(grid).toHaveClass('model-grid');
    });
  });

  describe('Error Handling', () => {
    it('should handle models with missing data gracefully', () => {
      const incompleteModel: ModelInfo = {
        id: '4',
        name: '',
        filePath: '',
        fileSize: 0,
        createdAt: new Date(),
        modifiedAt: new Date(),
        modelType: ModelType.CHECKPOINT,
        hash: '',
        folder: '',
      };

      renderModelGrid({ models: [incompleteModel] });

      // Should still render the card without errors
      expect(document.querySelector('.model-card')).toBeInTheDocument();
      expect(screen.getByText('0 B')).toBeInTheDocument(); // File size formatting
    });

    it('should handle invalid dates gracefully', () => {
      const modelWithInvalidDate: ModelInfo = {
        ...mockModels[0],
        modifiedAt: new Date('invalid-date'),
      };

      expect(() => {
        renderModelGrid({ models: [modelWithInvalidDate] });
      }).not.toThrow();
    });
  });
});
