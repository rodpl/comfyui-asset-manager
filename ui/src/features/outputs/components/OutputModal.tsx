import React, { useEffect, useCallback } from 'react';
import { formatFileSize, formatDate } from '../mockData';
import '../OutputsTab.css';
import { Output } from '../types';

export interface OutputModalProps {
  output: Output | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string, output: Output) => void;
}

const OutputModal = ({ output, isOpen, onClose, onAction }: OutputModalProps) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !output) {
    return null;
  }

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleCopyPath = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(output.filePath);
      onAction('copy-path', output);
    }
  };

  const handleOpenSystem = () => {
    onAction('open-system', output);
  };

  const handleShowFolder = () => {
    onAction('show-folder', output);
  };

  return (
    <div
      className="output-modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="output-modal-title"
    >
      <div className="output-modal-container">
        <div className="output-modal-header">
          <h3 id="output-modal-title" className="output-modal-title">
            {output.filename}
          </h3>
          <button className="output-modal-close" onClick={onClose} aria-label="Close modal">
            <i className="pi pi-times"></i>
          </button>
        </div>

        <div className="output-modal-content">
          <div className="output-modal-image-container">
            <img
              src={output.filePath}
              alt={output.filename}
              className="output-modal-image"
              onError={(e) => {
                // Fallback if full image fails to load
                const target = e.target as HTMLImageElement;
                target.src = output.thumbnailPath || '';
                if (!output.thumbnailPath) {
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = `
                    <div class="output-modal-image-error">
                      <i class="pi pi-exclamation-triangle" style="font-size: 3rem; opacity: 0.5;"></i>
                      <p>Failed to load image</p>
                    </div>
                  `;
                }
              }}
            />
          </div>

          <div className="output-modal-sidebar">
            <div className="output-modal-section">
              <h4>Image Details</h4>
              <div className="output-modal-details">
                <div className="detail-row">
                  <span className="detail-label">Dimensions:</span>
                  <span className="detail-value">
                    {output.imageWidth} × {output.imageHeight}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">File Size:</span>
                  <span className="detail-value">{formatFileSize(output.fileSize)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Format:</span>
                  <span className="detail-value">{output.fileFormat.toUpperCase()}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Created:</span>
                  <span className="detail-value">{formatDate(output.createdAt)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Modified:</span>
                  <span className="detail-value">{formatDate(output.modifiedAt)}</span>
                </div>
              </div>
            </div>

            {output.workflowMetadata && (
              <div className="output-modal-section">
                <h4>Workflow Metadata</h4>
                <div className="output-modal-details">
                  {output.workflowMetadata.prompt && (
                    <div className="detail-row">
                      <span className="detail-label">Prompt:</span>
                      <span className="detail-value workflow-prompt">
                        {output.workflowMetadata.prompt}
                      </span>
                    </div>
                  )}
                  {output.workflowMetadata.model && (
                    <div className="detail-row">
                      <span className="detail-label">Model:</span>
                      <span className="detail-value">{output.workflowMetadata.model}</span>
                    </div>
                  )}
                  {output.workflowMetadata.steps && (
                    <div className="detail-row">
                      <span className="detail-label">Steps:</span>
                      <span className="detail-value">{output.workflowMetadata.steps}</span>
                    </div>
                  )}
                  {output.workflowMetadata.cfg && (
                    <div className="detail-row">
                      <span className="detail-label">CFG Scale:</span>
                      <span className="detail-value">{output.workflowMetadata.cfg}</span>
                    </div>
                  )}
                  {output.workflowMetadata.sampler && (
                    <div className="detail-row">
                      <span className="detail-label">Sampler:</span>
                      <span className="detail-value">{output.workflowMetadata.sampler}</span>
                    </div>
                  )}
                  {output.workflowMetadata.seed && (
                    <div className="detail-row">
                      <span className="detail-label">Seed:</span>
                      <span className="detail-value">{output.workflowMetadata.seed}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="output-modal-section">
              <h4>Actions</h4>
              <div className="output-modal-actions">
                <button
                  className="action-button primary"
                  onClick={handleOpenSystem}
                  title="Open in system image viewer"
                >
                  <i className="pi pi-external-link"></i>
                  Open in System Viewer
                </button>
                <button
                  className="action-button"
                  onClick={handleCopyPath}
                  title="Copy file path to clipboard"
                >
                  <i className="pi pi-copy"></i>
                  Copy File Path
                </button>
                <button
                  className="action-button"
                  onClick={handleShowFolder}
                  title="Show file in folder"
                >
                  <i className="pi pi-folder-open"></i>
                  Show in Folder
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutputModal;
