/**
 * Success Message Component
 * Provides consistent success feedback using ComfyUI theme
 */

import React from 'react';

interface SuccessMessageProps {
  title?: string;
  message: string;
  className?: string;
  onDismiss?: () => void;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  title,
  message,
  className = '',
  onDismiss,
}) => {
  return (
    <div className={`asset-manager-success-message ${className}`}>
      <i className="asset-manager-success-icon pi pi-check-circle" />
      <div className="asset-manager-success-content">
        {title && <div className="asset-manager-success-title">{title}</div>}
        <div className="asset-manager-success-description">{message}</div>
      </div>
      {onDismiss && (
        <button
          className="asset-manager-button asset-manager-button--icon asset-manager-button--icon-small"
          onClick={onDismiss}
          aria-label="Dismiss success message"
        >
          <i className="pi pi-times" />
        </button>
      )}
    </div>
  );
};

export default SuccessMessage;