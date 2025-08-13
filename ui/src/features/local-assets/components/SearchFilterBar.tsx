import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchFilterBarProps, ModelType } from '../types';
import './SearchFilterBar.css';

const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  totalResults,
  loading = false,
}) => {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search implementation
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      onSearchChange(localSearchQuery);
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [localSearchQuery, onSearchChange]);

  // Update local state when external searchQuery changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setLocalSearchQuery('');
    onSearchChange('');
  };

  const handleModelTypeToggle = (modelType: ModelType) => {
    const newModelTypes = filters.modelTypes.includes(modelType)
      ? filters.modelTypes.filter((type) => type !== modelType)
      : [...filters.modelTypes, modelType];

    onFilterChange({
      ...filters,
      modelTypes: newModelTypes,
    });
  };

  const handleClearAllFilters = () => {
    onFilterChange({
      modelTypes: [],
      fileSizeRange: undefined,
      dateRange: undefined,
      hasMetadata: undefined,
      hasThumbnail: undefined,
    });
  };

  const hasActiveFilters =
    filters.modelTypes.length > 0 ||
    filters.fileSizeRange ||
    filters.dateRange ||
    filters.hasMetadata !== undefined ||
    filters.hasThumbnail !== undefined;

  const getModelTypeDisplayName = (modelType: ModelType): string => {
    switch (modelType) {
      case ModelType.CHECKPOINT:
        return t('folders.checkpoint');
      case ModelType.LORA:
        return t('folders.lora');
      case ModelType.VAE:
        return t('folders.vae');
      case ModelType.EMBEDDING:
        return t('folders.embedding');
      case ModelType.CONTROLNET:
        return t('folders.controlnet');
      case ModelType.UPSCALER:
        return t('folders.upscaler');
      default:
        return modelType;
    }
  };

  return (
    <div className="search-filter-bar">
      <div className="search-filter-main">
        <div className="search-input-container">
          <div className="search-input-wrapper">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder={t('search.placeholder')}
              value={localSearchQuery}
              onChange={handleSearchInputChange}
              disabled={loading}
              aria-label={t('search.placeholder')}
              data-testid="search-input"
            />
            {localSearchQuery && (
              <button
                className="search-clear-button"
                onClick={handleClearSearch}
                aria-label={t('search.clear')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
          {loading && <div className="search-loading-indicator" />}
        </div>

        <div className="search-actions">
          <button
            className={`filter-toggle-button ${showFilters ? 'active' : ''} ${hasActiveFilters ? 'has-filters' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            aria-label={t('search.toggleFilters')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
            </svg>
            {t('search.filters')}
            {hasActiveFilters && <span className="filter-count-badge" />}
          </button>

          {totalResults !== undefined && (
            <div className="search-results-count">
              {t('search.resultsCount', { count: totalResults })}
            </div>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="search-filters-panel">
          <div className="filter-section">
            <h4 className="filter-section-title">{t('search.modelTypes')}</h4>
            <div className="filter-chips">
              {Object.values(ModelType).map((modelType) => (
                <button
                  key={modelType}
                  className={`filter-chip ${filters.modelTypes.includes(modelType) ? 'active' : ''}`}
                  onClick={() => handleModelTypeToggle(modelType)}
                >
                  {getModelTypeDisplayName(modelType)}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h4 className="filter-section-title">{t('search.metadata')}</h4>
            <div className="filter-checkboxes">
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={filters.hasMetadata === true}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      hasMetadata: e.target.checked ? true : undefined,
                    })
                  }
                />
                <span>{t('search.hasMetadata')}</span>
              </label>
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={filters.hasThumbnail === true}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      hasThumbnail: e.target.checked ? true : undefined,
                    })
                  }
                />
                <span>{t('search.hasThumbnail')}</span>
              </label>
            </div>
          </div>

          <div className="filter-actions">
            <button
              className="filter-clear-button"
              onClick={handleClearAllFilters}
              disabled={!hasActiveFilters}
            >
              {t('search.clearFilters')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilterBar;
