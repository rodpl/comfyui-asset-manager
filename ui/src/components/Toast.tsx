/**
 * Toast Notification Component
 * Provides toast-style notifications using ComfyUI theme
 */

import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  title?: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  visible?: boolean;
  onClose?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  title,
  variant = 'info',
  duration = 5000,
  visible = true,
  onClose,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const getIcon = () => {
    switch (variant) {
      case 'success':
        return 'pi pi-check-circle';
      case 'error':
        return 'pi pi-times-circle';
      case 'warning':
        return 'pi pi-exclamation-triangle';
      default:
        return 'pi pi-info-circle';
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <div className={`asset-manager-toast asset-manager-toast--${variant} ${isVisible ? 'asset-manager-toast--visible' : ''} ${className}`}>
      <i className={`asset-manager-success-icon ${getIcon()}`} />
      <div className="asset-manager-success-content">
        {title && <div className="asset-manager-success-title">{title}</div>}
        <div className="asset-manager-success-description">{message}</div>
      </div>
      <button
        className="asset-manager-toast-close"
        onClick={handleClose}
        aria-label="Close notification"
      >
        <i className="pi pi-times" />
      </button>
    </div>
  );
};

export default Toast;