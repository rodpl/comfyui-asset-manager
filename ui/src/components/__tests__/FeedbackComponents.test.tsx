/**
 * Tests for feedback components with theme support
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorMessage, SuccessMessage, EmptyState, Toast, ProgressIndicator } from '../index';

describe('Feedback Components', () => {
  describe('ErrorMessage', () => {
    it('renders error message with title and description', () => {
      render(
        <ErrorMessage title="Test Error" message="This is a test error message" variant="error" />
      );

      expect(screen.getByText('Test Error')).toBeInTheDocument();
      expect(screen.getByText('This is a test error message')).toBeInTheDocument();
    });

    it('renders inline error message', () => {
      render(<ErrorMessage message="Inline error" inline />);

      expect(screen.getByText('Inline error')).toBeInTheDocument();
    });

    it('calls onDismiss when dismiss button is clicked', () => {
      const onDismiss = vi.fn();
      render(<ErrorMessage message="Test message" onDismiss={onDismiss} />);

      const dismissButton = screen.getByLabelText('Dismiss error');
      fireEvent.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('SuccessMessage', () => {
    it('renders success message with title and description', () => {
      render(<SuccessMessage title="Success!" message="Operation completed successfully" />);

      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
    });

    it('calls onDismiss when dismiss button is clicked', () => {
      const onDismiss = vi.fn();
      render(<SuccessMessage message="Test message" onDismiss={onDismiss} />);

      const dismissButton = screen.getByLabelText('Dismiss success message');
      fireEvent.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('EmptyState', () => {
    it('renders empty state with title and description', () => {
      render(
        <EmptyState
          title="No Items Found"
          description="There are no items to display"
          icon="pi pi-folder-open"
        />
      );

      expect(screen.getByText('No Items Found')).toBeInTheDocument();
      expect(screen.getByText('There are no items to display')).toBeInTheDocument();
    });

    it('renders actions when provided', () => {
      render(<EmptyState title="No Items" actions={<button>Add Item</button>} />);

      expect(screen.getByText('Add Item')).toBeInTheDocument();
    });
  });

  describe('Toast', () => {
    it('renders toast notification', () => {
      render(
        <Toast
          title="Notification"
          message="This is a test notification"
          variant="success"
          visible={true}
        />
      );

      expect(screen.getByText('Notification')).toBeInTheDocument();
      expect(screen.getByText('This is a test notification')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<Toast message="Test message" visible={true} onClose={onClose} />);

      const closeButton = screen.getByLabelText('Close notification');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not render when visible is false', () => {
      render(<Toast message="Test message" visible={false} />);

      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });
  });

  describe('ProgressIndicator', () => {
    it('renders determinate progress', () => {
      render(<ProgressIndicator progress={50} showPercentage={true} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('renders indeterminate progress', () => {
      render(<ProgressIndicator />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label', 'Loading...');
      expect(progressBar).not.toHaveAttribute('aria-valuenow');
    });

    it('clamps progress values to 0-100 range', () => {
      render(<ProgressIndicator progress={150} showPercentage={true} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });
});
