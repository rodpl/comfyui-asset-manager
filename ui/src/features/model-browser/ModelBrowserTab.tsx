import React from 'react';
import { useTranslation } from 'react-i18next';
import './ModelBrowserTab.css';

const ModelBrowserTab: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="tab-panel">
      <div className="tab-panel-header">
        <h3>{t('tabs.modelBrowser')}</h3>
        <p>{t('tabs.modelBrowserDescription')}</p>
      </div>
      <div className="tab-panel-content">
        <div className="placeholder-content">
          <i className="pi pi-search" style={{ fontSize: '3rem', opacity: 0.5 }}></i>
          <p>{t('content.modelBrowser.placeholder')}</p>
        </div>
      </div>
    </div>
  );
};

export default ModelBrowserTab;
