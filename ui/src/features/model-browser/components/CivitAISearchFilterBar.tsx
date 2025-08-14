import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CivitAIFilters } from '../types';
import { 
  CIVITAI_SORT_OPTIONS, 
  CIVITAI_PERIOD_OPTIONS, 
  BASE_MODELS
} from '../constants';
import './CivitAISearchFilterBar.css';

export interface CivitAISearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: CivitAIFilters;
  onFiltersChange: (filters: CivitAIFilters) => void;
  resultsCount?: number;
  isLoading?: boolean;
  className?: string;
}

const CivitAISearchFilterBar: React.FC<CivitAISearchFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  resultsCount,
  isLoading = false,
  className = '',
}) => {
  const { t } = useTranslation();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(searchQuery);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        onSearchChange(searchInput);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, searchQuery, onSearchChange]);

  // Update local search input when prop changes
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // Filter change handlers
  const handleSortChange = useCallback((sort: CivitAIFilters['sort']) => {
    onFiltersChange({ ...filters, sort });
  }, [filters, onFiltersChange]);

  const handlePeriodChange = useCallback((period: CivitAIFilters['period']) => {
    onFiltersChange({ ...filters, period });
  }, [filters, onFiltersChange]);

  const handleNsfwToggle = useCallback(() => {
    onFiltersChange({ ...filters, nsfw: !filters.nsfw });
  }, [filters, onFiltersChange]);

  const handleModelTypeToggle = useCallback((modelType: string) => {
    const currentTypes = filters.types || [];
    const newTypes = currentTypes.includes(modelType)
      ? currentTypes.filter(t => t !== modelType)
      : [...currentTypes, modelType];
    
    onFiltersChange({ 
      ...filters, 
      types: newTypes.length > 0 ? newTypes : undefined 
    });
  }, [filters, onFiltersChange]);

  const handleBaseModelToggle = useCallback((baseModel: string) => {
    const currentModels = filters.baseModels || [];
    const newModels = currentModels.includes(baseModel)
      ? currentModels.filter(m => m !== baseModel)
      : [...currentModels, baseModel];
    
    onFiltersChange({ 
      ...filters, 
      baseModels: newModels.length > 0 ? newModels : undefined 
    });
  }, [filters, onFiltersChange]);

  const handleRatingChange = useCallback((rating: number | undefined) => {
    onFiltersChange({ ...filters, rating });
  }, [filters, onFiltersChange]);

  const handleUsernameChange = useCallback((username: string) => {
    onFiltersChange({ 
      ...filters, 
      username: username.trim() || undefined 
    });
  }, [filters, onFiltersChange]);

  const handleTagChange = useCallback((tag: string) => {
    onFiltersChange({ 
      ...filters, 
      tag: tag.trim() || undefined 
    });
  }, [filters, onFiltersChange]);

  const clearAllFilters = useCallback(() => {
    onFiltersChange({
      sort: 'Most Downloaded',
      period: 'AllTime',
      nsfw: false,
    });
    setSearchInput('');
    onSearchChange('');
  }, [onFiltersChange, onSearchChange]);

  const clearSearch = useCallback(() => {
    setSearchInput('');
    onSearchChange('');
  }, [onSearchChange]);

  // Count active filters
  const activeFilterCount = [
    filters.types?.length || 0,
    filters.baseModels?.length || 0,
    filters.rating !== undefined ? 1 : 0,
    filters.username ? 1 : 0,
    filters.tag ? 1 : 0,
    filters.nsfw ? 1 : 0,
  ].reduce((sum, count) => (sum || 0) + (count || 0), 0);

  // Available model types for CivitAI
  const civitaiModelTypes = [
    'Checkpoint',
    'LORA', 
    'TextualInversion',
    'Controlnet',
    'VAE',
    'Upscaler'
  ];

  const containerClasses = [
    'civitai-search-filter-bar',
    className,
    isLoading ? 'loading' : '',
    showAdvancedFilters ? 'expanded' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {/* Main Search and Filter Row */}
      <div className="search-filter-main">
        {/* Search Input */}
        <div className="search-input-container">
          <div className="search-input-wrapper">
            <i className="pi pi-search search-icon" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('search.placeholder')}
              className="search-input"
              disabled={isLoading}
            />
            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                className="clear-search-button"
                aria-label={t('search.clear')}
              >
                <i className="pi pi-times" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Filters */}
        <div className="quick-filters">
          <div className="filter-group">
            <label>{t('modelBrowser.filters.sort')}</label>
            <select 
              value={filters.sort || 'Most Downloaded'}
              onChange={(e) => handleSortChange(e.target.value as CivitAIFilters['sort'])}
              className="filter-select"
              disabled={isLoading}
            >
              {CIVITAI_SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {t(`modelBrowser.sort.${option.value.toLowerCase().replace(/\s+/g, '')}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>{t('modelBrowser.filters.period')}</label>
            <select 
              value={filters.period || 'AllTime'}
              onChange={(e) => handlePeriodChange(e.target.value as CivitAIFilters['period'])}
              className="filter-select"
              disabled={isLoading}
            >
              {CIVITAI_PERIOD_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {t(`modelBrowser.period.${option.value.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group nsfw-filter">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.nsfw || false}
                onChange={handleNsfwToggle}
                disabled={isLoading}
              />
              <span>{t('modelBrowser.filters.includeNsfw')}</span>
            </label>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="filter-actions">
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`advanced-filters-toggle ${showAdvancedFilters ? 'active' : ''}`}
            disabled={isLoading}
          >
            <i className="pi pi-filter" />
            <span>{t('search.filters')}</span>
            {activeFilterCount > 0 && (
              <span className="filter-count">{activeFilterCount}</span>
            )}
            <i className={`pi pi-chevron-${showAdvancedFilters ? 'up' : 'down'}`} />
          </button>

          {(activeFilterCount > 0 || searchInput) && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="clear-filters-button"
              disabled={isLoading}
            >
              <i className="pi pi-times" />
              <span>{t('search.clearFilters')}</span>
            </button>
          )}
        </div>

        {/* Results Count */}
        {resultsCount !== undefined && (
          <div className="results-info">
            <span className="results-count">
              {t('search.resultsCount', { count: resultsCount })}
            </span>
          </div>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="advanced-filters-panel">
          <div className="advanced-filters-content">
            {/* Model Types Filter */}
            <div className="filter-section">
              <h4>{t('search.modelTypes')}</h4>
              <div className="checkbox-grid">
                {civitaiModelTypes.map(type => (
                  <label key={type} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.types?.includes(type) || false}
                      onChange={() => handleModelTypeToggle(type)}
                      disabled={isLoading}
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Base Models Filter */}
            <div className="filter-section">
              <h4>Base Models</h4>
              <div className="checkbox-grid">
                {BASE_MODELS.slice(0, -1).map(baseModel => (
                  <label key={baseModel} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.baseModels?.includes(baseModel) || false}
                      onChange={() => handleBaseModelToggle(baseModel)}
                      disabled={isLoading}
                    />
                    <span>{baseModel}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Filters */}
            <div className="filter-section">
              <h4>Additional Filters</h4>
              <div className="additional-filters">
                <div className="filter-input-group">
                  <label>Minimum Rating</label>
                  <select
                    value={filters.rating || ''}
                    onChange={(e) => handleRatingChange(e.target.value ? Number(e.target.value) : undefined)}
                    className="filter-select"
                    disabled={isLoading}
                  >
                    <option value="">Any Rating</option>
                    <option value="1">1+ Stars</option>
                    <option value="2">2+ Stars</option>
                    <option value="3">3+ Stars</option>
                    <option value="4">4+ Stars</option>
                    <option value="5">5 Stars</option>
                  </select>
                </div>

                <div className="filter-input-group">
                  <label>Creator Username</label>
                  <input
                    type="text"
                    value={filters.username || ''}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="Enter username..."
                    className="filter-input"
                    disabled={isLoading}
                  />
                </div>

                <div className="filter-input-group">
                  <label>Tag</label>
                  <input
                    type="text"
                    value={filters.tag || ''}
                    onChange={(e) => handleTagChange(e.target.value)}
                    placeholder="Enter tag..."
                    className="filter-input"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CivitAISearchFilterBar;