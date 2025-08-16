/**
 * Theme Demo Component
 * Demonstrates the CSS-based theme system with various themed components
 */

import './ThemeDemo.css';

interface ThemeDemoProps {
  className?: string;
}

export const ThemeDemo = ({ className = '' }: ThemeDemoProps) => {
  return (
    <div className={`theme-demo ${className}`}>
      <h3 className="asset-manager-text-primary">Theme System Demo</h3>
      <p className="asset-manager-text-secondary">
        This demonstrates the CSS-based theme system that automatically adapts to ComfyUI's
        light/dark theme.
      </p>

      {/* Button Examples */}
      <div className="demo-section">
        <h4 className="asset-manager-text-primary">Buttons</h4>
        <div className="demo-buttons">
          <button className="asset-manager-button">Default Button</button>
          <button className="asset-manager-button asset-manager-button--primary">
            Primary Button
          </button>
          <button className="asset-manager-button asset-manager-button--secondary">
            Secondary Button
          </button>
          <button className="asset-manager-button asset-manager-button--success">
            Success Button
          </button>
          <button className="asset-manager-button asset-manager-button--warning">
            Warning Button
          </button>
          <button className="asset-manager-button asset-manager-button--error">Error Button</button>
        </div>
      </div>

      {/* Input Examples */}
      <div className="demo-section">
        <h4 className="asset-manager-text-primary">Inputs</h4>
        <div className="demo-inputs">
          <input className="asset-manager-input" type="text" placeholder="Enter text here..." />
          <input className="asset-manager-input" type="search" placeholder="Search models..." />
        </div>
      </div>

      {/* Card Examples */}
      <div className="demo-section">
        <h4 className="asset-manager-text-primary">Cards</h4>
        <div className="demo-cards">
          <div className="asset-manager-card">
            <h5 className="asset-manager-text-primary">Model Card</h5>
            <p className="asset-manager-text-secondary">
              This is a sample model card that adapts to the theme.
            </p>
            <div className="card-actions">
              <button className="asset-manager-button asset-manager-button--primary">
                Download
              </button>
              <button className="asset-manager-button">Details</button>
            </div>
          </div>
          <div className="asset-manager-card">
            <h5 className="asset-manager-text-primary">Another Card</h5>
            <p className="asset-manager-text-secondary">
              Cards automatically inherit theme colors and transitions.
            </p>
          </div>
        </div>
      </div>

      {/* Status Examples */}
      <div className="demo-section">
        <h4 className="asset-manager-text-primary">Status Indicators</h4>
        <div className="demo-status">
          <div className="asset-manager-component asset-manager-success asset-manager-padding-sm">
            <span>✓ Success status</span>
          </div>
          <div className="asset-manager-component asset-manager-warning asset-manager-padding-sm">
            <span>⚠ Warning status</span>
          </div>
          <div className="asset-manager-component asset-manager-error asset-manager-padding-sm">
            <span>✗ Error status</span>
          </div>
          <div className="asset-manager-component asset-manager-info asset-manager-padding-sm">
            <span>ℹ Info status</span>
          </div>
        </div>
      </div>

      {/* Loading Example */}
      <div className="demo-section">
        <h4 className="asset-manager-text-primary">Loading States</h4>
        <div className="demo-loading">
          <div className="asset-manager-spinner" style={{ width: '32px', height: '32px' }}></div>
          <span className="asset-manager-loading asset-manager-spacing-sm">Loading content...</span>
        </div>
      </div>
    </div>
  );
};

export default ThemeDemo;
