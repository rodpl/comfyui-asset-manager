import React, { useState, useCallback } from 'react';
import { ExternalModel, ComfyUIModelType } from '../types';
import { MODEL_TYPE_DISPLAY_NAMES, MODEL_TYPE_COLORS } from '../constants';
import './ModelCard.css';

export interface ModelCardProps {
  model: ExternalModel;
  onClick?: (model: ExternalModel) => void;
  onDragStart?: (model: ExternalModel) => void;
  className?: string;
  draggable?: boolean;
}

const ModelCard: React.FC<ModelCardProps> = ({
  model,
  onClick,
  onDragStart,
  className = '',
  draggable = false,
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleClick = useCallback(() => {
    onClick?.(model);
  }, [onClick, model]);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      if (!draggable) return;

      // Set drag data for potential ComfyUI integration
      e.dataTransfer.setData(
        'text/plain',
        JSON.stringify({
          type: 'external-model',
          platform: model.platform,
          modelId: model.id,
          modelType: model.modelType,
          name: model.name,
        })
      );

      onDragStart?.(model);
    },
    [draggable, model, onDragStart]
  );

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoading(false);
    setImageError(true);
  }, []);

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDownloadCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const getModelTypeColor = (modelType?: ComfyUIModelType): string => {
    return modelType ? MODEL_TYPE_COLORS[modelType] : MODEL_TYPE_COLORS[ComfyUIModelType.UNKNOWN];
  };

  const getModelTypeIcon = (modelType?: ComfyUIModelType): string => {
    const iconMap = {
      [ComfyUIModelType.CHECKPOINT]: 'pi pi-file',
      [ComfyUIModelType.LORA]: 'pi pi-cog',
      [ComfyUIModelType.VAE]: 'pi pi-image',
      [ComfyUIModelType.EMBEDDING]: 'pi pi-tag',
      [ComfyUIModelType.CONTROLNET]: 'pi pi-sliders-h',
      [ComfyUIModelType.UPSCALER]: 'pi pi-search-plus',
      [ComfyUIModelType.UNKNOWN]: 'pi pi-question-circle',
    };

    return modelType ? iconMap[modelType] : iconMap[ComfyUIModelType.UNKNOWN];
  };

  const getPlatformIcon = (platform: string): string => {
    const platformIcons = {
      civitai: 'pi pi-globe',
      huggingface: 'pi pi-github',
    };
    return platformIcons[platform as keyof typeof platformIcons] || 'pi pi-cloud';
  };

  const cardClasses = [
    'model-card',
    'external-model-card',
    className,
    imageLoading ? 'loading' : '',
    !model.comfyuiCompatibility.isCompatible ? 'incompatible' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={cardClasses}
      onClick={handleClick}
      onDragStart={handleDragStart}
      draggable={draggable}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`${model.name} by ${model.author} on ${model.platform}`}
    >
      {/* Thumbnail Section */}
      <div className="model-card-thumbnail">
        {imageLoading && (
          <div className="model-thumbnail-skeleton">
            <div className="skeleton-shimmer" />
          </div>
        )}

        {model.thumbnailUrl && !imageError ? (
          <img
            src={model.thumbnailUrl}
            alt={`${model.name} preview`}
            className={`model-thumbnail ${imageLoading ? 'loading' : ''}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="model-thumbnail-placeholder">
            <i className={`model-type-icon ${getModelTypeIcon(model.modelType)}`} />
          </div>
        )}

        {/* Platform Badge */}
        <div className="platform-badge">
          <i className={getPlatformIcon(model.platform)} />
          <span>{model.platform}</span>
        </div>

        {/* Compatibility Indicator */}
        <div
          className={`compatibility-indicator ${model.comfyuiCompatibility.isCompatible ? 'compatible' : 'incompatible'}`}
        >
          <i
            className={
              model.comfyuiCompatibility.isCompatible
                ? 'pi pi-check-circle'
                : 'pi pi-exclamation-triangle'
            }
          />
        </div>
      </div>

      {/* Content Section */}
      <div className="model-card-content">
        <div className="model-card-header">
          <h4 className="model-name" title={model.name}>
            {model.name}
          </h4>

          {model.modelType && (
            <div
              className="model-type-badge"
              style={{ backgroundColor: getModelTypeColor(model.modelType) }}
            >
              {MODEL_TYPE_DISPLAY_NAMES[model.modelType]}
            </div>
          )}
        </div>

        <div className="model-author" title={model.author}>
          by {model.author}
        </div>

        {model.description && (
          <div className="model-description" title={model.description}>
            {model.description}
          </div>
        )}

        <div className="model-card-footer">
          <div className="model-stats">
            <div className="stat-item">
              <i className="pi pi-download" />
              <span>{formatDownloadCount(model.downloadCount)}</span>
            </div>

            {model.rating && (
              <div className="stat-item">
                <i className="pi pi-star-fill" />
                <span>{model.rating.toFixed(1)}</span>
              </div>
            )}

            <div className="stat-item">
              <i className="pi pi-file" />
              <span>{formatFileSize(model.fileSize)}</span>
            </div>
          </div>

          {/* Model Format and Base Model Info */}
          <div className="model-technical-info">
            {model.fileFormat && (
              <div className="format-badge">{model.fileFormat.toUpperCase()}</div>
            )}

            {model.baseModel && (
              <div className="base-model-info" title={`Base Model: ${model.baseModel}`}>
                {model.baseModel}
              </div>
            )}
          </div>
        </div>

        {/* ComfyUI Integration Info */}
        {model.comfyuiCompatibility.modelFolder && (
          <div className="comfyui-info">
            <i className="pi pi-folder" />
            <span>→ {model.comfyuiCompatibility.modelFolder}/</span>
          </div>
        )}

        {/* Tags */}
        {model.tags.length > 0 && (
          <div className="model-tags">
            {model.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="tag-chip">
                {tag}
              </span>
            ))}
            {model.tags.length > 3 && (
              <span className="tag-chip more-tags">+{model.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {imageLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <i className="pi pi-spin pi-spinner" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelCard;
