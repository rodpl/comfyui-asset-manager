// React import removed to align with new JSX runtime when not needed
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ConfirmationDialog from '../ConfirmationDialog';
import { resetBodyScrollLock } from '../../../../utils/bodyScrollLock';

describe('ConfirmationDialog', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Test Dialog',
    message: 'Are you sure you want to proceed?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetBodyScrollLock();
  });

  it('renders when open', () => {
    render(<ConfirmationDialog {...defaultProps} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ConfirmationDialog {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    render(<ConfirmationDialog {...defaultProps} />);
    
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);
    
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<ConfirmationDialog {...defaultProps} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when backdrop is clicked', () => {
    render(<ConfirmationDialog {...defaultProps} />);
    
    const backdrop = screen.getByRole('dialog');
    fireEvent.click(backdrop);
    
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not call onCancel when dialog content is clicked', () => {
    render(<ConfirmationDialog {...defaultProps} />);
    
    const title = screen.getByText('Test Dialog');
    fireEvent.click(title);
    
    expect(defaultProps.onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel when escape key is pressed', () => {
    render(<ConfirmationDialog {...defaultProps} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when enter key is pressed', () => {
    render(<ConfirmationDialog {...defaultProps} />);
    
    fireEvent.keyDown(document, { key: 'Enter' });
    
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('uses custom button text when provided', () => {
    render(
      <ConfirmationDialog
        {...defaultProps}
        confirmText="Yes, Delete"
        cancelText="No, Keep"
      />
    );
    
    expect(screen.getByRole('button', { name: /yes, delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /no, keep/i })).toBeInTheDocument();
  });

  it('shows correct icon for different types', () => {
    const { rerender } = render(<ConfirmationDialog {...defaultProps} type="info" />);
    expect(screen.getByRole('dialog')).toContainHTML('pi-question-circle');

    rerender(<ConfirmationDialog {...defaultProps} type="warning" />);
    expect(screen.getByRole('dialog')).toContainHTML('pi-exclamation-triangle');

    rerender(<ConfirmationDialog {...defaultProps} type="error" />);
    expect(screen.getByRole('dialog')).toContainHTML('pi-times-circle');
  });

  it('prevents body scroll when open', () => {
    const { rerender } = render(<ConfirmationDialog {...defaultProps} />);
    
    expect(document.body.style.overflow).toBe('hidden');
    
    rerender(<ConfirmationDialog {...defaultProps} isOpen={false} />);
    
    expect(document.body.style.overflow).toBe('unset');
  });

  it('focuses cancel button by default', () => {
    render(<ConfirmationDialog {...defaultProps} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toHaveFocus();
  });

  it('has proper accessibility attributes', () => {
    render(<ConfirmationDialog {...defaultProps} />);
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'confirmation-dialog-title');
    
    const title = screen.getByText('Test Dialog');
    expect(title).toHaveAttribute('id', 'confirmation-dialog-title');
  });
});