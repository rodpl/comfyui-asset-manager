import React from 'react';
import { useTranslation } from 'react-i18next';
import { FolderNavigationProps, ModelType } from './types';
import './FolderNavigation.css';

const FolderNavigation: React.FC<FolderNavigationProps> = ({
  folders,
  selectedFolder,
  onFolderSelect,
  loading = false,
}) => {
  const { t } = useTranslation();

  const getModelTypeIcon = (modelType: ModelType): string => {
    switch (modelType) {
      case ModelType.CHECKPOINT:
        return 'pi-bookmark';
      case ModelType.LORA:
        return 'pi-cog';
      case ModelType.VAE:
        return 'pi-palette';
      case ModelType.EMBEDDING:
        return 'pi-tag';
      case ModelType.CONTROLNET:
        return 'pi-sliders-h';
      case ModelType.UPSCALER:
        return 'pi-expand';
      default:
        return 'pi-folder';
    }
  };

  const getModelTypeLabel = (modelType: ModelType): string => {
    switch (modelType) {
      case ModelType.CHECKPOINT:
        return t('folders.checkpoint', 'Checkpoints');
      case ModelType.LORA:
        return t('folders.lora', 'LoRAs');
      case ModelType.VAE:
        return t('folders.vae', 'VAE');
      case ModelType.EMBEDDING:
        return t('folders.embedding', 'Embeddings');
      case ModelType.CONTROLNET:
        return t('folders.controlnet', 'ControlNet');
      case ModelType.UPSCALER:
        return t('folders.upscaler', 'Upscalers');
      default:
        return modelType;
    }
  };

  if (loading) {
    return (
      <div className="folder-navigation">
        <div className="folder-navigation-header">
          <h4>{t('folders.title', 'Folders')}</h4>
        </div>
        <div className="folder-navigation-content">
          <div className="folder-loading">
            <i className="pi pi-spin pi-spinner"></i>
            <span>{t('folders.loading', 'Loading folders...')}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!folders || folders.length === 0) {
    return (
      <div className="folder-navigation">
        <div className="folder-navigation-header">
          <h4>{t('folders.title', 'Folders')}</h4>
        </div>
        <div className="folder-navigation-content">
          <div className="folder-empty">
            <i className="pi pi-folder-open"></i>
            <span>{t('folders.empty', 'No folders found')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="folder-navigation">
      <div className="folder-navigation-header">
        <h4>{t('folders.title', 'Folders')}</h4>
        <span className="folder-count">
          {t('folders.count', '{{count}} folders', { count: folders.length })}
        </span>
      </div>
      <div className="folder-navigation-content">
        <div className="folder-list">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className={`folder-item ${selectedFolder === folder.id ? 'selected' : ''}`}
              onClick={() => onFolderSelect(folder.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onFolderSelect(folder.id);
                }
              }}
              aria-label={`Select ${getModelTypeLabel(folder.modelType)} folder with ${folder.modelCount} models`}
            >
              <div className="folder-item-icon">
                <i className={`pi ${getModelTypeIcon(folder.modelType)}`}></i>
              </div>
              <div className="folder-item-content">
                <div className="folder-item-name">{getModelTypeLabel(folder.modelType)}</div>
                <div className="folder-item-details">
                  <span className="folder-item-count">
                    {t('folders.modelCount', '{{count}} models', { count: folder.modelCount })}
                  </span>
                  <span className="folder-item-path" title={folder.path}>
                    {folder.name}
                  </span>
                </div>
              </div>
              {selectedFolder === folder.id && (
                <div className="folder-item-indicator">
                  <i className="pi pi-chevron-right"></i>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FolderNavigation;
