import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FolderNavigation from './FolderNavigation';
import { ModelFolder, ModelType } from './types';
import './LocalAssetsTab.css';

// Mock data for demonstration
const mockFolders: ModelFolder[] = [
  {
    id: 'checkpoints',
    name: 'checkpoints',
    path: '/models/checkpoints',
    modelType: ModelType.CHECKPOINT,
    modelCount: 15,
  },
  {
    id: 'loras',
    name: 'loras',
    path: '/models/loras',
    modelType: ModelType.LORA,
    modelCount: 8,
  },
  {
    id: 'vae',
    name: 'vae',
    path: '/models/vae',
    modelType: ModelType.VAE,
    modelCount: 3,
  },
  {
    id: 'embeddings',
    name: 'embeddings',
    path: '/models/embeddings',
    modelType: ModelType.EMBEDDING,
    modelCount: 12,
  },
  {
    id: 'controlnet',
    name: 'controlnet',
    path: '/models/controlnet',
    modelType: ModelType.CONTROLNET,
    modelCount: 5,
  },
  {
    id: 'upscaler',
    name: 'upscaler',
    path: '/models/upscaler',
    modelType: ModelType.UPSCALER,
    modelCount: 2,
  },
];

const LocalAssetsTab: React.FC = () => {
  const { t } = useTranslation();
  const [selectedFolder, setSelectedFolder] = useState<string>('checkpoints');
  const [loading] = useState<boolean>(false);

  const handleFolderSelect = (folderId: string) => {
    setSelectedFolder(folderId);
    console.log('Selected folder:', folderId);
  };

  return (
    <div className="tab-panel">
      <div className="tab-panel-header">
        <h3>{t('tabs.localAssets')}</h3>
        <p>{t('tabs.localAssetsDescription')}</p>
      </div>
      <div className="tab-panel-content">
        <div className="local-assets-container">
          <div className="local-assets-layout">
            <FolderNavigation
              folders={mockFolders}
              selectedFolder={selectedFolder}
              onFolderSelect={handleFolderSelect}
              loading={loading}
            />
            <div className="local-assets-main">
              <div className="placeholder-content">
                <i className="pi pi-folder" style={{ fontSize: '3rem', opacity: 0.5 }}></i>
                <p>
                  {selectedFolder
                    ? `Models for ${mockFolders.find((f) => f.id === selectedFolder)?.name || selectedFolder} will be displayed here`
                    : t('content.localAssets.placeholder')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalAssetsTab;
