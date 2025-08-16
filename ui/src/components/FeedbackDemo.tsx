/**
 * Feedback Components Demo
 * Demonstrates all feedback components with ComfyUI theme integration
 */

import React, { useState } from 'react';
import {
  LoadingSpinner,
  ErrorMessage,
  SuccessMessage,
  EmptyState,
  Toast,
  ProgressIndicator,
} from './index';

const FeedbackDemo: React.FC = () => {
  const [showToast, setShowToast] = useState(false);
  const [toastVariant, setToastVariant] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  const [progress, setProgress] = useState(45);

  const handleShowToast = (variant: 'success' | 'error' | 'warning' | 'info') => {
    setToastVariant(variant);
    setShowToast(true);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: 'var(--asset-manager-text-primary)', marginBottom: '30px' }}>
        Feedback Components Demo
      </h2>

      {/* Loading Spinners */}
      <section style={{ marginBottom: '40px' }}>
        <h3 style={{ color: 'var(--asset-manager-text-primary)', marginBottom: '20px' }}>
          Loading Spinners
        </h3>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <LoadingSpinner size="small" color="primary" />
            <p style={{ color: 'var(--asset-manager-text-secondary)', fontSize: '12px', marginTop: '8px' }}>
              Small Primary
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <LoadingSpinner size="medium" color="success" />
            <p style={{ color: 'var(--asset-manager-text-secondary)', fontSize: '12px', marginTop: '8px' }}>
              Medium Success
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <LoadingSpinner size="large" color="warning" />
            <p style={{ color: 'var(--asset-manager-text-secondary)', fontSize: '12px', marginTop: '8px' }}>
              Large Warning
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <LoadingSpinner size="medium" color="error" text="Loading..." />
            <p style={{ color: 'var(--asset-manager-text-secondary)', fontSize: '12px', marginTop: '8px' }}>
              With Text
            </p>
          </div>
        </div>
      </section>

      {/* Progress Indicators */}
      <section style={{ marginBottom: '40px' }}>
        <h3 style={{ color: 'var(--asset-manager-text-primary)', marginBottom: '20px' }}>
          Progress Indicators
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <p style={{ color: 'var(--asset-manager-text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
              Determinate Progress ({progress}%)
            </p>
            <ProgressIndicator progress={progress} showPercentage />
            <div style={{ marginTop: '10px' }}>
              <button
                className="asset-manager-button asset-manager-button--small"
                onClick={() => setProgress(Math.max(0, progress - 10))}
              >
                -10%
              </button>
              <button
                className="asset-manager-button asset-manager-button--small"
                onClick={() => setProgress(Math.min(100, progress + 10))}
                style={{ marginLeft: '8px' }}
              >
                +10%
              </button>
            </div>
          </div>
          <div>
            <p style={{ color: 'var(--asset-manager-text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
              Indeterminate Progress
            </p>
            <ProgressIndicator />
          </div>
          <div>
            <p style={{ color: 'var(--asset-manager-text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
              Success Progress
            </p>
            <ProgressIndicator progress={100} variant="success" />
          </div>
        </div>
      </section>

      {/* Error Messages */}
      <section style={{ marginBottom: '40px' }}>
        <h3 style={{ color: 'var(--asset-manager-text-primary)', marginBottom: '20px' }}>
          Error Messages
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <ErrorMessage
            title="Connection Error"
            message="Failed to connect to the server. Please check your network connection and try again."
            variant="error"
          />
          <ErrorMessage
            title="Warning"
            message="This action cannot be undone. Please proceed with caution."
            variant="warning"
          />
          <ErrorMessage
            title="Information"
            message="Your changes have been saved automatically."
            variant="info"
          />
          <div>
            <p style={{ color: 'var(--asset-manager-text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
              Inline Error:
            </p>
            <ErrorMessage
              message="This field is required"
              inline
            />
          </div>
        </div>
      </section>

      {/* Success Messages */}
      <section style={{ marginBottom: '40px' }}>
        <h3 style={{ color: 'var(--asset-manager-text-primary)', marginBottom: '20px' }}>
          Success Messages
        </h3>
        <SuccessMessage
          title="Upload Complete"
          message="Your model has been successfully uploaded and is now available in your library."
        />
      </section>

      {/* Empty States */}
      <section style={{ marginBottom: '40px' }}>
        <h3 style={{ color: 'var(--asset-manager-text-primary)', marginBottom: '20px' }}>
          Empty States
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={{ border: '1px solid var(--asset-manager-border-primary)', borderRadius: '8px', minHeight: '200px' }}>
            <EmptyState
              icon="pi pi-folder-open"
              title="No Models Found"
              description="No models were found in the selected folder. Try selecting a different folder or adding some models."
              actions={
                <button className="asset-manager-button asset-manager-button--primary">
                  Browse Models
                </button>
              }
              variant="compact"
            />
          </div>
          <div style={{ border: '1px solid var(--asset-manager-border-primary)', borderRadius: '8px', minHeight: '200px' }}>
            <EmptyState
              icon="pi pi-search"
              title="No Search Results"
              description="No models match your search criteria."
              actions={
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="asset-manager-button asset-manager-button--primary">
                    Clear Search
                  </button>
                  <button className="asset-manager-button asset-manager-button--secondary">
                    Clear Filters
                  </button>
                </div>
              }
              variant="search"
            />
          </div>
        </div>
      </section>

      {/* Toast Notifications */}
      <section style={{ marginBottom: '40px' }}>
        <h3 style={{ color: 'var(--asset-manager-text-primary)', marginBottom: '20px' }}>
          Toast Notifications
        </h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="asset-manager-button asset-manager-button--success"
            onClick={() => handleShowToast('success')}
          >
            Show Success Toast
          </button>
          <button
            className="asset-manager-button asset-manager-button--error"
            onClick={() => handleShowToast('error')}
          >
            Show Error Toast
          </button>
          <button
            className="asset-manager-button asset-manager-button--warning"
            onClick={() => handleShowToast('warning')}
          >
            Show Warning Toast
          </button>
          <button
            className="asset-manager-button asset-manager-button--secondary"
            onClick={() => handleShowToast('info')}
          >
            Show Info Toast
          </button>
        </div>
      </section>

      {/* Toast Component */}
      {showToast && (
        <Toast
          title={`${toastVariant.charAt(0).toUpperCase() + toastVariant.slice(1)} Notification`}
          message={`This is a ${toastVariant} toast notification with ComfyUI theme integration.`}
          variant={toastVariant}
          visible={showToast}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};

export default FeedbackDemo;