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
    fileSize: response.fileSize,
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
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Format date for display
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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