// Mock data for Output Gallery feature
import { Output } from './types';

export const mockOutputs: Output[] = [
  {
    id: 'output-1',
    filename: 'ComfyUI_00001_.png',
    filePath: '/output/ComfyUI_00001_.png',
    fileSize: 2457600, // 2.4MB
    createdAt: new Date('2024-01-25T14:30:00Z'),
    modifiedAt: new Date('2024-01-25T14:30:00Z'),
    imageWidth: 1024,
    imageHeight: 1024,
    fileFormat: 'png',
    thumbnailPath: '/output/thumbnails/ComfyUI_00001_.png',
    workflowMetadata: {
      prompt: 'A beautiful landscape with mountains and a lake',
      model: 'Realistic Vision V5.1',
      steps: 20,
      cfg: 7.5,
      sampler: 'DPM++ 2M Karras',
      seed: 123456789,
    },
  },
  {
    id: 'output-2',
    filename: 'ComfyUI_00002_.jpg',
    filePath: '/output/ComfyUI_00002_.jpg',
    fileSize: 1843200, // 1.8MB
    createdAt: new Date('2024-01-25T13:45:00Z'),
    modifiedAt: new Date('2024-01-25T13:45:00Z'),
    imageWidth: 768,
    imageHeight: 1024,
    fileFormat: 'jpg',
    thumbnailPath: '/output/thumbnails/ComfyUI_00002_.jpg',
    workflowMetadata: {
      prompt: 'Portrait of a young woman with flowing hair',
      model: 'DreamShaper XL',
      steps: 25,
      cfg: 8.0,
      sampler: 'Euler a',
      seed: 987654321,
    },
  },
  {
    id: 'output-3',
    filename: 'ComfyUI_00003_.png',
    filePath: '/output/ComfyUI_00003_.png',
    fileSize: 3145728, // 3MB
    createdAt: new Date('2024-01-25T12:15:00Z'),
    modifiedAt: new Date('2024-01-25T12:15:00Z'),
    imageWidth: 1536,
    imageHeight: 1024,
    fileFormat: 'png',
    thumbnailPath: '/output/thumbnails/ComfyUI_00003_.png',
    workflowMetadata: {
      prompt: 'Cyberpunk cityscape at night with neon lights',
      model: 'Realistic Vision V5.1',
      steps: 30,
      cfg: 7.0,
      sampler: 'DPM++ SDE Karras',
      seed: 456789123,
    },
  },
  {
    id: 'output-4',
    filename: 'ComfyUI_00004_.webp',
    filePath: '/output/ComfyUI_00004_.webp',
    fileSize: 1572864, // 1.5MB
    createdAt: new Date('2024-01-25T11:30:00Z'),
    modifiedAt: new Date('2024-01-25T11:30:00Z'),
    imageWidth: 512,
    imageHeight: 768,
    fileFormat: 'webp',
    thumbnailPath: '/output/thumbnails/ComfyUI_00004_.webp',
    workflowMetadata: {
      prompt: 'Abstract art with geometric shapes and vibrant colors',
      model: 'DreamShaper XL',
      steps: 15,
      cfg: 6.5,
      sampler: 'DDIM',
      seed: 789123456,
    },
  },
  {
    id: 'output-5',
    filename: 'ComfyUI_00005_.png',
    filePath: '/output/ComfyUI_00005_.png',
    fileSize: 2097152, // 2MB
    createdAt: new Date('2024-01-25T10:45:00Z'),
    modifiedAt: new Date('2024-01-25T10:45:00Z'),
    imageWidth: 1024,
    imageHeight: 768,
    fileFormat: 'png',
    workflowMetadata: {
      prompt: 'Fantasy dragon flying over a medieval castle',
      model: 'Realistic Vision V5.1',
      steps: 28,
      cfg: 8.5,
      sampler: 'DPM++ 2M',
      seed: 321654987,
    },
  },
  {
    id: 'output-6',
    filename: 'ComfyUI_00006_.jpg',
    filePath: '/output/ComfyUI_00006_.jpg',
    fileSize: 1310720, // 1.25MB
    createdAt: new Date('2024-01-25T09:20:00Z'),
    modifiedAt: new Date('2024-01-25T09:20:00Z'),
    imageWidth: 768,
    imageHeight: 768,
    fileFormat: 'jpg',
    thumbnailPath: '/output/thumbnails/ComfyUI_00006_.jpg',
    workflowMetadata: {
      prompt: 'Serene forest path with sunlight filtering through trees',
      model: 'DreamShaper XL',
      steps: 22,
      cfg: 7.2,
      sampler: 'Euler',
      seed: 654987321,
    },
  },
  {
    id: 'output-7',
    filename: 'ComfyUI_00007_.png',
    filePath: '/output/ComfyUI_00007_.png',
    fileSize: 4194304, // 4MB
    createdAt: new Date('2024-01-24T16:30:00Z'),
    modifiedAt: new Date('2024-01-24T16:30:00Z'),
    imageWidth: 1536,
    imageHeight: 1536,
    fileFormat: 'png',
    thumbnailPath: '/output/thumbnails/ComfyUI_00007_.png',
    workflowMetadata: {
      prompt: 'Detailed architectural drawing of a modern building',
      model: 'Realistic Vision V5.1',
      steps: 35,
      cfg: 9.0,
      sampler: 'DPM++ 2M Karras',
      seed: 147258369,
    },
  },
  {
    id: 'output-8',
    filename: 'ComfyUI_00008_.jpg',
    filePath: '/output/ComfyUI_00008_.jpg',
    fileSize: 1048576, // 1MB
    createdAt: new Date('2024-01-24T15:15:00Z'),
    modifiedAt: new Date('2024-01-24T15:15:00Z'),
    imageWidth: 512,
    imageHeight: 512,
    fileFormat: 'jpg',
    workflowMetadata: {
      prompt: 'Minimalist still life with fruits on a table',
      model: 'DreamShaper XL',
      steps: 18,
      cfg: 6.8,
      sampler: 'LMS',
      seed: 963852741,
    },
  },
  {
    id: 'output-9',
    filename: 'ComfyUI_00009_.png',
    filePath: '/output/ComfyUI_00009_.png',
    fileSize: 2621440, // 2.5MB
    createdAt: new Date('2024-01-24T14:00:00Z'),
    modifiedAt: new Date('2024-01-24T14:00:00Z'),
    imageWidth: 1024,
    imageHeight: 1280,
    fileFormat: 'png',
    thumbnailPath: '/output/thumbnails/ComfyUI_00009_.png',
    workflowMetadata: {
      prompt: 'Steampunk mechanical creature with gears and steam',
      model: 'Realistic Vision V5.1',
      steps: 26,
      cfg: 7.8,
      sampler: 'DPM++ SDE',
      seed: 258741963,
    },
  },
  {
    id: 'output-10',
    filename: 'ComfyUI_00010_.webp',
    filePath: '/output/ComfyUI_00010_.webp',
    fileSize: 1835008, // 1.75MB
    createdAt: new Date('2024-01-24T12:45:00Z'),
    modifiedAt: new Date('2024-01-24T12:45:00Z'),
    imageWidth: 896,
    imageHeight: 1152,
    fileFormat: 'webp',
    thumbnailPath: '/output/thumbnails/ComfyUI_00010_.webp',
    workflowMetadata: {
      prompt: 'Ethereal fairy in an enchanted garden with glowing flowers',
      model: 'DreamShaper XL',
      steps: 24,
      cfg: 7.5,
      sampler: 'Heun',
      seed: 741963258,
    },
  },
];

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

// Helper function to format date
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
