// React import removed as it's not used in this test file
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ModelDetailModal from '../ModelDetailModal';
import { ExternalModel, ComfyUIModelType, CivitAIMetadata, HuggingFaceMetadata } from '../../types';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

// Mock data
const mockCivitAIModel: ExternalModel = {
  id: 'civitai-123',
  name: 'Test Checkpoint Model',
  description: 'A test checkpoint model for unit testing',
  author: 'TestAuthor',
  platform: 'civitai',
  thumbnailUrl: 'https://example.com/thumbnail.jpg',
  tags: ['realistic', 'portrait', 'photography'],
  downloadCount: 15000,
  rating: 4.5,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-06-01T00:00:00Z',
  metadata: {
    modelType: 'Checkpoint',
    baseModel: 'SD 1.5',
    nsfw: false,
    allowCommercialUse: 'Yes',
    favoriteCount: 500,
    commentCount: 25,
    versions: [
      {
        id: 1,
        name: 'v1.0',
        downloadUrl: 'https://example.com/download',
        files: [
          {
            name: 'model.safetensors',
            sizeKB: 2048000,
            type: 'Model',
            format: 'safetensors',
          },
        ],
      },
    ],
    comfyuiModelType: ComfyUIModelType.CHECKPOINT,
    comfyuiFolder: 'checkpoints',
    compatibilityScore: 0.95,
  } as CivitAIMetadata,
  comfyuiCompatibility: {
    isCompatible: true,
    modelFolder: 'checkpoints',
    compatibilityNotes: 'Fully compatible with ComfyUI',
    requiredNodes: ['Load Checkpoint', 'CheckpointLoaderSimple'],
  },
  modelType: ComfyUIModelType.CHECKPOINT,
  baseModel: 'SD 1.5',
  fileSize: 2097152000, // 2GB
  fileFormat: 'safetensors',
};

const mockHuggingFaceModel: ExternalModel = {
  id: 'hf-456',
  name: 'Test Diffusion Model',
  description: 'A test diffusion model from HuggingFace',
  author: 'HFAuthor',
  platform: 'huggingface',
  thumbnailUrl: 'https://example.com/hf-thumbnail.jpg',
  tags: ['diffusion', 'text-to-image', 'stable-diffusion'],
  downloadCount: 8500,
  rating: 4.2,
  createdAt: '2023-02-01T00:00:00Z',
  updatedAt: '2023-07-01T00:00:00Z',
  metadata: {
    library: 'diffusers',
    pipelineTag: 'text-to-image',
    license: 'apache-2.0',
    languages: ['en'],
    datasets: ['laion-2b'],
    metrics: ['fid'],
    siblings: [
      {
        rfilename: 'model.safetensors',
        size: 1073741824, // 1GB
      },
      {
        rfilename: 'config.json',
        size: 1024,
      },
    ],
    comfyuiCompatible: true,
    comfyuiModelType: ComfyUIModelType.CHECKPOINT,
    supportedFormats: ['safetensors', 'bin'],
    diffusionType: 'stable-diffusion',
  } as HuggingFaceMetadata,
  comfyuiCompatibility: {
    isCompatible: true,
    modelFolder: 'checkpoints',
    compatibilityNotes: 'Compatible with diffusers library',
    requiredNodes: ['Load Checkpoint'],
  },
  modelType: ComfyUIModelType.CHECKPOINT,
  baseModel: 'SD 1.5',
  fileSize: 1073741824, // 1GB
  fileFormat: 'safetensors',
};

const mockIncompatibleModel: ExternalModel = {
  ...mockCivitAIModel,
  id: 'incompatible-789',
  name: 'Incompatible Model',
  comfyuiCompatibility: {
    isCompatible: false,
    compatibilityNotes: 'This model format is not supported by ComfyUI',
    requiredNodes: [],
  },
};

