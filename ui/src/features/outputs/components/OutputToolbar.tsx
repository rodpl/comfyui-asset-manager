import { ChangeEvent } from 'react';
import { ViewMode, SortOption, OutputToolbarProps } from '../types';
import '../OutputsTab.css';

const OutputToolbar = ({
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  onRefresh,
  loading = false,
}: OutputToolbarProps & { loading?: boolean }) => {
  const handleSortChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onSortChange(event.target.value as SortOption);
  };

  const handleViewModeClick = (mode: ViewMode) => {
    onViewModeChange(mode);
  };

  return (
    <div className="outputs-toolbar" role="toolbar" aria-label="Output gallery controls">
      <div className="outputs-view-controls">
        <button
          className={`view-mode-button ${viewMode === 'grid' ? 'active' : ''}`}
          onClick={() => handleViewModeClick('grid')}
          aria-label="Grid view"
          aria-pressed={viewMode === 'grid'}
          title="Grid view"
          type="button"
        >
          <i className="pi pi-th-large" aria-hidden="true"></i>
          <span className="view-mode-text">Grid</span>
        </button>
        <button
          className={`view-mode-button ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => handleViewModeClick('list')}
          aria-label="List view"
          aria-pressed={viewMode === 'list'}
          title="List view"
          type="button"
        >
          <i className="pi pi-list" aria-hidden="true"></i>
          <span className="view-mode-text">List</span>
        </button>
      </div>

      <div className="outputs-sort-controls">
        <label htmlFor="outputs-sort-select" className="sr-only">
          Sort outputs by
        </label>
        <select
          id="outputs-sort-select"
          className="outputs-sort-select"
          value={sortBy}
          onChange={handleSortChange}
          aria-label="Sort outputs"
        >
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="size-desc">Largest First</option>
          <option value="size-asc">Smallest First</option>
        </select>

        <button
          className="view-mode-button refresh-button"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh outputs"
          title="Refresh outputs"
          type="button"
        >
          <i 
            className={`pi pi-refresh ${loading ? 'pi-spin' : ''}`} 
            aria-hidden="true"
          ></i>
          <span className="refresh-text">Refresh</span>
        </button>
      </div>
    </div>
  );
};

export default OutputToolbar;