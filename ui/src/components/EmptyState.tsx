/**
 * Empty State Component
 * Provides consistent empty state displays using ComfyUI theme
 */

import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  variant?: 'default' | 'search' | 'compact';
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'pi pi-folder-open',
  title,
  description,
  actions,
  variant = 'default',
  className = '',
}) => {
  const variantClass = variant !== 'default' ? `asset-manager-empty-state--${variant}` : '';

  return (
    <div className={`asset-manager-empty-state ${variantClass} ${className}`}>
      <i className={`asset-manager-empty-icon ${icon}`} />
      <h3 className="asset-manager-empty-title">{title}</h3>
      {description && (
        <p className="asset-manager-empty-description">{description}</p>
      )}
      {actions && (
        <div className="asset-manager-empty-actions">{actions}</div>
      )}
    </div>
  );
};

export default EmptyState;