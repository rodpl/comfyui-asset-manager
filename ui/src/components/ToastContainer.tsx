/**
 * Toast Container Component
 * Renders fallback toasts when ComfyUI's native toast system is not available
 */

import React from 'react';
import { Toast } from './Toast';
import { useNotifications } from '../hooks/useNotifications';

interface ToastContainerProps {
  className?: string;
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
  maxToasts?: number;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  className = '',
  position = 'top-right',
  maxToasts = 5,
}) => {
  const { fallbackToasts, remove, isComfyUIAvailable } = useNotifications();

  // Don't render if ComfyUI's native toast system is available
  if (isComfyUIAvailable) {
    return null;
  }

  // Limit number of visible toasts
  const visibleToasts = fallbackToasts.slice(0, maxToasts);

  if (visibleToasts.length === 0) {
    return null;
  }

  const getPositionClass = () => {
    switch (position) {
      case 'top-left':
        return 'asset-manager-toast-container--top-left';
      case 'bottom-right':
        return 'asset-manager-toast-container--bottom-right';
      case 'bottom-left':
        return 'asset-manager-toast-container--bottom-left';
      case 'top-center':
        return 'asset-manager-toast-container--top-center';
      case 'bottom-center':
        return 'asset-manager-toast-container--bottom-center';
      default:
        return 'asset-manager-toast-container--top-right';
    }
  };

  return (
    <div className={`asset-manager-toast-container ${getPositionClass()} ${className}`}>
      {visibleToasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          title={toast.title}
          variant={toast.type}
          duration={toast.duration}
          visible={true}
          onClose={() => remove(toast.id)}
          className="asset-manager-toast-container-item"
        />
      ))}
    </div>
  );
};

export default ToastContainer;
