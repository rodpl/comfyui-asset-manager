# Theme Integration Examples

## Complete Component Examples

This document provides complete, working examples of properly themed components that demonstrate best practices for ComfyUI theme integration.

## Table of Contents

1. [Basic Themed Component](#basic-themed-component)
2. [Complex Card Component](#complex-card-component)
3. [Form Components](#form-components)
4. [Modal Components](#modal-components)
5. [Loading and Feedback Components](#loading-and-feedback-components)
6. [Theme-Aware React Hook Usage](#theme-aware-react-hook-usage)

## Basic Themed Component

### Simple Button Component

**ThemedButton.tsx**
```typescript
import React, { ButtonHTMLAttributes } from 'react';
import './ThemedButton.css';

interface ThemedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
}

export const ThemedButton: React.FC<ThemedButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}) => {
  const classes = [
    'asset-manager-button',
    `asset-manager-button--${variant}`,
    `asset-manager-button--${size}`,
    loading && 'asset-manager-button--loading',
    className
  ].filter(Boolean).join(' ');

  return (
    <button 
      className={classes} 
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="asset-manager-button__spinner" />
      ) : (
        children
      )}
    </button>
  );
};
```

**ThemedButton.css**
```css
.asset-manager-button {
  /* Base styles using theme variables */
  background-color: var(--asset-manager-bg-secondary);
  color: var(--asset-manager-text-primary);
  border: 1px solid var(--asset-manager-border-primary);
  border-radius: 4px;
  padding: 8px 16px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  /* Smooth transitions for theme switching */
  transition: 
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

/* Variant styles */
.asset-manager-button--primary {
  background-color: var(--asset-manager-interactive-primary);
  color: white;
  border-color: var(--asset-manager-interactive-primary);
}

.asset-manager-button--secondary {
  background-color: transparent;
  color: var(--asset-manager-text-primary);
  border-color: var(--asset-manager-border-primary);
}

.asset-manager-button--danger {
  background-color: #dc3545;
  color: white;
  border-color: #dc3545;
}

/* Size variants */
.asset-manager-button--small {
  padding: 4px 8px;
  font-size: 12px;
}

.asset-manager-button--large {
  padding: 12px 24px;
  font-size: 16px;
}

/* Interactive states */
.asset-manager-button:hover:not(:disabled) {
  background-color: var(--asset-manager-bg-hover);
  border-color: var(--asset-manager-interactive-hover);
}

.asset-manager-button--primary:hover:not(:disabled) {
  background-color: var(--asset-manager-interactive-hover);
  border-color: var(--asset-manager-interactive-hover);
}

.asset-manager-button--danger:hover:not(:disabled) {
  background-color: #c82333;
  border-color: #c82333;
}

.asset-manager-button:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.3);
}

.asset-manager-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Loading state */
.asset-manager-button--loading {
  cursor: wait;
}

.asset-manager-button__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

## Complex Card Component

### Asset Card with Multiple States

**AssetCard.tsx**
```typescript
import React from 'react';
import { ThemedButton } from './ThemedButton';
import './AssetCard.css';

interface AssetCardProps {
  title: string;
  description?: string;
  imageUrl?: string;
  metadata?: Record<string, string>;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
    loading?: boolean;
  }>;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
}

export const AssetCard: React.FC<AssetCardProps> = ({
  title,
  description,
  imageUrl,
  metadata,
  actions = [],
  selected = false,
  disabled = false,
  className = ''
}) => {
  const classes = [
    'asset-manager-card',
    selected && 'asset-manager-card--selected',
    disabled && 'asset-manager-card--disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {imageUrl && (
        <div className="asset-manager-card__image">
          <img src={imageUrl} alt={title} />
        </div>
      )}
      
      <div className="asset-manager-card__content">
        <h3 className="asset-manager-card__title">{title}</h3>
        
        {description && (
          <p className="asset-manager-card__description">{description}</p>
        )}
        
        {metadata && Object.keys(metadata).length > 0 && (
          <div className="asset-manager-card__metadata">
            {Object.entries(metadata).map(([key, value]) => (
              <div key={key} className="asset-manager-card__metadata-item">
                <span className="asset-manager-card__metadata-key">{key}:</span>
                <span className="asset-manager-card__metadata-value">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {actions.length > 0 && (
        <div className="asset-manager-card__actions">
          {actions.map((action, index) => (
            <ThemedButton
              key={index}
              variant={action.variant}
              size="small"
              loading={action.loading}
              onClick={action.onClick}
              disabled={disabled}
            >
              {action.label}
            </ThemedButton>
          ))}
        </div>
      )}
    </div>
  );
};
```

**AssetCard.css**
```css
.asset-manager-card {
  /* Component-specific CSS variables for easier customization */
  --card-bg: var(--asset-manager-bg-secondary);
  --card-border: var(--asset-manager-border-primary);
  --card-text: var(--asset-manager-text-primary);
  --card-text-muted: var(--asset-manager-text-secondary);
  --card-shadow: rgba(0, 0, 0, 0.1);
  
  /* Base card styles */
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px var(--card-shadow);
  
  /* Smooth transitions */
  transition: 
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.asset-manager-card:hover:not(.asset-manager-card--disabled) {
  --card-bg: var(--asset-manager-bg-hover);
  --card-border: var(--asset-manager-border-hover);
  --card-shadow: rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.asset-manager-card--selected {
  --card-border: var(--asset-manager-interactive-primary);
  --card-shadow: rgba(0, 122, 204, 0.2);
}

.asset-manager-card--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.asset-manager-card__image {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background-color: var(--asset-manager-bg-primary);
}

.asset-manager-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.asset-manager-card__content {
  padding: 16px;
}

.asset-manager-card__title {
  color: var(--card-text);
  font-size: 1.1em;
  font-weight: 600;
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.asset-manager-card__description {
  color: var(--card-text-muted);
  font-size: 0.9em;
  line-height: 1.4;
  margin: 0 0 12px 0;
}

.asset-manager-card__metadata {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.asset-manager-card__metadata-item {
  display: flex;
  gap: 8px;
  font-size: 0.8em;
}

.asset-manager-card__metadata-key {
  color: var(--card-text-muted);
  font-weight: 500;
  min-width: 60px;
}

.asset-manager-card__metadata-value {
  color: var(--card-text);
}

.asset-manager-card__actions {
  padding: 0 16px 16px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* Light theme adjustments */
:root.comfy-theme-light #asset-manager-root .asset-manager-card {
  --card-shadow: rgba(0, 0, 0, 0.05);
}

:root.comfy-theme-light #asset-manager-root .asset-manager-card:hover {
  --card-shadow: rgba(0, 0, 0, 0.1);
}

:root.comfy-theme-light #asset-manager-root .asset-manager-card--selected {
  --card-shadow: rgba(0, 102, 204, 0.15);
}
```

## Form Components

### Themed Input Component

**ThemedInput.tsx**
```typescript
import React, { InputHTMLAttributes, forwardRef } from 'react';
import './ThemedInput.css';

interface ThemedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'search';
}

export const ThemedInput = forwardRef<HTMLInputElement, ThemedInputProps>(({
  label,
  error,
  helperText,
  variant = 'default',
  className = '',
  ...props
}, ref) => {
  const inputClasses = [
    'asset-manager-input',
    `asset-manager-input--${variant}`,
    error && 'asset-manager-input--error',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="asset-manager-input-group">
      {label && (
        <label className="asset-manager-input-label">
          {label}
        </label>
      )}
      
      <input
        ref={ref}
        className={inputClasses}
        {...props}
      />
      
      {error && (
        <div className="asset-manager-input-error">
          {error}
        </div>
      )}
      
      {helperText && !error && (
        <div className="asset-manager-input-helper">
          {helperText}
        </div>
      )}
    </div>
  );
});

ThemedInput.displayName = 'ThemedInput';
```

**ThemedInput.css**
```css
.asset-manager-input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.asset-manager-input-label {
  color: var(--asset-manager-text-primary);
  font-size: 14px;
  font-weight: 500;
}

.asset-manager-input {
  background-color: var(--asset-manager-bg-secondary);
  color: var(--asset-manager-text-primary);
  border: 1px solid var(--asset-manager-border-primary);
  border-radius: 4px;
  padding: 8px 12px;
  font-family: inherit;
  font-size: 14px;
  
  transition: 
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.asset-manager-input::placeholder {
  color: var(--asset-manager-text-muted);
}

.asset-manager-input:focus {
  outline: none;
  border-color: var(--asset-manager-interactive-primary);
  box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
}

.asset-manager-input--search {
  padding-left: 32px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: 8px center;
  background-size: 16px;
}

.asset-manager-input--error {
  border-color: #dc3545;
}

.asset-manager-input--error:focus {
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.2);
}

.asset-manager-input-error {
  color: #dc3545;
  font-size: 12px;
}

.asset-manager-input-helper {
  color: var(--asset-manager-text-muted);
  font-size: 12px;
}

.asset-manager-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: var(--asset-manager-bg-primary);
}
```

## Modal Components

### Themed Modal Component

**ThemedModal.tsx**
```typescript
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ThemedButton } from './ThemedButton';
import './ThemedModal.css';

interface ThemedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
    loading?: boolean;
  }>;
  size?: 'small' | 'medium' | 'large';
  closeOnOverlayClick?: boolean;
}

export const ThemedModal: React.FC<ThemedModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  actions = [],
  size = 'medium',
  closeOnOverlayClick = true
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return createPortal(
    <div className="asset-manager-modal-overlay" onClick={handleOverlayClick}>
      <div className={`asset-manager-modal asset-manager-modal--${size}`}>
        {title && (
          <div className="asset-manager-modal__header">
            <h2 className="asset-manager-modal__title">{title}</h2>
            <button
              className="asset-manager-modal__close"
              onClick={onClose}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        )}
        
        <div className="asset-manager-modal__content">
          {children}
        </div>
        
        {actions.length > 0 && (
          <div className="asset-manager-modal__actions">
            {actions.map((action, index) => (
              <ThemedButton
                key={index}
                variant={action.variant}
                loading={action.loading}
                onClick={action.onClick}
              >
                {action.label}
              </ThemedButton>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
```

**ThemedModal.css**
```css
.asset-manager-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.asset-manager-modal {
  background-color: var(--asset-manager-bg-primary);
  border: 1px solid var(--asset-manager-border-primary);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  transition: 
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.asset-manager-modal--small {
  width: 400px;
  max-width: 90vw;
}

.asset-manager-modal--medium {
  width: 600px;
  max-width: 90vw;
}

.asset-manager-modal--large {
  width: 800px;
  max-width: 90vw;
}

.asset-manager-modal__header {
  background-color: var(--asset-manager-bg-secondary);
  border-bottom: 1px solid var(--asset-manager-border-primary);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.asset-manager-modal__title {
  color: var(--asset-manager-text-primary);
  font-size: 1.2em;
  font-weight: 600;
  margin: 0;
}

.asset-manager-modal__close {
  background: none;
  border: none;
  color: var(--asset-manager-text-secondary);
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  
  transition: 
    background-color 0.2s ease,
    color 0.2s ease;
}

.asset-manager-modal__close:hover {
  background-color: var(--asset-manager-bg-hover);
  color: var(--asset-manager-text-primary);
}

.asset-manager-modal__content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  color: var(--asset-manager-text-primary);
}

.asset-manager-modal__actions {
  border-top: 1px solid var(--asset-manager-border-primary);
  padding: 16px 20px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  background-color: var(--asset-manager-bg-secondary);
}

/* Light theme adjustments */
:root.comfy-theme-light #asset-manager-root .asset-manager-modal {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}
```

## Loading and Feedback Components

### Loading Spinner

**LoadingSpinner.tsx**
```typescript
import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message,
  className = ''
}) => {
  const classes = [
    'asset-manager-spinner',
    `asset-manager-spinner--${size}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="asset-manager-spinner-container">
      <div className={classes} />
      {message && (
        <div className="asset-manager-spinner-message">
          {message}
        </div>
      )}
    </div>
  );
};
```

**LoadingSpinner.css**
```css
.asset-manager-spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.asset-manager-spinner {
  border: 2px solid var(--asset-manager-border-primary);
  border-top: 2px solid var(--asset-manager-interactive-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.asset-manager-spinner--small {
  width: 16px;
  height: 16px;
  border-width: 1px;
}

.asset-manager-spinner--medium {
  width: 24px;
  height: 24px;
}

.asset-manager-spinner--large {
  width: 32px;
  height: 32px;
  border-width: 3px;
}

.asset-manager-spinner-message {
  color: var(--asset-manager-text-secondary);
  font-size: 14px;
  text-align: center;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

## Theme-Aware React Hook Usage

### Component with Conditional Theme Logic

```typescript
import React from 'react';
import { useComfyUITheme } from '../hooks/useComfyUITheme';

export const ThemeAwareComponent: React.FC = () => {
  const { isLight, isDark } = useComfyUITheme();

  return (
    <div className="theme-aware-component">
      {/* Most styling handled by CSS variables */}
      <div className="content-area">
        <h2>Theme-Aware Content</h2>
        
        {/* Use JavaScript theme detection only when necessary */}
        {isLight && (
          <div className="light-theme-feature">
            This feature only appears in light theme
          </div>
        )}
        
        {isDark && (
          <div className="dark-theme-feature">
            This feature only appears in dark theme
          </div>
        )}
        
        {/* Conditional rendering based on theme */}
        <img 
          src={isLight ? '/assets/logo-dark.png' : '/assets/logo-light.png'}
          alt="Logo"
          className="theme-logo"
        />
      </div>
      
      {/* Most visual elements use CSS-based theming */}
      <div className="themed-panel">
        This panel's appearance is controlled entirely by CSS variables
      </div>
    </div>
  );
};
```

**Corresponding CSS:**
```css
.theme-aware-component {
  background-color: var(--asset-manager-bg-primary);
  color: var(--asset-manager-text-primary);
  padding: 20px;
  border-radius: 8px;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.content-area {
  margin-bottom: 20px;
}

.light-theme-feature,
.dark-theme-feature {
  padding: 12px;
  border-radius: 4px;
  margin: 12px 0;
}

.light-theme-feature {
  background-color: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  color: #856404;
}

.dark-theme-feature {
  background-color: rgba(108, 117, 125, 0.1);
  border: 1px solid rgba(108, 117, 125, 0.3);
  color: var(--asset-manager-text-secondary);
}

.theme-logo {
  max-width: 200px;
  height: auto;
  transition: opacity 0.2s ease;
}

.themed-panel {
  background-color: var(--asset-manager-bg-secondary);
  border: 1px solid var(--asset-manager-border-primary);
  padding: 16px;
  border-radius: 4px;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}
```

## Testing Examples

### Component Theme Testing

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { themeTestUtils } from '../utils/themeTestUtils';
import { AssetCard } from './AssetCard';

describe('AssetCard Theme Integration', () => {
  let container: HTMLElement;
  
  beforeEach(() => {
    container = themeTestUtils.createThemeTestContainer();
  });
  
  afterEach(() => {
    container.remove();
    themeTestUtils.setComfyUITheme('dark'); // Reset to dark
  });
  
  it('should apply correct theme styles in dark mode', () => {
    themeTestUtils.setComfyUITheme('dark');
    
    const { container: renderContainer } = render(
      <AssetCard title="Test Card" description="Test description" />
    );
    
    const card = renderContainer.querySelector('.asset-manager-card');
    const computedStyle = getComputedStyle(card!);
    
    // Verify dark theme colors are applied
    expect(computedStyle.backgroundColor).toBe('rgb(58, 58, 58)');
    expect(computedStyle.color).toBe('rgb(255, 255, 255)');
  });
  
  it('should apply correct theme styles in light mode', async () => {
    themeTestUtils.setComfyUITheme('light');
    await themeTestUtils.waitForThemeTransition();
    
    const { container: renderContainer } = render(
      <AssetCard title="Test Card" description="Test description" />
    );
    
    const card = renderContainer.querySelector('.asset-manager-card');
    const computedStyle = getComputedStyle(card!);
    
    // Verify light theme colors are applied
    expect(computedStyle.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(computedStyle.color).toBe('rgb(0, 0, 0)');
  });
  
  it('should transition smoothly between themes', async () => {
    const { container: renderContainer } = render(
      <AssetCard title="Test Card" />
    );
    
    const card = renderContainer.querySelector('.asset-manager-card');
    const computedStyle = getComputedStyle(card!);
    
    // Verify transition properties are set
    expect(computedStyle.transition).toContain('background-color');
    expect(computedStyle.transition).toContain('0.2s');
  });
});
```

These examples demonstrate the complete implementation of properly themed components that automatically adapt to ComfyUI's theme system while maintaining performance and accessibility.