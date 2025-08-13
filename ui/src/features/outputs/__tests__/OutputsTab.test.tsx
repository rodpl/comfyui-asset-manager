import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OutputsTab from '../OutputsTab';
import { Output } from '../types';
import { OutputGalleryProps } from '../components/OutputGallery';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'tabs.outputs': 'Outputs',
        'tabs.outputsDescription': 'View and manage your ComfyUI generated images and outputs',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock LoadingSpinner component
vi.mock('../../../components/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>,
}));

// Mock the components
vi.mock('../components', () => ({
  OutputGallery: ({ outputs, onOutputSelect }: OutputGalleryProps) => (
    <div data-testid="output-gallery">
      {outputs.map((output: Output) => (
        <div key={output.id} onClick={() => onOutputSelect(output)}>
          {output.filename}
        </div>
      ))}
    </div>
  ),
  OutputModal: ({
    isOpen,
    output,
    onClose,
  }: {
    isOpen: boolean;
    output: Output | null;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid="output-modal">
        <div>{output?.filename}</div>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
  OutputToolbar: ({
    viewMode,
    onViewModeChange,
    sortBy,
    onSortChange,
    onRefresh,
    loading,
  }: {
    viewMode: string;
    onViewModeChange: (mode: string) => void;
    sortBy: string;
    onSortChange: (sortBy: string) => void;
    onRefresh: () => void;
    loading?: boolean;
  }) => (
    <div data-testid="output-toolbar">
      <button
        data-testid="grid-view-button"
        className={viewMode === 'grid' ? 'active' : ''}
        onClick={() => onViewModeChange('grid')}
      >
        Grid
      </button>
      <button
        data-testid="list-view-button"
        className={viewMode === 'list' ? 'active' : ''}
        onClick={() => onViewModeChange('list')}
      >
        List
      </button>
      <select
        data-testid="sort-select"
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
      >
        <option value="date-desc">Newest First</option>
        <option value="date-asc">Oldest First</option>
        <option value="name-asc">Name A-Z</option>
        <option value="name-desc">Name Z-A</option>
        <option value="size-desc">Largest First</option>
        <option value="size-asc">Smallest First</option>
      </select>
      <button
        data-testid="refresh-button"
        onClick={onRefresh}
        disabled={loading}
      >
        Refresh
      </button>
    </div>
  ),
}));

// Mock the mockData
vi.mock('../mockData', () => ({
  mockOutputs: [
    {
      id: 'test-1',
      filename: 'test-output-1.png',
      filePath: '/output/test-output-1.png',
      fileSize: 1024000,
      createdAt: new Date('2024-01-25T14:30:00Z'),
      modifiedAt: new Date('2024-01-25T14:30:00Z'),
      imageWidth: 1024,
      imageHeight: 1024,
      fileFormat: 'png',
    },
    {
      id: 'test-2',
      filename: 'test-output-2.jpg',
      filePath: '/output/test-output-2.jpg',
      fileSize: 2048000,
      createdAt: new Date('2024-01-25T13:30:00Z'),
      modifiedAt: new Date('2024-01-25T13:30:00Z'),
      imageWidth: 512,
      imageHeight: 768,
      fileFormat: 'jpg',
    },
  ],
}));

describe('OutputsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the outputs tab with header', () => {
    render(<OutputsTab />);

    expect(screen.getByText('Outputs')).toBeInTheDocument();
    expect(
      screen.getByText('View and manage your ComfyUI generated images and outputs')
    ).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<OutputsTab />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading outputs...')).toBeInTheDocument();
  });

  it('renders toolbar with view controls', async () => {
    render(<OutputsTab />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Grid')).toBeInTheDocument();
    expect(screen.getByText('List')).toBeInTheDocument();
    expect(screen.getByText('Refresh')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Newest First')).toBeInTheDocument();
  });

  it('renders output gallery after loading', async () => {
    render(<OutputsTab />);

    // Wait for loading to finish to avoid race conditions on CI
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    expect(await screen.findByText('test-output-1.png')).toBeInTheDocument();
    expect(await screen.findByText('test-output-2.jpg')).toBeInTheDocument();
  });

  it('handles view mode changes', async () => {
    render(<OutputsTab />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    const gridButton = screen.getByText('Grid');
    const listButton = screen.getByText('List');

    expect(gridButton).toHaveClass('active');
    expect(listButton).not.toHaveClass('active');

    fireEvent.click(listButton);

    expect(listButton).toHaveClass('active');
    expect(gridButton).not.toHaveClass('active');
  });

  it('handles sort option changes', async () => {
    render(<OutputsTab />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    const sortSelect = screen.getByDisplayValue('Newest First');
    fireEvent.change(sortSelect, { target: { value: 'name-asc' } });

    expect(sortSelect).toHaveValue('name-asc');
  });

  it('handles refresh button click', async () => {
    render(<OutputsTab />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    // Should show loading state briefly
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('opens modal when output is selected', async () => {
    render(<OutputsTab />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    const outputItem = screen.getByText('test-output-1.png');
    fireEvent.click(outputItem);

    expect(screen.getByTestId('output-modal')).toBeInTheDocument();
    expect(screen.getAllByText('test-output-1.png')).toHaveLength(2); // One in gallery, one in modal
  });

  it('closes modal when close button is clicked', async () => {
    render(<OutputsTab />);

    await waitFor(() => {
      expect(screen.getByTestId('output-gallery')).toBeInTheDocument();
    });

    // Open modal
    const outputItem = screen.getByText('test-output-1.png');
    fireEvent.click(outputItem);

    expect(screen.getByTestId('output-modal')).toBeInTheDocument();

    // Close modal
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(screen.queryByTestId('output-modal')).not.toBeInTheDocument();
  });

  it('closes modal with Escape key', async () => {
    render(<OutputsTab />);

    await waitFor(() => {
      expect(screen.getByTestId('output-gallery')).toBeInTheDocument();
    });

    // Open modal
    const outputItem = screen.getByText('test-output-1.png');
    fireEvent.click(outputItem);

    expect(screen.getByTestId('output-modal')).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByTestId('output-modal')).not.toBeInTheDocument();
    });
  });

  it('renders with correct CSS classes', () => {
    const { container } = render(<OutputsTab />);

    expect(container.querySelector('.tab-panel')).toBeInTheDocument();
    expect(container.querySelector('.tab-panel-header')).toBeInTheDocument();
    expect(container.querySelector('.tab-panel-content')).toBeInTheDocument();
    expect(container.querySelector('.outputs-container')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    // Mock console.error to avoid test output noise
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock a failed promise to trigger error state
    vi.spyOn(globalThis, 'setTimeout').mockImplementationOnce(() => {
      // Simulate an error during loading
      throw new Error('Failed to load outputs');
    });

    render(<OutputsTab />);

    // The error should be caught and handled gracefully
    await waitFor(() => {
      // Component should still render without crashing
      expect(screen.getByText('Outputs')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('has proper accessibility attributes', () => {
    render(<OutputsTab />);

    const tabPanel = screen.getByRole('tabpanel');
    expect(tabPanel).toHaveAttribute('aria-labelledby', 'outputs-tab');

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveAttribute('id', 'outputs-tab');
  });
});
