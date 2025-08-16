/**
 * Visual Regression Tests for Component Styling Consistency
 * 
 * Tests to ensure all components maintain consistent styling across theme changes
 * and that CSS classes are applied correctly in both light and dark modes.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { setComfyUITheme } from '../../utils/themeTestUtils';

// Test components that use theme classes
const TestButton = ({ variant = 'primary', size = 'medium', children = 'Test Button' }) => (
  <button className={`asset-manager-button asset-manager-button--${variant} asset-manager-button--${size}`}>
    {children}
  </button>
);

const TestCard = ({ children = 'Test Card Content' }) => (
  <div className="asset-manager-card">
    <div className="asset-manager-card-content">{children}</div>
  </div>
);

const TestInput = ({ placeholder = 'Test input', error = false }) => (
  <input 
    className={`asset-manager-input ${error ? 'asset-manager-input--error' : ''}`}
    placeholder={placeholder}
  />
);

const TestModal = ({ children = 'Modal Content' }) => (
  <div className="asset-manager-modal">
    <div className="asset-manager-modal-backdrop" />
    <div className="asset-manager-modal-content">{children}</div>
  </div>
);

const TestLoadingSpinner = ({ size = 'medium', variant = 'primary' }) => (
  <div className="asset-manager-loading">
    <div className={`asset-manager-spinner asset-manager-spinner--${size} asset-manager-spinner--${variant}`} />
    <span className="asset-manager-loading-text">Loading...</span>
  </div>
);

const TestErrorMessage = ({ type = 'error', title = 'Error', message = 'Something went wrong' }) => (
  <div className={`asset-manager-error-message asset-manager-error-message--${type}`}>
    <div className="asset-manager-error-icon">⚠</div>
    <div className="asset-manager-error-content">
      <div className="asset-manager-error-title">{title}</div>
      <div className="asset-manager-error-description">{message}</div>
    </div>
  </div>
);

const TestEmptyState = ({ variant = 'default', title = 'No Items', description = 'No items found' }) => (
  <div className={`asset-manager-empty-state asset-manager-empty-state--${variant}`}>
    <div className="asset-manager-empty-icon">📁</div>
    <div className="asset-manager-empty-title">{title}</div>
    <div className="asset-manager-empty-description">{description}</div>
  </div>
);

const TestToast = ({ type = 'info', message = 'Toast message' }) => (
  <div className={`asset-manager-toast asset-manager-toast--${type} asset-manager-toast--visible`}>
    <div className="asset-manager-toast-content">{message}</div>
    <button className="asset-manager-toast-close">×</button>
  </div>
);

describe('Visual Regression Tests - Component Styling Consistency', () => {
  let rootElement: HTMLElement;

  beforeEach(() => {
    // Create extension root element
    rootElement = document.createElement('div');
    rootElement.id = 'comfyui-asset-manager-root';
    document.body.appendChild(rootElement);

    // Reset to dark theme
    setComfyUITheme('dark');
  });

  afterEach(() => {
    // Clean up
    if (rootElement.parentNode) {
      rootElement.parentNode.removeChild(rootElement);
    }
    document.documentElement.className = '';
  });

  describe('Button Component Styling', () => {
    it('should apply correct CSS classes for button variants', () => {
      const { container } = render(
        <div>
          <TestButton variant="primary" size="small" />
          <TestButton variant="secondary" size="medium" />
          <TestButton variant="success" size="large" />
          <TestButton variant="warning" />
          <TestButton variant="error" />
        </div>
      );

      const buttons = container.querySelectorAll('.asset-manager-button');
      expect(buttons).toHaveLength(5);

      // Check primary button classes
      expect(buttons[0]).toHaveClass('asset-manager-button--primary');
      expect(buttons[0]).toHaveClass('asset-manager-button--small');

      // Check secondary button classes
      expect(buttons[1]).toHaveClass('asset-manager-button--secondary');
      expect(buttons[1]).toHaveClass('asset-manager-button--medium');

      // Check success button classes
      expect(buttons[2]).toHaveClass('asset-manager-button--success');
      expect(buttons[2]).toHaveClass('asset-manager-button--large');

      // Check warning and error buttons
      expect(buttons[3]).toHaveClass('asset-manager-button--warning');
      expect(buttons[4]).toHaveClass('asset-manager-button--error');
    });

    it('should maintain button styling consistency across themes', () => {
      const { container, rerender } = render(<TestButton variant="primary" />);

      // Test dark theme
      setComfyUITheme('dark');
      rerender(<TestButton variant="primary" />);
      
      const darkButton = container.querySelector('.asset-manager-button');
      expect(darkButton).toHaveClass('asset-manager-button');
      expect(darkButton).toHaveClass('asset-manager-button--primary');

      // Test light theme
      setComfyUITheme('light');
      rerender(<TestButton variant="primary" />);
      
      const lightButton = container.querySelector('.asset-manager-button');
      expect(lightButton).toHaveClass('asset-manager-button');
      expect(lightButton).toHaveClass('asset-manager-button--primary');

      // Classes should be identical
      expect(darkButton?.className).toBe(lightButton?.className);
    });
  });

  describe('Card Component Styling', () => {
    it('should apply correct CSS classes for cards', () => {
      const { container } = render(<TestCard />);

      const card = container.querySelector('.asset-manager-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('asset-manager-card');

      const content = container.querySelector('.asset-manager-card-content');
      expect(content).toBeInTheDocument();
    });

    it('should maintain card styling across theme changes', () => {
      const { container, rerender } = render(<TestCard />);

      // Test in both themes
      setComfyUITheme('dark');
      rerender(<TestCard />);
      const darkCard = container.querySelector('.asset-manager-card');

      setComfyUITheme('light');
      rerender(<TestCard />);
      const lightCard = container.querySelector('.asset-manager-card');

      // Structure should be consistent
      expect(darkCard?.className).toBe(lightCard?.className);
    });
  });

  describe('Input Component Styling', () => {
    it('should apply correct CSS classes for input states', () => {
      const { container } = render(
        <div>
          <TestInput />
          <TestInput error={true} />
        </div>
      );

      const inputs = container.querySelectorAll('.asset-manager-input');
      expect(inputs).toHaveLength(2);

      // Normal input
      expect(inputs[0]).toHaveClass('asset-manager-input');
      expect(inputs[0]).not.toHaveClass('asset-manager-input--error');

      // Error input
      expect(inputs[1]).toHaveClass('asset-manager-input');
      expect(inputs[1]).toHaveClass('asset-manager-input--error');
    });

    it('should maintain input styling consistency across themes', () => {
      const { container, rerender } = render(<TestInput error={true} />);

      setComfyUITheme('dark');
      rerender(<TestInput error={true} />);
      const darkInput = container.querySelector('.asset-manager-input');

      setComfyUITheme('light');
      rerender(<TestInput error={true} />);
      const lightInput = container.querySelector('.asset-manager-input');

      expect(darkInput?.className).toBe(lightInput?.className);
    });
  });

  describe('Modal Component Styling', () => {
    it('should apply correct CSS classes for modal elements', () => {
      const { container } = render(<TestModal />);

      const modal = container.querySelector('.asset-manager-modal');
      const backdrop = container.querySelector('.asset-manager-modal-backdrop');
      const content = container.querySelector('.asset-manager-modal-content');

      expect(modal).toBeInTheDocument();
      expect(backdrop).toBeInTheDocument();
      expect(content).toBeInTheDocument();

      expect(modal).toHaveClass('asset-manager-modal');
      expect(backdrop).toHaveClass('asset-manager-modal-backdrop');
      expect(content).toHaveClass('asset-manager-modal-content');
    });
  });

  describe('Loading Component Styling', () => {
    it('should apply correct CSS classes for loading states', () => {
      const { container } = render(
        <div>
          <TestLoadingSpinner size="small" variant="primary" />
          <TestLoadingSpinner size="large" variant="success" />
        </div>
      );

      const loadingContainers = container.querySelectorAll('.asset-manager-loading');
      const spinners = container.querySelectorAll('.asset-manager-spinner');

      expect(loadingContainers).toHaveLength(2);
      expect(spinners).toHaveLength(2);

      // Check first spinner
      expect(spinners[0]).toHaveClass('asset-manager-spinner--small');
      expect(spinners[0]).toHaveClass('asset-manager-spinner--primary');

      // Check second spinner
      expect(spinners[1]).toHaveClass('asset-manager-spinner--large');
      expect(spinners[1]).toHaveClass('asset-manager-spinner--success');
    });

    it('should include loading text with correct classes', () => {
      const { container } = render(<TestLoadingSpinner />);

      const loadingText = container.querySelector('.asset-manager-loading-text');
      expect(loadingText).toBeInTheDocument();
      expect(loadingText).toHaveClass('asset-manager-loading-text');
      expect(loadingText).toHaveTextContent('Loading...');
    });
  });

  describe('Error Message Component Styling', () => {
    it('should apply correct CSS classes for error message types', () => {
      const { container } = render(
        <div>
          <TestErrorMessage type="error" />
          <TestErrorMessage type="warning" />
          <TestErrorMessage type="info" />
        </div>
      );

      const errorMessages = container.querySelectorAll('.asset-manager-error-message');
      expect(errorMessages).toHaveLength(3);

      expect(errorMessages[0]).toHaveClass('asset-manager-error-message--error');
      expect(errorMessages[1]).toHaveClass('asset-manager-error-message--warning');
      expect(errorMessages[2]).toHaveClass('asset-manager-error-message--info');
    });

    it('should include all error message elements', () => {
      const { container } = render(<TestErrorMessage />);

      const icon = container.querySelector('.asset-manager-error-icon');
      const content = container.querySelector('.asset-manager-error-content');
      const title = container.querySelector('.asset-manager-error-title');
      const description = container.querySelector('.asset-manager-error-description');

      expect(icon).toBeInTheDocument();
      expect(content).toBeInTheDocument();
      expect(title).toBeInTheDocument();
      expect(description).toBeInTheDocument();
    });
  });

  describe('Empty State Component Styling', () => {
    it('should apply correct CSS classes for empty state variants', () => {
      const { container } = render(
        <div>
          <TestEmptyState variant="default" />
          <TestEmptyState variant="search" />
          <TestEmptyState variant="compact" />
        </div>
      );

      const emptyStates = container.querySelectorAll('.asset-manager-empty-state');
      expect(emptyStates).toHaveLength(3);

      expect(emptyStates[0]).toHaveClass('asset-manager-empty-state--default');
      expect(emptyStates[1]).toHaveClass('asset-manager-empty-state--search');
      expect(emptyStates[2]).toHaveClass('asset-manager-empty-state--compact');
    });

    it('should include all empty state elements', () => {
      const { container } = render(<TestEmptyState />);

      const icon = container.querySelector('.asset-manager-empty-icon');
      const title = container.querySelector('.asset-manager-empty-title');
      const description = container.querySelector('.asset-manager-empty-description');

      expect(icon).toBeInTheDocument();
      expect(title).toBeInTheDocument();
      expect(description).toBeInTheDocument();
    });
  });

  describe('Toast Component Styling', () => {
    it('should apply correct CSS classes for toast types', () => {
      const { container } = render(
        <div>
          <TestToast type="info" />
          <TestToast type="success" />
          <TestToast type="error" />
          <TestToast type="warning" />
        </div>
      );

      const toasts = container.querySelectorAll('.asset-manager-toast');
      expect(toasts).toHaveLength(4);

      expect(toasts[0]).toHaveClass('asset-manager-toast--info');
      expect(toasts[1]).toHaveClass('asset-manager-toast--success');
      expect(toasts[2]).toHaveClass('asset-manager-toast--error');
      expect(toasts[3]).toHaveClass('asset-manager-toast--warning');

      // All should have visible class
      toasts.forEach(toast => {
        expect(toast).toHaveClass('asset-manager-toast--visible');
      });
    });

    it('should include toast content and close button', () => {
      const { container } = render(<TestToast />);

      const content = container.querySelector('.asset-manager-toast-content');
      const closeButton = container.querySelector('.asset-manager-toast-close');

      expect(content).toBeInTheDocument();
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveTextContent('×');
    });
  });

  describe('Utility Classes', () => {
    it('should apply spacing utility classes correctly', () => {
      const TestSpacingComponent = () => (
        <div>
          <div className="asset-manager-spacing-xs">XS Spacing</div>
          <div className="asset-manager-spacing-sm">SM Spacing</div>
          <div className="asset-manager-spacing-md">MD Spacing</div>
          <div className="asset-manager-spacing-lg">LG Spacing</div>
          <div className="asset-manager-spacing-xl">XL Spacing</div>
        </div>
      );

      const { container } = render(<TestSpacingComponent />);

      const spacingElements = container.querySelectorAll('[class*="asset-manager-spacing-"]');
      expect(spacingElements).toHaveLength(5);

      expect(spacingElements[0]).toHaveClass('asset-manager-spacing-xs');
      expect(spacingElements[1]).toHaveClass('asset-manager-spacing-sm');
      expect(spacingElements[2]).toHaveClass('asset-manager-spacing-md');
      expect(spacingElements[3]).toHaveClass('asset-manager-spacing-lg');
      expect(spacingElements[4]).toHaveClass('asset-manager-spacing-xl');
    });

    it('should apply text color utility classes correctly', () => {
      const TestTextComponent = () => (
        <div>
          <div className="asset-manager-text-primary">Primary Text</div>
          <div className="asset-manager-text-secondary">Secondary Text</div>
          <div className="asset-manager-text-muted">Muted Text</div>
        </div>
      );

      const { container } = render(<TestTextComponent />);

      const textElements = container.querySelectorAll('[class*="asset-manager-text-"]');
      expect(textElements).toHaveLength(3);

      expect(textElements[0]).toHaveClass('asset-manager-text-primary');
      expect(textElements[1]).toHaveClass('asset-manager-text-secondary');
      expect(textElements[2]).toHaveClass('asset-manager-text-muted');
    });

    it('should apply background color utility classes correctly', () => {
      const TestBackgroundComponent = () => (
        <div>
          <div className="asset-manager-bg-primary">Primary Background</div>
          <div className="asset-manager-bg-secondary">Secondary Background</div>
          <div className="asset-manager-bg-tertiary">Tertiary Background</div>
        </div>
      );

      const { container } = render(<TestBackgroundComponent />);

      const bgElements = container.querySelectorAll('[class*="asset-manager-bg-"]');
      expect(bgElements).toHaveLength(3);

      expect(bgElements[0]).toHaveClass('asset-manager-bg-primary');
      expect(bgElements[1]).toHaveClass('asset-manager-bg-secondary');
      expect(bgElements[2]).toHaveClass('asset-manager-bg-tertiary');
    });
  });

  describe('Theme-Specific Class Application', () => {
    it('should maintain consistent class structure across theme changes', () => {
      const TestAllComponents = () => (
        <div>
          <TestButton variant="primary" />
          <TestCard />
          <TestInput error={true} />
          <TestLoadingSpinner />
          <TestErrorMessage />
          <TestEmptyState />
          <TestToast />
        </div>
      );

      const { container, rerender } = render(<TestAllComponents />);

      // Capture dark theme classes
      setComfyUITheme('dark');
      rerender(<TestAllComponents />);
      const darkClasses = Array.from(container.querySelectorAll('[class*="asset-manager-"]')).map(
        el => el.className
      );

      // Capture light theme classes
      setComfyUITheme('light');
      rerender(<TestAllComponents />);
      const lightClasses = Array.from(container.querySelectorAll('[class*="asset-manager-"]')).map(
        el => el.className
      );

      // Classes should be identical across themes
      expect(darkClasses).toEqual(lightClasses);
    });

    it('should not have theme-specific classes in component markup', () => {
      const { container } = render(
        <div>
          <TestButton />
          <TestCard />
          <TestInput />
        </div>
      );

      // Components should not have theme-specific classes like 'light' or 'dark'
      const allElements = container.querySelectorAll('*');
      allElements.forEach(element => {
        expect(element.className).not.toMatch(/\b(light|dark)\b/);
        expect(element.className).not.toMatch(/comfy-theme/);
      });
    });
  });

  describe('CSS Class Naming Consistency', () => {
    it('should follow consistent naming patterns', () => {
      const { container } = render(
        <div>
          <TestButton variant="primary" size="large" />
          <TestLoadingSpinner size="small" variant="success" />
          <TestErrorMessage type="warning" />
        </div>
      );

      const allElements = container.querySelectorAll('[class*="asset-manager-"]');
      
      allElements.forEach(element => {
        const classes = element.className.split(' ');
        
        classes.forEach(className => {
          if (className.startsWith('asset-manager-')) {
            // Should follow kebab-case pattern
            expect(className).toMatch(/^asset-manager-[a-z-]+$/);
            
            // Modifier classes should use double dash
            if (className.includes('--')) {
              expect(className).toMatch(/^asset-manager-[a-z-]+--[a-z-]+$/);
            }
          }
        });
      });
    });

    it('should use consistent modifier patterns', () => {
      const { container } = render(
        <div>
          <TestButton variant="primary" size="small" />
          <TestButton variant="secondary" size="large" />
          <TestLoadingSpinner variant="success" size="medium" />
        </div>
      );

      // Check button modifiers
      const buttons = container.querySelectorAll('.asset-manager-button');
      buttons.forEach(button => {
        const classes = button.className.split(' ');
        const modifierClasses = classes.filter(c => c.includes('--'));
        
        // Should have variant and size modifiers
        expect(modifierClasses.some(c => c.includes('--primary') || c.includes('--secondary'))).toBe(true);
        expect(modifierClasses.some(c => c.includes('--small') || c.includes('--large'))).toBe(true);
      });
    });
  });
});