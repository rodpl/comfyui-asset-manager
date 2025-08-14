/**
 * Enhanced Empty State Components for Model Browser
 * Provides contextual empty states with helpful actions and suggestions
 */

import React from 'react';
import './EmptyState.css';

export interface EmptyStateProps {
  type: 'no-results' | 'no-models' | 'error' | 'offline' | 'loading-failed';
  platform?: 'civitai' | 'huggingface' | 'general';
  searchQuery?: string;
  onRetry?: () => void;
  onClearSearch?: () => void;
  onRefresh?: () => void;
  className?: string;
  title?: string;
  description?: string;
  suggestions?: string[];
}

// Base empty state component
export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  platform = 'general',
  searchQuery,
  onRetry,
  onClearSearch,
  onRefresh,
  className = '',
  title,
  description,
  suggestions = [],
}) => {
  const getEmptyStateConfig = () => {
    switch (type) {
      case 'no-results':
        return {
          icon: 'pi pi-search',
          title: title || `No models found${searchQuery ? ` for "${searchQuery}"` : ''}`,
          description: description || getNoResultsDescription(),
          suggestions: suggestions.length > 0 ? suggestions : getNoResultsSuggestions(),
          actions: getNoResultsActions(),
        };

      case 'no-models':
        return {
          icon: getPlatformIcon(),
          title: title || `No models available on ${getPlatformName()}`,
          description: description || `We couldn't find any models on ${getPlatformName()} at the moment.`,
          suggestions: suggestions.length > 0 ? suggestions : getNoModelsSuggestions(),
          actions: getNoModelsActions(),
        };

      case 'error':
        return {
          icon: 'pi pi-exclamation-triangle',
          title: title || 'Failed to load models',
          description: description || `There was an error loading models from ${getPlatformName()}.`,
          suggestions: suggestions.length > 0 ? suggestions : getErrorSuggestions(),
          actions: getErrorActions(),
        };

      case 'offline':
        return {
          icon: 'pi pi-wifi',
          title: title || 'You\'re offline',
          description: description || 'Model browsing requires an internet connection.',
          suggestions: suggestions.length > 0 ? suggestions : getOfflineSuggestions(),
          actions: getOfflineActions(),
        };

      case 'loading-failed':
        return {
          icon: 'pi pi-times-circle',
          title: title || 'Loading failed',
          description: description || `Failed to load models from ${getPlatformName()}.`,
          suggestions: suggestions.length > 0 ? suggestions : getLoadingFailedSuggestions(),
          actions: getLoadingFailedActions(),
        };

      default:
        return {
          icon: 'pi pi-info-circle',
          title: title || 'No content available',
          description: description || 'There\'s nothing to show here right now.',
          suggestions: [],
          actions: [],
        };
    }
  };

  const getPlatformIcon = (): string => {
    switch (platform) {
      case 'civitai':
        return 'pi pi-globe';
      case 'huggingface':
        return 'pi pi-github';
      default:
        return 'pi pi-cloud';
    }
  };

  const getPlatformName = (): string => {
    switch (platform) {
      case 'civitai':
        return 'CivitAI';
      case 'huggingface':
        return 'HuggingFace';
      default:
        return 'this platform';
    }
  };

  const getNoResultsDescription = (): string => {
    if (searchQuery) {
      return `We couldn't find any models matching "${searchQuery}" on ${getPlatformName()}.`;
    }
    return `No models match your current filters on ${getPlatformName()}.`;
  };

  const getNoResultsSuggestions = (): string[] => {
    const baseSuggestions = [
      'Try different search terms',
      'Remove some filters',
      'Check your spelling',
    ];

    if (platform === 'civitai') {
      return [
        ...baseSuggestions,
        'Try searching for popular model types like "checkpoint" or "lora"',
        'Browse different model categories',
      ];
    }

    if (platform === 'huggingface') {
      return [
        ...baseSuggestions,
        'Try searching for "stable-diffusion" or "text-to-image"',
        'Look for models with "diffusers" library',
      ];
    }

    return baseSuggestions;
  };

  const getNoModelsSuggestions = (): string[] => {
    if (platform === 'civitai') {
      return [
        'CivitAI might be experiencing temporary issues',
        'Try refreshing the page',
        'Check CivitAI\'s status page',
      ];
    }

    if (platform === 'huggingface') {
      return [
        'HuggingFace might be experiencing temporary issues',
        'Try refreshing the page',
        'Check HuggingFace\'s status page',
      ];
    }

    return [
      'The service might be temporarily unavailable',
      'Try refreshing the page',
      'Check your internet connection',
    ];
  };

  const getErrorSuggestions = (): string[] => {
    return [
      'Check your internet connection',
      'Try refreshing the page',
      'The service might be temporarily down',
      'Try again in a few minutes',
    ];
  };

  const getOfflineSuggestions = (): string[] => {
    return [
      'Check your internet connection',
      'Try connecting to a different network',
      'Browse your local models instead',
    ];
  };

  const getLoadingFailedSuggestions = (): string[] => {
    return [
      'Check your internet connection',
      'The service might be temporarily unavailable',
      'Try refreshing the page',
    ];
  };

  const getNoResultsActions = () => {
    const actions = [];

    if (searchQuery && onClearSearch) {
      actions.push({
        label: 'Clear Search',
        icon: 'pi pi-times',
        onClick: onClearSearch,
        variant: 'outlined' as const,
      });
    }

    if (onRefresh) {
      actions.push({
        label: 'Refresh',
        icon: 'pi pi-refresh',
        onClick: onRefresh,
        variant: 'primary' as const,
      });
    }

    return actions;
  };

  const getNoModelsActions = () => {
    const actions = [];

    if (onRefresh) {
      actions.push({
        label: 'Refresh',
        icon: 'pi pi-refresh',
        onClick: onRefresh,
        variant: 'primary' as const,
      });
    }

    return actions;
  };

  const getErrorActions = () => {
    const actions = [];

    if (onRetry) {
      actions.push({
        label: 'Try Again',
        icon: 'pi pi-refresh',
        onClick: onRetry,
        variant: 'primary' as const,
      });
    }

    return actions;
  };

  const getOfflineActions = () => {
    const actions = [];

    if (onRefresh) {
      actions.push({
        label: 'Check Connection',
        icon: 'pi pi-wifi',
        onClick: onRefresh,
        variant: 'primary' as const,
      });
    }

    return actions;
  };

  const getLoadingFailedActions = () => {
    const actions = [];

    if (onRetry) {
      actions.push({
        label: 'Try Again',
        icon: 'pi pi-refresh',
        onClick: onRetry,
        variant: 'primary' as const,
      });
    }

    return actions;
  };

  const config = getEmptyStateConfig();

  return (
    <div className={`empty-state ${type}-empty-state ${platform}-empty-state ${className}`}>
      <div className="empty-state-content">
        {/* Icon */}
        <div className="empty-state-icon">
          <i className={config.icon} />
        </div>

        {/* Title */}
        <h3 className="empty-state-title">
          {config.title}
        </h3>

        {/* Description */}
        <p className="empty-state-description">
          {config.description}
        </p>

        {/* Search query highlight */}
        {searchQuery && type === 'no-results' && (
          <div className="search-query-highlight">
            <span className="search-label">Search query:</span>
            <code className="search-query">"{searchQuery}"</code>
          </div>
        )}

        {/* Suggestions */}
        {config.suggestions.length > 0 && (
          <div className="empty-state-suggestions">
            <h4 className="suggestions-title">Try this:</h4>
            <ul className="suggestions-list">
              {config.suggestions.map((suggestion, index) => (
                <li key={index} className="suggestion-item">
                  <i className="pi pi-angle-right" />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        {config.actions.length > 0 && (
          <div className="empty-state-actions">
            {config.actions.map((action, index) => (
              <button
                key={index}
                className={`p-button ${action.variant === 'primary' ? 'p-button-primary' : 'p-button-outlined'} empty-state-action`}
                onClick={action.onClick}
              >
                <i className={action.icon} />
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Platform-specific help */}
        {(platform === 'civitai' || platform === 'huggingface') && (
          <div className="platform-help">
            <button
              className="p-button p-button-text platform-help-button"
              onClick={() => {
                const url = platform === 'civitai' 
                  ? 'https://civitai.com' 
                  : 'https://huggingface.co/models';
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
            >
              <i className={getPlatformIcon()} />
              Visit {getPlatformName()}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Specialized empty state components
export const NoResultsEmptyState: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState {...props} type="no-results" />
);

export const NoModelsEmptyState: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState {...props} type="no-models" />
);

export const ErrorEmptyState: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState {...props} type="error" />
);

export const OfflineEmptyState: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState {...props} type="offline" />
);

export const LoadingFailedEmptyState: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState {...props} type="loading-failed" />
);

export default EmptyState;