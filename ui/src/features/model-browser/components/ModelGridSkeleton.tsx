/**
 * Enhanced Loading Skeleton for Model Grid
 * Provides realistic loading placeholders with shimmer effects
 */

import React from 'react';
import './ModelGridSkeleton.css';

export interface ModelGridSkeletonProps {
  count?: number;
  platform?: 'civitai' | 'huggingface' | 'general';
  className?: string;
}

export interface ModelCardSkeletonProps {
  platform?: 'civitai' | 'huggingface' | 'general';
  className?: string;
}

// Individual model card skeleton
export const ModelCardSkeleton: React.FC<ModelCardSkeletonProps> = ({
  platform = 'general',
  className = '',
}) => {
  return (
    <div className={`model-card-skeleton ${platform}-skeleton ${className}`}>
      {/* Thumbnail skeleton */}
      <div className="skeleton-thumbnail">
        <div className="skeleton-shimmer" />
        
        {/* Platform badge skeleton */}
        <div className="skeleton-platform-badge">
          <div className="skeleton-shimmer" />
        </div>
        
        {/* Compatibility indicator skeleton */}
        <div className="skeleton-compatibility">
          <div className="skeleton-shimmer" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="skeleton-content">
        {/* Header skeleton */}
        <div className="skeleton-header">
          <div className="skeleton-title">
            <div className="skeleton-shimmer" />
          </div>
          <div className="skeleton-type-badge">
            <div className="skeleton-shimmer" />
          </div>
        </div>

        {/* Author skeleton */}
        <div className="skeleton-author">
          <div className="skeleton-shimmer" />
        </div>

        {/* Description skeleton */}
        <div className="skeleton-description">
          <div className="skeleton-line">
            <div className="skeleton-shimmer" />
          </div>
          <div className="skeleton-line short">
            <div className="skeleton-shimmer" />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="skeleton-stats">
          <div className="skeleton-stat">
            <div className="skeleton-icon">
              <div className="skeleton-shimmer" />
            </div>
            <div className="skeleton-value">
              <div className="skeleton-shimmer" />
            </div>
          </div>
          <div className="skeleton-stat">
            <div className="skeleton-icon">
              <div className="skeleton-shimmer" />
            </div>
            <div className="skeleton-value">
              <div className="skeleton-shimmer" />
            </div>
          </div>
          <div className="skeleton-stat">
            <div className="skeleton-icon">
              <div className="skeleton-shimmer" />
            </div>
            <div className="skeleton-value">
              <div className="skeleton-shimmer" />
            </div>
          </div>
        </div>

        {/* Technical info skeleton */}
        <div className="skeleton-technical">
          <div className="skeleton-format">
            <div className="skeleton-shimmer" />
          </div>
          <div className="skeleton-base-model">
            <div className="skeleton-shimmer" />
          </div>
        </div>

        {/* ComfyUI info skeleton */}
        <div className="skeleton-comfyui-info">
          <div className="skeleton-folder-icon">
            <div className="skeleton-shimmer" />
          </div>
          <div className="skeleton-folder-path">
            <div className="skeleton-shimmer" />
          </div>
        </div>

        {/* Tags skeleton */}
        <div className="skeleton-tags">
          <div className="skeleton-tag">
            <div className="skeleton-shimmer" />
          </div>
          <div className="skeleton-tag">
            <div className="skeleton-shimmer" />
          </div>
          <div className="skeleton-tag short">
            <div className="skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Grid of skeleton cards
export const ModelGridSkeleton: React.FC<ModelGridSkeletonProps> = ({
  count = 20,
  platform = 'general',
  className = '',
}) => {
  return (
    <div className={`model-grid-skeleton ${className}`}>
      <div className="model-grid">
        {Array.from({ length: count }, (_, index) => (
          <ModelCardSkeleton
            key={index}
            platform={platform}
            className="grid-skeleton-item"
          />
        ))}
      </div>
    </div>
  );
};

// Compact skeleton for search results
export const ModelSearchSkeleton: React.FC<{
  count?: number;
  className?: string;
}> = ({ count = 5, className = '' }) => {
  return (
    <div className={`model-search-skeleton ${className}`}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="search-result-skeleton">
          <div className="search-thumbnail-skeleton">
            <div className="skeleton-shimmer" />
          </div>
          <div className="search-content-skeleton">
            <div className="search-title-skeleton">
              <div className="skeleton-shimmer" />
            </div>
            <div className="search-author-skeleton">
              <div className="skeleton-shimmer" />
            </div>
            <div className="search-stats-skeleton">
              <div className="skeleton-shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Loading more indicator skeleton
export const LoadMoreSkeleton: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  return (
    <div className={`load-more-skeleton ${className}`}>
      <div className="load-more-content">
        <div className="load-more-spinner">
          <div className="skeleton-shimmer" />
        </div>
        <div className="load-more-text">
          <div className="skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
};

// Skeleton for model detail modal
export const ModelDetailSkeleton: React.FC<{
  platform?: 'civitai' | 'huggingface' | 'general';
  className?: string;
}> = ({ platform = 'general', className = '' }) => {
  return (
    <div className={`model-detail-skeleton ${platform}-detail-skeleton ${className}`}>
      {/* Header skeleton */}
      <div className="detail-header-skeleton">
        <div className="detail-title-skeleton">
          <div className="skeleton-shimmer" />
        </div>
        <div className="detail-author-skeleton">
          <div className="skeleton-shimmer" />
        </div>
      </div>

      {/* Image gallery skeleton */}
      <div className="detail-gallery-skeleton">
        <div className="gallery-main-image">
          <div className="skeleton-shimmer" />
        </div>
        <div className="gallery-thumbnails">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="gallery-thumbnail-skeleton">
              <div className="skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>

      {/* Info sections skeleton */}
      <div className="detail-info-skeleton">
        <div className="info-section">
          <div className="section-title-skeleton">
            <div className="skeleton-shimmer" />
          </div>
          <div className="section-content-skeleton">
            <div className="skeleton-line">
              <div className="skeleton-shimmer" />
            </div>
            <div className="skeleton-line">
              <div className="skeleton-shimmer" />
            </div>
            <div className="skeleton-line short">
              <div className="skeleton-shimmer" />
            </div>
          </div>
        </div>

        <div className="info-section">
          <div className="section-title-skeleton">
            <div className="skeleton-shimmer" />
          </div>
          <div className="section-content-skeleton">
            <div className="skeleton-line">
              <div className="skeleton-shimmer" />
            </div>
            <div className="skeleton-line">
              <div className="skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelGridSkeleton;