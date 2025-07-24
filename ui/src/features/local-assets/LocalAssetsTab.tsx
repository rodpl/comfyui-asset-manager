import React from 'react';
import { useTranslation } from 'react-i18next';
import './LocalAssetsTab.css';

const LocalAssetsTab: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="tab-panel">
      <div className="tab-panel-header">
        <h3>{t('tabs.localAssets')}</h3>
        <p>{t('tabs.localAssetsDescription')}</p>
      </div>
      <div className="tab-panel-content">
        <div className="placeholder-content">
          <i className="pi pi-folder" style={{ fontSize: '3rem', opacity: 0.5 }}></i>
          <p>{t('content.localAssets.placeholder')}</p>
        </div>
      </div>
    </div>
  );
};

export default LocalAssetsTab;
