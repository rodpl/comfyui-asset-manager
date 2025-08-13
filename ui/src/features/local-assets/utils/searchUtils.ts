import { ModelInfo, FilterOptions } from '../types';

/**
 * Highlights search terms in text by wrapping matches with <mark> tags
 */
export const highlightSearchTerms = (text: string, searchQuery: string): string => {
  if (!searchQuery.trim()) {
    return text;
  }

  const terms = searchQuery.trim().split(/\s+/);
  let highlightedText = text;

  terms.forEach((term) => {
    if (term.length > 0) {
      const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    }
  });

  return highlightedText;
};

/**
 * Escapes special regex characters in a string
 */
const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Filters models based on search query and filter options
 */
export const filterModels = (
  models: ModelInfo[],
  searchQuery: string,
  filters: FilterOptions
): ModelInfo[] => {
  let filteredModels = [...models];

  // Apply search query filter
  if (searchQuery.trim()) {
    const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/);
    filteredModels = filteredModels.filter((model) => {
      const searchableText = [
        model.name,
        model.filePath,
        model.modelType,
        model.hash,
        // Add any additional searchable fields here
      ]
        .join(' ')
        .toLowerCase();

      return searchTerms.every((term) => searchableText.includes(term));
    });
  }

  // Apply model type filter
  if (filters.modelTypes.length > 0) {
    filteredModels = filteredModels.filter((model) => filters.modelTypes.includes(model.modelType));
  }

  // Apply file size filter
  if (filters.fileSizeRange) {
    filteredModels = filteredModels.filter(
      (model) =>
        model.fileSize >= filters.fileSizeRange!.min && model.fileSize <= filters.fileSizeRange!.max
    );
  }

  // Apply date range filter
  if (filters.dateRange) {
    filteredModels = filteredModels.filter(
      (model) =>
        model.modifiedAt >= filters.dateRange!.start && model.modifiedAt <= filters.dateRange!.end
    );
  }

  // Apply metadata filter
  if (filters.hasMetadata !== undefined) {
    filteredModels = filteredModels.filter((model) => {
      // For now, we'll assume models with certain properties have metadata
      // This would be replaced with actual metadata checking logic
      const hasMetadata = model.hash && model.hash.length > 0;
      return filters.hasMetadata ? hasMetadata : !hasMetadata;
    });
  }

  // Apply thumbnail filter
  if (filters.hasThumbnail !== undefined) {
    filteredModels = filteredModels.filter((model) => {
      const hasThumbnail = Boolean(model.thumbnail);
      return filters.hasThumbnail ? hasThumbnail : !hasThumbnail;
    });
  }

  return filteredModels;
};

/**
 * Formats file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Debounces a function call
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
};
