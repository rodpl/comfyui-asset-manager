import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalAssetsTab, ModelBrowserTab, OutputsTab } from './features';
import './App.css';
import { ThemeDemo } from './components';

// Define tab types for better type safety
type TabId = 'local' | 'browse' | 'outputs' | 'theme';

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
  { id: 'theme', labelKey: 'tabs.theme', icon: 'pi pi-palette' },
];

// Main App component
const App = () => {
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
      case 'theme':
        return <ThemeDemo />;
      default:
        return null;
    }
  }, [activeTab]);

  return (
    <div className="asset-manager-container h-full">
      <div className="comfy-vue-side-bar-container flex flex-col h-full">
        <div className="comfy-vue-side-bar-header">
          <div
            className="p-toolbar p-component border-x-0 border-t-0 rounded-none px-2 py-1 min-h-8"
            role="toolbar"
          >
            <div className="p-toolbar-start">
              <span className="text-xs 2xl:text-sm truncate" title="{t('app.title.)}">
                {t('app.title').toUpperCase()}
              </span>
            </div>
            <div className="p-toolbar-center"></div>
            <div className="p-toolbar-end"></div>
          </div>
        </div>
      </div>

      <nav className="tab-navigation" role="tablist" data-testid="am-tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
            data-testid={`tab-${tab.id}`}
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
