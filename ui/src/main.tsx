import { ComfyApp } from '@comfyorg/comfyui-frontend-types';
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { useTranslation } from 'react-i18next';

import './index.css';
import './utils/i18n';

// Declare global ComfyUI objects
declare global {
  interface Window {
    app?: ComfyApp;
  }
}

// Lazy load the App component for better performance
const App = React.lazy(() => import('./App'));

// Ensure the built entry CSS (extracted by Vite as main.css) is loaded when running inside ComfyUI
function ensureGlobalStylesLoaded(): void {
  const linkId = 'comfyui-asset-manager-global-styles';
  if (!document.getElementById(linkId)) {
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = '/asset_manager/main.css';
    document.head.appendChild(link);
  }
}

// Function to wait for document and app to be ready
function waitForInit(): Promise<void> {
  return new Promise((resolve) => {
    // Check if document is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkApp);
    } else {
      checkApp();
    }

    // Check if app is available
    function checkApp() {
      if (window.app) {
        resolve();
      } else {
        // Poll for app availability
        const interval = setInterval(() => {
          if (window.app) {
            console.log('App initialized');
            clearInterval(interval);
            resolve();
          }
        }, 50);

        // Set timeout to avoid infinite polling
        setTimeout(() => {
          clearInterval(interval);
          console.error('Timeout waiting for app to initialize');
          resolve(); // Continue anyway to avoid blocking
        }, 5000);
      }
    }
  });
}

// Initialize the extension once everything is ready
async function initializeExtension(): Promise<void> {
  try {
    // Wait for document and ComfyUI app
    await waitForInit();

    // Load global styles extracted by Vite (since there's no HTML to inject them)
    ensureGlobalStylesLoaded();

    if (!window.app) {
      console.error('ComfyUI app not available');
      return;
    }

    // Create a function component with i18n for translation
    function SidebarWrapper() {
      // Using useTranslation hook to initialize i18n context
      useTranslation();
      return <App />;
    }

    // Register the sidebar tab using ComfyUI's extension API
    const sidebarTab = {
      id: 'comfyui-asset-manager',
      icon: 'pi pi-server', // Using PrimeVue icon
      title: 'Asset Manager',
      tooltip: 'Asset Manager for ComfyUI',
      type: 'custom' as const,
      render: (element: HTMLElement) => {
        console.log('Rendering Asset Manager Model Browser Extension');
        // Ensure styles are present even if this callback runs before initializeExtension
        ensureGlobalStylesLoaded();
        // Create a container for our React app
        const container = document.createElement('div');
        container.id = 'comfyui-asset-manager-root';
        container.style.height = '100%';
        element.appendChild(container);

        // Mount the React app to the container
        ReactDOM.createRoot(container).render(
          <React.StrictMode>
            <Suspense fallback={<div>Loading...</div>}>
              <SidebarWrapper />
            </Suspense>
          </React.StrictMode>
        );
      },
    };

    window.app.extensionManager.registerSidebarTab(sidebarTab);

    // Register extension with about page badges
    window.app.registerExtension({
      name: 'rodpl.AssetManager',
      // About Panel Badges API - Adds custom badges to the ComfyUI about page
      aboutPageBadges: [
        {
          label: 'Asset Manager',
          url: 'https://github.com/rodpl/comfyui-asset-manager',
          icon: 'pi pi-github',
        },
      ],
    });

    console.log('Asset Manager Extension initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Asset Manager Extension:', error);
  }
}

// Start initialization
void initializeExtension();
