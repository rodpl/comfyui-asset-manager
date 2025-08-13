import React, { useLayoutEffect, useCallback, useState, useRef } from 'react';
import { lockBodyScroll, unlockBodyScroll } from '../../../utils/bodyScrollLock';
import { formatFileSize, formatDate } from '../utils/outputUtils';
import { apiClient } from '../../../services/api';
import ConfirmationDialog from './ConfirmationDialog';
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

const OutputModal = ({
  output,
  isOpen,
  onClose,
  onAction,
  outputs = [],
  onNavigate,
}: OutputModalProps) => {
  // Image zoom and pan state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Manage body overflow using layout effect for immediate synchronization
  useLayoutEffect(() => {
    if (isOpen && !!output) {
      lockBodyScroll();
    } else {
      unlockBodyScroll();
    }
    return () => {
      unlockBodyScroll();
    };
  }, [isOpen, output]);
  
  // Workflow loading state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(false);
  const [workflowFeedback, setWorkflowFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Reset zoom and pan when output changes
  useLayoutEffect(() => {
    if (output) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
      setWorkflowFeedback(null);
      setShowConfirmDialog(false);
      setIsLoadingWorkflow(false);
    }
  }, [output]);

  // Find current output index for navigation
  const currentIndex = output ? outputs.findIndex((o) => o.id === output.id) : -1;
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
    setScale((prev) => Math.min(prev * 1.2, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev / 1.2, 0.1));
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
      setScale((prev) => Math.min(Math.max(prev * delta, 0.1), 5));
    }
  }, []);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (scale > 1) {
        event.preventDefault();
        setIsDragging(true);
        setDragStart({ x: event.clientX, y: event.clientY });
        setLastPanPosition(position);
      }
    },
    [scale, position]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (isDragging && scale > 1) {
        const deltaX = event.clientX - dragStart.x;
        const deltaY = event.clientY - dragStart.y;
        setPosition({
          x: lastPanPosition.x + deltaX,
          y: lastPanPosition.y + deltaY,
        });
      }
    },
    [isDragging, scale, dragStart, lastPanPosition]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useLayoutEffect(() => {
    // Attach keydown handler while mounted
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Note: Do not early return before hooks; render null conditionally at the end

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

  const handleLoadWorkflow = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmLoadWorkflow = async () => {
    if (!output) return;

    setShowConfirmDialog(false);
    setIsLoadingWorkflow(true);
    setWorkflowFeedback(null);

    try {
      const response = await apiClient.loadWorkflow(output.id);
      
      if (response.success) {
        setWorkflowFeedback({
          type: 'success',
          message: response.message || 'Workflow loaded successfully into ComfyUI'
        });
        
        // Also call the parent action handler for any additional handling
        onAction('load-workflow', output);
      } else {
        throw new Error(response.message || 'Failed to load workflow');
      }
    } catch (error) {
      console.error('Failed to load workflow:', error);
      setWorkflowFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to load workflow. Please try again.'
      });
    } finally {
      setIsLoadingWorkflow(false);
    }
  };

  const handleCancelLoadWorkflow = () => {
    setShowConfirmDialog(false);
  };

  // Clear feedback after 5 seconds
  useLayoutEffect(() => {
    if (workflowFeedback) {
      const timer = setTimeout(() => {
        setWorkflowFeedback(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [workflowFeedback]);

  return (!isOpen || !output) ? null : (
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
            style={{
              cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            }}
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
                transform: `scale(${scale}) translate(${position.x / scale}px, ${
                  position.y / scale
                }px)`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
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
                  {(() => {
                    const wm: any = output.workflowMetadata as any;
                    const rawPrompt = wm?.prompt;
                    const positivePrompt = wm?.positive_prompt;
                    // Prefer explicit positive_prompt if available
                    let promptText: string | undefined;
                    if (typeof positivePrompt === 'string') {
                      promptText = positivePrompt;
                    } else if (typeof rawPrompt === 'string') {
                      promptText = rawPrompt;
                    } else if (rawPrompt && typeof rawPrompt === 'object') {
                      // Fallback: stringify minimal summary to avoid React rendering objects
                      try {
                        const json = JSON.stringify(rawPrompt);
                        promptText = json.length > 1000 ? json.slice(0, 1000) + '…' : json;
                      } catch {
                        promptText = undefined;
                      }
                    }
                    return promptText ? (
                      <div className="detail-row">
                        <span className="detail-label">Prompt:</span>
                        <span className="detail-value workflow-prompt">{promptText}</span>
                      </div>
                    ) : null;
                  })()}
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
                  {(output.workflowMetadata as any).cfg !== undefined ||
                  (output.workflowMetadata as any).cfg_scale !== undefined ? (
                    <div className="detail-row">
                      <span className="detail-label">CFG Scale:</span>
                      <span className="detail-value">
                        {
                          (output.workflowMetadata as any).cfg ?? (output.workflowMetadata as any).cfg_scale
                        }
                      </span>
                    </div>
                  ) : null}
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
                {output.workflowMetadata && output.workflowMetadata.workflow && (
                  <div>
                    <button
                      className={`action-button primary workflow-loading-button ${
                        isLoadingWorkflow ? 'loading' : ''
                      }`}
                      onClick={handleLoadWorkflow}
                      disabled={isLoadingWorkflow}
                      title="Load workflow back into ComfyUI"
                    >
                      <i className={`pi ${isLoadingWorkflow ? 'pi-spin pi-spinner' : 'pi-play'}`}></i>
                      {isLoadingWorkflow ? 'Loading...' : 'Load Workflow'}
                    </button>
                    {workflowFeedback && (
                      <div className={`workflow-action-feedback ${workflowFeedback.type}`}>
                        <i className={`pi ${workflowFeedback.type === 'success' ? 'pi-check' : 'pi-exclamation-triangle'}`}></i>
                        {workflowFeedback.message}
                      </div>
                    )}
                  </div>
                )}
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

      {/* Workflow Loading Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        title="Load Workflow"
        message={`Are you sure you want to load the workflow from "${output?.filename}" into ComfyUI? This will replace your current workflow.`}
        confirmText="Load Workflow"
        cancelText="Cancel"
        onConfirm={handleConfirmLoadWorkflow}
        onCancel={handleCancelLoadWorkflow}
        type="warning"
      />
    </div>
  );
};

export default OutputModal;
