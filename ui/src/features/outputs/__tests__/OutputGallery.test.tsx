import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OutputGallery } from '../components';
import { Output } from '../types';

const mockOutputs: Output[] = [
  {
    id: 'output-1',
    filename: 'test-image-1.png',
    filePath: '/output/test-image-1.png',
    fileSize: 1024000,
    createdAt: new Date('2024-01-25T14:30:00Z'),
    modifiedAt: new Date('2024-01-25T14:30:00Z'),
    imageWidth: 1024,
    imageHeight: 1024,
    fileFormat: 'png',
    thumbnailPath: '/output/thumbnails/test-image-1.png',
  },
  {
    id: 'output-2',
    filename: 'test-image-2.jpg',
    filePath: '/output/test-image-2.jpg',
    fileSize: 2048000,
    createdAt: new Date('2024-01-25T13:30:00Z'),
    modifiedAt: new Date('2024-01-25T13:30:00Z'),
    imageWidth: 512,
    imageHeight: 768,
    fileFormat: 'jpg',
  },
];

// Mock OutputCard component
vi.mock('../components/OutputCard', () => ({
  default: ({ output, onClick, onContextMenu, viewMode }: {
    output: Output;
    onClick: () => void;
    onContextMenu: (event: React.MouseEvent) => void;
    viewMode: 'grid' | 'list';
  }) => (
    <div
      data-testid={`output-card-${output.id}`}
      data-view-mode={viewMode}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {output.filename}
    </div>
  ),
}));

describe('OutputGallery', () => {
  const defaultProps = {
    outputs: mockOutputs,
    viewMode: 'grid' as const,
    onOutputSelect: vi.fn(),
    onContextMenu: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders gallery with outputs in grid mode', () => {
    render(<OutputGallery {...defaultProps} />);

    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', 'Output gallery');
    expect(screen.getByRole('grid')).toHaveClass('outputs-gallery', 'outputs-grid');

    expect(screen.getByTestId('output-card-output-1')).toBeInTheDocument();
    expect(screen.getByTestId('output-card-output-2')).toBeInTheDocument();
    expect(screen.getByText('test-image-1.png')).toBeInTheDocument();
    expect(screen.getByText('test-image-2.jpg')).toBeInTheDocument();
  });

  it('renders gallery with outputs in list mode', () => {
    render(<OutputGallery {...defaultProps} viewMode="list" />);

    expect(screen.getByRole('grid')).toHaveClass('outputs-gallery', 'outputs-list');
    
    const cards = screen.getAllByTestId(/output-card-/);
    cards.forEach(card => {
      expect(card).toHaveAttribute('data-view-mode', 'list');
    });
  });

  it('shows empty state when no outputs are provided', () => {
    render(<OutputGallery {...defaultProps} outputs={[]} />);

    expect(screen.getByText('No Outputs Found')).toBeInTheDocument();
    expect(screen.getByText('No generated images were found in your output directory.')).toBeInTheDocument();
    expect(screen.getByText('Generate some images with ComfyUI to see them here!')).toBeInTheDocument();
    
    // Should show empty state icon
    const emptyStateIcon = document.querySelector('.pi-images');
    expect(emptyStateIcon).toBeInTheDocument();
  });

  it('calls onOutputSelect when output card is clicked', () => {
    const onOutputSelect = vi.fn();
    render(<OutputGallery {...defaultProps} onOutputSelect={onOutputSelect} />);

    const outputCard = screen.getByTestId('output-card-output-1');
    fireEvent.click(outputCard);

    expect(onOutputSelect).toHaveBeenCalledWith(mockOutputs[0]);
  });

  it('calls onContextMenu when output card is right-clicked', () => {
    const onContextMenu = vi.fn();
    render(<OutputGallery {...defaultProps} onContextMenu={onContextMenu} />);

    const outputCard = screen.getByTestId('output-card-output-1');
    const contextMenuEvent = new MouseEvent('contextmenu', { bubbles: true });
    fireEvent(outputCard, contextMenuEvent);

    expect(onContextMenu).toHaveBeenCalledWith(mockOutputs[0], expect.any(Object));
  });

  it('renders all provided outputs', () => {
    render(<OutputGallery {...defaultProps} />);

    mockOutputs.forEach(output => {
      expect(screen.getByTestId(`output-card-${output.id}`)).toBeInTheDocument();
      expect(screen.getByText(output.filename)).toBeInTheDocument();
    });
  });

  it('passes correct props to OutputCard components', () => {
    render(<OutputGallery {...defaultProps} viewMode="list" />);

    const cards = screen.getAllByTestId(/output-card-/);
    expect(cards).toHaveLength(mockOutputs.length);
    
    cards.forEach(card => {
      expect(card).toHaveAttribute('data-view-mode', 'list');
    });
  });

  it('has proper accessibility attributes', () => {
    render(<OutputGallery {...defaultProps} />);

    const gallery = screen.getByRole('grid');
    expect(gallery).toHaveAttribute('aria-label', 'Output gallery');
  });

  it('applies correct CSS classes based on view mode', () => {
    const { rerender } = render(<OutputGallery {...defaultProps} viewMode="grid" />);
    
    let gallery = screen.getByRole('grid');
    expect(gallery).toHaveClass('outputs-gallery', 'outputs-grid');
    expect(gallery).not.toHaveClass('outputs-list');

    rerender(<OutputGallery {...defaultProps} viewMode="list" />);
    
    gallery = screen.getByRole('grid');
    expect(gallery).toHaveClass('outputs-gallery', 'outputs-list');
    expect(gallery).not.toHaveClass('outputs-grid');
  });

  it('handles empty outputs array gracefully', () => {
    render(<OutputGallery {...defaultProps} outputs={[]} />);

    expect(screen.queryByTestId(/output-card-/)).not.toBeInTheDocument();
    expect(screen.getByText('No Outputs Found')).toBeInTheDocument();
  });

  it('maintains component structure with different output counts', () => {
    const singleOutput = [mockOutputs[0]];
    const { rerender } = render(<OutputGallery {...defaultProps} outputs={singleOutput} />);

    expect(screen.getAllByTestId(/output-card-/)).toHaveLength(1);

    rerender(<OutputGallery {...defaultProps} outputs={mockOutputs} />);
    expect(screen.getAllByTestId(/output-card-/)).toHaveLength(2);
  });
});