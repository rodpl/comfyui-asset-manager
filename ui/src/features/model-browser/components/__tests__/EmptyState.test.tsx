/**
 * Tests for EmptyState components
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import {
  EmptyState,
  NoResultsEmptyState,
  NoModelsEmptyState,
  ErrorEmptyState,
  OfflineEmptyState,
  LoadingFailedEmptyState,
} from '../EmptyState';

// Mock window.open
Object.defineProperty(window, 'open', {
  writable: true,
  value: vi.fn(),
});

describe('EmptyState', () => {
  describe('NoResultsEmptyState', () => {
    it('renders no results message', () => {
      render(<NoResultsEmptyState platform="civitai" />);

      expect(screen.getByText(/no models found/i)).toBeInTheDocument();
    });

    it('displays search query when provided', () => {
      render(<NoResultsEmptyState platform="civitai" searchQuery="test query" />);

      expect(screen.getByText(/no models found for "test query"/i)).toBeInTheDocument();
      expect(screen.getByText('"test query"')).toBeInTheDocument();
    });

    it('shows clear search button when search query exists', () => {
      const onClearSearch = vi.fn();
      render(
        <NoResultsEmptyState platform="civitai" searchQuery="test" onClearSearch={onClearSearch} />
      );

      const clearButton = screen.getByRole('button', { name: /clear search/i });
      expect(clearButton).toBeInTheDocument();

      fireEvent.click(clearButton);
      expect(onClearSearch).toHaveBeenCalled();
    });

    it('shows refresh button when onRefresh is provided', () => {
      const onRefresh = vi.fn();
      render(<NoResultsEmptyState platform="civitai" onRefresh={onRefresh} />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeInTheDocument();

      fireEvent.click(refreshButton);
      expect(onRefresh).toHaveBeenCalled();
    });

    it('displays platform-specific suggestions for CivitAI', () => {
      render(<NoResultsEmptyState platform="civitai" />);

      expect(
        screen.getByText(/try searching for popular model types like "checkpoint" or "lora"/i)
      ).toBeInTheDocument();
    });

    it('displays platform-specific suggestions for HuggingFace', () => {
      render(<NoResultsEmptyState platform="huggingface" />);

      expect(
        screen.getByText(/try searching for "stable-diffusion" or "text-to-image"/i)
      ).toBeInTheDocument();
    });
  });

  describe('NoModelsEmptyState', () => {
    it('renders no models message', () => {
      render(<NoModelsEmptyState platform="civitai" />);

      expect(screen.getByText(/no models available on civitai/i)).toBeInTheDocument();
    });

    it('shows refresh button', () => {
      const onRefresh = vi.fn();
      render(<NoModelsEmptyState platform="civitai" onRefresh={onRefresh} />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  describe('ErrorEmptyState', () => {
    it('renders error message', () => {
      render(<ErrorEmptyState platform="civitai" />);

      expect(screen.getByText(/failed to load models/i)).toBeInTheDocument();
    });

    it('shows custom error description', () => {
      render(<ErrorEmptyState platform="civitai" description="Custom error message" />);

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('shows retry button when onRetry is provided', () => {
      const onRetry = vi.fn();
      render(<ErrorEmptyState platform="civitai" onRetry={onRetry} />);

      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);
      expect(onRetry).toHaveBeenCalled();
    });

    it('displays error suggestions', () => {
      render(<ErrorEmptyState platform="civitai" />);

      expect(screen.getByText(/check your internet connection/i)).toBeInTheDocument();
      expect(screen.getByText(/try refreshing the page/i)).toBeInTheDocument();
    });
  });

  describe('OfflineEmptyState', () => {
    it('renders offline message', () => {
      render(<OfflineEmptyState />);

      expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
      expect(
        screen.getByText(/model browsing requires an internet connection/i)
      ).toBeInTheDocument();
    });

    it('shows check connection button', () => {
      const onRefresh = vi.fn();
      render(<OfflineEmptyState onRefresh={onRefresh} />);

      const checkButton = screen.getByRole('button', { name: /check connection/i });
      fireEvent.click(checkButton);
      expect(onRefresh).toHaveBeenCalled();
    });

    it('displays offline suggestions', () => {
      render(<OfflineEmptyState />);

      expect(screen.getByText(/check your internet connection/i)).toBeInTheDocument();
      expect(screen.getByText(/browse your local models instead/i)).toBeInTheDocument();
    });
  });

  describe('LoadingFailedEmptyState', () => {
    it('renders loading failed message', () => {
      render(<LoadingFailedEmptyState platform="civitai" />);

      expect(screen.getByText(/loading failed/i)).toBeInTheDocument();
    });

    it('shows try again button', () => {
      const onRetry = vi.fn();
      render(<LoadingFailedEmptyState platform="civitai" onRetry={onRetry} />);

      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);
      expect(onRetry).toHaveBeenCalled();
    });
  });

  describe('Platform help links', () => {
    it('shows CivitAI help link', () => {
      render(<NoResultsEmptyState platform="civitai" />);

      const helpButton = screen.getByRole('button', { name: /visit civitai/i });
      fireEvent.click(helpButton);

      expect(window.open).toHaveBeenCalledWith(
        'https://civitai.com',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('shows HuggingFace help link', () => {
      render(<NoResultsEmptyState platform="huggingface" />);

      const helpButton = screen.getByRole('button', { name: /visit huggingface/i });
      fireEvent.click(helpButton);

      expect(window.open).toHaveBeenCalledWith(
        'https://huggingface.co/models',
        '_blank',
        'noopener,noreferrer'
      );
    });
  });

  describe('Custom props', () => {
    it('accepts custom title and description', () => {
      render(
        <EmptyState type="no-results" title="Custom Title" description="Custom Description" />
      );

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom Description')).toBeInTheDocument();
    });

    it('accepts custom suggestions', () => {
      render(
        <EmptyState
          type="no-results"
          suggestions={['Custom suggestion 1', 'Custom suggestion 2']}
        />
      );

      expect(screen.getByText('Custom suggestion 1')).toBeInTheDocument();
      expect(screen.getByText('Custom suggestion 2')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<EmptyState type="no-results" className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Icons and styling', () => {
    it('shows correct icon for each type', () => {
      const { rerender, container } = render(<EmptyState type="no-results" />);
      expect(container.firstChild).toHaveClass('no-results-empty-state');

      rerender(<EmptyState type="error" />);
      expect(container.firstChild).toHaveClass('error-empty-state');

      rerender(<EmptyState type="offline" />);
      expect(container.firstChild).toHaveClass('offline-empty-state');
    });

    it('applies platform-specific classes', () => {
      const { container } = render(<EmptyState type="no-results" platform="civitai" />);
      expect(container.firstChild).toHaveClass('civitai-empty-state');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<NoResultsEmptyState platform="civitai" onRefresh={() => {}} />);

      // Check that buttons have proper labels
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      const onRefresh = vi.fn();
      render(<NoResultsEmptyState platform="civitai" onRefresh={onRefresh} />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      refreshButton.focus();
      expect(refreshButton).toHaveFocus();
    });
  });
});
