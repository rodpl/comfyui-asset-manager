// Type definitions for Output Gallery feature

export interface Output {
  id: string;
  filename: string;
  filePath: string;
  fileSize: number;
  createdAt: Date;
  modifiedAt: Date;
  imageWidth: number;
  imageHeight: number;
  fileFormat: string;
  thumbnailPath?: string;
  workflowMetadata?: Record<string, any>;
}

export interface OutputResponse {
  id: string;
  filename: string;
  filePath: string;
  fileSize: number;
  createdAt: string; // ISO datetime
  modifiedAt: string; // ISO datetime
  imageWidth: number;
  imageHeight: number;
  fileFormat: string;
  thumbnailPath?: string;
  workflowMetadata?: Record<string, unknown>;
}

export interface OutputsListResponse {
  success: boolean;
  data: OutputResponse[];
  total: number;
  error?: string;
}

export type ViewMode = 'grid' | 'list';
export type SortOption =
  | 'date-desc'
  | 'date-asc'
  | 'name-asc'
  | 'name-desc'
  | 'size-desc'
  | 'size-asc';

export interface OutputsState {
  outputs: Output[];
  loading: boolean;
  error: string | null;
  viewMode: ViewMode;
  sortBy: SortOption;
}

export interface OutputToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
  onRefresh: () => void;
}

export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

export interface FileInfo {
  size: number;
  format: string;
  createdAt: Date;
  modifiedAt: Date;
  sizeFormatted: string;
}

// Context menu action types
export type ContextMenuAction = 'copy-path' | 'open-system' | 'show-folder';

export interface ContextMenuProps {
  output: Output;
  position: { x: number; y: number };
  isVisible: boolean;
  onAction: (action: ContextMenuAction) => void;
  onClose: () => void;
}
