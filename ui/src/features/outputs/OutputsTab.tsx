import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { OutputGallery, OutputModal } from './components';
import { Output, ViewMode, SortOption } from './types';
import { apiClient } from '../../services/api';
import { convertOutputResponseArray } from './utils/outputUtils';
import LoadingSpinner from '../../components/LoadingSpinner';
import './OutputsTab.css';

const OutputsTab = () => {
  const { t } = useTranslation();
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [selectedOutput, setSelectedOutput] = useState<Output | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Load outputs from API
  useEffect(() => {
    const loadOutputs = async () => {
      setLoading(true);
      setError(null);

      try {
        // Convert sortBy to API format
        const [sortField, sortOrder] = sortBy.split('-');
        const ascending = sortOrder === 'asc';
        
        const response = await apiClient.getOutputs({
          sortBy: sortField,
          ascending: ascending
        });
        
        const outputs = convertOutputResponseArray(response.data);
        setOutputs(outputs);
      } catch (err) {
        console.error('Error loading outputs:', err);
        setError('Failed to load outputs. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadOutputs();
  }, [sortBy]);

  // Outputs are already sorted by the API
  const sortedOutputs = outputs;

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const handleSortChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(event.target.value as SortOption);
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.refreshOutputs();
      const outputs = convertOutputResponseArray(response.data);
      setOutputs(outputs);
    } catch (err) {
      console.error('Error refreshing outputs:', err);
      setError('Failed to refresh outputs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOutputSelect = useCallback((output: Output) => {
    setSelectedOutput(output);
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedOutput(null);
  }, []);

  const handleContextMenu = useCallback((output: Output, event: React.MouseEvent) => {
    event.preventDefault();
    // TODO: Implement context menu functionality
    console.log('Context menu for output:', output);
  }, []);

  const handleModalAction = useCallback((action: string, output: Output) => {
    switch (action) {
      case 'copy-path':
        console.log('Copying path:', output.filePath);
        // TODO: Show success toast
        break;
      case 'open-system':
        console.log('Opening in system viewer:', output.filePath);
        // TODO: Implement system integration
        break;
      case 'show-folder':
        console.log('Showing in folder:', output.filePath);
        // TODO: Implement system integration
        break;
      default:
        console.log('Unknown action:', action);
    }
  }, []);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Close modal with Escape key
      if (event.key === 'Escape' && isModalOpen) {
        handleModalClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen, handleModalClose]);

  // Error auto-dismiss
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="tab-panel" role="tabpanel" aria-labelledby="outputs-tab">
      <div className="tab-panel-header">
        <h3 id="outputs-tab">{t('tabs.outputs')}</h3>
        <p>{t('tabs.outputsDescription')}</p>
      </div>

      {error && (
        <div className="error-banner" role="alert" aria-live="polite">
          <div className="error-content">
            <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{error}</span>
            <button
              className="error-dismiss"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="tab-panel-content">
        <div className="outputs-container">
          {/* Toolbar */}
          <div className="outputs-toolbar">
            <div className="outputs-view-controls">
              <button
                className={`view-mode-button ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => handleViewModeChange('grid')}
                aria-label="Grid view"
                title="Grid view"
              >
                <i className="pi pi-th-large"></i>
                Grid
              </button>
              <button
                className={`view-mode-button ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => handleViewModeChange('list')}
                aria-label="List view"
                title="List view"
              >
                <i className="pi pi-list"></i>
                List
              </button>
            </div>

            <div className="outputs-sort-controls">
              <select
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
                className="view-mode-button"
                onClick={handleRefresh}
                disabled={loading}
                aria-label="Refresh outputs"
                title="Refresh outputs"
              >
                <i className={`pi pi-refresh ${loading ? 'pi-spin' : ''}`}></i>
                Refresh
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="outputs-content">
            {loading ? (
              <div className="outputs-loading">
                <LoadingSpinner />
                <span style={{ marginLeft: '12px' }}>Loading outputs...</span>
              </div>
            ) : (
              <OutputGallery
                outputs={sortedOutputs}
                viewMode={viewMode}
                onOutputSelect={handleOutputSelect}
                onContextMenu={handleContextMenu}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedOutput && (
        <OutputModal
          output={selectedOutput}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onAction={handleModalAction}
        />
      )}
    </div>
  );
};

export default OutputsTab;
