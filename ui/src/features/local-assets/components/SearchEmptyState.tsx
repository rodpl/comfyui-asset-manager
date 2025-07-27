import React from 'react';
import { useTranslation } from 'react-i18next';
import './SearchEmptyState.css';

interface SearchEmptyStateProps {
  searchQuery: string;
  hasFilters: boolean;
  onClearSearch: () => void;
  onClearFilters: () => void;
}

const SearchEmptyState: React.FC<SearchEmptyStateProps> = ({
  searchQuery,
  hasFilters,
  onClearSearch,
  onClearFilters,
}) => {
  const { t } = useTranslation();

  return (
    <div className="search-empty-state">
      <div className="search-empty-content">
        <div className="search-empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
            <line x1="11" y1="8" x2="11" y2="16" />
            <line x1="8" y1="11" x2="16" y2="11" />
          </svg>
        </div>
        
        <h3 className="search-empty-title">
          {t('search.noResults.title')}
        </h3>
        
        <p className="search-empty-description">
          {t('search.noResults.description')}
        </p>

        <div className="search-empty-suggestions">
          <h4>{t('search.noResults.suggestions')}</h4>
          <ul>
            <li>{t('search.noResults.checkSpelling')}</li>
            <li>{t('search.noResults.tryBroaderTerms')}</li>
            {hasFilters && <li>{t('search.noResults.clearFilters')}</li>}
          </ul>
        </div>

        <div className="search-empty-actions">
          {searchQuery && (
            <button
              className="search-empty-button primary"
              onClick={onClearSearch}
            >
              {t('search.clear')}
            </button>
          )}
          {hasFilters && (
            <button
              className="search-empty-button secondary"
              onClick={onClearFilters}
            >
              {t('search.clearFilters')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchEmptyState;