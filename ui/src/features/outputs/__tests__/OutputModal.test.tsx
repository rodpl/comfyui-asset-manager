import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OutputModal } from '../components';
import { resetBodyScrollLock } from '../../../utils/bodyScrollLock';
import { Output } from '../types';

// Mock the mockData module
vi.mock('../mockData', () => ({
  formatFileSize: (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  },
  formatDate: (date: Date) =>
    date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
}));

const mockOutput: Output = {
  id: 'output-1',
  filename: 'test-image.png',
  filePath: '/output/test-image.png',
  fileSize: 2097152, // 2MB
  createdAt: new Date('2024-01-25T14:30:00Z'),
  modifiedAt: new Date('2024-01-25T14:30:00Z'),
  imageWidth: 1024,
  imageHeight: 768,
  fileFormat: 'png',
  thumbnailPath: '/output/thumbnails/test-image.png',
  workflowMetadata: {
    prompt: 'A beautiful landscape with mountains',
    model: 'Realistic Vision V5.1',
    steps: 20,
    cfg: 7.5,
    sampler: 'DPM++ 2M Karras',
    seed: 123456789,
  },
};

const mockOutputWithoutMetadata: Output = {
  ...mockOutput,
  id: 'output-2',
  filename: 'no-metadata.jpg',
  workflowMetadata: undefined,
};

const mockOutput3: Output = {
  ...mockOutput,
  id: 'output-3',
  filename: 'third-image.png',
};

const mockOutputs: Output[] = [mockOutput, mockOutputWithoutMetadata, mockOutput3];

