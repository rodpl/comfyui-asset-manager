// React import removed to align with new JSX runtime
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import OutputModal from '../OutputModal';
import { apiClient } from '../../../../services/api';
import { Output } from '../../types';
import { resetBodyScrollLock } from '../../../../utils/bodyScrollLock';

// Mock the API client
vi.mock('../../../../services/api', () => ({
  apiClient: {
    loadWorkflow: vi.fn(),
  },
}));

// Mock the utility functions
vi.mock('../../utils/outputUtils', () => ({
  formatFileSize: vi.fn((size: number) => `${size} bytes`),
  formatDate: vi.fn((date: Date) => date.toISOString()),
}));

describe('OutputModal - Workflow Loading', () => {
  const mockOutput: Output = {
    id: 'test-output-1',
    filename: 'test-image.png',
    filePath: '/path/to/test-image.png',
    fileSize: 1024,
    createdAt: new Date('2023-01-01'),
    modifiedAt: new Date('2023-01-01'),
    imageWidth: 512,
    imageHeight: 512,
    fileFormat: 'png',
    workflowMetadata: {
      workflow: { nodes: [] },
      prompt: 'test prompt',
      model: 'test-model.safetensors',
      steps: 20,
      seed: 12345,
    },
  };

  const mockOutputWithoutWorkflow: Output = {
    ...mockOutput,
    id: 'test-output-no-workflow',
    filename: 'no-workflow-image.png',
    workflowMetadata: undefined,
  };

  const defaultProps = {
    output: mockOutput,
    isOpen: true,
    onClose: vi.fn(),
    onAction: vi.fn(),
    outputs: [mockOutput],
    onNavigate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset DOM
    document.body.innerHTML = '';
    resetBodyScrollLock();
  });

  afterEach(() => {
    // Clean up any timers
    if (vi.isFakeTimers()) {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
    // Reset body overflow
    document.body.style.overflow = 'unset';
  });

  it('shows load workflow button when workflow metadata is available', () => {
    render(<OutputModal {...defaultProps} />);
    
    const loadButtons = screen.queryAllByText('Load Workflow');
    expect(loadButtons.length).toBeGreaterThan(0);
  });

  it('does not show load workflow button when workflow metadata is missing', () => {
    render(<OutputModal {...defaultProps} output={mockOutputWithoutWorkflow} />);
    
    const loadButtons = screen.queryAllByText('Load Workflow');
    expect(loadButtons).toHaveLength(0);
  });

  it('shows confirmation dialog when load workflow button is clicked', async () => {
    render(<OutputModal {...defaultProps} />);
    
    const loadButton = screen.getByText('Load Workflow');
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(screen.getByText(/are you sure you want to load the workflow/i)).toBeInTheDocument();
    });
  });

  it('cancels workflow loading when cancel button is clicked', async () => {
    render(<OutputModal {...defaultProps} />);
    
    const loadButton = screen.getByText('Load Workflow');
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(screen.getByText(/are you sure you want to load the workflow/i)).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText(/are you sure you want to load the workflow/i)).not.toBeInTheDocument();
    });

    expect(apiClient.loadWorkflow).not.toHaveBeenCalled();
  });

  it('loads workflow successfully when confirmed', async () => {
    const mockLoadWorkflow = vi.mocked(apiClient.loadWorkflow);
    mockLoadWorkflow.mockResolvedValue({
      success: true,
      message: 'Workflow loaded successfully',
    });

    render(<OutputModal {...defaultProps} />);
    
    const loadButton = screen.getByText('Load Workflow');
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(screen.getByText(/are you sure you want to load the workflow/i)).toBeInTheDocument();
    });

    const allConfirmButtons = screen.getAllByText('Load Workflow');
    const dialogConfirmButton = allConfirmButtons.find(btn => 
      btn.closest('.confirmation-dialog-actions')
    );
    fireEvent.click(dialogConfirmButton || allConfirmButtons[allConfirmButtons.length - 1]);

    await waitFor(() => {
      expect(mockLoadWorkflow).toHaveBeenCalledWith('test-output-1');
    });

    await waitFor(() => {
      expect(screen.getByText(/workflow loaded successfully/i)).toBeInTheDocument();
    });

    expect(defaultProps.onAction).toHaveBeenCalledWith('load-workflow', mockOutput);
  });

  it('shows error message when workflow loading fails', async () => {
    const mockLoadWorkflow = vi.mocked(apiClient.loadWorkflow);
    mockLoadWorkflow.mockRejectedValue(new Error('Network error'));

    render(<OutputModal {...defaultProps} />);
    
    const loadButton = screen.getByText('Load Workflow');
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(screen.getByText(/are you sure you want to load the workflow/i)).toBeInTheDocument();
    });

    const allConfirmButtons = screen.getAllByText('Load Workflow');
    const dialogConfirmButton = allConfirmButtons.find(btn => 
      btn.closest('.confirmation-dialog-actions')
    );
    fireEvent.click(dialogConfirmButton || allConfirmButtons[allConfirmButtons.length - 1]);

    await waitFor(() => {
      expect(mockLoadWorkflow).toHaveBeenCalledWith('test-output-1');
    });

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });

    expect(defaultProps.onAction).not.toHaveBeenCalled();
  });

  it('handles API response with success false', async () => {
    const mockLoadWorkflow = vi.mocked(apiClient.loadWorkflow);
    mockLoadWorkflow.mockResolvedValue({
      success: false,
      message: 'Workflow contains missing nodes',
    });

    render(<OutputModal {...defaultProps} />);
    
    const loadButton = screen.getByText('Load Workflow');
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(screen.getByText(/are you sure you want to load the workflow/i)).toBeInTheDocument();
    });

    const allConfirmButtons = screen.getAllByText('Load Workflow');
    const dialogConfirmButton = allConfirmButtons.find(btn => 
      btn.closest('.confirmation-dialog-actions')
    );
    fireEvent.click(dialogConfirmButton || allConfirmButtons[allConfirmButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText(/workflow contains missing nodes/i)).toBeInTheDocument();
    });

    expect(defaultProps.onAction).not.toHaveBeenCalled();
  });
});