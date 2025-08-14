/**
 * Tests for ModelBrowserErrorBoundary component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ModelBrowserErrorBoundary, {
  withModelBrowserErrorBoundary,
} from '../ModelBrowserErrorBoundary';

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

// Test component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean; errorMessage?: string }> = ({
  shouldThrow = true,
  errorMessage = 'Test error',
}) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>No error</div>;
};

// Test component that works normally
const WorkingComponent: React.FC = () => <div>Working component</div>;

describe('ModelBrowserErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ModelBrowserErrorBoundary>
        <WorkingComponent />
      </ModelBrowserErrorBoundary>
    );

    expect(screen.getByText('Working component')).toBeInTheDocument();
  });

  it('renders error UI when child component throws', () => {
    render(
      <ModelBrowserErrorBoundary platform="civitai">
        <ThrowError />
      </ModelBrowserErrorBoundary>
    );

    expect(screen.getByText('CivitAI Error')).toBeInTheDocument();
    expect(screen.getByText(/Test error/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('displays platform-specific error messages', () => {
    render(
      <ModelBrowserErrorBoundary platform="huggingface">
        <ThrowError />
      </ModelBrowserErrorBoundary>
    );

    expect(screen.getByText('HuggingFace Error')).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <ModelBrowserErrorBoundary onError={onError}>
        <ThrowError />
      </ModelBrowserErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('calls onRetry callback when retry button is clicked', () => {
    const onRetry = vi.fn();

    render(
      <ModelBrowserErrorBoundary onRetry={onRetry}>
        <ThrowError />
      </ModelBrowserErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('resets error state when retry is clicked', () => {
    let shouldThrow = true;
    const TestComponent = () => <ThrowError shouldThrow={shouldThrow} />;

    const { rerender } = render(
      <ModelBrowserErrorBoundary>
        <TestComponent />
      </ModelBrowserErrorBoundary>
    );

    // Error should be displayed
    expect(screen.getByText(/Error/)).toBeInTheDocument();

    // Fix the error and retry
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    rerender(
      <ModelBrowserErrorBoundary>
        <TestComponent />
      </ModelBrowserErrorBoundary>
    );

    // Should show working component now
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('shows auto-retry indicator for retryable errors', async () => {
    render(
      <ModelBrowserErrorBoundary>
        <ThrowError errorMessage="Failed to fetch" />
      </ModelBrowserErrorBoundary>
    );

    // Should show auto-retry indicator
    await waitFor(() => {
      expect(screen.getByText(/retrying automatically/i)).toBeInTheDocument();
    });
  });

  it('does not auto-retry for non-retryable errors', () => {
    render(
      <ModelBrowserErrorBoundary>
        <ThrowError errorMessage="Syntax error" />
      </ModelBrowserErrorBoundary>
    );

    // Should not show auto-retry indicator
    expect(screen.queryByText(/retrying automatically/i)).not.toBeInTheDocument();
  });

  it('shows retry count when retrying', async () => {
    render(
      <ModelBrowserErrorBoundary>
        <ThrowError errorMessage="NetworkError" />
      </ModelBrowserErrorBoundary>
    );

    // Should show auto-retry indicator
    await waitFor(() => {
      expect(screen.getByText(/retrying automatically/i)).toBeInTheDocument();
    });
  });

  it('stops auto-retrying after max attempts', async () => {
    render(
      <ModelBrowserErrorBoundary>
        <ThrowError errorMessage="Failed to fetch" />
      </ModelBrowserErrorBoundary>
    );

    // Should initially show auto-retry
    expect(screen.getByText(/retrying automatically/i)).toBeInTheDocument();

    // Wait for max retries to be reached (with reasonable timeout)
    await waitFor(
      () => {
        expect(screen.queryByText(/retrying automatically/i)).not.toBeInTheDocument();
      },
      { timeout: 8000 }
    );

    // Should show retry attempt info after retries complete
    expect(
      screen.getByText((content, element) => {
        return element?.textContent?.includes('Retry attempt') || false;
      })
    ).toBeInTheDocument();
  }, 10000);

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ModelBrowserErrorBoundary fallback={customFallback}>
        <ThrowError />
      </ModelBrowserErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText(/Error/)).not.toBeInTheDocument();
  });

  it('hides retry button when showRetry is false', () => {
    render(
      <ModelBrowserErrorBoundary showRetry={false}>
        <ThrowError />
      </ModelBrowserErrorBoundary>
    );

    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('shows technical details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ModelBrowserErrorBoundary>
        <ThrowError />
      </ModelBrowserErrorBoundary>
    );

    expect(screen.getByText('Technical Details')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('hides technical details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <ModelBrowserErrorBoundary>
        <ThrowError />
      </ModelBrowserErrorBoundary>
    );

    expect(screen.queryByText('Technical Details')).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  describe('withModelBrowserErrorBoundary HOC', () => {
    it('wraps component with error boundary', () => {
      const WrappedComponent = withModelBrowserErrorBoundary(WorkingComponent, {
        platform: 'civitai',
      });

      render(<WrappedComponent />);
      expect(screen.getByText('Working component')).toBeInTheDocument();
    });

    it('catches errors in wrapped component', () => {
      const WrappedComponent = withModelBrowserErrorBoundary(ThrowError, {
        platform: 'civitai',
      });

      render(<WrappedComponent />);
      expect(screen.getByText('CivitAI Error')).toBeInTheDocument();
    });

    it('passes options to error boundary', () => {
      const onError = vi.fn();
      const WrappedComponent = withModelBrowserErrorBoundary(ThrowError, {
        platform: 'huggingface',
        onError,
      });

      render(<WrappedComponent />);

      expect(screen.getByText('HuggingFace Error')).toBeInTheDocument();
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('Error message formatting', () => {
    it('formats CivitAI API errors', () => {
      render(
        <ModelBrowserErrorBoundary platform="civitai">
          <ThrowError errorMessage="CIVITAI_API_ERROR: Connection failed" />
        </ModelBrowserErrorBoundary>
      );

      expect(screen.getByText(/failed to connect to civitai/i)).toBeInTheDocument();
    });

    it('formats HuggingFace API errors', () => {
      render(
        <ModelBrowserErrorBoundary platform="huggingface">
          <ThrowError errorMessage="HUGGINGFACE_API_ERROR: Connection failed" />
        </ModelBrowserErrorBoundary>
      );

      expect(screen.getByText(/failed to connect to huggingface/i)).toBeInTheDocument();
    });

    it('formats network errors', () => {
      render(
        <ModelBrowserErrorBoundary platform="civitai">
          <ThrowError errorMessage="Failed to fetch" />
        </ModelBrowserErrorBoundary>
      );

      expect(screen.getByText(/unable to connect to civitai/i)).toBeInTheDocument();
    });

    it('formats rate limiting errors', () => {
      render(
        <ModelBrowserErrorBoundary>
          <ThrowError errorMessage="HTTP 429: Too many requests" />
        </ModelBrowserErrorBoundary>
      );

      expect(screen.getByText(/too many requests/i)).toBeInTheDocument();
    });

    it('formats server errors', () => {
      render(
        <ModelBrowserErrorBoundary>
          <ThrowError errorMessage="HTTP 503: Service unavailable" />
        </ModelBrowserErrorBoundary>
      );

      expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument();
    });

    it('formats timeout errors', () => {
      render(
        <ModelBrowserErrorBoundary>
          <ThrowError errorMessage="TimeoutError: Request timed out" />
        </ModelBrowserErrorBoundary>
      );

      expect(screen.getByText(/request timed out/i)).toBeInTheDocument();
    });
  });
});
