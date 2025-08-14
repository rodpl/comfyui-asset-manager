import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HuggingFaceFilters } from '../types';
import { HUGGINGFACE_SORT_OPTIONS } from '../constants';
import './HuggingFaceSearchFilterBar.css';

export interface HuggingFaceSearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: HuggingFaceFilters;
  onFiltersChange: (filters: HuggingFaceFilters) => void;
  resultsCount?: number;
  isLoading?: boolean;
  className?: string;
}

const HuggingFaceSearchFilterBar: React.FC<HuggingFaceSearchFilterBarProps> = ({
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
  const handleSortChange = useCallback((sort: HuggingFaceFilters['sort']) => {
    onFiltersChange({ ...filters, sort });
  }, [filters, onFiltersChange]);

  const handleDirectionChange = useCallback((direction: HuggingFaceFilters['direction']) => {
    onFiltersChange({ ...filters, direction });
  }, [filters, onFiltersChange]);

  const handleAuthorChange = useCallback((author: string) => {
    onFiltersChange({ 
      ...filters, 
      author: author.trim() || undefined 
    });
  }, [filters, onFiltersChange]);

  const handleLibraryToggle = useCallback((library: string) => {
    const currentLibraries = filters.library || [];
    const newLibraries = currentLibraries.includes(library)
      ? currentLibraries.filter(l => l !== library)
      : [...currentLibraries, library];
    
    onFiltersChange({ 
      ...filters, 
      library: newLibraries.length > 0 ? newLibraries : undefined 
    });
  }, [filters, onFiltersChange]);

  const handleTaskToggle = useCallback((task: string) => {
    const currentTasks = filters.task || [];
    const newTasks = currentTasks.includes(task)
      ? currentTasks.filter(t => t !== task)
      : [...currentTasks, task];
    
    onFiltersChange({ 
      ...filters, 
      task: newTasks.length > 0 ? newTasks : undefined 
    });
  }, [filters, onFiltersChange]);

  const handleLanguageToggle = useCallback((language: string) => {
    const currentLanguages = filters.language || [];
    const newLanguages = currentLanguages.includes(language)
      ? currentLanguages.filter(l => l !== language)
      : [...currentLanguages, language];
    
    onFiltersChange({ 
      ...filters, 
      language: newLanguages.length > 0 ? newLanguages : undefined 
    });
  }, [filters, onFiltersChange]);

  const handleLicenseToggle = useCallback((license: string) => {
    const currentLicenses = filters.license || [];
    const newLicenses = currentLicenses.includes(license)
      ? currentLicenses.filter(l => l !== license)
      : [...currentLicenses, license];
    
    onFiltersChange({ 
      ...filters, 
      license: newLicenses.length > 0 ? newLicenses : undefined 
    });
  }, [filters, onFiltersChange]);

  const clearAllFilters = useCallback(() => {
    onFiltersChange({
      sort: 'downloads',
      direction: 'desc',
      library: ['diffusers', 'transformers'],
      task: ['text-to-image'],
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
    filters.library?.length || 0,
    filters.task?.length || 0,
    filters.language?.length || 0,
    filters.license?.length || 0,
    filters.author ? 1 : 0,
  ].reduce((sum, count) => (sum || 0) + (count || 0), 0);

  // Available options for HuggingFace
  const huggingfaceLibraries = [
    'diffusers',
    'transformers',
    'pytorch',
    'tensorflow',
    'jax',
    'onnx'
  ];

  const huggingfaceTasks = [
    'text-to-image',
    'image-to-image',
    'unconditional-image-generation',
    'image-classification',
    'feature-extraction',
    'text-classification',
    'token-classification'
  ];

  const commonLanguages = [
    'en',
    'zh',
    'es',
    'fr',
    'de',
    'ja',
    'ko',
    'pt'
  ];

  const commonLicenses = [
    'apache-2.0',
    'mit',
    'openrail',
    'creativeml-openrail-m',
    'cc-by-4.0',
    'cc-by-sa-4.0',
    'gpl-3.0'
  ];

  const containerClasses = [
    'huggingface-search-filter-bar',
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
              value={filters.sort || 'downloads'}
              onChange={(e) => handleSortChange(e.target.value as HuggingFaceFilters['sort'])}
              className="filter-select"
              disabled={isLoading}
            >
              {HUGGINGFACE_SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {t(`modelBrowser.sort.${option.value}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>{t('modelBrowser.filters.direction')}</label>
            <select 
              value={filters.direction || 'desc'}
              onChange={(e) => handleDirectionChange(e.target.value as HuggingFaceFilters['direction'])}
              className="filter-select"
              disabled={isLoading}
            >
              <option value="desc">{t('modelBrowser.direction.desc')}</option>
              <option value="asc">{t('modelBrowser.direction.asc')}</option>
            </select>
          </div>

          <div className="filter-group author-filter">
            <label>{t('modelBrowser.filters.author')}</label>
            <input
              type="text"
              value={filters.author || ''}
              onChange={(e) => handleAuthorChange(e.target.value)}
              placeholder={t('modelBrowser.filters.authorPlaceholder')}
              className="filter-input"
              disabled={isLoading}
            />
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
            {/* Libraries Filter */}
            <div className="filter-section">
              <h4>{t('modelBrowser.filters.libraries')}</h4>
              <div className="checkbox-grid">
                {huggingfaceLibraries.map(library => (
                  <label key={library} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.library?.includes(library) || false}
                      onChange={() => handleLibraryToggle(library)}
                      disabled={isLoading}
                    />
                    <span>{library}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tasks Filter */}
            <div className="filter-section">
              <h4>{t('modelBrowser.filters.tasks')}</h4>
              <div className="checkbox-grid">
                {huggingfaceTasks.map(task => (
                  <label key={task} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.task?.includes(task) || false}
                      onChange={() => handleTaskToggle(task)}
                      disabled={isLoading}
                    />
                    <span>{task.replace(/-/g, ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Languages Filter */}
            <div className="filter-section">
              <h4>{t('modelBrowser.filters.languages')}</h4>
              <div className="checkbox-grid">
                {commonLanguages.map(language => (
                  <label key={language} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.language?.includes(language) || false}
                      onChange={() => handleLanguageToggle(language)}
                      disabled={isLoading}
                    />
                    <span>{language.toUpperCase()}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Licenses Filter */}
            <div className="filter-section">
              <h4>{t('modelBrowser.filters.licenses')}</h4>
              <div className="checkbox-grid">
                {commonLicenses.map(license => (
                  <label key={license} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.license?.includes(license) || false}
                      onChange={() => handleLicenseToggle(license)}
                      disabled={isLoading}
                    />
                    <span>{license}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HuggingFaceSearchFilterBar;