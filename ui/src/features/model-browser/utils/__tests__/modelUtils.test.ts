/**
 * Tests for model utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  getComfyUITypeFromCivitAI,
  getComfyUIFolderFromCivitAI,
  getComfyUITypeFromHuggingFace,
  getComfyUIFolderFromHuggingFace,
  isFormatSupported,
  getCompatibilityScore,
  formatFileSize,
  getModelTypeDisplayName,
  getModelTypeColor,
  validateExternalModel,
} from '../modelUtils';
import { ComfyUIModelType } from '../../types';

describe('modelUtils', () => {
  describe('CivitAI mappings', () => {
    it('should map CivitAI types to ComfyUI types correctly', () => {
      expect(getComfyUITypeFromCivitAI('Checkpoint')).toBe(ComfyUIModelType.CHECKPOINT);
      expect(getComfyUITypeFromCivitAI('LORA')).toBe(ComfyUIModelType.LORA);
      expect(getComfyUITypeFromCivitAI('VAE')).toBe(ComfyUIModelType.VAE);
      expect(getComfyUITypeFromCivitAI('Unknown')).toBe(ComfyUIModelType.UNKNOWN);
    });

    it('should map CivitAI types to ComfyUI folders correctly', () => {
      expect(getComfyUIFolderFromCivitAI('Checkpoint')).toBe('checkpoints');
      expect(getComfyUIFolderFromCivitAI('LORA')).toBe('loras');
      expect(getComfyUIFolderFromCivitAI('VAE')).toBe('vae');
      expect(getComfyUIFolderFromCivitAI('Unknown')).toBe('models');
    });
  });

  describe('HuggingFace mappings', () => {
    it('should map HuggingFace pipeline tags to ComfyUI types correctly', () => {
      expect(getComfyUITypeFromHuggingFace('text-to-image')).toBe(ComfyUIModelType.CHECKPOINT);
      expect(getComfyUITypeFromHuggingFace('image-to-image')).toBe(ComfyUIModelType.CHECKPOINT);
      expect(getComfyUITypeFromHuggingFace('unknown')).toBe(ComfyUIModelType.UNKNOWN);
    });

    it('should map HuggingFace pipeline tags to ComfyUI folders correctly', () => {
      expect(getComfyUIFolderFromHuggingFace('text-to-image')).toBe('checkpoints');
      expect(getComfyUIFolderFromHuggingFace('image-to-image')).toBe('checkpoints');
      expect(getComfyUIFolderFromHuggingFace('unknown')).toBe('models');
    });
  });

  describe('format support', () => {
    it('should correctly identify supported formats', () => {
      expect(isFormatSupported('safetensors')).toBe(true);
      expect(isFormatSupported('ckpt')).toBe(true);
      expect(isFormatSupported('pt')).toBe(true);
      expect(isFormatSupported('unknown')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isFormatSupported('SAFETENSORS')).toBe(true);
      expect(isFormatSupported('Ckpt')).toBe(true);
    });
  });

  describe('compatibility score', () => {
    it('should calculate correct scores for CivitAI models', () => {
      // Perfect score: known type + safetensors + known base model
      expect(getCompatibilityScore('Checkpoint', 'safetensors', 'SD 1.5', 'civitai')).toBe(1.0);

      // Good score: known type + ckpt + known base model
      expect(getCompatibilityScore('Checkpoint', 'ckpt', 'SD 1.5', 'civitai')).toBeCloseTo(0.9);

      // Lower score: unknown type + unsupported format + unknown base model
      expect(getCompatibilityScore('Unknown', 'unknown', 'Unknown', 'civitai')).toBe(0.0);
    });

    it('should calculate correct scores for HuggingFace models', () => {
      expect(getCompatibilityScore('text-to-image', 'safetensors', 'SD 1.5', 'huggingface')).toBe(
        1.0
      );
      expect(getCompatibilityScore('unknown', 'unknown', 'Unknown', 'huggingface')).toBe(0.0);
    });
  });

  describe('file size formatting', () => {
    it('should format file sizes correctly', () => {
      expect(formatFileSize(undefined)).toBe('Unknown');
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
      expect(formatFileSize(1536 * 1024 * 1024)).toBe('1.5 GB');
    });
  });

  describe('model type display', () => {
    it('should return correct display names', () => {
      expect(getModelTypeDisplayName(ComfyUIModelType.CHECKPOINT)).toBe('Checkpoint');
      expect(getModelTypeDisplayName(ComfyUIModelType.LORA)).toBe('LoRA');
      expect(getModelTypeDisplayName(ComfyUIModelType.VAE)).toBe('VAE');
      expect(getModelTypeDisplayName(ComfyUIModelType.UNKNOWN)).toBe('Unknown');
    });

    it('should return valid colors', () => {
      const color = getModelTypeColor(ComfyUIModelType.CHECKPOINT);
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  describe('model validation', () => {
    it('should validate required fields', () => {
      const errors = validateExternalModel({});
      expect(errors).toContain('Model ID is required');
      expect(errors).toContain('Model name is required');
      expect(errors).toContain('Model author is required');
      expect(errors).toContain('Valid platform (civitai or huggingface) is required');
    });

    it('should validate rating range', () => {
      const errors = validateExternalModel({
        id: 'test',
        name: 'test',
        author: 'test',
        platform: 'civitai',
        rating: 6,
      });
      expect(errors).toContain('Rating must be between 0 and 5');
    });

    it('should validate download count', () => {
      const errors = validateExternalModel({
        id: 'test',
        name: 'test',
        author: 'test',
        platform: 'civitai',
        downloadCount: -1,
      });
      expect(errors).toContain('Download count cannot be negative');
    });

    it('should pass validation for valid model', () => {
      const errors = validateExternalModel({
        id: 'test',
        name: 'test',
        author: 'test',
        platform: 'civitai',
        rating: 4.5,
        downloadCount: 1000,
      });
      expect(errors).toHaveLength(0);
    });
  });
});
