import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OutputCard } from '../components';
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
};

const mockOutputWithoutThumbnail: Output = {
  ...mockOutput,
  id: 'output-2',
  filename: 'no-thumbnail.jpg',
  thumbnailPath: undefined,
};

describe('OutputCard', () => {
  const defaultProps = {
    output: mockOutput,
    viewMode: 'grid' as const,
    onClick: vi.fn(),
    onContextMenu: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Grid View', () => {
    it('renders output card in grid view', () => {
      render(<OutputCard {...defaultProps} />);

      expect(screen.getByRole('gridcell')).toHaveClass('output-card');
      expect(screen.getByText('test-image.png')).toBeInTheDocument();
      expect(screen.getByText('2.0 MB')).toBeInTheDocument();
      expect(screen.getByText('1024×768')).toBeInTheDocument();
    });

    it('displays thumbnail when available', () => {
      render(<OutputCard {...defaultProps} />);

      const thumbnail = screen.getByAltText('test-image.png');
      expect(thumbnail).toBeInTheDocument();
      expect(thumbnail).toHaveAttribute('src', '/output/thumbnails/test-image.png');
    });

    it('displays placeholder icon when no thumbnail', () => {
      render(<OutputCard {...defaultProps} output={mockOutputWithoutThumbnail} />);

      const placeholderIcon = document.querySelector('.pi-image');
      expect(placeholderIcon).toBeInTheDocument();
    });

    it('handles thumbnail load error', () => {
      render(<OutputCard {...defaultProps} />);

      const thumbnail = screen.getByAltText('test-image.png');
      fireEvent.error(thumbnail);

      // After error, should show placeholder icon
      const placeholderIcon = document.querySelector('.pi-image');
      expect(placeholderIcon).toBeInTheDocument();
    });

    it('shows overlay buttons on hover', () => {
      render(<OutputCard {...defaultProps} />);

      const quickViewButton = screen.getByLabelText('Quick view');
      const moreActionsButton = screen.getByLabelText('More actions');

      expect(quickViewButton).toBeInTheDocument();
      expect(moreActionsButton).toBeInTheDocument();
    });

    it('displays formatted date and file size', () => {
      render(<OutputCard {...defaultProps} />);

      expect(screen.getByText(/Jan 25, 2024.*PM/)).toBeInTheDocument();
      expect(screen.getByText('2.0 MB')).toBeInTheDocument();
    });

    it('truncates long filenames', () => {
      const longFilenameOutput = {
        ...mockOutput,
        filename: 'very-long-filename-that-should-be-truncated-in-the-display.png',
      };

      render(<OutputCard {...defaultProps} output={longFilenameOutput} />);

      const filenameElement = screen.getByText(longFilenameOutput.filename);
      expect(filenameElement).toHaveClass('output-card-filename');
    });
  });

  describe('List View', () => {
    it('renders output card in list view', () => {
      render(<OutputCard {...defaultProps} viewMode="list" />);

      expect(screen.getByRole('gridcell')).toHaveClass('output-list-item');
      expect(screen.getByText('test-image.png')).toBeInTheDocument();
    });

    it('displays thumbnail in list view', () => {
      render(<OutputCard {...defaultProps} viewMode="list" />);

      const thumbnail = screen.getByAltText('test-image.png');
      expect(thumbnail).toBeInTheDocument();
      expect(thumbnail.parentElement).toHaveClass('output-list-thumbnail');
    });

    it('displays metadata in list view format', () => {
      render(<OutputCard {...defaultProps} viewMode="list" />);

      const metaText = screen.getByText(/Jan 25, 2024.*1024×768.*2.0 MB/);
      expect(metaText).toBeInTheDocument();
    });

    it('shows actions button in list view', () => {
      render(<OutputCard {...defaultProps} viewMode="list" />);

      const actionsButton = screen.getByLabelText('More actions');
      expect(actionsButton).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onClick when card is clicked', () => {
      const onClick = vi.fn();
      render(<OutputCard {...defaultProps} onClick={onClick} />);

      const card = screen.getByRole('gridcell');
      fireEvent.click(card);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('calls onContextMenu when card is right-clicked', () => {
      const onContextMenu = vi.fn();
      render(<OutputCard {...defaultProps} onContextMenu={onContextMenu} />);

      const card = screen.getByRole('gridcell');
      fireEvent.contextMenu(card);

      expect(onContextMenu).toHaveBeenCalledTimes(1);
    });

    it('calls onClick when Enter key is pressed', () => {
      const onClick = vi.fn();
      render(<OutputCard {...defaultProps} onClick={onClick} />);

      const card = screen.getByRole('gridcell');
      fireEvent.keyDown(card, { key: 'Enter' });

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick when Space key is pressed', () => {
      const onClick = vi.fn();
      render(<OutputCard {...defaultProps} onClick={onClick} />);

      const card = screen.getByRole('gridcell');
      fireEvent.keyDown(card, { key: ' ' });

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick for other keys', () => {
      const onClick = vi.fn();
      render(<OutputCard {...defaultProps} onClick={onClick} />);

      const card = screen.getByRole('gridcell');
      fireEvent.keyDown(card, { key: 'Tab' });

      expect(onClick).not.toHaveBeenCalled();
    });

    it('prevents event propagation for overlay buttons', () => {
      const onClick = vi.fn();
      render(<OutputCard {...defaultProps} onClick={onClick} />);

      const moreActionsButton = screen.getByLabelText('More actions');
      fireEvent.click(moreActionsButton);

      // Card onClick should not be called when overlay button is clicked
      expect(onClick).not.toHaveBeenCalled();
    });

    it('calls onContextMenu when more actions button is clicked in grid view', () => {
      const onContextMenu = vi.fn();
      render(<OutputCard {...defaultProps} onContextMenu={onContextMenu} />);

      const moreActionsButton = screen.getByLabelText('More actions');
      fireEvent.click(moreActionsButton);

      expect(onContextMenu).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<OutputCard {...defaultProps} />);

      const card = screen.getByRole('gridcell');
      expect(card).toHaveAttribute('aria-label', 'Output test-image.png');
      expect(card).toHaveAttribute('tabindex', '0');
    });

    it('has proper alt text for thumbnails', () => {
      render(<OutputCard {...defaultProps} />);

      const thumbnail = screen.getByAltText('test-image.png');
      expect(thumbnail).toBeInTheDocument();
    });

    it('has accessible button labels', () => {
      render(<OutputCard {...defaultProps} />);

      expect(screen.getByLabelText('Quick view')).toBeInTheDocument();
      expect(screen.getByLabelText('More actions')).toBeInTheDocument();
    });

    it('has proper title attributes for tooltips', () => {
      render(<OutputCard {...defaultProps} />);

      const filenameElement = screen.getByText('test-image.png');
      expect(filenameElement).toHaveAttribute('title', 'test-image.png');

      expect(screen.getByTitle('Quick view')).toBeInTheDocument();
      expect(screen.getByTitle('More actions')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing thumbnail gracefully', () => {
      render(<OutputCard {...defaultProps} output={mockOutputWithoutThumbnail} />);

      const placeholderIcon = document.querySelector('.pi-image');
      expect(placeholderIcon).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('handles zero file size', () => {
      const zeroSizeOutput = { ...mockOutput, fileSize: 0 };
      render(<OutputCard {...defaultProps} output={zeroSizeOutput} />);

      expect(screen.getByText('0 B')).toBeInTheDocument();
    });

    it('handles invalid dates gracefully', () => {
      const invalidDateOutput = {
        ...mockOutput,
        createdAt: new Date('invalid-date'),
      };

      expect(() => {
        render(<OutputCard {...defaultProps} output={invalidDateOutput} />);
      }).not.toThrow();
    });

    it('handles empty filename', () => {
      const emptyFilenameOutput = { ...mockOutput, filename: '' };
      render(<OutputCard {...defaultProps} output={emptyFilenameOutput} />);

      // Should still render without errors
      expect(screen.getByRole('gridcell')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies correct CSS classes for different view modes', () => {
      const { rerender } = render(<OutputCard {...defaultProps} viewMode="grid" />);

      let card = screen.getByRole('gridcell');
      expect(card).toHaveClass('output-card');
      expect(card).not.toHaveClass('output-list-item');

      rerender(<OutputCard {...defaultProps} viewMode="list" />);

      card = screen.getByRole('gridcell');
      expect(card).toHaveClass('output-list-item');
      expect(card).not.toHaveClass('output-card');
    });
  });
});
