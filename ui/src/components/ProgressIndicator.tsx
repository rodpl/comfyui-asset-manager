/**
 * Progress Indicator Component
 * Provides progress indicators for loading states using ComfyUI theme
 */

import React from 'react';

interface ProgressIndicatorProps {
  progress?: number; // 0-100, undefined for indeterminate
  variant?: 'primary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  showPercentage?: boolean;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  variant = 'primary',
  size = 'medium',
  showPercentage = false,
  className = '',
}) => {
  const isIndeterminate = progress === undefined;
  const progressValue = Math.max(0, Math.min(100, progress || 0));

  const getProgressBarClass = () => {
    let classes = 'asset-manager-progress-bar';
    if (isIndeterminate) {
      classes += ' asset-manager-progress-bar--indeterminate';
    }
    if (variant !== 'primary') {
      classes += ` asset-manager-progress--${variant} asset-manager-progress-bar`;
    }
    return classes;
  };

  const getContainerClass = () => {
    let classes = 'asset-manager-progress-indicator';
    if (size !== 'medium') {
      classes += ` asset-manager-progress-indicator--${size}`;
    }
    return classes;
  };

  return (
    <div className={`${getContainerClass()} ${className}`}>
      <div className="asset-manager-progress">
        <div
          className={getProgressBarClass()}
          style={!isIndeterminate ? { width: `${progressValue}%` } : undefined}
          role="progressbar"
          aria-valuenow={!isIndeterminate ? progressValue : undefined}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={isIndeterminate ? 'Loading...' : `${progressValue}% complete`}
        />
      </div>
      {showPercentage && !isIndeterminate && (
        <div className="asset-manager-progress-text">
          {Math.round(progressValue)}%
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;