describe('ModelDetailModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders modal when open with CivitAI model', () => {
    render(<ModelDetailModal model={mockCivitAIModel} isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Test Checkpoint Model' })).toBeInTheDocument();
    expect(screen.getByText('TestAuthor')).toBeInTheDocument();
    expect(
      screen.getByText('civitai', { selector: '.external-platform-badge' })
    ).toBeInTheDocument();
    expect(screen.getByText('CHECKPOINT')).toBeInTheDocument();
  });

  it('renders modal when open with HuggingFace model', () => {
    render(<ModelDetailModal model={mockHuggingFaceModel} isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Test Diffusion Model' })).toBeInTheDocument();
    expect(screen.getByText('HFAuthor')).toBeInTheDocument();
    expect(
      screen.getByText('huggingface', { selector: '.external-platform-badge' })
    ).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ModelDetailModal model={mockCivitAIModel} isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<ModelDetailModal model={mockCivitAIModel} isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    render(<ModelDetailModal model={mockCivitAIModel} isOpen={true} onClose={mockOnClose} />);

    const backdrop = screen.getByRole('dialog');
    fireEvent.click(backdrop);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    render(<ModelDetailModal model={mockCivitAIModel} isOpen={true} onClose={mockOnClose} />);

    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when modal content is clicked', () => {
    render(<ModelDetailModal model={mockCivitAIModel} isOpen={true} onClose={mockOnClose} />);

    const modalContent = screen
      .getByRole('dialog')
      .querySelector('.external-model-detail-modal-content');
    fireEvent.click(modalContent!);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('switches between tabs correctly', () => {
    render(<ModelDetailModal model={mockCivitAIModel} isOpen={true} onClose={mockOnClose} />);

    // Initially on Details tab
    expect(screen.getByText('Details')).toHaveClass('active');
    expect(screen.getByText('Basic Information')).toBeInTheDocument();

    // Switch to Compatibility tab
    fireEvent.click(screen.getByText('ComfyUI'));
    expect(screen.getByText('ComfyUI')).toHaveClass('active');
    expect(screen.getByText('ComfyUI Compatibility')).toBeInTheDocument();

    // Switch to Files tab
    fireEvent.click(screen.getByText('Files'));
    expect(screen.getByText('Files')).toHaveClass('active');
    expect(screen.getByText('Available Files')).toBeInTheDocument();
  });

  it('displays model information correctly', () => {
    render(<ModelDetailModal model={mockCivitAIModel} isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByRole('heading', { name: 'Test Checkpoint Model' })).toBeInTheDocument();
    expect(screen.getByText('TestAuthor')).toBeInTheDocument();
    expect(screen.getByText('15.0K')).toBeInTheDocument(); // Download count
    expect(screen.getByText('4.5')).toBeInTheDocument(); // Rating
    expect(screen.getByText('2.0 GB')).toBeInTheDocument(); // File size
    expect(screen.getByText('SAFETENSORS')).toBeInTheDocument(); // Format
    expect(screen.getByText('SD 1.5')).toBeInTheDocument(); // Base model
  });

  it('displays tags correctly', () => {
    render(<ModelDetailModal model={mockCivitAIModel} isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('realistic')).toBeInTheDocument();
    expect(screen.getByText('portrait')).toBeInTheDocument();
    expect(screen.getByText('photography')).toBeInTheDocument();
  });

  it('displays CivitAI-specific metadata', () => {
    render(<ModelDetailModal model={mockCivitAIModel} isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('CivitAI Information')).toBeInTheDocument();
    expect(screen.getByText('500 favorites')).toBeInTheDocument();
    expect(screen.getByText('25 comments')).toBeInTheDocument();
    expect(screen.getByText('Commercial use: Yes')).toBeInTheDocument();
  });

  it('displays HuggingFace-specific metadata', () => {
    render(<ModelDetailModal model={mockHuggingFaceModel} isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('HuggingFace Information')).toBeInTheDocument();
    expect(screen.getByText('Library: diffusers')).toBeInTheDocument();
    expect(screen.getByText('Pipeline: text-to-image')).toBeInTheDocument();
    expect(screen.getByText('License: apache-2.0')).toBeInTheDocument();
    expect(screen.getByText('Diffusion Type: stable-diffusion')).toBeInTheDocument();
  });

  it('displays compatibility information for compatible model', () => {
    render(<ModelDetailModal model={mockCivitAIModel} isOpen={true} onClose={mockOnClose} />);

    // Switch to Compatibility tab
    fireEvent.click(screen.getByText('ComfyUI'));

    expect(screen.getByText('Compatible with ComfyUI')).toBeInTheDocument();
    expect(screen.getByText('Fully compatible with ComfyUI')).toBeInTheDocument();
    expect(screen.getByText('ComfyUI/models/checkpoints/')).toBeInTheDocument();
    expect(screen.getByText('Load Checkpoint')).toBeInTheDocument();
    expect(screen.getByText('CheckpointLoaderSimple')).toBeInTheDocument();
  });

  it('displays compatibility information for incompatible model', () => {
    render(<ModelDetailModal model={mockIncompatibleModel} isOpen={true} onClose={mockOnClose} />);

    // Switch to Compatibility tab
    fireEvent.click(screen.getByText('ComfyUI'));

    expect(screen.getByText('Incompatible with ComfyUI')).toBeInTheDocument();
    expect(screen.getByText('This model format is not supported by ComfyUI')).toBeInTheDocument();
  });

  it('displays file information for CivitAI model', () => {
    render(<ModelDetailModal model={mockCivitAIModel} isOpen={true} onClose={mockOnClose} />);

    // Switch to Files tab
    fireEvent.click(screen.getByText('Files'));

    expect(screen.getByText('Available Files')).toBeInTheDocument();
    expect(screen.getByText('Version: v1.0')).toBeInTheDocument();
    expect(screen.getByText('model.safetensors')).toBeInTheDocument();
    expect(screen.getByText('2.0 GB')).toBeInTheDocument();
    expect(screen.getByText('SAFETENSORS')).toBeInTheDocument();
    expect(screen.getByText('Model')).toBeInTheDocument();
  });

  it('displays file information for HuggingFace model', () => {
    render(<ModelDetailModal model={mockHuggingFaceModel} isOpen={true} onClose={mockOnClose} />);

    // Switch to Files tab
    fireEvent.click(screen.getByText('Files'));

    expect(screen.getByText('Available Files')).toBeInTheDocument();
    expect(screen.getByText('model.safetensors')).toBeInTheDocument();
    expect(screen.getByText('config.json')).toBeInTheDocument();
    expect(screen.getByText('1.0 GB')).toBeInTheDocument();
    expect(screen.getByText('1.0 KB')).toBeInTheDocument();
  });

  it('copies text to clipboard when copy button is clicked', async () => {
    render(<ModelDetailModal model={mockCivitAIModel} isOpen={true} onClose={mockOnClose} />);

    const copyButton = screen.getAllByTitle('Copy model name')[0];
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Test Checkpoint Model');

    // Check for success state
    await waitFor(() => {
      expect(copyButton).toHaveClass('success');
    });
  });

  it('copies folder path to clipboard', async () => {
    render(<ModelDetailModal model={mockCivitAIModel} isOpen={true} onClose={mockOnClose} />);

    // Switch to Compatibility tab
    fireEvent.click(screen.getByText('ComfyUI'));

    const copyButton = screen.getByTitle('Copy folder path');
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ComfyUI/models/checkpoints/');
  });

  it('handles image loading states', () => {
    render(<ModelDetailModal model={mockCivitAIModel} isOpen={true} onClose={mockOnClose} />);

    const image = screen.getByAltText('Test Checkpoint Model preview');
    expect(image).toBeInTheDocument();

    // Simulate image error
    fireEvent.error(image);

    // The image should be hidden and placeholder should be shown
    expect(image.style.display).toBe('none');
  });

  it('shows Images tab only when model has images', () => {
    const modelWithoutImages = {
      ...mockCivitAIModel,
      thumbnailUrl: undefined,
    };

    render(<ModelDetailModal model={modelWithoutImages} isOpen={true} onClose={mockOnClose} />);

    expect(screen.queryByText(/Images \(/)).not.toBeInTheDocument();
  });

  it('shows Files tab only when model has file information', () => {
    const modelWithoutFiles = {
      ...mockCivitAIModel,
      metadata: {
        ...(mockCivitAIModel.metadata as CivitAIMetadata),
        versions: [],
      },
    };

    render(<ModelDetailModal model={modelWithoutFiles} isOpen={true} onClose={mockOnClose} />);

    expect(screen.queryByText('Files')).not.toBeInTheDocument();
  });

  it('formats file sizes correctly', () => {
    render(<ModelDetailModal model={mockCivitAIModel} isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('2.0 GB')).toBeInTheDocument();
  });

  it('formats download counts correctly', () => {
    render(<ModelDetailModal model={mockCivitAIModel} isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('15.0K')).toBeInTheDocument();
  });

  it('displays rating with stars', () => {
    render(<ModelDetailModal model={mockCivitAIModel} isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('4.5')).toBeInTheDocument();

    // Check for star icons (should have 4 filled stars and 1 empty)
    const starsContainer = screen.getByText('4.5').parentElement?.querySelector('.external-stars');
    expect(starsContainer).toBeInTheDocument();
    const stars = starsContainer?.querySelectorAll('i[class*="pi-star"]');
    expect(stars).toHaveLength(5);
  });

  it('handles models without optional fields gracefully', () => {
    const minimalModel: ExternalModel = {
      id: 'minimal-123',
      name: 'Minimal Model',
      description: '',
      author: 'MinimalAuthor',
      platform: 'civitai',
      tags: [],
      downloadCount: 0,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      metadata: {} as CivitAIMetadata,
      comfyuiCompatibility: {
        isCompatible: true,
        requiredNodes: [],
      },
    };

    render(<ModelDetailModal model={minimalModel} isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByRole('heading', { name: 'Minimal Model' })).toBeInTheDocument();
    expect(screen.getByText('MinimalAuthor')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // Download count
  });
});
