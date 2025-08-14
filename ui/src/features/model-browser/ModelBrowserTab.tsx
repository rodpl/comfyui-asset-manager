import React, { useState, useCallback, ErrorInfo } from 'react';
import { useTranslation } from 'react-i18next';
import CivitAIBrowser from './components/CivitAIBrowser';
import HuggingFaceBrowser from './components/HuggingFaceBrowser';
import ModelDetailModal from './components/ModelDetailModal';
import { ExternalModel } from './types';
import './ModelBrowserTab.css';

// Error Boundary Component
class SubTabErrorBoundary extends React.Component<
  { children: React.ReactNode; tabName: string; onRetry: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; tabName: string; onRetry: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in ${this.props.tabName} tab:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="sub-tab-error-boundary">
          <div className="error-content">
            <div className="error-icon">
              <i className="pi pi-exclamation-triangle" />
            </div>
            <h3>Something went wrong in {this.props.tabName}</h3>
            <p className="error-message">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="error-actions">
              <button
                className="p-button p-button-primary"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  this.props.onRetry();
                }}
              >
                <i className="pi pi-refresh" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

type SubTab = 'civitai' | 'huggingface';

interface SubTabState {
  activeTab: SubTab;
  tabStates: {
    [K in SubTab]: {
      scrollPosition: number;
      searchQuery: string;
      lastVisited: number;
    };
  };
}

// interface SharedSearchContext {
//   globalSearchQuery: string;
//   searchHistory: string[];
// }

const ModelBrowserTab: React.FC = () => {
  const { t } = useTranslation();

  // Sub-tab state management
  const [subTabState, setSubTabState] = useState<SubTabState>({
    activeTab: 'civitai',
    tabStates: {
      civitai: {
        scrollPosition: 0,
        searchQuery: '',
        lastVisited: Date.now(),
      },
      huggingface: {
        scrollPosition: 0,
        searchQuery: '',
        lastVisited: 0,
      },
    },
  });

  // Shared search context (for future implementation)
  // const [sharedSearchContext, setSharedSearchContext] = useState<SharedSearchContext>({
  //   globalSearchQuery: '',
  //   searchHistory: [],
  // });

  // Model detail modal state
  const [selectedModel, setSelectedModel] = useState<ExternalModel | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle sub-tab switching
  const handleSubTabChange = useCallback((tab: SubTab) => {
    if (tab === subTabState.activeTab) return;

    setSubTabState(prev => ({
      ...prev,
      activeTab: tab,
      tabStates: {
        ...prev.tabStates,
        [tab]: {
          ...prev.tabStates[tab],
          lastVisited: Date.now(),
        },
      },
    }));
  }, [subTabState.activeTab]);

  // Update tab state (for preserving scroll position and search - future implementation)
  // const updateTabState = useCallback((tab: SubTab, updates: Partial<SubTabState['tabStates'][SubTab]>) => {
  //   setSubTabState(prev => ({
  //     ...prev,
  //     tabStates: {
  //       ...prev.tabStates,
  //       [tab]: {
  //         ...prev.tabStates[tab],
  //         ...updates,
  //       },
  //     },
  //   }));
  // }, []);

  // Handle model selection for detail modal
  const handleModelClick = useCallback((model: ExternalModel) => {
    setSelectedModel(model);
    setIsModalOpen(true);
  }, []);

  // Handle model drag start (for future drag-and-drop functionality)
  const handleModelDragStart = useCallback((model: ExternalModel) => {
    console.log('Model drag started:', model.name);
    // Future implementation: set drag data for ComfyUI integration
  }, []);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedModel(null);
  }, []);

  // Handle error boundary retry
  const handleErrorRetry = useCallback(() => {
    // Force re-render by updating last visited time
    setSubTabState(prev => ({
      ...prev,
      tabStates: {
        ...prev.tabStates,
        [prev.activeTab]: {
          ...prev.tabStates[prev.activeTab],
          lastVisited: Date.now(),
        },
      },
    }));
  }, []);

  return (
    <div className="tab-panel">
      <div className="tab-panel-header">
        <h3>{t('tabs.modelBrowser')}</h3>
        <p>{t('tabs.modelBrowserDescription')}</p>
      </div>
      
      {/* Sub-tab Navigation */}
      <div className="model-browser-sub-tabs">
        <div className="sub-tab-nav">
          <button
            className={`sub-tab-button ${subTabState.activeTab === 'civitai' ? 'active' : ''}`}
            onClick={() => handleSubTabChange('civitai')}
            type="button"
          >
            <i className="pi pi-globe" />
            <span>{t('modelBrowser.civitai.title')}</span>
          </button>
          <button
            className={`sub-tab-button ${subTabState.activeTab === 'huggingface' ? 'active' : ''}`}
            onClick={() => handleSubTabChange('huggingface')}
            type="button"
          >
            <i className="pi pi-github" />
            <span>{t('modelBrowser.huggingface.title')}</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Content */}
      <div className="tab-panel-content">
        <div className="sub-tab-content">
          {subTabState.activeTab === 'civitai' && (
            <div className="sub-tab-panel civitai-panel">
              <SubTabErrorBoundary tabName="CivitAI" onRetry={handleErrorRetry}>
                <CivitAIBrowser
                  onModelClick={handleModelClick}
                  onModelDragStart={handleModelDragStart}
                  className="civitai-browser-integrated"
                />
              </SubTabErrorBoundary>
            </div>
          )}
          
          {subTabState.activeTab === 'huggingface' && (
            <div className="sub-tab-panel huggingface-panel">
              <SubTabErrorBoundary tabName="HuggingFace" onRetry={handleErrorRetry}>
                <HuggingFaceBrowser
                  onModelClick={handleModelClick}
                  onModelDragStart={handleModelDragStart}
                  className="huggingface-browser-integrated"
                />
              </SubTabErrorBoundary>
            </div>
          )}
        </div>
      </div>

      {/* Model Detail Modal */}
      {selectedModel && (
        <ModelDetailModal
          model={selectedModel}
          isOpen={isModalOpen}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default ModelBrowserTab;
