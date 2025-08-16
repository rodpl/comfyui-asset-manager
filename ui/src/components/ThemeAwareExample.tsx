/**
 * Example component demonstrating useComfyUITheme hook usage
 * This is for demonstration purposes only - most components should use CSS variables instead
 */

import React from 'react';
import { useComfyUITheme, useThemeValue, useThemeConditional } from '../hooks/useComfyUITheme';

export const ThemeAwareExample: React.FC = () => {
  const { isLight, isDark, theme, refresh } = useComfyUITheme();

  // Example of using useThemeValue for conditional values
  const iconName = useThemeValue('pi-sun', 'pi-moon');
  const statusMessage = useThemeValue('Light theme active', 'Dark theme active');

  // Example of using useThemeConditional for conditional rendering
  const renderForTheme = useThemeConditional();

  return (
    <div className="asset-manager-component" style={{ padding: '1rem' }}>
      <h3>Theme Detection Example</h3>

      <div style={{ marginBottom: '1rem' }}>
        <p>
          <strong>Current Theme:</strong> {theme}
        </p>
        <p>
          <strong>Is Light:</strong> {isLight ? 'Yes' : 'No'}
        </p>
        <p>
          <strong>Is Dark:</strong> {isDark ? 'Yes' : 'No'}
        </p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <p>
          <i className={`pi ${iconName}`} style={{ marginRight: '0.5rem' }} />
          {statusMessage}
        </p>
      </div>

      {/* Conditional rendering examples */}
      {renderForTheme(
        'light',
        <div className="asset-manager-card" style={{ padding: '0.5rem', marginBottom: '0.5rem' }}>
          <p>🌞 This content only shows in light theme!</p>
        </div>
      )}

      {renderForTheme(
        'dark',
        <div className="asset-manager-card" style={{ padding: '0.5rem', marginBottom: '0.5rem' }}>
          <p>🌙 This content only shows in dark theme!</p>
        </div>
      )}

      {/* Manual refresh button for testing */}
      <button
        className="asset-manager-button asset-manager-button--small"
        onClick={refresh}
        style={{ marginTop: '1rem' }}
      >
        Refresh Theme Detection
      </button>

      <div
        style={{
          marginTop: '1rem',
          fontSize: '0.875rem',
          color: 'var(--asset-manager-text-secondary)',
        }}
      >
        <p>
          <strong>Note:</strong> This component is for demonstration only.
        </p>
        <p>
          Most components should use CSS variables for automatic theme adaptation instead of
          JavaScript.
        </p>
      </div>
    </div>
  );
};

export default ThemeAwareExample;
