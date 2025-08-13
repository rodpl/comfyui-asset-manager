import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import ModelDetailModal from '../ModelDetailModal';
import { EnrichedModelInfo, ModelType } from '../../types';

// Mock fetch globally
(globalThis as any).fetch = vi.fn();

// Initialize i18n for tests
i18n.init({
  lng: 'en',
  fallbackLng: 'en',
  debug: false,
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: {
      translation: {
        'modelDetail.close': 'Close',
        'modelDetail.tabs.details': 'Details',
        'modelDetail.tabs.metadata': 'Metadata',
        'modelDetail.tabs.usage': 'Usage',
        'modelDetail.basicInfo': 'Basic Information',
        'modelDetail.fileName': 'File Name',
        'modelDetail.filePath': 'File Path',
        'modelDetail.fileSize': 'File Size',
        'modelDetail.modelType': 'Model Type',
        'modelDetail.hash': 'Hash',
        'modelDetail.created': 'Created',
        'modelDetail.modified': 'Modified',
        'modelDetail.copyName': 'Copy name',
        'modelDetail.copyPath': 'Copy file path',
        'modelDetail.copyHash': 'Copy hash',
        'modelDetail.civitaiInfo': 'CivitAI Information',
        'modelDetail.huggingfaceInfo': 'HuggingFace Information',
        'modelDetail.downloads': 'downloads',
        'modelDetail.likes': 'likes',
        'modelDetail.userMetadata': 'User Metadata',
        'modelDetail.description': 'Description',
        'modelDetail.rating': 'Rating',
        'modelDetail.userTags': 'Tags',
        'modelDetail.noUserMetadata':
          'No user metadata available. You can add custom tags, descriptions, and ratings to organize your models.',
        'modelDetail.technicalDetails': 'Technical Details',
        'modelDetail.fileFormat': 'File Format',
        'modelDetail.compatibility.checkpoint': 'Compatible with checkpoint loader nodes',
        'modelDetail.compatibility.lora': 'Compatible with LoRA loader nodes',
        'modelDetail.compatibility.vae': 'Compatible with VAE loader and encode/decode nodes',
        'modelDetail.compatibility.embedding': 'Compatible with text encoding nodes',
        'modelDetail.compatibility.controlnet': 'Compatible with ControlNet nodes',
        'modelDetail.compatibility.upscaler': 'Compatible with upscale model nodes',
        'modelDetail.quickActions': 'Quick Actions',
        'modelDetail.addToWorkflow': 'Add to Workflow',
        'modelDetail.copyForWorkflow': 'Copy Path',
        'modelDetail.usageInstructions': 'Usage Instructions',
        'modelDetail.dragAndDrop': 'Drag and Drop',
        'modelDetail.dragAndDropDescription':
          'Drag this model from the grid directly onto compatible ComfyUI nodes in your workflow.',
        'modelDetail.manualLoad': 'Manual Loading',
        'modelDetail.manualLoadDescription':
          'Use the file path below to manually load this model in ComfyUI nodes:',
        'modelDetail.compatibleNodes': 'Compatible Nodes',
      },
    },
  },
});

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

const mockModel: EnrichedModelInfo = {
  id: '1',
  name: 'Test Model',
  filePath: '/models/checkpoints/test_model.safetensors',
  fileSize: 2147483648, // 2GB
  createdAt: new Date('2024-01-01'),
  modifiedAt: new Date('2024-01-15'),
  modelType: ModelType.CHECKPOINT,
  hash: 'abc123def456ghi789',
  folder: 'checkpoints',
  thumbnail: 'https://example.com/thumbnail.jpg',
  externalMetadata: {
    civitai: {
      modelId: 4201,
      name: 'Test Model',
      description: 'A test model for unit testing',
      tags: ['test', 'unit-test', 'mock'],
      images: ['https://example.com/image1.jpg'],
      downloadCount: 1000,
      rating: 4.5,
      creator: 'TestCreator',
    },
  },
  userMetadata: {
    tags: ['favorite', 'testing'],
    description: 'My test model for development',
    rating: 5,
  },
};

const renderModal = (props = {}) => {
  const defaultProps = {
    model: mockModel,
    isOpen: true,
    onClose: vi.fn(),
    onAddToWorkflow: vi.fn(),
    ...props,
  };

  try {
    return render(
      <I18nextProvider i18n={i18n}>
        <ModelDetailModal {...defaultProps} />
      </I18nextProvider>
    );
  } catch (error) {
    console.error('Error rendering modal:', error);
    throw error;
  }
};

