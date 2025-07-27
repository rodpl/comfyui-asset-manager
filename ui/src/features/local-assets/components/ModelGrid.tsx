import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ModelInfo, ModelType } from '../types';
import './ModelGrid.css';

interface ModelGridProps {
  models: ModelInfo[];
  loading: boolean;
  onModelSelect: (model: ModelInfo) => void;
  onModelDrag?: (model: ModelInfo) => void;
}

interface ModelCardProps {
  model: ModelInfo;
  onSelect: (model: ModelInfo) => void;
  onDragStart?: (model: ModelInfo) => void;
}

const ModelCard: React.FC<ModelCardProps> = ({ model, onSelect, onDragStart }) => {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getModelTypeIcon = (type: ModelType): string => {
    switch (type) {
      case ModelType.CHECKPOINT:
        return 'pi pi-bookmark';
      case ModelType.LORA:
        return 'pi pi-cog';
      case ModelType.VAE:
        return 'pi pi-eye';
      case ModelType.EMBEDDING:
        return 'pi pi-code';
      case ModelType.CONTROLNET:
        return 'pi pi-sliders-h';
      case ModelType.UPSCALER:
        return 'pi pi-search-plus';
      default:
        return 'pi pi-file';
    }
  };

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData(
        'application/json',
        JSON.stringify({
          type: 'model',
          model: model,
        })
      );
      e.dataTransfer.effectAllowed = 'copy';
      onDragStart?.(model);
    },
    [model, onDragStart]
  );

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  return (
    <div
      className="model-card p-card p-component"
      onClick={() => onSelect(model)}
      draggable={!!onDragStart}
      onDragStart={handleDragStart}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(model);
        }
      }}
      aria-label={`${model.name} - ${model.modelType} model`}
    >
      <div className="model-card-thumbnail">
        {imageLoading && (
          <div className="model-thumbnail-skeleton">
            <div className="skeleton-shimmer"></div>
          </div>
        )}
        {model.thumbnail && !imageError ? (
          <img
            src={model.thumbnail}
            alt={model.name}
            className={`model-thumbnail ${imageLoading ? 'loading' : ''}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ) : (
          <div className="model-thumbnail-placeholder">
            <i className={`${getModelTypeIcon(model.modelType)} model-type-icon`}></i>
          </div>
        )}
      </div>

      <div className="model-card-content p-card-body">
        <div className="model-card-header">
          <h4 className="model-name p-card-title" title={model.name}>
            {model.name}
          </h4>
          <span className="model-type-badge">{model.modelType.toUpperCase()}</span>
        </div>

        <div className="model-card-details">
          <div className="model-file-size">{formatFileSize(model.fileSize)}</div>
          <div className="model-modified-date">
            {t('modelGrid.modified')}: {new Date(model.modifiedAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};

const ModelGridSkeleton: React.FC<{ count?: number }> = ({ count = 12 }) => {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="model-card model-card-skeleton p-card p-component">
          <div className="model-card-thumbnail">
            <div className="model-thumbnail-skeleton">
              <div className="skeleton-shimmer"></div>
            </div>
          </div>
          <div className="model-card-content p-card-body">
            <div className="skeleton-text skeleton-title"></div>
            <div className="skeleton-text skeleton-subtitle"></div>
            <div className="skeleton-text skeleton-details"></div>
          </div>
        </div>
      ))}
    </>
  );
};

const ModelGrid: React.FC<ModelGridProps> = ({ models, loading, onModelSelect, onModelDrag }) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="model-grid">
        <ModelGridSkeleton />
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="model-grid-empty">
        <div className="empty-state">
          <i className="pi pi-folder-open empty-icon"></i>
          <h3 className="empty-title">{t('modelGrid.empty.title')}</h3>
          <p className="empty-description">{t('modelGrid.empty.description')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="model-grid" role="grid" aria-label={t('modelGrid.ariaLabel')}>
      {models.map((model) => (
        <ModelCard
          key={model.id}
          model={model}
          onSelect={onModelSelect}
          onDragStart={onModelDrag}
        />
      ))}
    </div>
  );
};

export default ModelGrid;
