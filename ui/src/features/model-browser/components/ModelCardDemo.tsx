import React from 'react';
import ModelCard from './ModelCard';
import { ExternalModel, ComfyUIModelType } from '../types';

// Demo component to showcase the ModelCard component
const ModelCardDemo: React.FC = () => {
  const demoModels: ExternalModel[] = [
    {
      id: 'civitai-1',
      name: 'Realistic Vision V5.1',
      description: 'A photorealistic model that produces high-quality, detailed images with excellent lighting and composition.',
      author: 'SG_161222',
      platform: 'civitai',
      thumbnailUrl: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/78fd2a0a-42b6-42b0-9c7c-9f4d5a5c5c5c/width=450/00001-28328.jpeg',
      tags: ['photorealistic', 'portrait', 'photography'],
      downloadCount: 125000,
      rating: 4.8,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-06-15T00:00:00Z',
      metadata: {},
      comfyuiCompatibility: {
        isCompatible: true,
        modelFolder: 'checkpoints',
        compatibilityNotes: 'Fully compatible with ComfyUI',
        requiredNodes: []
      },
      modelType: ComfyUIModelType.CHECKPOINT,
      baseModel: 'SD 1.5',
      fileSize: 2048000000, // 2GB
      fileFormat: 'safetensors'
    },
    {
      id: 'huggingface-1',
      name: 'stable-diffusion-xl-base-1.0',
      description: 'SDXL is a latent diffusion model for text-to-image synthesis.',
      author: 'stabilityai',
      platform: 'huggingface',
      thumbnailUrl: undefined, // No thumbnail to test placeholder
      tags: ['text-to-image', 'diffusion', 'stable-diffusion'],
      downloadCount: 50000,
      rating: 4.5,
      createdAt: '2023-07-01T00:00:00Z',
      updatedAt: '2023-07-26T00:00:00Z',
      metadata: {},
      comfyuiCompatibility: {
        isCompatible: true,
        modelFolder: 'checkpoints',
        requiredNodes: []
      },
      modelType: ComfyUIModelType.CHECKPOINT,
      baseModel: 'SDXL 1.0',
      fileSize: 6800000000, // 6.8GB
      fileFormat: 'safetensors'
    },
    {
      id: 'civitai-2',
      name: 'Detail Tweaker LoRA',
      description: 'A LoRA that enhances fine details in generated images.',
      author: 'DetailMaster',
      platform: 'civitai',
      thumbnailUrl: 'https://image.civitai.com/example-lora-thumbnail.jpg',
      tags: ['lora', 'detail', 'enhancement'],
      downloadCount: 15000,
      rating: 4.2,
      createdAt: '2023-08-01T00:00:00Z',
      updatedAt: '2023-08-15T00:00:00Z',
      metadata: {},
      comfyuiCompatibility: {
        isCompatible: true,
        modelFolder: 'loras',
        requiredNodes: []
      },
      modelType: ComfyUIModelType.LORA,
      baseModel: 'SD 1.5',
      fileSize: 144000000, // 144MB
      fileFormat: 'safetensors'
    },
    {
      id: 'huggingface-2',
      name: 'incompatible-model',
      description: 'A model that is not compatible with ComfyUI.',
      author: 'testuser',
      platform: 'huggingface',
      thumbnailUrl: undefined,
      tags: ['experimental', 'research'],
      downloadCount: 500,
      rating: undefined,
      createdAt: '2023-09-01T00:00:00Z',
      updatedAt: '2023-09-01T00:00:00Z',
      metadata: {},
      comfyuiCompatibility: {
        isCompatible: false,
        compatibilityNotes: 'Requires custom nodes not available in ComfyUI',
        requiredNodes: ['custom-experimental-node']
      },
      modelType: ComfyUIModelType.UNKNOWN,
      fileSize: undefined,
      fileFormat: 'bin'
    }
  ];

  const handleModelClick = (model: ExternalModel) => {
    console.log('Model clicked:', model.name);
  };

  const handleModelDragStart = (model: ExternalModel) => {
    console.log('Model drag started:', model.name);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>ModelCard Component Demo</h2>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '20px',
        marginTop: '20px'
      }}>
        {demoModels.map((model) => (
          <ModelCard
            key={model.id}
            model={model}
            onClick={handleModelClick}
            onDragStart={handleModelDragStart}
            draggable={true}
          />
        ))}
      </div>
    </div>
  );
};

export default ModelCardDemo;