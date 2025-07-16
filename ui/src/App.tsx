import { useState } from 'react';
import './App.css';

const App = () => {
  const [activeTab, setActiveTab] = useState('local');

  const renderContent = () => {
    switch (activeTab) {
      case 'local':
        return <div>Local Assets Content</div>;
      case 'browse':
        return <div>Model Browser Content</div>;
      case 'outputs':
        return <div>Outputs Content</div>;
      default:
        return null;
    }
  };

  return (
    <div className="asset-manager">
      <div className="tabs">
        <button
          onClick={() => setActiveTab('local')}
          className={activeTab === 'local' ? 'active' : ''}
        >
          Local Assets
        </button>
        <button
          onClick={() => setActiveTab('browse')}
          className={activeTab === 'browse' ? 'active' : ''}
        >
          Model Browser
        </button>
        <button
          onClick={() => setActiveTab('outputs')}
          className={activeTab === 'outputs' ? 'active' : ''}
        >
          Outputs
        </button>
      </div>
      <div className="tab-content">{renderContent()}</div>
    </div>
  );
};

export default App;