describe('OutputModal', () => {
  const defaultProps = {
    output: mockOutput,
    isOpen: true,
    onClose: vi.fn(),
    onAction: vi.fn(),
    outputs: mockOutputs,
    onNavigate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset body overflow before each test
    document.body.style.overflow = 'unset';
    // Reset body scroll lock internal counter
    resetBodyScrollLock();

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    // Clean up any event listeners
    document.removeEventListener('keydown', vi.fn());
  });

  it('renders modal when open with output', () => {
    render(<OutputModal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('test-image.png')).toBeInTheDocument();
    expect(screen.getByAltText('test-image.png')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<OutputModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not render when no output provided', () => {
    render(<OutputModal {...defaultProps} output={null} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('displays image details correctly', () => {
    render(<OutputModal {...defaultProps} />);

    expect(screen.getByText('Image Details')).toBeInTheDocument();
    expect(screen.getByText('1024 × 768')).toBeInTheDocument();
    expect(screen.getByText('2.0 MB')).toBeInTheDocument();
    expect(screen.getByText('PNG')).toBeInTheDocument();
    expect(screen.getAllByText(/Jan 25, 2024.*PM/)).toHaveLength(2); // Created and Modified dates
  });

  it('displays workflow metadata when available', () => {
    render(<OutputModal {...defaultProps} />);

    expect(screen.getByText('Workflow Metadata')).toBeInTheDocument();
    expect(screen.getByText('A beautiful landscape with mountains')).toBeInTheDocument();
    expect(screen.getByText('Realistic Vision V5.1')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('7.5')).toBeInTheDocument();
    expect(screen.getByText('DPM++ 2M Karras')).toBeInTheDocument();
    expect(screen.getByText('123456789')).toBeInTheDocument();
  });

  it('hides workflow metadata section when not available', () => {
    render(<OutputModal {...defaultProps} output={mockOutputWithoutMetadata} />);

    expect(screen.queryByText('Workflow Metadata')).not.toBeInTheDocument();
  });

  it('displays action buttons', () => {
    render(<OutputModal {...defaultProps} />);

    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('Open in System Viewer')).toBeInTheDocument();
    expect(screen.getByText('Copy File Path')).toBeInTheDocument();
    expect(screen.getByText('Show in Folder')).toBeInTheDocument();
  });

  describe('User Interactions', () => {
    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<OutputModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      render(<OutputModal {...defaultProps} onClose={onClose} />);

      const backdrop = screen.getByRole('dialog');
      fireEvent.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when modal content is clicked', () => {
      const onClose = vi.fn();
      render(<OutputModal {...defaultProps} onClose={onClose} />);

      const modalContent = document.querySelector('.output-modal-container');
      fireEvent.click(modalContent!);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('calls onClose when Escape key is pressed', () => {
      const onClose = vi.fn();
      render(<OutputModal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose for other keys', () => {
      const onClose = vi.fn();
      render(<OutputModal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Enter' });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('navigates to previous output when left arrow is pressed', () => {
      const onNavigate = vi.fn();
      // Use second output so we can navigate to previous
      render(<OutputModal {...defaultProps} output={mockOutputs[1]} onNavigate={onNavigate} />);

      fireEvent.keyDown(document, { key: 'ArrowLeft' });

      expect(onNavigate).toHaveBeenCalledWith(mockOutputs[0]); // Previous output
    });

    it('navigates to next output when right arrow is pressed', () => {
      const onNavigate = vi.fn();
      // Use first output so we can navigate to next
      render(<OutputModal {...defaultProps} output={mockOutputs[0]} onNavigate={onNavigate} />);

      fireEvent.keyDown(document, { key: 'ArrowRight' });

      expect(onNavigate).toHaveBeenCalledWith(mockOutputs[1]); // Next output
    });

    it('does not navigate when at first output and left arrow pressed', () => {
      const onNavigate = vi.fn();
      render(<OutputModal {...defaultProps} output={mockOutputs[0]} onNavigate={onNavigate} />);

      fireEvent.keyDown(document, { key: 'ArrowLeft' });

      expect(onNavigate).not.toHaveBeenCalled();
    });

    it('does not navigate when at last output and right arrow pressed', () => {
      const onNavigate = vi.fn();
      render(<OutputModal {...defaultProps} output={mockOutputs[2]} onNavigate={onNavigate} />);

      fireEvent.keyDown(document, { key: 'ArrowRight' });

      expect(onNavigate).not.toHaveBeenCalled();
    });

    it('calls onAction with copy-path when copy button is clicked', () => {
      const onAction = vi.fn();
      render(<OutputModal {...defaultProps} onAction={onAction} />);

      const copyButton = screen.getByText('Copy File Path');
      fireEvent.click(copyButton);

      expect(onAction).toHaveBeenCalledWith('copy-path', mockOutput);
    });

    it('calls onAction with open-system when open button is clicked', () => {
      const onAction = vi.fn();
      render(<OutputModal {...defaultProps} onAction={onAction} />);

      const openButton = screen.getByText('Open in System Viewer');
      fireEvent.click(openButton);

      expect(onAction).toHaveBeenCalledWith('open-system', mockOutput);
    });

    it('calls onAction with show-folder when show folder button is clicked', () => {
      const onAction = vi.fn();
      render(<OutputModal {...defaultProps} onAction={onAction} />);

      const showFolderButton = screen.getByText('Show in Folder');
      fireEvent.click(showFolderButton);

      expect(onAction).toHaveBeenCalledWith('show-folder', mockOutput);
    });
  });

  describe('Image Handling', () => {
    it('displays main image with correct src', () => {
      render(<OutputModal {...defaultProps} />);

      const image = screen.getByAltText('test-image.png');
      expect(image).toHaveAttribute('src', '/output/test-image.png');
    });

    it('handles image load error by falling back to thumbnail', () => {
      render(<OutputModal {...defaultProps} />);

      const image = screen.getByAltText('test-image.png');
      fireEvent.error(image);

      expect(image).toHaveAttribute('src', '/output/thumbnails/test-image.png');
    });

    it('shows error message when both main image and thumbnail fail', () => {
      const outputWithoutThumbnail = { ...mockOutput, thumbnailPath: undefined };
      render(<OutputModal {...defaultProps} output={outputWithoutThumbnail} />);

      const image = screen.getByAltText('test-image.png');
      fireEvent.error(image);

      expect(screen.getByText('Failed to load image')).toBeInTheDocument();
    });
  });

  describe('Body Overflow Management', () => {
    it('sets body overflow to hidden when modal opens', () => {
      render(<OutputModal {...defaultProps} />);

      return waitFor(() => expect(document.body.style.overflow).toBe('hidden'));
    });

    it('resets body overflow when modal closes', () => {
      const { rerender } = render(<OutputModal {...defaultProps} />);

      return waitFor(() => expect(document.body.style.overflow).toBe('hidden')).then(() => {
        rerender(<OutputModal {...defaultProps} isOpen={false} />);

        return waitFor(() => expect(document.body.style.overflow).toBe('unset'));
      });
    });

    it('resets body overflow on unmount', () => {
      const { unmount } = render(<OutputModal {...defaultProps} />);

      return waitFor(() => expect(document.body.style.overflow).toBe('hidden')).then(() => {
        unmount();

        expect(document.body.style.overflow).toBe('unset');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<OutputModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'output-modal-title');
    });

    it('has proper heading structure', () => {
      render(<OutputModal {...defaultProps} />);

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveAttribute('id', 'output-modal-title');
      expect(title).toHaveTextContent('test-image.png');
    });

    it('has accessible button labels', () => {
      render(<OutputModal {...defaultProps} />);

      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });

    it('has proper button titles for tooltips', () => {
      render(<OutputModal {...defaultProps} />);

      expect(screen.getByTitle('Open in system image viewer')).toBeInTheDocument();
      expect(screen.getByTitle('Copy file path to clipboard')).toBeInTheDocument();
      expect(screen.getByTitle('Show file in folder')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies correct CSS classes', () => {
      render(<OutputModal {...defaultProps} />);

      expect(document.querySelector('.output-modal-backdrop')).toBeInTheDocument();
      expect(document.querySelector('.output-modal-container')).toBeInTheDocument();
      expect(document.querySelector('.output-modal-header')).toBeInTheDocument();
      expect(document.querySelector('.output-modal-content')).toBeInTheDocument();
      expect(document.querySelector('.output-modal-sidebar')).toBeInTheDocument();
    });
  });

  describe('Navigation Controls', () => {
    it('shows navigation buttons when there are multiple outputs', () => {
      // Use middle output so both navigation buttons show
      render(<OutputModal {...defaultProps} output={mockOutputs[1]} />);

      expect(screen.getByLabelText('Previous image')).toBeInTheDocument();
      expect(screen.getByLabelText('Next image')).toBeInTheDocument();
    });

    it('hides previous button when at first output', () => {
      render(<OutputModal {...defaultProps} output={mockOutputs[0]} />);

      expect(screen.queryByLabelText('Previous image')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Next image')).toBeInTheDocument();
    });

    it('hides next button when at last output', () => {
      render(<OutputModal {...defaultProps} output={mockOutputs[2]} />);

      expect(screen.getByLabelText('Previous image')).toBeInTheDocument();
      expect(screen.queryByLabelText('Next image')).not.toBeInTheDocument();
    });

    it('calls onNavigate when navigation buttons are clicked', () => {
      const onNavigate = vi.fn();
      render(<OutputModal {...defaultProps} output={mockOutputs[0]} onNavigate={onNavigate} />);

      const nextButton = screen.getByLabelText('Next image');
      fireEvent.click(nextButton);

      expect(onNavigate).toHaveBeenCalledWith(mockOutputs[1]);
    });

    it('hides navigation buttons when outputs array is empty', () => {
      render(<OutputModal {...defaultProps} outputs={[]} />);

      expect(screen.queryByLabelText('Previous image')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Next image')).not.toBeInTheDocument();
    });
  });

  describe('Zoom Controls', () => {
    it('displays zoom controls', () => {
      render(<OutputModal {...defaultProps} />);

      expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
      expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
      expect(screen.getByLabelText('Reset zoom')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('updates zoom level when zoom buttons are clicked', () => {
      render(<OutputModal {...defaultProps} />);

      const zoomInButton = screen.getByLabelText('Zoom in');
      fireEvent.click(zoomInButton);

      expect(screen.getByText('120%')).toBeInTheDocument();
    });

    it('resets zoom when reset button is clicked', () => {
      render(<OutputModal {...defaultProps} />);

      const zoomInButton = screen.getByLabelText('Zoom in');
      const resetButton = screen.getByLabelText('Reset zoom');

      fireEvent.click(zoomInButton);
      expect(screen.getByText('120%')).toBeInTheDocument();

      fireEvent.click(resetButton);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('disables zoom out button at minimum zoom', () => {
      render(<OutputModal {...defaultProps} />);

      const zoomOutButton = screen.getByLabelText('Zoom out');

      // Click zoom out multiple times to reach minimum
      for (let i = 0; i < 20; i++) {
        fireEvent.click(zoomOutButton);
      }

      expect(zoomOutButton).toBeDisabled();
    });

    it('disables zoom in button at maximum zoom', () => {
      render(<OutputModal {...defaultProps} />);

      const zoomInButton = screen.getByLabelText('Zoom in');

      // Click zoom in multiple times to reach maximum
      for (let i = 0; i < 20; i++) {
        fireEvent.click(zoomInButton);
      }

      expect(zoomInButton).toBeDisabled();
    });
  });

  describe('Keyboard Zoom Controls', () => {
    it('zooms in when + key is pressed', () => {
      render(<OutputModal {...defaultProps} />);

      fireEvent.keyDown(document, { key: '+' });

      expect(screen.getByText('120%')).toBeInTheDocument();
    });

    it('zooms in when = key is pressed', () => {
      render(<OutputModal {...defaultProps} />);

      fireEvent.keyDown(document, { key: '=' });

      expect(screen.getByText('120%')).toBeInTheDocument();
    });

    it('zooms out when - key is pressed', () => {
      render(<OutputModal {...defaultProps} />);

      // First zoom in
      fireEvent.keyDown(document, { key: '+' });
      expect(screen.getByText('120%')).toBeInTheDocument();

      // Then zoom out
      fireEvent.keyDown(document, { key: '-' });
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('resets zoom when 0 key is pressed', () => {
      render(<OutputModal {...defaultProps} />);

      // First zoom in
      fireEvent.keyDown(document, { key: '+' });
      expect(screen.getByText('120%')).toBeInTheDocument();

      // Then reset
      fireEvent.keyDown(document, { key: '0' });
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing workflow metadata fields gracefully', () => {
      const partialMetadataOutput = {
        ...mockOutput,
        workflowMetadata: {
          prompt: 'Test prompt',
          // Missing other fields
        },
      };

      render(<OutputModal {...defaultProps} output={partialMetadataOutput} />);

      expect(screen.getByText('Test prompt')).toBeInTheDocument();
      expect(screen.queryByText('Realistic Vision V5.1')).not.toBeInTheDocument();
    });

    it('handles empty strings in metadata', () => {
      const emptyMetadataOutput = {
        ...mockOutput,
        workflowMetadata: {
          prompt: '',
          model: 'Test Model',
        },
      };

      render(<OutputModal {...defaultProps} output={emptyMetadataOutput} />);

      expect(screen.getByText('Test Model')).toBeInTheDocument();
      // Empty prompt should not be displayed
      expect(screen.queryByText(/Prompt:/)).not.toBeInTheDocument();
    });

    it('handles zero values in metadata', () => {
      const zeroMetadataOutput = {
        ...mockOutput,
        workflowMetadata: {
          steps: 0,
          cfg: 0,
          seed: 0,
        },
      };

      render(<OutputModal {...defaultProps} output={zeroMetadataOutput} />);

      // The zero values should be rendered but not in proper detail rows since they're empty
      expect(screen.getByText('Workflow Metadata')).toBeInTheDocument();
    });

    it('resets zoom and pan when output changes', () => {
      const { rerender } = render(<OutputModal {...defaultProps} />);

      // Zoom in first
      fireEvent.keyDown(document, { key: '+' });
      expect(screen.getByText('120%')).toBeInTheDocument();

      // Change output
      rerender(<OutputModal {...defaultProps} output={mockOutputs[2]} />);

      // Should reset to 100%
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });
});
