/**
 * Utility functions for output data transformation
 */

import { Output, OutputResponse } from '../types';

/**
 * Convert OutputResponse from API to Output for frontend use
 */
export const convertOutputResponse = (response: OutputResponse): Output => {
  // Accept both camelCase and snake_case, and prefer HTTP-friendly URLs when provided
  const anyResp = response as unknown as Record<string, any>;

  const filePath: string | undefined =
    anyResp.filePath || anyResp.file_url || anyResp.fileUrl || anyResp.file_path;

  const thumbnailPath: string | undefined =
    anyResp.thumbnailPath ||
    anyResp.thumbnail_url ||
    anyResp.thumbnailUrl ||
    anyResp.thumbnail_path;

  const fileSizeRaw = anyResp.fileSize ?? anyResp.file_size;
  const createdAtRaw = anyResp.createdAt ?? anyResp.created_at;
  const modifiedAtRaw = anyResp.modifiedAt ?? anyResp.modified_at;
  const imageWidthRaw = anyResp.imageWidth ?? anyResp.image_width;
  const imageHeightRaw = anyResp.imageHeight ?? anyResp.image_height;
  const fileFormatRaw = anyResp.fileFormat ?? anyResp.file_format;
  const workflowMetadataRaw = anyResp.workflowMetadata ?? anyResp.workflow_metadata;

  return {
    id: anyResp.id,
    filename: anyResp.filename,
    filePath: filePath || '',
    fileSize: typeof fileSizeRaw === 'number' && isFinite(fileSizeRaw) ? fileSizeRaw : 0,
    createdAt: new Date(createdAtRaw),
    modifiedAt: new Date(modifiedAtRaw),
    imageWidth: imageWidthRaw,
    imageHeight: imageHeightRaw,
    fileFormat: fileFormatRaw,
    thumbnailPath: thumbnailPath || undefined,
    workflowMetadata: (workflowMetadataRaw as Record<string, any>) || {},
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
