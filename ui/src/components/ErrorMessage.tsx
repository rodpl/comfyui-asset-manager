/**
 * Error Message Component
 * Provides consistent error display across the application using ComfyUI theme
 */

import React from 'react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  variant?: 'error' | 'warning' | 'info';
  inline?: boolean;
  className?: string;
  onDismiss?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  variant = 'error',
  inline = false,
  className = '',
  onDismiss,
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'warning':
        return 'pi pi-exclamation-triangle';
      case 'info':
        return 'pi pi-info-circle';
      default:
        return 'pi pi-times-circle';
    }
  };

  if (inline) {
    return (
      <div className={`asset-manager-error-inline ${className}`}>
        <i className={`asset-manager-error-icon ${getIcon()}`} />
        <span>{message}</span>
      </div>
    );
  }

  return (
    <div className={`asset-manager-error-message asset-manager-error-message--${variant} ${className}`}>
      <i className={`asset-manager-error-icon ${getIcon()}`} />
      <div className="asset-manager-error-content">
        {title && <div className="asset-manager-error-title">{title}</div>}
        <div className="asset-manager-error-description">{message}</div>
      </div>
      {onDismiss && (
        <button
          className="asset-manager-button asset-manager-button--icon asset-manager-button--icon-small"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          <i className="pi pi-times" />
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;