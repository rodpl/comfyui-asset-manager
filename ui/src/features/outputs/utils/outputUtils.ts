/**
 * Utility functions for output data transformation
 */

import { Output, OutputResponse } from '../types';

/**
 * Convert OutputResponse from API to Output for frontend use
 */
export const convertOutputResponse = (response: OutputResponse): Output => {
  return {
    id: response.id,
    filename: response.filename,
    filePath: response.filePath,
    fileSize: typeof (response as any).fileSize === 'number' && isFinite((response as any).fileSize)
      ? (response as any).fileSize
      : 0,
    createdAt: new Date(response.createdAt),
    modifiedAt: new Date(response.modifiedAt),
    imageWidth: response.imageWidth,
    imageHeight: response.imageHeight,
    fileFormat: response.fileFormat,
    thumbnailPath: response.thumbnailPath,
    workflowMetadata: response.workflowMetadata || {}
  };
};

/**
 * Convert array of OutputResponse to Output array
 */
export const convertOutputResponseArray = (responses: OutputResponse[]): Output[] => {
  return responses.map(convertOutputResponse);
};

/**
 * Format file size in human-readable format
 */
export const formatFileSize = (bytes?: number | null): string => {
  if (typeof bytes !== 'number' || !isFinite(bytes) || bytes < 0) return '—';
  if (bytes === 0) return '0 B';

  const k = 1024;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const unitIndex = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));

  // For bytes, show integer without decimal places
  if (unitIndex === 0) return `${bytes} B`;

  const value = bytes / Math.pow(k, unitIndex);
  // Always show one decimal place to match UI expectations (e.g., 2.0 MB)
  return `${value.toFixed(1)} ${units[unitIndex]}`;
};

/**
 * Format date for display
 */
export const formatDate = (date: Date): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Get image dimensions string
 */
export const formatDimensions = (width: number, height: number): string => {
  return `${width} × ${height}`;
};

/**
 * Calculate aspect ratio
 */
export const calculateAspectRatio = (width: number, height: number): number => {
  return height > 0 ? width / height : 1.0;
};