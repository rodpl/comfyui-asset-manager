/**
 * API Client for ComfyUI Asset Manager
 * Handles communication with the backend API endpoints
 */

import { ModelFolder, ModelInfo, EnrichedModelInfo } from '../features/local-assets/types';

// API Configuration
const API_BASE_URL = '/asset_manager';
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const REQUEST_DEDUP_TIMEOUT = 5000; // 5 seconds

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// Custom error class for API errors
export class ApiClientError extends Error {
  public status?: number;
  public code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
  }
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  delay: number;
  backoff: boolean;
}

// Request options
interface RequestOptions {
  timeout?: number;
  retry?: Partial<RetryConfig>;
  signal?: AbortSignal;
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Check if error is retryable
 */
const isRetryableError = (error: ApiClientError): boolean => {
  if (!error.status) return true; // Network errors are retryable
  return error.status >= 500 || error.status === 408 || error.status === 429;
};

/**
 * Main API Client class
 */
export class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private requestCache: Map<string, Promise<any>> = new Map();
  private healthCheckInterval?: number;
  private isHealthy: boolean = true;
  private healthCheckCallbacks: Set<(isHealthy: boolean) => void> = new Set();

  constructor(baseUrl: string = API_BASE_URL, timeout: number = DEFAULT_TIMEOUT) {
    this.baseUrl = baseUrl;
    this.defaultTimeout = timeout;
    this.startHealthCheck();
  }

  /**
   * Make HTTP request with retry logic
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit & RequestOptions = {}
  ): Promise<T> {
    const { timeout = this.defaultTimeout, retry = {}, signal, ...fetchOptions } = options;
    const retryConfig: RetryConfig = {
      maxRetries: MAX_RETRIES,
      delay: RETRY_DELAY,
      backoff: true,
      ...retry,
    };

    // Use request deduplication for GET requests
    const shouldDeduplicate = !fetchOptions.method || fetchOptions.method === 'GET';
    if (shouldDeduplicate) {
      const cacheKey = this.getCacheKey(endpoint, fetchOptions);
      return this.deduplicateRequest(cacheKey, () =>
        this.executeRequest<T>(endpoint, fetchOptions, retryConfig, timeout, signal)
      );
    }

    return this.executeRequest<T>(endpoint, fetchOptions, retryConfig, timeout, signal);
  }

  /**
   * Execute HTTP request with retry logic
   */
  private async executeRequest<T>(
    endpoint: string,
    fetchOptions: RequestInit,
    retryConfig: RetryConfig,
    timeout: number,
    signal?: AbortSignal
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    let lastError: ApiClientError;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        // Combine signals if provided
        const combinedSignal = signal
          ? this.combineAbortSignals([signal, controller.signal])
          : controller.signal;

        const response = await fetch(url, {
          ...fetchOptions,
          signal: combinedSignal,
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new ApiClientError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            response.status.toString()
          );
        }

        const data = await response.json();
        return data;
      } catch (error) {
        const apiError =
          error instanceof ApiClientError
            ? error
            : new ApiClientError(
                error instanceof Error ? error.message : 'Unknown error',
                undefined,
                'NETWORK_ERROR'
              );

        lastError = apiError;

        // Don't retry on last attempt or non-retryable errors
        if (attempt === retryConfig.maxRetries || !isRetryableError(apiError)) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = retryConfig.backoff
          ? retryConfig.delay * Math.pow(2, attempt)
          : retryConfig.delay;

        await sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Combine multiple AbortSignals
   */
  private combineAbortSignals(signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();

    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort();
        break;
      }
      signal.addEventListener('abort', () => controller.abort());
    }

