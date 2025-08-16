/**
 * Loading Spinner Component
 * Provides consistent loading indicators across the application
 */

import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'white' | 'success' | 'warning' | 'error';
  text?: string;
  overlay?: boolean;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  text,
  overlay = false,
  className = '',
}) => {
  const spinnerClass = `loading-spinner ${size} ${color} ${className}`;
  const containerClass = `loading-container ${overlay ? 'overlay' : ''}`;

  const spinner = (
    <div className={spinnerClass}>
      <div className="spinner-circle"></div>
      {text && <div className="spinner-text">{text}</div>}
    </div>
  );

  if (overlay) {
    return <div className={containerClass}>{spinner}</div>;
  }

  return spinner;
};

// Skeleton loader for content placeholders
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  className = '',
}) => {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
  };

  return <div className={`skeleton ${className}`} style={style} />;
};

// Loading state for model grid
export const ModelGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="model-grid-skeleton">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="model-card-skeleton">
          <Skeleton height="200px" borderRadius="8px" />
          <div className="model-card-skeleton-content">
            <Skeleton height="16px" width="80%" />
            <Skeleton height="14px" width="60%" />
            <Skeleton height="12px" width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Loading state for folder navigation
export const FolderNavigationSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="folder-navigation-skeleton">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="folder-item-skeleton">
          <Skeleton height="16px" width="100%" />
          <Skeleton height="12px" width="60%" />
        </div>
      ))}
    </div>
  );
};

export default LoadingSpinner;
