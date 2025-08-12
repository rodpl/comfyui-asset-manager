import React, { useEffect, useCallback, useState, useRef } from 'react';
import { formatFileSize, formatDate } from '../utils/outputUtils';
import '../OutputsTab.css';
import { Output } from '../types';

export interface OutputModalProps {
  output: Output | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string, output: Output) => void;
  outputs?: Output[]; // All outputs for navigation
  onNavigate?: (output: Output) => void; // Navigate to different output
}

const OutputModal = ({ output, isOpen, onClose, onAction, outputs = [], onNavigate }: OutputModalProps) => {
  // Image zoom and pan state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset zoom and pan when output changes
  useEffect(() => {
    if (output) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [output, output.id]);

  // Find current output index for navigation
  const currentIndex = output ? outputs.findIndex(o => o.id === output.id) : -1;
  const canNavigatePrev = currentIndex > 0;
  const canNavigateNext = currentIndex < outputs.length - 1;

  const navigateToPrevious = useCallback(() => {
    if (canNavigatePrev && onNavigate) {
      onNavigate(outputs[currentIndex - 1]);
    }
  }, [canNavigatePrev, onNavigate, outputs, currentIndex]);

  const navigateToNext = useCallback(() => {
    if (canNavigateNext && onNavigate) {
      onNavigate(outputs[currentIndex + 1]);
    }
  }, [canNavigateNext, onNavigate, outputs, currentIndex]);

  // Zoom and pan handlers
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev * 1.2, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev / 1.2, 0.1));
  }, []);

  const handleZoomReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        navigateToPrevious();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        navigateToNext();
      } else if (event.key === '=' || event.key === '+') {
        event.preventDefault();
        handleZoomIn();
      } else if (event.key === '-') {
        event.preventDefault();
        handleZoomOut();
      } else if (event.key === '0') {
        event.preventDefault();
        handleZoomReset();
      }
    },
    [onClose, navigateToPrevious, navigateToNext, handleZoomIn, handleZoomOut, handleZoomReset]
  );

  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const delta = event.deltaY > 0 ? 0.9 : 1.1;
      setScale(prev => Math.min(Math.max(prev * delta, 0.1), 5));
    }
  }, []);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (scale > 1) {
      event.preventDefault();
      setIsDragging(true);
      setDragStart({ x: event.clientX, y: event.clientY });
      setLastPanPosition(position);
    }
  }, [scale, position]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      const deltaX = event.clientX - dragStart.x;
      const deltaY = event.clientY - dragStart.y;
      setPosition({
        x: lastPanPosition.x + deltaX,
        y: lastPanPosition.y + deltaY
      });
    }
  }, [isDragging, scale, dragStart, lastPanPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

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
          <div 
            className="output-modal-image-container"
            ref={containerRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          >
            {/* Navigation arrows */}
            {canNavigatePrev && (
              <button
                className="output-modal-nav-button output-modal-nav-prev"
                onClick={navigateToPrevious}
                aria-label="Previous image"
                title="Previous image (←)"
              >
                <i className="pi pi-chevron-left"></i>
              </button>
            )}
            {canNavigateNext && (
              <button
                className="output-modal-nav-button output-modal-nav-next"
                onClick={navigateToNext}
                aria-label="Next image"
                title="Next image (→)"
              >
                <i className="pi pi-chevron-right"></i>
              </button>
            )}

            {/* Zoom controls */}
            <div className="output-modal-zoom-controls">
              <button
                className="zoom-control-button"
                onClick={handleZoomOut}
                disabled={scale <= 0.11} // Use slightly higher threshold to account for floating point precision
                aria-label="Zoom out"
                title="Zoom out (-)"
              >
                <i className="pi pi-minus"></i>
              </button>
              <span className="zoom-level">{Math.round(scale * 100)}%</span>
              <button
                className="zoom-control-button"
                onClick={handleZoomIn}
                disabled={scale >= 4.99} // Use slightly lower threshold to account for floating point precision
                aria-label="Zoom in"
                title="Zoom in (+)"
              >
                <i className="pi pi-plus"></i>
              </button>
              <button
                className="zoom-control-button"
                onClick={handleZoomReset}
                aria-label="Reset zoom"
                title="Reset zoom (0)"
              >
                <i className="pi pi-refresh"></i>
              </button>
            </div>

            <img
              ref={imageRef}
              src={output.filePath}
              alt={output.filename}
              className="output-modal-image"
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
              }}
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
              onDragStart={(e) => e.preventDefault()} // Prevent default image drag
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
