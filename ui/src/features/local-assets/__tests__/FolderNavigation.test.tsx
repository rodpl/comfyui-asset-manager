import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import FolderNavigation from '../FolderNavigation';
import { ModelFolder, ModelType } from '../types';

// Initialize i18n for testing
i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  debug: false,
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: {
      translation: {
        'folders.title': 'Folders',
        'folders.count': '{{count}} folders',
        'folders.loading': 'Loading folders...',
        'folders.empty': 'No folders found',
        'folders.modelCount': '{{count}} models',
        'folders.checkpoint': 'Checkpoints',
        'folders.lora': 'LoRAs',
        'folders.vae': 'VAE',
        'folders.embedding': 'Embeddings',
        'folders.controlnet': 'ControlNet',
        'folders.upscaler': 'Upscalers',
      },
    },
  },
});

// Mock data
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
];

const renderWithI18n = (component: React.ReactElement) => {
  return render(component);
};

describe('FolderNavigation', () => {
  const mockOnFolderSelect = vi.fn();

  beforeEach(() => {
    mockOnFolderSelect.mockClear();
  });

  describe('Basic Rendering', () => {
    it('renders folder navigation with folders', () => {
      renderWithI18n(
        <FolderNavigation
          folders={mockFolders}
          selectedFolder="checkpoints"
          onFolderSelect={mockOnFolderSelect}
        />
      );

      expect(screen.getByText('Folders')).toBeInTheDocument();
      expect(screen.getByText('4 folders')).toBeInTheDocument();
      expect(screen.getByText('Checkpoints')).toBeInTheDocument();
      expect(screen.getByText('LoRAs')).toBeInTheDocument();
      expect(screen.getByText('VAE')).toBeInTheDocument();
      expect(screen.getByText('Embeddings')).toBeInTheDocument();
    });

    it('displays model counts for each folder', () => {
      renderWithI18n(
        <FolderNavigation
          folders={mockFolders}
          selectedFolder="checkpoints"
          onFolderSelect={mockOnFolderSelect}
        />
      );

      expect(screen.getByText('15 models')).toBeInTheDocument();
      expect(screen.getByText('8 models')).toBeInTheDocument();
      expect(screen.getByText('3 models')).toBeInTheDocument();
      expect(screen.getByText('12 models')).toBeInTheDocument();
    });

    it('shows selected folder with proper styling', () => {
      renderWithI18n(
        <FolderNavigation
          folders={mockFolders}
          selectedFolder="checkpoints"
          onFolderSelect={mockOnFolderSelect}
        />
      );

      const selectedFolder = screen.getByText('Checkpoints').closest('.folder-item');
      expect(selectedFolder).toHaveClass('selected');
    });
  });

  describe('Loading State', () => {
    it('displays loading state when loading is true', () => {
      renderWithI18n(
        <FolderNavigation
          folders={[]}
          selectedFolder=""
          onFolderSelect={mockOnFolderSelect}
          loading={true}
        />
      );

      expect(screen.getByText('Loading folders...')).toBeInTheDocument();
      const spinnerIcon = screen
        .getByText('Loading folders...')
        .parentElement?.querySelector('.pi-spinner');
      expect(spinnerIcon).toBeInTheDocument();
    });

    it('does not show folder list when loading', () => {
      renderWithI18n(
        <FolderNavigation
          folders={mockFolders}
          selectedFolder=""
          onFolderSelect={mockOnFolderSelect}
          loading={true}
        />
      );

      expect(screen.queryByText('Checkpoints')).not.toBeInTheDocument();
      expect(screen.getByText('Loading folders...')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('displays empty state when no folders are provided', () => {
      renderWithI18n(
        <FolderNavigation folders={[]} selectedFolder="" onFolderSelect={mockOnFolderSelect} />
      );

      expect(screen.getByText('No folders found')).toBeInTheDocument();
    });

    it('displays empty state when folders array is undefined', () => {
      renderWithI18n(
        <FolderNavigation
          folders={undefined as unknown as ModelFolder[]}
          selectedFolder=""
          onFolderSelect={mockOnFolderSelect}
        />
      );

      expect(screen.getByText('No folders found')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onFolderSelect when folder is clicked', () => {
      renderWithI18n(
        <FolderNavigation
          folders={mockFolders}
          selectedFolder="checkpoints"
          onFolderSelect={mockOnFolderSelect}
        />
      );

      const loraFolder = screen.getByText('LoRAs').closest('.folder-item');
      fireEvent.click(loraFolder!);

      expect(mockOnFolderSelect).toHaveBeenCalledWith('loras');
    });

    it('calls onFolderSelect when Enter key is pressed', () => {
      renderWithI18n(
        <FolderNavigation
          folders={mockFolders}
          selectedFolder="checkpoints"
          onFolderSelect={mockOnFolderSelect}
        />
      );

      const vaeFolder = screen.getByText('VAE').closest('.folder-item');
      fireEvent.keyDown(vaeFolder!, { key: 'Enter' });

      expect(mockOnFolderSelect).toHaveBeenCalledWith('vae');
    });

    it('calls onFolderSelect when Space key is pressed', () => {
      renderWithI18n(
        <FolderNavigation
          folders={mockFolders}
          selectedFolder="checkpoints"
          onFolderSelect={mockOnFolderSelect}
        />
      );

      const embeddingFolder = screen.getByText('Embeddings').closest('.folder-item');
      fireEvent.keyDown(embeddingFolder!, { key: ' ' });

      expect(mockOnFolderSelect).toHaveBeenCalledWith('embeddings');
    });

    it('does not call onFolderSelect for other keys', () => {
      renderWithI18n(
        <FolderNavigation
          folders={mockFolders}
          selectedFolder="checkpoints"
          onFolderSelect={mockOnFolderSelect}
        />
      );

      const loraFolder = screen.getByText('LoRAs').closest('.folder-item');
      fireEvent.keyDown(loraFolder!, { key: 'Tab' });

      expect(mockOnFolderSelect).not.toHaveBeenCalled();
    });
  });

  describe('Model Type Icons', () => {
    it('displays correct icons for different model types', () => {
      renderWithI18n(
        <FolderNavigation
          folders={mockFolders}
          selectedFolder="checkpoints"
          onFolderSelect={mockOnFolderSelect}
        />
      );

      // Check that icons are present (we can't easily test specific icon classes)
      const folderItems = screen.getAllByRole('button');
      expect(folderItems).toHaveLength(4);

      folderItems.forEach((item) => {
        const icon = item.querySelector('.folder-item-icon i');
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveClass('pi');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for folder items', () => {
      renderWithI18n(
        <FolderNavigation
          folders={mockFolders}
          selectedFolder="checkpoints"
          onFolderSelect={mockOnFolderSelect}
        />
      );

      const checkpointFolder = screen.getByLabelText('Select Checkpoints folder with 15 models');
      expect(checkpointFolder).toBeInTheDocument();

      const loraFolder = screen.getByLabelText('Select LoRAs folder with 8 models');
      expect(loraFolder).toBeInTheDocument();
    });

    it('has proper tabIndex for keyboard navigation', () => {
      renderWithI18n(
        <FolderNavigation
          folders={mockFolders}
          selectedFolder="checkpoints"
          onFolderSelect={mockOnFolderSelect}
        />
      );

      const folderItems = screen.getAllByRole('button');
      folderItems.forEach((item) => {
        expect(item).toHaveAttribute('tabIndex', '0');
      });
    });

    it('has proper role attributes', () => {
      renderWithI18n(
        <FolderNavigation
          folders={mockFolders}
          selectedFolder="checkpoints"
          onFolderSelect={mockOnFolderSelect}
        />
      );

      const folderItems = screen.getAllByRole('button');
      expect(folderItems).toHaveLength(4);
    });
  });

  describe('Model Type Labels', () => {
    it('displays correct labels for all model types', () => {
      const allTypeFolders: ModelFolder[] = [
        {
          id: '1',
          name: 'checkpoints',
          path: '/checkpoints',
          modelType: ModelType.CHECKPOINT,
          modelCount: 1,
        },
        {
          id: '2',
          name: 'loras',
          path: '/loras',
          modelType: ModelType.LORA,
          modelCount: 1,
        },
        {
          id: '3',
          name: 'vae',
          path: '/vae',
          modelType: ModelType.VAE,
          modelCount: 1,
        },
        {
          id: '4',
          name: 'embeddings',
          path: '/embeddings',
          modelType: ModelType.EMBEDDING,
          modelCount: 1,
        },
        {
          id: '5',
          name: 'controlnet',
          path: '/controlnet',
          modelType: ModelType.CONTROLNET,
          modelCount: 1,
        },
        {
          id: '6',
          name: 'upscaler',
          path: '/upscaler',
          modelType: ModelType.UPSCALER,
          modelCount: 1,
        },
      ];

      renderWithI18n(
        <FolderNavigation
          folders={allTypeFolders}
          selectedFolder="1"
          onFolderSelect={mockOnFolderSelect}
        />
      );

      expect(screen.getByText('Checkpoints')).toBeInTheDocument();
      expect(screen.getByText('LoRAs')).toBeInTheDocument();
      expect(screen.getByText('VAE')).toBeInTheDocument();
      expect(screen.getByText('Embeddings')).toBeInTheDocument();
      expect(screen.getByText('ControlNet')).toBeInTheDocument();
      expect(screen.getByText('Upscalers')).toBeInTheDocument();
    });
  });

  describe('Folder Path Display', () => {
    it('shows folder names in the path details', () => {
      renderWithI18n(
        <FolderNavigation
          folders={mockFolders}
          selectedFolder="checkpoints"
          onFolderSelect={mockOnFolderSelect}
        />
      );

      expect(screen.getByText('checkpoints')).toBeInTheDocument();
      expect(screen.getByText('loras')).toBeInTheDocument();
      expect(screen.getByText('vae')).toBeInTheDocument();
      expect(screen.getByText('embeddings')).toBeInTheDocument();
    });

    it('shows full path in title attribute', () => {
      renderWithI18n(
        <FolderNavigation
          folders={mockFolders}
          selectedFolder="checkpoints"
          onFolderSelect={mockOnFolderSelect}
        />
      );

      const pathElements = screen.getAllByTitle('/models/checkpoints');
      expect(pathElements.length).toBeGreaterThan(0);
    });
  });
});
