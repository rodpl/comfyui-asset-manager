import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import MetadataEditor from './MetadataEditor';
import { ModelInfo } from '../types';
import './BulkMetadataModal.css';

interface BulkMetadataModalProps {
  models: ModelInfo[];
  isOpen: boolean;
  onClose: () => void;
  onBulkUpdate: (modelIds: string[], metadata: { tags: string[]; description: string; rating: number }) => Promise<void>;
  availableTags: string[];
}

const BulkMetadataModal: React.FC<BulkMetadataModalProps> = ({
  models,
  isOpen,
  onClose,
  onBulkUpdate,
  availableTags,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleMetadataSave = useCallback(async (metadata: { tags: string[]; description: string; rating: number }) => {
    setLoading(true);
    try {
      const modelIds = models.map(model => model.id);
      await onBulkUpdate(modelIds, metadata);
      onClose();
    } catch (error) {
      console.error('Failed to bulk update metadata:', error);
      // Error handling is done in the parent component
    } finally {
      setLoading(false);
    }
  }, [models, onBulkUpdate, onClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="bulk-metadata-backdrop" 
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-modal-title"
      tabIndex={-1}
    >
      <div className="bulk-metadata-content">
        <div className="bulk-metadata-header">
          <h2 id="bulk-modal-title" className="bulk-modal-title">
            <i className="pi pi-tags"></i>
            {t('bulkMetadata.title')}
          </h2>
          <button 
            className="bulk-modal-close-button"
            onClick={onClose}
            aria-label={t('bulkMetadata.close')}
          >
            <i className="pi pi-times"></i>
          </button>
        </div>

        <div className="bulk-metadata-body">
          <div className="bulk-info">
            <div className="bulk-info-item">
              <i className="pi pi-info-circle"></i>
              <span>{t('bulkMetadata.selectedModels', { count: models.length })}</span>
            </div>
            <div className="bulk-info-item">
              <i className="pi pi-exclamation-triangle"></i>
              <span>{t('bulkMetadata.warning')}</span>
            </div>
          </div>

          <div className="selected-models-preview">
            <h3>{t('bulkMetadata.selectedModelsTitle')}</h3>
            <div className="models-list">
              {models.slice(0, 5).map((model, index) => (
                <div key={model.id} className="model-item">
                  <i className="pi pi-file"></i>
                  <span className="model-name">{model.name}</span>
                  <span className="model-type">{model.modelType}</span>
                </div>
              ))}
              {models.length > 5 && (
                <div className="more-models">
                  <i className="pi pi-ellipsis-h"></i>
                  <span>{t('bulkMetadata.moreModels', { count: models.length - 5 })}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bulk-editor-section">
            <h3>{t('bulkMetadata.metadataToApply')}</h3>
            <MetadataEditor
              availableTags={availableTags}
              onSave={handleMetadataSave}
              onCancel={onClose}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkMetadataModal;