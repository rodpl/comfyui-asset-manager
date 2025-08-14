/**
 * Enhanced Error Boundary for Model Browser Components
 * Provides comprehensive error handling with retry mechanisms and platform-specific error messages
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExternalModelError } from '../types';
import './ModelBrowserErrorBoundary.css';

interface Props {
  children: ReactNode;
  platform?: 'civitai' | 'huggingface' | 'general';
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  showRetry?: boolean;
  className?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
}

export class ModelBrowserErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo,
    });

    // Log the error with platform context
    console.error(`Model Browser Error (${this.props.platform || 'general'}):`, {
      error,
      errorInfo,
      platform: this.props.platform,
      retryCount: this.state.retryCount,
    });

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo);

    // Auto-retry for certain types of errors
    if (this.shouldAutoRetry(error) && this.state.retryCount < this.maxRetries) {
      this.autoRetry();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private shouldAutoRetry(error: Error): boolean {
    // Auto-retry for network errors, timeout errors, and temporary API issues
    const retryableErrors = [
      'NetworkError',
      'TimeoutError',
      'Failed to fetch',
      'Load failed',
      'HTTP 429', // Rate limited
      'HTTP 502', // Bad Gateway
      'HTTP 503', // Service Unavailable
      'HTTP 504', // Gateway Timeout
    ];

    return retryableErrors.some(
      (retryableError) =>
        error.message.includes(retryableError) || error.name.includes(retryableError)
    );
  }

  private autoRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState({ isRetrying: true });

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, this.state.retryCount) * 1000;

    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

  private handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      isRetrying: false,
    }));

    // Call the onRetry callback if provided
    this.props.onRetry?.();
  };

  private handleManualRetry = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }

    this.handleRetry();
  };

  private getErrorMessage(): string {
    const { error } = this.state;
    const { platform } = this.props;

    if (!error) return 'An unknown error occurred';

    // Handle ExternalModelError types
    if (error.message.includes('CIVITAI_API_ERROR')) {
      return 'Failed to connect to CivitAI. Please check your internet connection and try again.';
    }

    if (error.message.includes('HUGGINGFACE_API_ERROR')) {
      return 'Failed to connect to HuggingFace. Please check your internet connection and try again.';
    }

    // Handle network errors
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return `Unable to connect to ${platform || 'the service'}. Please check your internet connection.`;
    }

    // Handle rate limiting
    if (error.message.includes('HTTP 429') || error.message.includes('rate limit')) {
      return `Too many requests to ${platform || 'the service'}. Please wait a moment and try again.`;
    }

    // Handle server errors
    if (error.message.includes('HTTP 5')) {
      return `${platform || 'The service'} is temporarily unavailable. Please try again later.`;
    }

    // Handle timeout errors
    if (error.message.includes('timeout') || error.message.includes('TimeoutError')) {
      return `Request timed out. Please check your connection and try again.`;
    }

    // Default error message
    return error.message || 'An unexpected error occurred while loading models.';
  }

  private getPlatformIcon(): string {
    switch (this.props.platform) {
      case 'civitai':
        return 'pi pi-globe';
      case 'huggingface':
        return 'pi pi-github';
      default:
        return 'pi pi-exclamation-triangle';
    }
  }

  private getPlatformName(): string {
    switch (this.props.platform) {
      case 'civitai':
        return 'CivitAI';
      case 'huggingface':
        return 'HuggingFace';
      default:
        return 'Model Browser';
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.getErrorMessage();
      const platformIcon = this.getPlatformIcon();
      const platformName = this.getPlatformName();
      const canRetry =
        this.props.showRetry !== false &&
        (this.props.onRetry || this.state.retryCount < this.maxRetries);

      return (
        <div className={`model-browser-error-boundary ${this.props.className || ''}`}>
          <div className="error-boundary-content">
            {/* Error Icon */}
            <div className="error-icon">
              <i className={platformIcon} />
            </div>

            {/* Error Title */}
            <h3 className="error-title">{platformName} Error</h3>

            {/* Error Message */}
            <p className="error-message">{errorMessage}</p>

            {/* Retry Information */}
            {this.state.retryCount > 0 && !this.state.isRetrying && (
              <p className="retry-info">
                Retry attempt {this.state.retryCount} of {this.maxRetries}
              </p>
            )}

            {/* Auto-retry indicator */}
            {this.state.isRetrying && (
              <div className="auto-retry-indicator">
                <i className="pi pi-spin pi-spinner" />
                <span>Retrying automatically...</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="error-actions">
              {canRetry && !this.state.isRetrying && (
                <button
                  className="p-button p-button-primary retry-button"
                  onClick={this.handleManualRetry}
                  disabled={this.state.isRetrying}
                >
                  <i className="pi pi-refresh" />
                  Try Again
                </button>
              )}

              {/* Help/Support Link */}
              <button
                className="p-button p-button-text help-button"
                onClick={() => {
                  // Could open help documentation or support
                  console.log('Help requested for error:', this.state.error);
                }}
              >
                <i className="pi pi-question-circle" />
                Get Help
              </button>
            </div>

            {/* Technical Details (collapsible) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Technical Details</summary>
                <div className="error-stack">
                  <strong>Error:</strong> {this.state.error.name}: {this.state.error.message}
                  {this.state.error.stack && (
                    <>
                      <br />
                      <strong>Stack:</strong>
                      <pre>{this.state.error.stack}</pre>
                    </>
                  )}
                  {this.state.errorInfo && (
                    <>
                      <br />
                      <strong>Component Stack:</strong>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export const withModelBrowserErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    platform?: 'civitai' | 'huggingface' | 'general';
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    onRetry?: () => void;
    showRetry?: boolean;
  } = {}
) => {
  const WrappedComponent = (props: P) => (
    <ModelBrowserErrorBoundary {...options}>
      <Component {...props} />
    </ModelBrowserErrorBoundary>
  );

  WrappedComponent.displayName = `withModelBrowserErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

export default ModelBrowserErrorBoundary;
