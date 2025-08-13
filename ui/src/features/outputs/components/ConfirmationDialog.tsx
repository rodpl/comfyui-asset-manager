import React, { useEffect } from 'react';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'info' | 'warning' | 'error';
}

const ConfirmationDialog = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'info',
}: ConfirmationDialogProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      } else if (event.key === 'Enter') {
        onConfirm();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onCancel();
    }
  };

  const getIconClass = () => {
    switch (type) {
      case 'warning':
        return 'pi pi-exclamation-triangle';
      case 'error':
        return 'pi pi-times-circle';
      default:
        return 'pi pi-question-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'warning':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      default:
        return '#3b82f6';
    }
  };

  return (
    <div
      className="confirmation-dialog-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-dialog-title"
    >
      <div className="confirmation-dialog-container">
        <div className="confirmation-dialog-header">
          <div className="confirmation-dialog-icon">
            <i className={getIconClass()} style={{ color: getIconColor() }}></i>
          </div>
          <h3 id="confirmation-dialog-title" className="confirmation-dialog-title">
            {title}
          </h3>
        </div>

        <div className="confirmation-dialog-content">
          <p className="confirmation-dialog-message">{message}</p>
        </div>

        <div className="confirmation-dialog-actions">
          <button
            className="confirmation-dialog-button confirmation-dialog-cancel"
            onClick={onCancel}
            autoFocus
          >
            {cancelText}
          </button>
          <button
            className="confirmation-dialog-button confirmation-dialog-confirm"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;