import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalModel, ModelSearchParams, CivitAIFilters } from '../types';
import { civitaiService } from '../services/civitaiService';
import { DEFAULT_PAGE_SIZE, ERROR_MESSAGES } from '../constants';
import ModelCard from './ModelCard';
import CivitAISearchFilterBar from './CivitAISearchFilterBar';
import './CivitAIBrowser.css';

export interface CivitAIBrowserProps {
  onModelClick?: (model: ExternalModel) => void;
  onModelDragStart?: (model: ExternalModel) => void;
  className?: string;
}

interface LoadingState {
  initial: boolean;
  loadMore: boolean;
  error: string | null;
}

const CivitAIBrowser: React.FC<CivitAIBrowserProps> = ({
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
  const [filters, setFilters] = useState<CivitAIFilters>({
    sort: 'Most Downloaded',
    period: 'AllTime',
    nsfw: false,
  });

  // Search parameters
  const searchParams = useMemo((): ModelSearchParams => ({
    query: searchQuery,
    platform: 'civitai',
    limit: DEFAULT_PAGE_SIZE,
    offset: currentOffset,
    filters,
  }), [searchQuery, currentOffset, filters]);

  // Load models function
  const loadModels = useCallback(async (isLoadMore = false) => {
    try {
      setLoading(prev => ({
        ...prev,
        [isLoadMore ? 'loadMore' : 'initial']: true,
        error: null,
      }));

      const params = {
        ...searchParams,
        offset: isLoadMore ? currentOffset : 0,
      };

      const response = await civitaiService.searchModels(params);

      if (isLoadMore) {
        setModels(prev => [...prev, ...response.models]);
      } else {
        setModels(response.models);
        setCurrentOffset(0);
      }

      setHasMore(response.hasMore);
      setCurrentOffset(prev => isLoadMore ? prev + DEFAULT_PAGE_SIZE : DEFAULT_PAGE_SIZE);

    } catch (error) {
      console.error('Failed to load CivitAI models:', error);
      setLoading(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : ERROR_MESSAGES.API_ERROR,
      }));
    } finally {
      setLoading(prev => ({
        ...prev,
        initial: false,
        loadMore: false,
      }));
    }
  }, [searchParams, currentOffset]);

  // Load more models
  const loadMoreModels = useCallback(() => {
    if (!loading.loadMore && hasMore) {
      loadModels(true);
    }
  }, [loadModels, loading.loadMore, hasMore]);

  // Retry loading
  const retryLoad = useCallback(() => {
    setLoading(prev => ({ ...prev, error: null }));
    loadModels(false);
  }, [loadModels]);

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

  const handleFiltersChange = useCallback((newFilters: CivitAIFilters) => {
    setFilters(newFilters);
  }, []);



  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <div className="model-grid">
      {Array.from({ length: DEFAULT_PAGE_SIZE }, (_, index) => (
        <div key={index} className="model-card-skeleton">
          <div className="skeleton-thumbnail" />
          <div className="skeleton-content">
            <div className="skeleton-title" />
            <div className="skeleton-author" />
            <div className="skeleton-description" />
            <div className="skeleton-stats" />
          </div>
        </div>
      ))}
    </div>
  );

  // Render error state
  const renderError = () => (
    <div className="error-state">
      <div className="error-icon">
        <i className="pi pi-exclamation-triangle" />
      </div>
      <h3>{t('errors.loadFailed')}</h3>
      <p>{loading.error}</p>
      <button 
        className="p-button p-button-primary"
        onClick={retryLoad}
      >
        <i className="pi pi-refresh" />
        {t('actions.retry')}
      </button>
    </div>
  );

  // Render empty state
  const renderEmptyState = () => (
    <div className="empty-state">
      <div className="empty-icon">
        <i className="pi pi-search" />
      </div>
      <h3>{t('modelBrowser.civitai.noResults')}</h3>
      <p>{t('modelBrowser.civitai.noResultsDescription')}</p>
      {searchQuery && (
        <p className="search-query">
          {t('modelBrowser.searchQuery')}: "{searchQuery}"
        </p>
      )}
    </div>
  );



  // Main render
  const containerClasses = [
    'civitai-browser',
    className,
    loading.initial ? 'loading' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="browser-header">
        <div className="platform-info">
          <i className="pi pi-globe" />
          <h3>{t('modelBrowser.civitai.title')}</h3>
          <span className="platform-description">
            {t('modelBrowser.civitai.description')}
          </span>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <CivitAISearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        resultsCount={models.length}
        isLoading={loading.initial || loading.loadMore}
      />

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
                  className="civitai-model-card"
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
  );
};

export default CivitAIBrowser;