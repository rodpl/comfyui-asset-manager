/**
 * Theme Demo Component
 * Demonstrates the CSS-based theme system with various themed components
 */

import './ThemeDemo.css';
import { InteractiveElementsDemo } from './InteractiveElementsDemo';
import TransitionTestComponent from './TransitionTestComponent';

interface ThemeDemoProps {
  className?: string;
}

export const ThemeDemo = ({ className = '' }: ThemeDemoProps) => {
  return (
    <div className={`theme-demo ${className}`}>
      <h3 className="asset-manager-text-primary">Theme System Demo</h3>
      <p className="asset-manager-text-secondary">
        This demonstrates the CSS-based theme system that automatically adapts to ComfyUI's
        light/dark theme. All interactive elements use ComfyUI's CSS custom properties with fallback values.
      </p>

      {/* Comprehensive Interactive Elements Demo */}
      <InteractiveElementsDemo />

      {/* Theme Transition Performance Test */}
      <div className="demo-section">
        <TransitionTestComponent elementCount={50} showMetrics={true} />
      </div>

      {/* Original Simple Examples for Quick Reference */}
      <div className="demo-section">
        <h4 className="asset-manager-text-primary">Quick Reference</h4>
        <p className="asset-manager-text-secondary">
          Basic examples showing theme adaptation:
        </p>
        
        <div className="demo-buttons">
          <button className="asset-manager-button">Default</button>
          <button className="asset-manager-button asset-manager-button--primary">Primary</button>
          <input className="asset-manager-input" type="text" placeholder="Theme-aware input..." />
        </div>
        
        <div className="asset-manager-card" style={{ marginTop: '1rem' }}>
          <h5 className="asset-manager-text-primary">Theme-Aware Card</h5>
          <p className="asset-manager-text-secondary">
            This card automatically adapts to ComfyUI's theme changes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ThemeDemo;
