import React from 'react';
import { useTranslation } from 'react-i18next';
import './OutputsTab.css';

const OutputsTab: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="tab-panel">
      <div className="tab-panel-header">
        <h3>{t('tabs.outputs')}</h3>
        <p>{t('tabs.outputsDescription')}</p>
      </div>
      <div className="tab-panel-content">
        <div className="placeholder-content">
          <i className="pi pi-images" style={{ fontSize: '3rem', opacity: 0.5 }}></i>
          <p>{t('content.outputs.placeholder')}</p>
        </div>
      </div>
    </div>
  );
};

export default OutputsTab;
