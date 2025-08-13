/**
 * Network Status Component
 * Displays network connectivity status and provides user feedback
 */

import React, { useEffect, useState } from 'react';
import { useAssetManager } from '../contexts/AssetManagerContext';
import './NetworkStatus.css';

interface NetworkStatusProps {
  showWhenOnline?: boolean;
  position?: 'top' | 'bottom';
  className?: string;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({
  showWhenOnline = false,
  position = 'top',
  className = '',
}) => {
  const { state } = useAssetManager();
  const [showStatus, setShowStatus] = useState(false);
  const [justWentOnline, setJustWentOnline] = useState(false);

  useEffect(() => {
    if (!state.isOnline) {
      setShowStatus(true);
      setJustWentOnline(false);
    } else if (showWhenOnline || justWentOnline) {
      setShowStatus(true);
      if (justWentOnline) {
        // Hide the "back online" message after 3 seconds
        const timer = setTimeout(() => {
          setShowStatus(false);
          setJustWentOnline(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    } else {
      setShowStatus(false);
    }
  }, [state.isOnline, showWhenOnline, justWentOnline]);

  // Track when we go from offline to online
  useEffect(() => {
    if (state.isOnline && showStatus && !showWhenOnline) {
      setJustWentOnline(true);
    }
  }, [state.isOnline, showStatus, showWhenOnline]);

  if (!showStatus) {
    return null;
  }

  const isOffline = !state.isOnline;
  const statusClass = isOffline ? 'offline' : 'online';
  const positionClass = `position-${position}`;

  return (
    <div className={`network-status ${statusClass} ${positionClass} ${className}`}>
      <div className="network-status-content">
        <div className="network-status-icon">
          {isOffline ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24.24 8.64l-3.12-3.12c-4.8-4.8-12.48-4.8-17.28 0L.72 8.64c-.48.48-.48 1.2 0 1.68l3.12 3.12c4.8 4.8 12.48 4.8 17.28 0l3.12-3.12c.48-.48.48-1.2 0-1.68zM12 16.8c-2.64 0-4.8-2.16-4.8-4.8s2.16-4.8 4.8-4.8 4.8 2.16 4.8 4.8-2.16 4.8-4.8 4.8z" />
              <path d="M2.4 2.4l19.2 19.2" stroke="currentColor" strokeWidth="2" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          )}
        </div>
        <div className="network-status-text">
          {isOffline ? (
            <>
              <strong>You're offline</strong>
              <span>Some features may not be available</span>
            </>
          ) : (
            <>
              <strong>Back online</strong>
              <span>All features are now available</span>
            </>
          )}
        </div>
        {state.lastSync && (
          <div className="network-status-sync">
            Last sync: {state.lastSync.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkStatus;
