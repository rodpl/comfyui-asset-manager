import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalModel, ModelSearchParams, HuggingFaceFilters } from '../types';
import { huggingfaceService } from '../services/huggingfaceService';
import { DEFAULT_PAGE_SIZE, ERROR_MESSAGES } from '../constants';
import ModelCard from './ModelCard';
import HuggingFaceSearchFilterBar from './HuggingFaceSearchFilterBar';
import { ModelGridSkeleton } from './ModelGridSkeleton';
import { NoResultsEmptyState, ErrorEmptyState, OfflineEmptyState } from './EmptyState';
import ModelBrowserErrorBoundary from './ModelBrowserErrorBoundary';
import useOfflineDetection from '../hooks/useOfflineDetection';
import useRetryMechanism from '../hooks/useRetryMechanism';
import './HuggingFaceBrowser.css';

export interface HuggingFaceBrowserProps {
  onModelClick?: (model: ExternalModel) => void;
  onModelDragStart?: (model: ExternalModel) => void;
  className?: string;
}

interface LoadingState {
  initial: boolean;
  loadMore: boolean;
  error: string | null;
}

const HuggingFaceBrowser: React.FC<HuggingFaceBrowserProps> = ({
  onModelClick,
  onModelDragStart,
  className = '',
}) => {
  const { t } = useTranslation();

  // State management
  const [models, setModels] = useState<ExternalModel[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    initial: true,
    loadMore: false,
    error: null,
  });
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<HuggingFaceFilters>({
    sort: 'downloads',
    direction: 'desc',
    library: ['diffusers', 'transformers'],
    task: ['text-to-image'],
  });

  // Offline detection
  const {
    isFullyOnline,
    hasConnectivityIssues,
    connectionQuality,
    retry: retryConnection,
  } = useOfflineDetection({
    endpoints: ['/asset_manager/external/models/huggingface'],
    onOnline: () => {
      // Auto-retry when coming back online
      if (models.length === 0 && !loading.initial) {
        loadModels(false);
      }
    },
  });

  // Search parameters
  const searchParams = useMemo((): ModelSearchParams => ({
    query: searchQuery,
    platform: 'huggingface',
    limit: DEFAULT_PAGE_SIZE,
    offset: currentOffset,
    filters,
  }), [searchQuery, currentOffset, filters]);

  // Create retry mechanism for loading models
  const {
    execute: executeLoadModels,
    retry: retryLoadModels,
    isRetrying,
    statusMessage,
    canRetry,
    hasReachedMaxRetries,
  } = useRetryMechanism(
    async () => {
      const params = {
        ...searchParams,
        offset: currentOffset,
      };
      return await huggingfaceService.searchModels(params);
    },
    {
      maxRetries: 3,
      onRetry: (attempt, error) => {
        console.log(`HuggingFace retry attempt ${attempt}:`, error.message);
      },
      onMaxRetriesReached: (error) => {
        console.error('HuggingFace max retries reached:', error);
        setLoading(prev => ({
          ...prev,
          error: `Failed to load models after multiple attempts: ${error.message}`,
        }));
      },
    }
  );

  // Load models function with enhanced error handling
  const loadModels = useCallback(async (isLoadMore = false) => {
    // Check if we're offline
    if (!isFullyOnline) {
      setLoading(prev => ({
        ...prev,
        error: hasConnectivityIssues 
          ? 'Connection issues detected. Please check your internet connection.'
          : 'You are offline. Please check your internet connection.',
      }));
      return;
    }

    try {
      setLoading(prev => ({
        ...prev,
        [isLoadMore ? 'loadMore' : 'initial']: true,
        error: null,
      }));

      // Update search params for current request
      const params = {
        ...searchParams,
        offset: isLoadMore ? currentOffset : 0,
      };

      const response = await huggingfaceService.searchModels(params);

      if (isLoadMore) {
        setModels(prev => [...prev, ...response.models]);
      } else {
        setModels(response.models);
        setCurrentOffset(0);
      }

      setHasMore(response.hasMore);
      setCurrentOffset(prev => isLoadMore ? prev + DEFAULT_PAGE_SIZE : DEFAULT_PAGE_SIZE);

    } catch (error) {
      console.error('Failed to load HuggingFace models:', error);
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.API_ERROR;
      
      setLoading(prev => ({
        ...prev,
        error: errorMessage,
      }));

      // Don't throw here - let the component handle the error state
    } finally {
      setLoading(prev => ({
        ...prev,
        initial: false,
        loadMore: false,
      }));
    }
  }, [searchParams, currentOffset, isFullyOnline, hasConnectivityIssues]);

  // Load more models
  const loadMoreModels = useCallback(() => {
    if (!loading.loadMore && hasMore) {
      loadModels(true);
    }
  }, [loadModels, loading.loadMore, hasMore]);

  // Enhanced retry function
  const retryLoad = useCallback(async () => {
    setLoading(prev => ({ ...prev, error: null }));
    
    // First try to reconnect if offline
    if (!isFullyOnline) {
      await retryConnection();
    }
    
    // Then retry loading models
    await loadModels(false);
  }, [loadModels, isFullyOnline, retryConnection]);

  // Effect to load models when search params change
  useEffect(() => {
    loadModels(false);
  }, [searchQuery, filters, loadModels]);

  // Infinite scroll handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    
    if (scrollPercentage > 0.8 && hasMore && !loading.loadMore) {
      loadMoreModels();
    }
  }, [hasMore, loading.loadMore, loadMoreModels]);

  // Search and filter handlers
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleFiltersChange = useCallback((newFilters: HuggingFaceFilters) => {
    setFilters(newFilters);
  }, []);

  // Enhanced render functions
  const renderLoadingSkeleton = () => (
    <ModelGridSkeleton 
      count={DEFAULT_PAGE_SIZE} 
      platform="huggingface"
      className="huggingface-loading-skeleton"
    />
  );

  const renderError = () => {
    // Check if it's an offline error
    if (!isFullyOnline) {
      return (
        <OfflineEmptyState
          platform="huggingface"
          onRetry={retryLoad}
          className="huggingface-offline-state"
        />
      );
    }

    return (
      <ErrorEmptyState
        platform="huggingface"
        description={loading.error || undefined}
        onRetry={canRetry ? retryLoad : undefined}
        className="huggingface-error-state"
        suggestions={[
          'Check your internet connection',
          'HuggingFace might be experiencing issues',
          'Try refreshing the page',
          hasConnectivityIssues ? 'Connection quality is poor' : '',
        ].filter(Boolean)}
      />
    );
  };

  const renderEmptyState = () => (
    <NoResultsEmptyState
      platform="huggingface"
      searchQuery={searchQuery}
      onClearSearch={searchQuery ? () => setSearchQuery('') : undefined}
      onRefresh={retryLoad}
      className="huggingface-empty-state"
      suggestions={[
        'Try different search terms',
        'Remove some filters',
        'Search for "stable-diffusion" or "text-to-image"',
        'Look for models with "diffusers" library',
      ]}
    />
  );

  // Main render
  const containerClasses = [
    'huggingface-browser',
    className,
    loading.initial ? 'loading' : '',
  ].filter(Boolean).join(' ');

  return (
    <ModelBrowserErrorBoundary
      platform="huggingface"
      onRetry={retryLoad}
      className="huggingface-error-boundary"
    >
      <div className={containerClasses}>
        {/* Header */}
        <div className="browser-header">
          <div className="platform-info">
            <i className="pi pi-github" />
            <h3>{t('modelBrowser.huggingface.title')}</h3>
            <span className="platform-description">
              {t('modelBrowser.huggingface.description')}
            </span>
            
            {/* Connection status indicator */}
            {hasConnectivityIssues && (
              <div className="connection-warning">
                <i className="pi pi-exclamation-triangle" />
                <span>Connection issues detected</span>
              </div>
            )}
          </div>
        </div>

        {/* Search and Filter Bar */}
        <HuggingFaceSearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          resultsCount={models.length}
          isLoading={loading.initial || loading.loadMore || isRetrying}
        />

        {/* Retry status message */}
        {isRetrying && (
          <div className="retry-status">
            <i className="pi pi-spin pi-spinner" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Content */}
        <div className="browser-content" onScroll={handleScroll}>
          {loading.initial && renderLoadingSkeleton()}
          
          {loading.error && renderError()}
          
          {!loading.initial && !loading.error && models.length === 0 && renderEmptyState()}
          
          {!loading.initial && !loading.error && models.length > 0 && (
            <>
              <div className="model-grid">
                {models.map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    onClick={onModelClick}
                    onDragStart={onModelDragStart}
                    draggable={true}
                    className="huggingface-model-card"
                  />
                ))}
              </div>

              {/* Load More Button/Indicator */}
              {hasMore && (
                <div className="load-more-section">
                  {loading.loadMore ? (
                    <div className="loading-more">
                      <i className="pi pi-spin pi-spinner" />
                      <span>{t('modelBrowser.loadingMore')}</span>
                    </div>
                  ) : (
                    <button
                      className="p-button p-button-outlined load-more-button"
                      onClick={loadMoreModels}
                      disabled={!isFullyOnline}
                    >
                      <i className="pi pi-plus" />
                      {t('modelBrowser.loadMore')}
                    </button>
                  )}
                </div>
              )}

              {/* End of Results */}
              {!hasMore && models.length > 0 && (
                <div className="end-of-results">
                  <i className="pi pi-check-circle" />
                  <span>{t('modelBrowser.endOfResults')}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ModelBrowserErrorBoundary>
  );
};

export default HuggingFaceBrowser;