describe('ModelDetailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock fetch for tags API
    ((globalThis as any).fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: ['character', 'style', 'anime', 'realistic'],
      }),
    });
  });

  it('should not render when isOpen is false', () => {
    const { container } = renderModal({ isOpen: false });
    expect(container.querySelector('.modal-backdrop')).not.toBeInTheDocument();
  });

  it('should render modal when isOpen is true', () => {
    const { container } = renderModal();

    // Check if modal backdrop exists
    const backdrop = container.querySelector('.modal-backdrop');
    expect(backdrop).toBeInTheDocument();

    // Check if modal content exists
    const modalContent = container.querySelector('.modal-content');
    expect(modalContent).toBeInTheDocument();
  });

  it('should display model basic information', () => {
    renderModal();

    expect(screen.getByRole('heading', { name: 'Test Model' })).toBeInTheDocument();
    expect(screen.getByText('CHECKPOINT')).toBeInTheDocument();
    expect(screen.getByText('/models/checkpoints/test_model.safetensors')).toBeInTheDocument();
    expect(screen.getByText('2 GB')).toBeInTheDocument();
    expect(screen.getByText('abc123def456ghi789')).toBeInTheDocument();
  });

  it('should display external metadata when available', () => {
    renderModal();

    expect(screen.getByText('A test model for unit testing')).toBeInTheDocument();
    expect(screen.getByText('1,000 downloads')).toBeInTheDocument();
    expect(screen.getByText('4.5/5')).toBeInTheDocument();
    expect(screen.getByText('TestCreator')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('unit-test')).toBeInTheDocument();
  });

  it('should display user metadata when available', () => {
    renderModal();

    // Switch to metadata tab
    fireEvent.click(screen.getByText('Metadata'));

    expect(screen.getByText('My test model for development')).toBeInTheDocument();
    expect(screen.getByText('favorite')).toBeInTheDocument();
    expect(screen.getByText('testing')).toBeInTheDocument();

    // Check rating stars
    const filledStars = screen
      .getAllByText('')
      .filter((el) => el.className.includes('pi-star') && el.className.includes('filled'));
    expect(filledStars).toHaveLength(5);
  });

  it('should handle tab switching', () => {
    renderModal();

    // Initially on details tab
    expect(screen.getByText('Basic Information')).toBeInTheDocument();

    // Switch to metadata tab
    fireEvent.click(screen.getByText('Metadata'));
    expect(screen.getByText('User Metadata')).toBeInTheDocument();

    // Switch to usage tab
    fireEvent.click(screen.getByText('Usage'));
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Add to Workflow')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    const backdrop = screen.getByRole('dialog');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    const modal = screen.getByRole('dialog');
    fireEvent.keyDown(modal, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onAddToWorkflow when Add to Workflow button is clicked', () => {
    const onAddToWorkflow = vi.fn();
    renderModal({ onAddToWorkflow });

    // Switch to usage tab
    fireEvent.click(screen.getByText('Usage'));

    fireEvent.click(screen.getByText('Add to Workflow'));
    expect(onAddToWorkflow).toHaveBeenCalledWith(mockModel);
  });

  it('should copy text to clipboard when copy buttons are clicked', async () => {
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText');
    renderModal();

    // Copy file path
    const copyPathButton = screen.getAllByTitle('Copy file path')[0];
    fireEvent.click(copyPathButton);

    await waitFor(() => {
      expect(writeTextSpy).toHaveBeenCalledWith('/models/checkpoints/test_model.safetensors');
    });

    // Copy hash
    const copyHashButton = screen.getByTitle('Copy hash');
    fireEvent.click(copyHashButton);

    await waitFor(() => {
      expect(writeTextSpy).toHaveBeenCalledWith('abc123def456ghi789');
    });
  });

  it('should display compatible nodes in usage tab', () => {
    renderModal();

    // Switch to usage tab
    fireEvent.click(screen.getByText('Usage'));

    expect(screen.getByText('Compatible Nodes')).toBeInTheDocument();
    expect(screen.getByText('Load Checkpoint')).toBeInTheDocument();
    expect(screen.getByText('CheckpointLoaderSimple')).toBeInTheDocument();
    expect(screen.getByText('CheckpointLoader')).toBeInTheDocument();
  });

  it('should handle model without external metadata', () => {
    const modelWithoutMetadata = {
      ...mockModel,
      externalMetadata: undefined,
    };

    renderModal({ model: modelWithoutMetadata });

    expect(screen.queryByText('CivitAI Information')).not.toBeInTheDocument();
    expect(screen.queryByText('HuggingFace Information')).not.toBeInTheDocument();
  });

  it('should handle model without user metadata', () => {
    const modelWithoutUserMetadata = {
      ...mockModel,
      userMetadata: undefined,
    };

    renderModal({ model: modelWithoutUserMetadata });

    // Switch to metadata tab
    fireEvent.click(screen.getByText('Metadata'));

    expect(
      screen.getByText(
        'No user metadata available. You can add custom tags, descriptions, and ratings to organize your models.'
      )
    ).toBeInTheDocument();
  });

  it('should display thumbnail when available', () => {
    renderModal();

    const thumbnail = screen.getByAltText('Test Model');
    expect(thumbnail).toBeInTheDocument();
    expect(thumbnail).toHaveAttribute('src', 'https://example.com/thumbnail.jpg');
  });

  it('should display placeholder when thumbnail is not available', () => {
    const modelWithoutThumbnail = {
      ...mockModel,
      thumbnail: undefined,
    };

    const { container } = renderModal({ model: modelWithoutThumbnail });

    expect(screen.queryByAltText('Test Model')).not.toBeInTheDocument();

    // Check for placeholder div
    const placeholder = container.querySelector('.model-preview-placeholder');
    expect(placeholder).toBeInTheDocument();
  });

  it('should format file size correctly', () => {
    renderModal();

    expect(screen.getByText('2 GB')).toBeInTheDocument();
  });

  it('should display model type badge', () => {
    renderModal();

    expect(screen.getByText('CHECKPOINT')).toBeInTheDocument();
  });

  it('should show success state for copy buttons', async () => {
    renderModal();

    const copyButton = screen.getAllByTitle('Copy file path')[0];
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(copyButton).toHaveClass('success');
    });

    // Should reset after timeout
    await waitFor(
      () => {
        expect(copyButton).not.toHaveClass('success');
      },
      { timeout: 3000 }
    );
  });
});
