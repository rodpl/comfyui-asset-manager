import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalAssetsTab, ModelBrowserTab, OutputsTab } from './features';
import './App.css';

// Define tab types for better type safety
type TabId = 'local' | 'browse' | 'outputs';

interface Tab {
  id: TabId;
  labelKey: string;
  icon?: string;
}

// Tab configuration
const TABS: Tab[] = [
  { id: 'local', labelKey: 'tabs.localAssets', icon: 'pi pi-folder' },
  { id: 'browse', labelKey: 'tabs.modelBrowser', icon: 'pi pi-search' },
  { id: 'outputs', labelKey: 'tabs.outputs', icon: 'pi pi-images' },
];

// Main App component
const App: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>('local');

  // Memoized tab change handler
  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
  }, []);

  // Render tab content based on active tab
  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'local':
        return <LocalAssetsTab />;
      case 'browse':
        return <ModelBrowserTab />;
      case 'outputs':
        return <OutputsTab />;
      default:
        return null;
    }
  }, [activeTab]);

  return (
    <div className="asset-manager-container">
      <header className="asset-manager-header">
        <h2>{t('app.title')}</h2>
        <p className="app-description">{t('app.description')}</p>
      </header>

      <nav className="tab-navigation" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.icon && <i className={tab.icon} aria-hidden="true"></i>}
            <span>{t(tab.labelKey)}</span>
          </button>
        ))}
      </nav>

      <main
        className="tab-content"
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {renderTabContent()}
      </main>
    </div>
  );
};

export default App;
