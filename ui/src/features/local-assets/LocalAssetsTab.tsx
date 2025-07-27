import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ModelGrid, ModelInfo, ModelType } from './components';
import './LocalAssetsTab.css';

const LocalAssetsTab: React.FC = () => {
  const { t } = useTranslation();
  const [selectedModel, setSelectedModel] = useState<ModelInfo | null>(null);

  // Demo data - in real implementation this would come from API
  const demoModels: ModelInfo[] = [
    {
      id: '1',
      name: 'Realistic Vision V6.0',
      filePath: '/models/checkpoints/realisticVisionV60_v60B1VAE.safetensors',
      fileSize: 2147483648, // 2GB
      createdAt: new Date('2024-01-01'),
      modifiedAt: new Date('2024-01-15'),
      modelType: ModelType.CHECKPOINT,
      hash: 'abc123def456',
      folder: 'checkpoints',
      thumbnail:
        'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/78fd2a0a-42b6-42b0-9c25-4b7f8c4c0e0e/width=450/00012-28328108.jpeg',
    },
    {
      id: '2',
      name: 'Detail Tweaker LoRA',
      filePath: '/models/loras/add_detail.safetensors',
      fileSize: 134217728, // 128MB
      createdAt: new Date('2024-01-02'),
      modifiedAt: new Date('2024-01-16'),
      modelType: ModelType.LORA,
      hash: 'def456ghi789',
      folder: 'loras',
    },
    {
      id: '3',
      name: 'VAE-ft-mse-840000-ema-pruned',
      filePath: '/models/vae/vae-ft-mse-840000-ema-pruned.safetensors',
      fileSize: 335544320, // 320MB
      createdAt: new Date('2024-01-03'),
      modifiedAt: new Date('2024-01-17'),
      modelType: ModelType.VAE,
      hash: 'ghi789jkl012',
      folder: 'vae',
    },
  ];

  const handleModelSelect = (model: ModelInfo) => {
    setSelectedModel(model);
    console.log('Selected model:', model);
  };

  const handleModelDrag = (model: ModelInfo) => {
    console.log('Dragging model:', model);
  };

  return (
    <div className="tab-panel">
      <div className="tab-panel-header">
        <h3>{t('tabs.localAssets')}</h3>
        <p>{t('tabs.localAssetsDescription')}</p>
      </div>
      <div
        className="tab-panel-content"
        style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        <ModelGrid
          models={demoModels}
          loading={false}
          onModelSelect={handleModelSelect}
          onModelDrag={handleModelDrag}
        />
        {selectedModel && (
          <div
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              background: 'var(--surface-card)',
              border: '1px solid var(--surface-border)',
              borderRadius: '8px',
              padding: '12px',
              maxWidth: '300px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>Selected Model</h4>
            <p style={{ margin: '0', fontSize: '0.8rem', color: 'var(--text-color-secondary)' }}>
              {selectedModel.name} ({selectedModel.modelType})
            </p>
            <button
              onClick={() => setSelectedModel(null)}
              style={{
                marginTop: '8px',
                padding: '4px 8px',
                fontSize: '0.7rem',
                background: 'var(--primary-color)',
                color: 'var(--primary-color-text)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocalAssetsTab;
