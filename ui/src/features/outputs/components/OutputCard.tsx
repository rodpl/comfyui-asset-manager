import React, { useState } from 'react';
import { formatFileSize, formatDate } from '../utils/outputUtils';
import '../OutputsTab.css';
import { Output, ViewMode } from '../types';

export interface OutputCardProps {
  output: Output;
  viewMode: ViewMode;
  onClick: () => void;
  onContextMenu: (event: React.MouseEvent) => void;
}

const OutputCard = ({ output, viewMode, onClick, onContextMenu }: OutputCardProps) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  const [imageError, setImageError] = useState(false);

  if (viewMode === 'list') {
    return (
      <div
        className="output-list-item"
        onClick={onClick}
        onContextMenu={onContextMenu}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="gridcell"
        aria-label={`Output ${output.filename}`}
      >
        <div className="output-list-thumbnail">
          {output.thumbnailPath && !imageError ? (
            <img
              src={output.thumbnailPath}
              alt={output.filename}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
              onLoad={() => { /* keep node stable */ }}
              onError={() => setImageError(true)}
            />
          ) : (
            <i className="pi pi-image" style={{ fontSize: '1.2rem' }}></i>
          )}
        </div>
        <div className="output-list-details">
          <div className="output-list-filename" title={output.filename}>
            {output.filename}
          </div>
          <div className="output-list-meta">
            {formatDate(output.createdAt)} • {output.imageWidth}×{output.imageHeight} •{' '}
            {formatFileSize(output.fileSize)}
          </div>
        </div>
        <div className="output-list-actions">
          <button
            className="output-action-button"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement quick actions
            }}
            aria-label="More actions"
            title="More actions"
          >
            <i className="pi pi-ellipsis-v"></i>
          </button>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      className="output-card"
      onClick={onClick}
      onContextMenu={onContextMenu}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="gridcell"
      aria-label={`Output ${output.filename}`}
    >
      <div className="output-card-image">
        {output.thumbnailPath && !imageError ? (
          <img
            src={output.thumbnailPath}
            alt={output.filename}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onLoad={() => { /* keep node stable */ }}
            onError={() => setImageError(true)}
          />
        ) : (
          <i className="pi pi-image" style={{ fontSize: '2rem', opacity: 0.5 }}></i>
        )}
        <div className="output-card-overlay">
          <button
            className="output-action-button"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement quick view action
            }}
            aria-label="Quick view"
            title="Quick view"
          >
            <i className="pi pi-eye"></i>
          </button>
          <button
            className="output-action-button"
            onClick={(e) => {
              e.stopPropagation();
              onContextMenu(e);
            }}
            aria-label="More actions"
            title="More actions"
          >
            <i className="pi pi-ellipsis-v"></i>
          </button>
        </div>
      </div>
      <div className="output-card-info">
        <div className="output-card-filename" title={output.filename}>
          {output.filename}
        </div>
        <div className="output-card-meta">
          <span className="output-card-date">{formatDate(output.createdAt)}</span>
          <span className="output-card-size">{formatFileSize(output.fileSize)}</span>
        </div>
        <div className="output-card-dimensions">
          {output.imageWidth}×{output.imageHeight}
        </div>
      </div>
    </div>
  );
};

export default OutputCard;
