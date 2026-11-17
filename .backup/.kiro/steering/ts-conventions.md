---
inclusion: fileMatch
fileMatchPattern: ["**/*.tsx", "**/*.ts", "ui/src/**/*"]
---

# TypeScript/JavaScript Conventions

## Naming Conventions

- **Variables & Functions**: Use camelCase (`getUserData`, `isLoading`)
- **Classes & Components**: Use PascalCase (`ModelCard`, `AssetManager`)
- **Constants**: Use UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_FILE_SIZE`)
- **Files**: Use kebab-case for files (`model-card.tsx`, `asset-service.ts`)
- **Directories**: Use kebab-case (`local-assets`, `model-browser`)

## File Organization

### Component Structure
```
components/
├── ModelCard/
│   ├── ModelCard.tsx        # Main component
│   ├── ModelCard.css        # Component styles
│   ├── ModelCard.test.tsx   # Component tests
│   └── index.ts             # Clean exports
```

### Feature Structure
```
features/
├── local-assets/
│   ├── LocalAssetsTab.tsx   # Main feature component
│   ├── components/          # Feature-specific components
│   ├── services/           # Feature-specific services
│   ├── types.ts            # Feature-specific types
│   └── index.ts            # Feature exports
```

## TypeScript Best Practices

### Type Definitions

```typescript
// Prefer interfaces for object shapes
interface ModelCardProps {
  model: Model;
  onSelect: (model: Model) => void;
  isSelected?: boolean;
}

// Use types for unions and computed types
type ModelType = 'checkpoint' | 'lora' | 'vae' | 'embedding';
type ModelStatus = 'loading' | 'ready' | 'error';

// Use enums for fixed sets of values
enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}
```

### Function Signatures

```typescript
// Explicit return types for exported functions
export const fetchModels = async (folderId: string): Promise<Model[]> => {
  // Implementation
};

// Use generic types for reusable functions
export const createApiClient = <T>(baseUrl: string): ApiClient<T> => {
  // Implementation
};
```

### Error Handling

```typescript
// Use discriminated unions for error states
type ApiResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

// Type-safe error handling
const handleApiResult = <T>(result: ApiResult<T>): T => {
  if (result.success) {
    return result.data;
  }
  throw new Error(result.error);
};
```

### React Component Patterns

```typescript
// Functional components with explicit props interface
interface ComponentProps {
  title: string;
  onAction: (action: string) => void;
  children?: React.ReactNode;
}

const MyComponent = ({ title, onAction, children }: ComponentProps) => {
  return (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  );
};

export default MyComponent;
```

### Hooks and State Management

```typescript
// Custom hooks with proper typing
const useAsyncData = <T>(
  fetchFn: () => Promise<T>
): {
  data: T | null;
  loading: boolean;
  error: string | null;
} => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFn()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [fetchFn]);

  return { data, loading, error };
};
```

## Code Quality Standards

### Linting Rules

- Use ESLint with TypeScript support
- Enable strict mode in tsconfig.json
- Use Prettier for consistent formatting
- No unused variables or imports
- Explicit return types for exported functions

### Import Organization

```typescript
// 1. Node modules
import React, { useState, useEffect } from 'react';
import { api } from '/scripts/api.js';

// 2. Internal modules (absolute paths)
import { Model } from '@/types/model';
import { useComfyUITheme } from '@/hooks/useComfyUITheme';

// 3. Relative imports
import './ModelCard.css';
import { ModelCardProps } from './types';
```

### Documentation

```typescript
/**
 * Fetches models from a specific folder
 * @param folderId - The ID of the folder to fetch models from
 * @param options - Additional fetch options
 * @returns Promise resolving to array of models
 * @throws {Error} When folder is not found or access is denied
 */
export const fetchModelsFromFolder = async (
  folderId: string,
  options?: FetchOptions
): Promise<Model[]> => {
  // Implementation
};
```

## ComfyUI-Specific Patterns

### Type Declarations

```typescript
// Extend global types for ComfyUI integration
declare global {
  interface Window {
    app: {
      graph: any;
      ui: {
        settings: any;
        dialog: any;
      };
      extensionManager: {
        registerSidebarTab: (config: SidebarTabConfig) => void;
      };
    };
    api: {
      fetchApi: (url: string, options?: RequestInit) => Promise<Response>;
    };
  }
}
```

### Feature Detection

```typescript
// Type-safe feature detection
const useComfyUICapabilities = () => {
  const [capabilities, setCapabilities] = useState({
    hasExtensionAPI: false,
    supportsPreviewMetadata: false,
    supportsMaxUploadSize: false,
  });

  useEffect(() => {
    setCapabilities({
      hasExtensionAPI: !!window.app?.extensionManager,
      supportsPreviewMetadata: !!window.app?.features?.supports_preview_metadata,
      supportsMaxUploadSize: !!window.app?.features?.max_upload_size,
    });
  }, []);

  return capabilities;
};
```

## Testing Patterns

```typescript
// Component testing with proper types
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { ModelCard } from './ModelCard';
import type { Model } from '@/types/model';

