/**
 * Test component for verifying theme transition performance
 * This component creates a large number of themed elements to test
 * transition performance with large component trees
 */

import React, { useState, useCallback } from 'react';
import { useComfyUITheme, withOptimizedTransitions } from '../hooks/useComfyUITheme';

interface TransitionTestComponentProps {
  /** Number of test elements to render */
  elementCount?: number;
  /** Whether to show performance metrics */
  showMetrics?: boolean;
}

const TransitionTestComponent: React.FC<TransitionTestComponentProps> = ({
  elementCount = 100,
  showMetrics = false,
}) => {
  const { theme, isTransitioning, setPerformanceMode } = useComfyUITheme();
  const [performanceMode, setPerformanceModeState] = useState(false);
  const [renderTime, setRenderTime] = useState<number | null>(null);

  // Toggle performance mode
  const handlePerformanceModeToggle = useCallback(() => {
    const newMode = !performanceMode;
    setPerformanceModeState(newMode);
    setPerformanceMode(newMode);
  }, [performanceMode, setPerformanceMode]);

  // Test bulk operations with optimized transitions
  const handleBulkOperation = useCallback(async () => {
    const startTime = performance.now();
    
    await withOptimizedTransitions(async () => {
      // Simulate a bulk operation that would normally cause many re-renders
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    const endTime = performance.now();
    setRenderTime(endTime - startTime);
  }, []);

  // Generate test elements
  const testElements = Array.from({ length: elementCount }, (_, index) => (
    <div
      key={index}
      className="asset-manager-card"
      style={{
        padding: '8px',
        margin: '4px',
        minHeight: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span className="asset-manager-text-primary">Test Element {index + 1}</span>
      <div className="asset-manager-button asset-manager-button--small">
        Action
      </div>
    </div>
  ));

  return (
    <div className="asset-manager-component" style={{ padding: '16px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 className="asset-manager-text-primary">Theme Transition Performance Test</h3>
        <p className="asset-manager-text-secondary">
          Current theme: {theme} | Transitioning: {isTransitioning ? 'Yes' : 'No'}
        </p>
      </div>

      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          className="asset-manager-button asset-manager-button--primary"
          onClick={handlePerformanceModeToggle}
        >
          {performanceMode ? 'Disable' : 'Enable'} Performance Mode
        </button>
        
        <button
          className="asset-manager-button asset-manager-button--secondary"
          onClick={handleBulkOperation}
        >
          Test Bulk Operation
        </button>
      </div>

      {showMetrics && (
        <div className="asset-manager-card" style={{ marginBottom: '16px' }}>
          <h4 className="asset-manager-text-primary">Performance Metrics</h4>
          <p className="asset-manager-text-secondary">
            Elements rendered: {elementCount}
          </p>
          <p className="asset-manager-text-secondary">
            Performance mode: {performanceMode ? 'Enabled' : 'Disabled'}
          </p>
          {renderTime !== null && (
            <p className="asset-manager-text-secondary">
              Last bulk operation: {renderTime.toFixed(2)}ms
            </p>
          )}
        </div>
      )}

      <div
        style={{
          maxHeight: '400px',
          overflowY: 'auto',
          border: '1px solid var(--asset-manager-border-primary)',
          borderRadius: 'var(--asset-manager-border-radius-md)',
          padding: '8px',
        }}
      >
        {testElements}
      </div>

      <div style={{ marginTop: '16px' }}>
        <p className="asset-manager-text-secondary" style={{ fontSize: '0.8rem' }}>
          Switch ComfyUI's theme to test transition performance with {elementCount} elements.
          Enable performance mode to disable transitions during bulk operations.
        </p>
      </div>
    </div>
  );
};

export default TransitionTestComponent;