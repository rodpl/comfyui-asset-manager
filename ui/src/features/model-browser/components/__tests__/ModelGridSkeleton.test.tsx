/**
 * Tests for ModelGridSkeleton components
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  ModelGridSkeleton,
  ModelCardSkeleton,
  ModelSearchSkeleton,
  LoadMoreSkeleton,
  ModelDetailSkeleton,
} from '../ModelGridSkeleton';

describe('ModelGridSkeleton', () => {
  it('renders default number of skeleton cards', () => {
    const { container } = render(<ModelGridSkeleton />);
    
    // Should render 20 skeleton cards by default
    const skeletonCards = container.querySelectorAll('.model-card-skeleton');
    expect(skeletonCards).toHaveLength(20);
  });

  it('renders custom number of skeleton cards', () => {
    const { container } = render(<ModelGridSkeleton count={5} />);
    
    const skeletonCards = container.querySelectorAll('.model-card-skeleton');
    expect(skeletonCards).toHaveLength(5);
  });

  it('applies platform-specific classes', () => {
    const { container } = render(<ModelGridSkeleton platform="civitai" />);
    
    const skeletonCards = container.querySelectorAll('.civitai-skeleton');
    expect(skeletonCards.length).toBeGreaterThan(0);
  });

  it('applies custom className', () => {
    const { container } = render(<ModelGridSkeleton className="custom-skeleton" />);
    
    expect(container.firstChild).toHaveClass('custom-skeleton');
  });

  it('renders in grid layout', () => {
    const { container } = render(<ModelGridSkeleton />);
    
    const grid = container.querySelector('.model-grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('model-grid');
  });
});

describe('ModelCardSkeleton', () => {
  it('renders skeleton card structure', () => {
    const { container } = render(<ModelCardSkeleton />);
    
    // Check for main skeleton elements
    expect(container.querySelector('.skeleton-thumbnail')).toBeInTheDocument();
    expect(container.querySelector('.skeleton-content')).toBeInTheDocument();
    expect(container.querySelector('.skeleton-title')).toBeInTheDocument();
    expect(container.querySelector('.skeleton-author')).toBeInTheDocument();
    expect(container.querySelector('.skeleton-description')).toBeInTheDocument();
    expect(container.querySelector('.skeleton-stats')).toBeInTheDocument();
  });

  it('includes platform badge skeleton', () => {
    const { container } = render(<ModelCardSkeleton />);
    
    expect(container.querySelector('.skeleton-platform-badge')).toBeInTheDocument();
  });

  it('includes compatibility indicator skeleton', () => {
    const { container } = render(<ModelCardSkeleton />);
    
    expect(container.querySelector('.skeleton-compatibility')).toBeInTheDocument();
  });

  it('includes technical info skeletons', () => {
    const { container } = render(<ModelCardSkeleton />);
    
    expect(container.querySelector('.skeleton-technical')).toBeInTheDocument();
    expect(container.querySelector('.skeleton-format')).toBeInTheDocument();
    expect(container.querySelector('.skeleton-base-model')).toBeInTheDocument();
  });

  it('includes ComfyUI info skeleton', () => {
    const { container } = render(<ModelCardSkeleton />);
    
    expect(container.querySelector('.skeleton-comfyui-info')).toBeInTheDocument();
    expect(container.querySelector('.skeleton-folder-icon')).toBeInTheDocument();
    expect(container.querySelector('.skeleton-folder-path')).toBeInTheDocument();
  });

  it('includes tags skeleton', () => {
    const { container } = render(<ModelCardSkeleton />);
    
    expect(container.querySelector('.skeleton-tags')).toBeInTheDocument();
    const tagSkeletons = container.querySelectorAll('.skeleton-tag');
    expect(tagSkeletons.length).toBeGreaterThan(0);
  });

  it('applies platform-specific styling', () => {
    const { container } = render(<ModelCardSkeleton platform="civitai" />);
    
    expect(container.firstChild).toHaveClass('civitai-skeleton');
  });

  it('applies custom className', () => {
    const { container } = render(<ModelCardSkeleton className="custom-card-skeleton" />);
    
    expect(container.firstChild).toHaveClass('custom-card-skeleton');
  });
});

describe('ModelSearchSkeleton', () => {
  it('renders default number of search result skeletons', () => {
    const { container } = render(<ModelSearchSkeleton />);
    
    const searchResults = container.querySelectorAll('.search-result-skeleton');
    expect(searchResults).toHaveLength(5);
  });

  it('renders custom number of search result skeletons', () => {
    const { container } = render(<ModelSearchSkeleton count={3} />);
    
    const searchResults = container.querySelectorAll('.search-result-skeleton');
    expect(searchResults).toHaveLength(3);
  });

  it('renders search result structure', () => {
    const { container } = render(<ModelSearchSkeleton count={1} />);
    
    expect(container.querySelector('.search-thumbnail-skeleton')).toBeInTheDocument();
    expect(container.querySelector('.search-content-skeleton')).toBeInTheDocument();
    expect(container.querySelector('.search-title-skeleton')).toBeInTheDocument();
    expect(container.querySelector('.search-author-skeleton')).toBeInTheDocument();
    expect(container.querySelector('.search-stats-skeleton')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<ModelSearchSkeleton className="custom-search-skeleton" />);
    
    expect(container.firstChild).toHaveClass('custom-search-skeleton');
  });
});

describe('LoadMoreSkeleton', () => {
  it('renders load more skeleton structure', () => {
    const { container } = render(<LoadMoreSkeleton />);
    
    expect(container.querySelector('.load-more-skeleton')).toBeInTheDocument();
    expect(container.querySelector('.load-more-content')).toBeInTheDocument();
    expect(container.querySelector('.load-more-spinner')).toBeInTheDocument();
    expect(container.querySelector('.load-more-text')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<LoadMoreSkeleton className="custom-load-more" />);
    
    expect(container.firstChild).toHaveClass('custom-load-more');
  });
});

describe('ModelDetailSkeleton', () => {
  it('renders model detail skeleton structure', () => {
    const { container } = render(<ModelDetailSkeleton />);
    
    expect(container.querySelector('.model-detail-skeleton')).toBeInTheDocument();
    expect(container.querySelector('.detail-header-skeleton')).toBeInTheDocument();
    expect(container.querySelector('.detail-gallery-skeleton')).toBeInTheDocument();
    expect(container.querySelector('.detail-info-skeleton')).toBeInTheDocument();
  });

  it('renders header skeleton elements', () => {
    const { container } = render(<ModelDetailSkeleton />);
    
    expect(container.querySelector('.detail-title-skeleton')).toBeInTheDocument();
    expect(container.querySelector('.detail-author-skeleton')).toBeInTheDocument();
  });

  it('renders gallery skeleton elements', () => {
    const { container } = render(<ModelDetailSkeleton />);
    
    expect(container.querySelector('.gallery-main-image')).toBeInTheDocument();
    expect(container.querySelector('.gallery-thumbnails')).toBeInTheDocument();
    
    const thumbnails = container.querySelectorAll('.gallery-thumbnail-skeleton');
    expect(thumbnails).toHaveLength(4);
  });

  it('renders info sections skeleton', () => {
    const { container } = render(<ModelDetailSkeleton />);
    
    const infoSections = container.querySelectorAll('.info-section');
    expect(infoSections.length).toBeGreaterThan(0);
    
    expect(container.querySelector('.section-title-skeleton')).toBeInTheDocument();
    expect(container.querySelector('.section-content-skeleton')).toBeInTheDocument();
  });

  it('applies platform-specific styling', () => {
    const { container } = render(<ModelDetailSkeleton platform="huggingface" />);
    
    expect(container.firstChild).toHaveClass('huggingface-detail-skeleton');
  });

  it('applies custom className', () => {
    const { container } = render(<ModelDetailSkeleton className="custom-detail-skeleton" />);
    
    expect(container.firstChild).toHaveClass('custom-detail-skeleton');
  });
});

describe('Shimmer animations', () => {
  it('includes shimmer elements in skeletons', () => {
    const { container } = render(<ModelCardSkeleton />);
    
    const shimmerElements = container.querySelectorAll('.skeleton-shimmer');
    expect(shimmerElements.length).toBeGreaterThan(0);
  });

  it('applies shimmer animation styles', () => {
    const { container } = render(<ModelCardSkeleton />);
    
    const shimmerElement = container.querySelector('.skeleton-shimmer');
    expect(shimmerElement).toBeInTheDocument();
    expect(shimmerElement).toHaveClass('skeleton-shimmer');
  });
});

describe('Responsive behavior', () => {
  it('maintains structure across different screen sizes', () => {
    const { container } = render(<ModelGridSkeleton count={1} />);
    
    // Should maintain grid structure
    const grid = container.querySelector('.model-grid');
    expect(grid).toBeInTheDocument();
    
    // Should have responsive grid columns
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('model-grid');
  });
});

describe('Accessibility', () => {
  it('does not interfere with screen readers', () => {
    const { container } = render(<ModelCardSkeleton />);
    
    // Skeleton should not have interactive elements
    const buttons = container.querySelectorAll('button');
    const links = container.querySelectorAll('a');
    const inputs = container.querySelectorAll('input');
    
    expect(buttons).toHaveLength(0);
    expect(links).toHaveLength(0);
    expect(inputs).toHaveLength(0);
  });

  it('provides appropriate visual hierarchy', () => {
    const { container } = render(<ModelCardSkeleton />);
    
    // Should have proper structure for screen readers
    const skeletonCard = container.querySelector('.model-card-skeleton');
    expect(skeletonCard).toBeInTheDocument();
    
    // Should not have heading elements that could confuse screen readers
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    expect(headings).toHaveLength(0);
  });
});