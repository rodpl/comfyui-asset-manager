import React from 'react';
import { OutputGalleryProps } from '../types';
import OutputCard from './OutputCard';
import '../OutputsTab.css';

const OutputGallery: React.FC<OutputGalleryProps> = ({
  outputs,
  viewMode,
  onOutputSelect,
  onContextMenu
}) => {
  if (outputs.length === 0) {
    return (
      <div className="outputs-empty-state">
        <div className="empty-state-icon">
          <i className="pi pi-images" style={{ fontSize: '3rem', opacity: 0.5 }}></i>
        </div>
        <h4>No Outputs Found</h4>
        <p>No generated images were found in your output directory.</p>
        <p>Generate some images with ComfyUI to see them here!</p>
      </div>
    );
  }

  const containerClass = viewMode === 'grid' ? 'outputs-grid' : 'outputs-list';

  return (
    <div className={`outputs-gallery ${containerClass}`} role="grid" aria-label="Output gallery">
      {outputs.map((output) => (
        <OutputCard
          key={output.id}
          output={output}
          viewMode={viewMode}
          onClick={() => onOutputSelect(output)}
          onContextMenu={(event) => onContextMenu(output, event)}
        />
      ))}
    </div>
  );
};

export default OutputGallery;