import React, { useState, useCallback, useEffect } from 'react';
import { ExternalModel, ComfyUIModelType, CivitAIMetadata, HuggingFaceMetadata } from '../types';
import { MODEL_TYPE_DISPLAY_NAMES, MODEL_TYPE_COLORS } from '../constants';
import './ModelDetailModal.css';

export interface ModelDetailModalProps {
  model: ExternalModel;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

type TabType = 'details' | 'images' | 'compatibility' | 'files';

const ModelDetailModal: React.FC<ModelDetailModalProps> = ({
  model,
  isOpen,
  onClose,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({});
  const [imageError, setImageError] = useState<Record<number, boolean>>({});

  // Reset state when modal opens/closes or model changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab('details');
      setSelectedImageIndex(0);
      setImageLoading({});
      setImageError({});
      setCopySuccess(null);
    }
  }, [isOpen, model.id]);

  const formatFileSize = useCallback((bytes?: number): string => {
    if (!bytes) return 'Unknown size';

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }, []);

  const formatDownloadCount = useCallback((count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }, []);

  const getModelTypeIcon = useCallback((modelType?: ComfyUIModelType): string => {
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
  }, []);

  const getPlatformIcon = useCallback((platform: string): string => {
    const platformIcons = {
      civitai: 'pi pi-globe',
      huggingface: 'pi pi-github',
    };
    return platformIcons[platform as keyof typeof platformIcons] || 'pi pi-cloud';
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

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  const handleImageLoad = useCallback((index: number) => {
    setImageLoading((prev) => ({ ...prev, [index]: false }));
    setImageError((prev) => ({ ...prev, [index]: false }));
  }, []);

  const handleImageError = useCallback((index: number) => {
    setImageLoading((prev) => ({ ...prev, [index]: false }));
    setImageError((prev) => ({ ...prev, [index]: true }));
  }, []);

  const handleImageSelect = useCallback((index: number) => {
    setSelectedImageIndex(index);
    setImageLoading((prev) => ({ ...prev, [index]: true }));
  }, []);

  // Get platform-specific metadata
  const civitaiMetadata = model.metadata as CivitAIMetadata;
  const huggingfaceMetadata = model.metadata as HuggingFaceMetadata;

  // Get images for gallery
  const getModelImages = useCallback((): string[] => {
    const images: string[] = [];

    // Add thumbnail if available
    if (model.thumbnailUrl) {
      images.push(model.thumbnailUrl);
    }

    // Add platform-specific images
    if (model.platform === 'civitai' && civitaiMetadata?.versions) {
      civitaiMetadata.versions.forEach((version) => {
        version.files.forEach(() => {
          // CivitAI typically has preview images associated with files
          // This would need to be implemented based on actual API structure
        });
      });
    }

    return images;
  }, [model, civitaiMetadata]);

  const modelImages = getModelImages();

  if (!isOpen) return null;

  const modalClasses = ['external-model-detail-modal-backdrop', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={modalClasses}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="external-modal-title"
      tabIndex={-1}
    >
      <div className="external-model-detail-modal-content">
        <div className="external-model-detail-modal-header">
          <div className="external-modal-title-section">
            <i className={`${getModelTypeIcon(model.modelType)} external-model-type-icon`}></i>
            <h2 id="external-modal-title" className="external-modal-title">
              {model.name}
            </h2>
            <div className="external-model-badges">
              {model.modelType && (
                <span
                  className="external-model-type-badge"
                  style={{ backgroundColor: MODEL_TYPE_COLORS[model.modelType] }}
                >
                  {MODEL_TYPE_DISPLAY_NAMES[model.modelType]}
                </span>
              )}
              <span className="external-platform-badge">
                <i className={getPlatformIcon(model.platform)} />
                {model.platform}
              </span>
            </div>
          </div>
          <button
            className="external-modal-close-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            <i className="pi pi-times"></i>
          </button>
        </div>

        <div className="external-model-detail-modal-body">
          <div className="external-modal-tabs">
            <button
              className={`external-tab-button ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              <i className="pi pi-info-circle"></i>
              Details
            </button>
            {modelImages.length > 0 && (
              <button
                className={`external-tab-button ${activeTab === 'images' ? 'active' : ''}`}
                onClick={() => setActiveTab('images')}
              >
                <i className="pi pi-images"></i>
                Images ({modelImages.length})
              </button>
            )}
            <button
              className={`external-tab-button ${activeTab === 'compatibility' ? 'active' : ''}`}
              onClick={() => setActiveTab('compatibility')}
            >
              <i className="pi pi-check-circle"></i>
              ComfyUI
            </button>
            {((model.platform === 'civitai' &&
              civitaiMetadata?.versions &&
              civitaiMetadata.versions.length > 0) ||
              (model.platform === 'huggingface' &&
                huggingfaceMetadata?.siblings &&
                huggingfaceMetadata.siblings.length > 0)) && (
              <button
                className={`external-tab-button ${activeTab === 'files' ? 'active' : ''}`}
                onClick={() => setActiveTab('files')}
              >
                <i className="pi pi-file"></i>
                Files
              </button>
            )}
          </div>

          <div className="external-tab-content">
            {activeTab === 'details' && (
              <div className="external-details-tab">
                <div className="external-model-preview">
                  {model.thumbnailUrl ? (
                    <img
                      src={model.thumbnailUrl}
                      alt={`${model.name} preview`}
                      className="external-model-preview-image"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div
                    className={`external-model-preview-placeholder ${model.thumbnailUrl ? 'hidden' : ''}`}
                  >
                    <i className={`${getModelTypeIcon(model.modelType)} external-preview-icon`}></i>
                  </div>
                </div>

                <div className="external-model-info">
                  <div className="external-info-section">
                    <h3>Basic Information</h3>
                    <div className="external-info-grid">
                      <div className="external-info-item">
                        <label>Model Name:</label>
                        <div className="external-info-value">
                          <span>{model.name}</span>
                          <button
                            className={`external-copy-button ${copySuccess === 'name' ? 'success' : ''}`}
                            onClick={() => copyToClipboard(model.name, 'name')}
                            title="Copy model name"
                          >
                            <i
                              className={copySuccess === 'name' ? 'pi pi-check' : 'pi pi-copy'}
                            ></i>
                          </button>
                        </div>
                      </div>

                      <div className="external-info-item">
                        <label>Author:</label>
                        <span>{model.author}</span>
                      </div>

                      <div className="external-info-item">
                        <label>Platform:</label>
                        <div className="external-platform-info">
                          <i className={getPlatformIcon(model.platform)} />
                          <span>{model.platform}</span>
                        </div>
                      </div>

                      <div className="external-info-item">
                        <label>Downloads:</label>
                        <span>{formatDownloadCount(model.downloadCount)}</span>
                      </div>

                      {model.rating && (
                        <div className="external-info-item">
                          <label>Rating:</label>
                          <div className="external-rating">
                            <span>{model.rating.toFixed(1)}</span>
                            <div className="external-stars">
                              {Array.from({ length: 5 }, (_, i) => (
                                <i
                                  key={i}
                                  className={`pi pi-star${i < Math.floor(model.rating!) ? '-fill' : ''}`}
                                ></i>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {model.fileSize && (
                        <div className="external-info-item">
                          <label>File Size:</label>
                          <span>{formatFileSize(model.fileSize)}</span>
                        </div>
                      )}

                      {model.fileFormat && (
                        <div className="external-info-item">
                          <label>Format:</label>
                          <span className="external-format-badge">
                            {model.fileFormat.toUpperCase()}
                          </span>
                        </div>
                      )}

                      {model.baseModel && (
                        <div className="external-info-item">
                          <label>Base Model:</label>
                          <span>{model.baseModel}</span>
                        </div>
                      )}

                      <div className="external-info-item">
                        <label>Created:</label>
                        <span>{new Date(model.createdAt).toLocaleDateString()}</span>
                      </div>

                      <div className="external-info-item">
                        <label>Updated:</label>
                        <span>{new Date(model.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {model.description && (
                    <div className="external-info-section">
                      <h3>Description</h3>
                      <div className="external-description">
                        <p>{model.description}</p>
                      </div>
                    </div>
                  )}

                  {model.tags.length > 0 && (
                    <div className="external-info-section">
                      <h3>Tags</h3>
                      <div className="external-tags">
                        {model.tags.map((tag, index) => (
                          <span key={index} className="external-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Platform-specific metadata */}
                  {model.platform === 'civitai' && civitaiMetadata && (
                    <div className="external-info-section">
                      <h3>
                        <i className="pi pi-globe"></i>
                        CivitAI Information
                      </h3>
                      <div className="external-platform-metadata">
                        <div className="external-metadata-stats">
                          <div className="external-stat">
                            <i className="pi pi-heart"></i>
                            <span>
                              {civitaiMetadata.favoriteCount?.toLocaleString() || 0} favorites
                            </span>
                          </div>
                          <div className="external-stat">
                            <i className="pi pi-comment"></i>
                            <span>
                              {civitaiMetadata.commentCount?.toLocaleString() || 0} comments
                            </span>
                          </div>
                          {civitaiMetadata.allowCommercialUse && (
                            <div className="external-stat">
                              <i className="pi pi-briefcase"></i>
                              <span>Commercial use: {civitaiMetadata.allowCommercialUse}</span>
                            </div>
                          )}
                        </div>
                        {civitaiMetadata.nsfw && (
                          <div className="external-nsfw-warning">
                            <i className="pi pi-exclamation-triangle"></i>
                            <span>NSFW Content</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {model.platform === 'huggingface' && huggingfaceMetadata && (
                    <div className="external-info-section">
                      <h3>
                        <i className="pi pi-github"></i>
                        HuggingFace Information
                      </h3>
                      <div className="external-platform-metadata">
                        <div className="external-metadata-stats">
                          {huggingfaceMetadata.library && (
                            <div className="external-stat">
                              <i className="pi pi-code"></i>
                              <span>Library: {huggingfaceMetadata.library}</span>
                            </div>
                          )}
                          {huggingfaceMetadata.pipelineTag && (
                            <div className="external-stat">
                              <i className="pi pi-sitemap"></i>
                              <span>Pipeline: {huggingfaceMetadata.pipelineTag}</span>
                            </div>
                          )}
                          {huggingfaceMetadata.license && (
                            <div className="external-stat">
                              <i className="pi pi-file-text"></i>
                              <span>License: {huggingfaceMetadata.license}</span>
                            </div>
                          )}
                        </div>
                        {huggingfaceMetadata.diffusionType && (
                          <div className="external-diffusion-info">
                            <i className="pi pi-image"></i>
                            <span>Diffusion Type: {huggingfaceMetadata.diffusionType}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'images' && modelImages.length > 0 && (
              <div className="external-images-tab">
                <div className="external-image-gallery">
                  <div className="external-main-image">
                    {imageLoading[selectedImageIndex] && (
                      <div className="external-image-loading">
                        <i className="pi pi-spin pi-spinner"></i>
                      </div>
                    )}
                    <img
                      src={modelImages[selectedImageIndex]}
                      alt={`${model.name} preview ${selectedImageIndex + 1}`}
                      className="external-gallery-main-image"
                      onLoad={() => handleImageLoad(selectedImageIndex)}
                      onError={() => handleImageError(selectedImageIndex)}
                      style={{
                        display: imageLoading[selectedImageIndex] ? 'none' : 'block',
                      }}
                    />
                    {imageError[selectedImageIndex] && (
                      <div className="external-image-error">
                        <i className="pi pi-exclamation-triangle"></i>
                        <span>Failed to load image</span>
                      </div>
                    )}
                  </div>

                  {modelImages.length > 1 && (
                    <div className="external-image-thumbnails">
                      {modelImages.map((image, index) => (
                        <button
                          key={index}
                          className={`external-thumbnail-button ${index === selectedImageIndex ? 'active' : ''}`}
                          onClick={() => handleImageSelect(index)}
                        >
                          <img
                            src={image}
                            alt={`${model.name} thumbnail ${index + 1}`}
                            className="external-thumbnail-image"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'compatibility' && (
              <div className="external-compatibility-tab">
                <div className="external-info-section">
                  <h3>ComfyUI Compatibility</h3>
                  <div className="external-compatibility-status">
                    <div
                      className={`external-compatibility-indicator ${model.comfyuiCompatibility.isCompatible ? 'compatible' : 'incompatible'}`}
                    >
                      <i
                        className={
                          model.comfyuiCompatibility.isCompatible
                            ? 'pi pi-check-circle'
                            : 'pi pi-exclamation-triangle'
                        }
                      ></i>
                      <span>
                        {model.comfyuiCompatibility.isCompatible ? 'Compatible' : 'Incompatible'}{' '}
                        with ComfyUI
                      </span>
                    </div>

                    {model.comfyuiCompatibility.compatibilityNotes && (
                      <div className="external-compatibility-notes">
                        <p>{model.comfyuiCompatibility.compatibilityNotes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {model.comfyuiCompatibility.isCompatible && (
                  <>
                    <div className="external-info-section">
                      <h3>Model Folder</h3>
                      <div className="external-model-folder-info">
                        {model.comfyuiCompatibility.modelFolder ? (
                          <div className="external-folder-path">
                            <i className="pi pi-folder"></i>
                            <span>ComfyUI/models/{model.comfyuiCompatibility.modelFolder}/</span>
                            <button
                              className={`external-copy-button ${copySuccess === 'folder' ? 'success' : ''}`}
                              onClick={() =>
                                copyToClipboard(
                                  `ComfyUI/models/${model.comfyuiCompatibility.modelFolder}/`,
                                  'folder'
                                )
                              }
                              title="Copy folder path"
                            >
                              <i
                                className={copySuccess === 'folder' ? 'pi pi-check' : 'pi pi-copy'}
                              ></i>
                            </button>
                          </div>
                        ) : (
                          <div className="external-folder-unknown">
                            <i className="pi pi-question-circle"></i>
                            <span>Model folder not determined</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {model.comfyuiCompatibility.requiredNodes.length > 0 && (
                      <div className="external-info-section">
                        <h3>Required Nodes</h3>
                        <div className="external-required-nodes">
                          {model.comfyuiCompatibility.requiredNodes.map((node, index) => (
                            <div key={index} className="external-node-item">
                              <i className="pi pi-circle"></i>
                              <span>{node}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="external-info-section">
                      <h3>Download Requirements</h3>
                      <div className="external-download-requirements">
                        <div className="external-requirement-item">
                          <label>Estimated Download Size:</label>
                          <span>{formatFileSize(model.fileSize)}</span>
                        </div>
                        <div className="external-requirement-item">
                          <label>Recommended Format:</label>
                          <span>{model.fileFormat || 'safetensors'}</span>
                        </div>
                        {model.baseModel && (
                          <div className="external-requirement-item">
                            <label>Base Model Compatibility:</label>
                            <span>{model.baseModel}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'files' && (
              <div className="external-files-tab">
                <div className="external-info-section">
                  <h3>Available Files</h3>
                  <div className="external-files-list">
                    {model.platform === 'civitai' && civitaiMetadata?.versions && (
                      <>
                        {civitaiMetadata.versions.map((version, versionIndex) => (
                          <div key={versionIndex} className="external-version-section">
                            <h4 className="external-version-title">Version: {version.name}</h4>
                            <div className="external-version-files">
                              {version.files.map((file, fileIndex) => (
                                <div key={fileIndex} className="external-file-item">
                                  <div className="external-file-info">
                                    <div className="external-file-name">
                                      <i className="pi pi-file"></i>
                                      <span>{file.name}</span>
                                    </div>
                                    <div className="external-file-details">
                                      <span className="external-file-size">
                                        {formatFileSize(file.sizeKB * 1024)}
                                      </span>
                                      <span className="external-file-format">
                                        {file.format.toUpperCase()}
                                      </span>
                                      <span className="external-file-type">{file.type}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {model.platform === 'huggingface' && huggingfaceMetadata?.siblings && (
                      <div className="external-hf-files">
                        {huggingfaceMetadata.siblings.map((sibling, index) => (
                          <div key={index} className="external-file-item">
                            <div className="external-file-info">
                              <div className="external-file-name">
                                <i className="pi pi-file"></i>
                                <span>{sibling.rfilename}</span>
                              </div>
                              <div className="external-file-details">
                                {sibling.size && (
                                  <span className="external-file-size">
                                    {formatFileSize(sibling.size)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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

export default ModelDetailModal;
