import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { EnrichedModelInfo, ModelType } from '../types';
import './ModelDetailModal.css';

interface ModelDetailModalProps {
  model: EnrichedModelInfo;
  isOpen: boolean;
  onClose: () => void;
  onAddToWorkflow: (model: EnrichedModelInfo) => void;
}

type TabType = 'details' | 'metadata' | 'usage';

const ModelDetailModal: React.FC<ModelDetailModalProps> = ({
  model,
  isOpen,
  onClose,
  onAddToWorkflow,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const formatFileSize = useCallback((bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }, []);

  const getModelTypeIcon = useCallback((type: ModelType): string => {
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
  }, []);

  const copyToClipboard = useCallback(async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, []);

  const handleAddToWorkflow = useCallback(() => {
    onAddToWorkflow(model);
  }, [model, onAddToWorkflow]);

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
      className="modal-backdrop" 
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabIndex={-1}
    >
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title-section">
            <i className={`${getModelTypeIcon(model.modelType)} model-type-icon`}></i>
            <h2 id="modal-title" className="modal-title">{model.name}</h2>
            <span className="model-type-badge">{model.modelType.toUpperCase()}</span>
          </div>
          <button 
            className="modal-close-button"
            onClick={onClose}
            aria-label={t('modelDetail.close')}
          >
            <i className="pi pi-times"></i>
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-tabs">
            <button
              className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              <i className="pi pi-info-circle"></i>
              {t('modelDetail.tabs.details')}
            </button>
            <button
              className={`tab-button ${activeTab === 'metadata' ? 'active' : ''}`}
              onClick={() => setActiveTab('metadata')}
            >
              <i className="pi pi-tags"></i>
              {t('modelDetail.tabs.metadata')}
            </button>
            <button
              className={`tab-button ${activeTab === 'usage' ? 'active' : ''}`}
              onClick={() => setActiveTab('usage')}
            >
              <i className="pi pi-play"></i>
              {t('modelDetail.tabs.usage')}
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'details' && (
              <div className="details-tab">
                <div className="model-preview">
                  {model.thumbnail ? (
                    <img 
                      src={model.thumbnail} 
                      alt={model.name}
                      className="model-preview-image"
                    />
                  ) : (
                    <div className="model-preview-placeholder">
                      <i className={`${getModelTypeIcon(model.modelType)} preview-icon`}></i>
                    </div>
                  )}
                </div>

                <div className="model-info">
                  <div className="info-section">
                    <h3>{t('modelDetail.basicInfo')}</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>{t('modelDetail.fileName')}:</label>
                        <div className="info-value">
                          <span>{model.name}</span>
                          <button
                            className={`copy-button ${copySuccess === 'name' ? 'success' : ''}`}
                            onClick={() => copyToClipboard(model.name, 'name')}
                            title={t('modelDetail.copyName')}
                          >
                            <i className={copySuccess === 'name' ? 'pi pi-check' : 'pi pi-copy'}></i>
                          </button>
                        </div>
                      </div>
                      
                      <div className="info-item">
                        <label>{t('modelDetail.filePath')}:</label>
                        <div className="info-value">
                          <span className="file-path">{model.filePath}</span>
                          <button
                            className={`copy-button ${copySuccess === 'path' ? 'success' : ''}`}
                            onClick={() => copyToClipboard(model.filePath, 'path')}
                            title={t('modelDetail.copyPath')}
                          >
                            <i className={copySuccess === 'path' ? 'pi pi-check' : 'pi pi-copy'}></i>
                          </button>
                        </div>
                      </div>

                      <div className="info-item">
                        <label>{t('modelDetail.fileSize')}:</label>
                        <span>{formatFileSize(model.fileSize)}</span>
                      </div>

                      <div className="info-item">
                        <label>{t('modelDetail.modelType')}:</label>
                        <span>{model.modelType}</span>
                      </div>

                      <div className="info-item">
                        <label>{t('modelDetail.hash')}:</label>
                        <div className="info-value">
                          <span className="hash-value">{model.hash}</span>
                          <button
                            className={`copy-button ${copySuccess === 'hash' ? 'success' : ''}`}
                            onClick={() => copyToClipboard(model.hash, 'hash')}
                            title={t('modelDetail.copyHash')}
                          >
                            <i className={copySuccess === 'hash' ? 'pi pi-check' : 'pi pi-copy'}></i>
                          </button>
                        </div>
                      </div>

                      <div className="info-item">
                        <label>{t('modelDetail.created')}:</label>
                        <span>{new Date(model.createdAt).toLocaleString()}</span>
                      </div>

                      <div className="info-item">
                        <label>{t('modelDetail.modified')}:</label>
                        <span>{new Date(model.modifiedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {model.externalMetadata?.civitai && (
                    <div className="info-section">
                      <h3>
                        <i className="pi pi-globe"></i>
                        {t('modelDetail.civitaiInfo')}
                      </h3>
                      <div className="external-metadata">
                        <p className="description">{model.externalMetadata.civitai.description}</p>
                        <div className="metadata-stats">
                          <div className="stat">
                            <i className="pi pi-download"></i>
                            <span>{model.externalMetadata.civitai.downloadCount.toLocaleString()} {t('modelDetail.downloads')}</span>
                          </div>
                          <div className="stat">
                            <i className="pi pi-star"></i>
                            <span>{model.externalMetadata.civitai.rating}/5</span>
                          </div>
                          <div className="stat">
                            <i className="pi pi-user"></i>
                            <span>{model.externalMetadata.civitai.creator}</span>
                          </div>
                        </div>
                        {model.externalMetadata.civitai.tags.length > 0 && (
                          <div className="tags">
                            {model.externalMetadata.civitai.tags.map((tag, index) => (
                              <span key={index} className="tag">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {model.externalMetadata?.huggingface && (
                    <div className="info-section">
                      <h3>
                        <i className="pi pi-globe"></i>
                        {t('modelDetail.huggingfaceInfo')}
                      </h3>
                      <div className="external-metadata">
                        <p className="description">{model.externalMetadata.huggingface.description}</p>
                        <div className="metadata-stats">
                          <div className="stat">
                            <i className="pi pi-download"></i>
                            <span>{model.externalMetadata.huggingface.downloads.toLocaleString()} {t('modelDetail.downloads')}</span>
                          </div>
                          <div className="stat">
                            <i className="pi pi-heart"></i>
                            <span>{model.externalMetadata.huggingface.likes.toLocaleString()} {t('modelDetail.likes')}</span>
                          </div>
                          <div className="stat">
                            <i className="pi pi-code"></i>
                            <span>{model.externalMetadata.huggingface.library}</span>
                          </div>
                        </div>
                        {model.externalMetadata.huggingface.tags.length > 0 && (
                          <div className="tags">
                            {model.externalMetadata.huggingface.tags.map((tag, index) => (
                              <span key={index} className="tag">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'metadata' && (
              <div className="metadata-tab">
                <div className="info-section">
                  <h3>{t('modelDetail.userMetadata')}</h3>
                  {model.userMetadata ? (
                    <div className="user-metadata">
                      {model.userMetadata.description && (
                        <div className="metadata-item">
                          <label>{t('modelDetail.description')}:</label>
                          <p>{model.userMetadata.description}</p>
                        </div>
                      )}
                      
                      {model.userMetadata.rating > 0 && (
                        <div className="metadata-item">
                          <label>{t('modelDetail.rating')}:</label>
                          <div className="rating">
                            {Array.from({ length: 5 }, (_, i) => (
                              <i
                                key={i}
                                className={`pi pi-star${i < model.userMetadata!.rating ? ' filled' : ''}`}
                              ></i>
                            ))}
                          </div>
                        </div>
                      )}

                      {model.userMetadata.tags.length > 0 && (
                        <div className="metadata-item">
                          <label>{t('modelDetail.userTags')}:</label>
                          <div className="tags">
                            {model.userMetadata.tags.map((tag, index) => (
                              <span key={index} className="tag user-tag">{tag}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="no-metadata">
                      <i className="pi pi-info-circle"></i>
                      <p>{t('modelDetail.noUserMetadata')}</p>
                    </div>
                  )}
                </div>

                <div className="info-section">
                  <h3>{t('modelDetail.technicalDetails')}</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>{t('modelDetail.fileFormat')}:</label>
                      <span>{model.filePath.split('.').pop()?.toUpperCase()}</span>
                    </div>
                    <div className="info-item">
                      <label>{t('modelDetail.compatibility')}:</label>
                      <span>{t(`modelDetail.compatibility.${model.modelType}`)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'usage' && (
              <div className="usage-tab">
                <div className="info-section">
                  <h3>{t('modelDetail.quickActions')}</h3>
                  <div className="action-buttons">
                    <button 
                      className="action-button primary"
                      onClick={handleAddToWorkflow}
                    >
                      <i className="pi pi-plus"></i>
                      {t('modelDetail.addToWorkflow')}
                    </button>
                    <button 
                      className="action-button"
                      onClick={() => copyToClipboard(model.filePath, 'workflow-path')}
                    >
                      <i className="pi pi-copy"></i>
                      {t('modelDetail.copyForWorkflow')}
                    </button>
                  </div>
                </div>

                <div className="info-section">
                  <h3>{t('modelDetail.usageInstructions')}</h3>
                  <div className="usage-instructions">
                    <div className="instruction-item">
                      <h4>{t('modelDetail.dragAndDrop')}</h4>
                      <p>{t('modelDetail.dragAndDropDescription')}</p>
                    </div>
                    <div className="instruction-item">
                      <h4>{t('modelDetail.manualLoad')}</h4>
                      <p>{t('modelDetail.manualLoadDescription')}</p>
                      <code className="file-path-code">{model.filePath}</code>
                    </div>
                  </div>
                </div>

                <div className="info-section">
                  <h3>{t('modelDetail.compatibleNodes')}</h3>
                  <div className="compatible-nodes">
                    {getCompatibleNodes(model.modelType).map((node, index) => (
                      <div key={index} className="node-item">
                        <i className="pi pi-circle"></i>
                        <span>{node}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get compatible nodes for each model type
const getCompatibleNodes = (modelType: ModelType): string[] => {
  switch (modelType) {
    case ModelType.CHECKPOINT:
      return ['Load Checkpoint', 'CheckpointLoaderSimple', 'CheckpointLoader'];
    case ModelType.LORA:
      return ['Load LoRA', 'LoraLoader', 'LoraLoaderModelOnly'];
    case ModelType.VAE:
      return ['Load VAE', 'VAELoader', 'VAEDecode', 'VAEEncode'];
    case ModelType.EMBEDDING:
      return ['Load Embedding', 'CLIPTextEncode'];
    case ModelType.CONTROLNET:
      return ['Load ControlNet Model', 'ControlNetLoader', 'Apply ControlNet'];
    case ModelType.UPSCALER:
      return ['Load Upscale Model', 'UpscaleModelLoader', 'ImageUpscaleWithModel'];
    default:
      return [];
  }
};

export default ModelDetailModal;