    return controller.signal;
  }

  /**
   * Generate cache key for request deduplication
   */
  private getCacheKey(endpoint: string, options: RequestInit = {}): string {
    const method = options.method || 'GET';
    const body = options.body || '';
    return `${method}:${endpoint}:${body}`;
  }

  /**
   * Deduplicate identical requests
   */
  private async deduplicateRequest<T>(cacheKey: string, requestFn: () => Promise<T>): Promise<T> {
    // Check if request is already in progress
    if (this.requestCache.has(cacheKey)) {
      return this.requestCache.get(cacheKey);
    }

    // Create new request promise
    const requestPromise = requestFn().finally(() => {
      // Clean up cache after request completes
      setTimeout(() => {
        this.requestCache.delete(cacheKey);
      }, REQUEST_DEDUP_TIMEOUT);
    });

    // Cache the promise
    this.requestCache.set(cacheKey, requestPromise);

    return requestPromise;
  }

  /**
   * Start periodic health checks
   */
  private startHealthCheck(): void {
    if (typeof window === 'undefined') return; // Skip in SSR

    this.healthCheckInterval = window.setInterval(async () => {
      try {
        await this.healthCheck({ timeout: 5000, retry: { maxRetries: 1 } });
        this.setHealthStatus(true);
      } catch (error) {
        this.setHealthStatus(false);
      }
    }, HEALTH_CHECK_INTERVAL);
  }

  /**
   * Stop health checks
   */
  public stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  /**
   * Set health status and notify callbacks
   */
  private setHealthStatus(isHealthy: boolean): void {
    if (this.isHealthy !== isHealthy) {
      this.isHealthy = isHealthy;
      this.healthCheckCallbacks.forEach((callback) => callback(isHealthy));
    }
  }

  /**
   * Subscribe to health status changes
   */
  public onHealthChange(callback: (isHealthy: boolean) => void): () => void {
    this.healthCheckCallbacks.add(callback);
    // Return unsubscribe function
    return () => this.healthCheckCallbacks.delete(callback);
  }

  /**
   * Get current health status
   */
  public getHealthStatus(): boolean {
    return this.isHealthy;
  }

  /**
   * Clear request cache
   */
  public clearCache(): void {
    this.requestCache.clear();
  }

  /**
   * GET request
   */
  private async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', ...options });
  }

  /**
   * PUT request
   */
  private async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  // API Methods

  /**
   * Get all folders
   */
  async getFolders(options?: RequestOptions): Promise<ModelFolder[]> {
    return this.get<ModelFolder[]>('/folders', options);
  }

  /**
   * Get models in a specific folder
   */
  async getModelsInFolder(folderId: string, options?: RequestOptions): Promise<ModelInfo[]> {
    return this.get<ModelInfo[]>(`/folders/${encodeURIComponent(folderId)}/models`, options);
  }

  /**
   * Get detailed information about a specific model
   */
  async getModelDetails(modelId: string, options?: RequestOptions): Promise<EnrichedModelInfo> {
    return this.get<EnrichedModelInfo>(`/models/${encodeURIComponent(modelId)}`, options);
  }

  /**
   * Search models
   */
  async searchModels(
    query: string,
    folderId?: string,
    options?: RequestOptions
  ): Promise<ModelInfo[]> {
    const params = new URLSearchParams({ q: query });
    if (folderId) {
      params.append('folder', folderId);
    }
    return this.get<ModelInfo[]>(`/search?${params.toString()}`, options);
  }

  /**
   * Update model metadata
   */
  async updateModelMetadata(
    modelId: string,
    metadata: { tags?: string[]; description?: string; rating?: number },
    options?: RequestOptions
  ): Promise<EnrichedModelInfo> {
    return this.put<EnrichedModelInfo>(
      `/models/${encodeURIComponent(modelId)}/metadata`,
      metadata,
      options
    );
  }

  /**
   * Health check endpoint
   */
  async healthCheck(options?: RequestOptions): Promise<{ status: string; timestamp: string }> {
    return this.get<{ status: string; timestamp: string }>('/health', options);
  }
}

// Create default API client instance
export const apiClient = new ApiClient();

// Export types for use in components
export type { RequestOptions, RetryConfig };