describe('ModelCard', () => {
  const mockModel: Model = {
    id: 'test-model',
    name: 'Test Model',
    type: 'checkpoint',
    filePath: '/path/to/model.safetensors',
    fileSize: 1024,
  };

  it('renders model information correctly', () => {
    const onSelect = vi.fn();
    render(<ModelCard model={mockModel} onSelect={onSelect} />);
    
    expect(screen.getByText('Test Model')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn();
    render(<ModelCard model={mockModel} onSelect={onSelect} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(mockModel);
  });
});
```

## Performance Considerations

### Optimization Patterns

```typescript
// Memoization for expensive calculations
const ExpensiveComponent = ({ data }: { data: LargeDataSet }) => {
  const processedData = useMemo(() => {
    return expensiveProcessing(data);
  }, [data]);

  return <div>{processedData}</div>;
};

// Callback memoization for stable references
const ParentComponent = () => {
  const handleClick = useCallback((id: string) => {
    // Handle click
  }, []);

  return <ChildComponent onClick={handleClick} />;
};
```

## Advanced TypeScript Patterns

### Utility Types for Domain Models

```typescript
// Create utility types for better type safety
type ModelId = string & { readonly brand: unique symbol };
type FolderId = string & { readonly brand: unique symbol };
type OutputId = string & { readonly brand: unique symbol };

// Type guards for branded types
const isModelId = (id: string): id is ModelId => {
  return /^model-[a-zA-Z0-9]+$/.test(id);
};

const isFolderId = (id: string): id is FolderId => {
  return /^folder-[a-zA-Z0-9]+$/.test(id);
};

// Usage
const createModel = (id: ModelId, name: string): Model => {
  // Implementation
};

// This will cause a TypeScript error if not properly validated
const modelId = "some-string";
createModel(modelId, "Test"); // Error: string is not assignable to ModelId

// Correct usage
const validatedId = isModelId("model-123") ? "model-123" as ModelId : null;
if (validatedId) {
  createModel(validatedId, "Test"); // OK
}
```

### Advanced React Patterns

For advanced React patterns including generic components, compound components, render props, and HOCs, see react-patterns.md.

### Type-Safe Event Handling

```typescript
// Define event types for type-safe communication
interface AssetManagerEvents {
  'model:selected': { model: Model };
  'folder:changed': { folderId: FolderId };
  'output:generated': { output: Output };
  'error:occurred': { error: Error; context: string };
}

class TypedEventEmitter<T extends Record<string, any>> {
  private listeners: Partial<{
    [K in keyof T]: Array<(data: T[K]) => void>
  }> = {};
  
  on<K extends keyof T>(event: K, listener: (data: T[K]) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);
  }
  
  emit<K extends keyof T>(event: K, data: T[K]): void {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      eventListeners.forEach(listener => listener(data));
    }
  }
  
  off<K extends keyof T>(event: K, listener: (data: T[K]) => void): void {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }
}

// Usage
const eventBus = new TypedEventEmitter<AssetManagerEvents>();

// Type-safe event handling
eventBus.on('model:selected', (data) => {
  // data is correctly typed as { model: Model }
  console.log(`Selected model: ${data.model.name}`);
});

eventBus.emit('model:selected', { model: selectedModel }); // Type-checked
```

### Conditional Types for API Responses

```typescript
// Conditional types for different API response formats
type ApiResponse<T, E = string> = 
  | { success: true; data: T }
  | { success: false; error: E };

type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

// Type-safe API client with conditional return types
class ApiClient {
  async get<T>(url: string): Promise<T>;
  async get<T>(url: string, paginated: true): Promise<PaginatedResponse<T>>;
  async get<T>(url: string, paginated?: boolean): Promise<T | PaginatedResponse<T>> {
    const response = await fetch(url);
    const data = await response.json();
    
    if (paginated) {
      return data as PaginatedResponse<T>;
    }
    
    return data as T;
  }
}

// Usage with correct type inference
const client = new ApiClient();

const models = await client.get<Model[]>('/models'); // Type: Model[]
const paginatedModels = await client.get<Model>('/models', true); // Type: PaginatedResponse<Model>
```

### Template Literal Types for API Endpoints

```typescript
// Template literal types for type-safe API endpoints
type ApiEndpoint = 
  | `/asset_manager/folders/${string}/models`
  | `/asset_manager/models/${string}`
  | `/asset_manager/outputs`
  | `/asset_manager/outputs/${string}`
  | `/asset_manager/metadata/${string}`;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface ApiRequest<T = any> {
  endpoint: ApiEndpoint;
  method: HttpMethod;
  data?: T;
}

// Type-safe API request builder
const createApiRequest = <T>(
  endpoint: ApiEndpoint,
  method: HttpMethod,
  data?: T
): ApiRequest<T> => ({
  endpoint,
  method,
  data
});

// Usage - TypeScript will validate endpoint format
const request = createApiRequest(
  '/asset_manager/folders/folder-123/models', // Valid
  'GET'
);

const invalidRequest = createApiRequest(
  '/invalid/endpoint', // TypeScript error
  'GET'
);
```

### Discriminated Unions for State Management

```typescript
// Discriminated unions for complex state
type LoadingState = 
  | { status: 'idle' }
  | { status: 'loading'; progress?: number }
  | { status: 'success'; data: any }
  | { status: 'error'; error: string };

// Type-safe state handling
const handleLoadingState = (state: LoadingState) => {
  switch (state.status) {
    case 'idle':
      return <div>Ready to load</div>;
    
    case 'loading':
      return (
        <div>
          Loading... {state.progress && `${state.progress}%`}
        </div>
      );
    
    case 'success':
      return <div>Data: {JSON.stringify(state.data)}</div>;
    
    case 'error':
      return <div>Error: {state.error}</div>;
    
    default:
      // TypeScript ensures exhaustive checking
      const _exhaustive: never = state;
      return _exhaustive;
  }
};
```

These advanced TypeScript patterns ensure type safety, better developer experience, and maintainable code throughout the project while leveraging TypeScript's powerful type system features.
