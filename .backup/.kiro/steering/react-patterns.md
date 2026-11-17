---
inclusion: fileMatch
fileMatchPattern: ["**/*.tsx", "**/*.ts", "ui/src/**/*"]
---

# React Development Guidelines

## Component Structure

- Use functional components with hooks
- Separate business logic from UI components
- Follow container/presentational pattern
- One component per file with descriptive names

### Component Definition Pattern

```tsx
// Preferred: Arrow function with interface
export interface ComponentProps {
  title: string;
  onAction: (action: string) => void;
}

const MyComponent = ({ title, onAction }: ComponentProps) => {
  return <div>{title}</div>;
};

export default MyComponent;
```

```tsx
// Avoid: React.FC wrapper
const MyComponent: React.FC<ComponentProps> = ({ title, onAction }) => {
  return <div>{title}</div>;
};
```

## State Management

- **Local State**: `useState` for simple component state
- **Global State**: React Context for shared application state
- **Complex State**: `useReducer` for state machines or complex logic
- **Server State**: Use React Query patterns for API data

## Performance Optimization

- `useMemo` for expensive calculations
- `React.memo` for preventing unnecessary re-renders
- `useCallback` for stable function references
- Lazy load components with `React.lazy` when appropriate

## ComfyUI Styling Integration

### CSS Framework Constraints

- **No External Frameworks**: Cannot import Bootstrap, Material-UI, etc.
- **Use ComfyUI's Classes**: Leverage existing PrimeVue and Tailwind classes
- **Theme Compatibility**: Must work with ComfyUI's light/dark themes

### Styling Patterns

```tsx
// PrimeVue component styling
<button className="p-button p-component p-button-primary">
  Action
</button>

<div className="p-card p-component">
  <div className="p-card-body">
    <div className="p-card-title">Title</div>
    <div className="p-card-content">Content</div>
  </div>
</div>

// Tailwind utilities for layout
<div className="flex flex-col gap-4 p-4">
  <div className="grid grid-cols-3 gap-2">
    {/* Items */}
  </div>
</div>

// ComfyUI CSS variables for theming
<div style={{
  backgroundColor: 'var(--comfy-menu-bg)',
  color: 'var(--comfy-input-text)',
  border: '1px solid var(--comfy-menu-border)'
}}>
  Themed content
</div>
```

## ComfyUI API Integration

### Extension Registration

```tsx
// main.tsx - Register with ComfyUI
window.app.extensionManager.registerSidebarTab({
  id: "asset-manager",
  icon: "pi pi-folder",
  title: "Asset Manager",
  tooltip: "Manage your ComfyUI assets",
  component: AssetManagerApp,
  type: "custom",
});
```

### API Access Patterns

```tsx
// Graph manipulation
const addToWorkflow = (modelPath: string) => {
  const graph = window.app.graph;
  const node = LiteGraph.createNode("CheckpointLoaderSimple");
  node.widgets[0].value = modelPath;
  graph.add(node);
  app.graph.setDirtyCanvas(true);
};

// API calls
const fetchData = async () => {
  const response = await window.api.fetchApi("/asset_manager/models");
  return response.json();
};

// Settings integration
window.app.ui.settings.addSetting({
  id: "AssetManager.setting",
  name: "Setting Name",
  type: "boolean",
  defaultValue: true,
});
```

### Feature Detection

```tsx
const useComfyUICapabilities = () => {
  const [capabilities, setCapabilities] = useState({
    hasExtensionAPI: false,
    supportsPreviewMetadata: false,
    supportsMaxUploadSize: false,
  });

  useEffect(() => {
    setCapabilities({
      hasExtensionAPI: !!window.app?.extensionManager,
      supportsPreviewMetadata:
        !!window.app?.features?.supports_preview_metadata,
      supportsMaxUploadSize: !!window.app?.features?.max_upload_size,
    });
  }, []);

  return capabilities;
};
```

### Theme Integration

```tsx
const useComfyUITheme = () => {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const updateTheme = () => {
      const isDark =
        document.body.classList.contains("dark") ||
        document.documentElement.getAttribute("data-theme") === "dark";
      setTheme(isDark ? "dark" : "light");
    };

    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
};
```

## Error Handling

```tsx
// Use ComfyUI's notification system
const showNotification = (
  message: string,
  type: "info" | "success" | "error" = "info"
) => {
  if (window.app?.ui?.dialog) {
    window.app.ui.dialog.show({ type, content: message });
  } else {
    console.log(`[Asset Manager] ${type.toUpperCase()}: ${message}`);
  }
};

// Error boundaries for robust UX
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Asset Manager Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-4 text-red-500">Something went wrong.</div>;
    }
    return this.props.children;
  }
}
```

## Testing Patterns

```tsx
// Component testing with React Testing Library
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";

test("component handles user interaction", () => {
  const mockAction = vi.fn();
  render(<MyComponent title="Test" onAction={mockAction} />);

  fireEvent.click(screen.getByText("Test"));
  expect(mockAction).toHaveBeenCalledWith("clicked");
});

// Mock ComfyUI globals for testing
beforeEach(() => {
  global.window.app = {
    graph: { add: vi.fn() },
    ui: { settings: { addSetting: vi.fn() } },
    extensionManager: { registerSidebarTab: vi.fn() },
  };
});
```

## Advanced React Patterns

### Custom Hooks for Business Logic

```tsx
// Custom hook for asset management
const useAssetManager = () => {
  const [assets, setAssets] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadAssets = useCallback(async (folderId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await window.api.fetchApi(`/asset_manager/folders/${folderId}/models`);
      const data = await response.json();
      setAssets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, []);
  
  const addToWorkflow = useCallback((model: Model) => {
    const graph = window.app.graph;
    const node = LiteGraph.createNode("CheckpointLoaderSimple");
    
    if (node.widgets?.[0]) {
      node.widgets[0].value = model.filePath;
    }
    
    graph.add(node);
    graph.setDirtyCanvas(true);
    
    // Show success notification
    if (window.app?.ui?.dialog) {
      window.app.ui.dialog.show({
        type: 'success',
        content: `Added ${model.name} to workflow`
      });
    }
  }, []);
  
  return {
    assets,
    loading,
    error,
    loadAssets,
    addToWorkflow
  };
};
```

### Compound Components Pattern

```tsx
// Compound component for flexible asset cards
interface AssetCardContextType {
  asset: Model;
  isSelected: boolean;
  onSelect: () => void;
}

const AssetCardContext = createContext<AssetCardContextType | null>(null);

const useAssetCard = () => {
  const context = useContext(AssetCardContext);
  if (!context) {
    throw new Error('useAssetCard must be used within AssetCard');
  }
  return context;
};

// Main compound component
interface AssetCardProps {
  asset: Model;
  isSelected?: boolean;
  onSelect?: (asset: Model) => void;
  children: React.ReactNode;
}

const AssetCard = ({ asset, isSelected = false, onSelect, children }: AssetCardProps) => {
  const handleSelect = useCallback(() => {
    onSelect?.(asset);
  }, [asset, onSelect]);
  
  const contextValue = useMemo(() => ({
    asset,
    isSelected,
    onSelect: handleSelect
  }), [asset, isSelected, handleSelect]);
  
  return (
    <AssetCardContext.Provider value={contextValue}>
      <div className={`asset-card ${isSelected ? 'selected' : ''}`}>
        {children}
      </div>
    </AssetCardContext.Provider>
  );
};

// Compound component parts
AssetCard.Thumbnail = ({ className = '' }: { className?: string }) => {
  const { asset } = useAssetCard();
  return (
    <div className={`asset-thumbnail ${className}`}>
      <img src={asset.thumbnailUrl || '/default-thumbnail.png'} alt={asset.name} />
    </div>
  );
};

AssetCard.Title = ({ className = '' }: { className?: string }) => {
  const { asset } = useAssetCard();
  return <h3 className={`asset-title ${className}`}>{asset.name}</h3>;
};

AssetCard.Metadata = ({ className = '' }: { className?: string }) => {
  const { asset } = useAssetCard();
  return (
    <div className={`asset-metadata ${className}`}>
      <span>{asset.type}</span>
      <span>{formatFileSize(asset.fileSize)}</span>
    </div>
  );
};

AssetCard.Actions = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return <div className={`asset-actions ${className}`}>{children}</div>;
};

// Usage
const AssetGrid = ({ assets }: { assets: Model[] }) => {
  const [selectedAsset, setSelectedAsset] = useState<Model | null>(null);
  
  return (
    <div className="asset-grid">
      {assets.map(asset => (
        <AssetCard
          key={asset.id}
          asset={asset}
          isSelected={selectedAsset?.id === asset.id}
          onSelect={setSelectedAsset}
        >
          <AssetCard.Thumbnail />
          <AssetCard.Title />
          <AssetCard.Metadata />
          <AssetCard.Actions>
            <button onClick={() => addToWorkflow(asset)}>
              Add to Workflow
            </button>
          </AssetCard.Actions>
        </AssetCard>
      ))}
    </div>
  );
};
```

### Render Props Pattern for Data Fetching

```tsx
// Render props component for flexible data rendering
interface DataFetcherProps<T> {
  url: string;
  children: (state: {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
  }) => React.ReactNode;
}

const DataFetcher = <T,>({ url, children }: DataFetcherProps<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await window.api.fetchApi(url);
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fetch failed');
    } finally {
      setLoading(false);
    }
  }, [url]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return <>{children({ data, loading, error, refetch: fetchData })}</>;
};

// Usage with different render strategies
const ModelList = () => (
  <DataFetcher<Model[]> url="/asset_manager/models">
    {({ data, loading, error, refetch }) => {
      if (loading) return <LoadingSpinner />;
      if (error) return <ErrorMessage error={error} onRetry={refetch} />;
      if (!data) return <EmptyState />;
      
      return (
        <div className="model-list">
          {data.map(model => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>
      );
    }}
  </DataFetcher>
);
```

### Higher-Order Component for ComfyUI Integration

```tsx
// HOC for ComfyUI feature detection
interface ComfyUIFeatures {
  hasExtensionAPI: boolean;
  supportsPreviewMetadata: boolean;
  supportsMaxUploadSize: boolean;
}

const withComfyUIFeatures = <P extends object>(
  Component: React.ComponentType<P & { comfyUIFeatures: ComfyUIFeatures }>
) => {
  return (props: P) => {
    const [features, setFeatures] = useState<ComfyUIFeatures>({
      hasExtensionAPI: false,
      supportsPreviewMetadata: false,
      supportsMaxUploadSize: false,
    });
    
    useEffect(() => {
      setFeatures({
        hasExtensionAPI: !!window.app?.extensionManager,
        supportsPreviewMetadata: !!window.app?.features?.supports_preview_metadata,
        supportsMaxUploadSize: !!window.app?.features?.max_upload_size,
      });
    }, []);
    
    return <Component {...props} comfyUIFeatures={features} />;
  };
};

// Usage
interface ModelBrowserProps {
  comfyUIFeatures: ComfyUIFeatures;
}

const ModelBrowserBase = ({ comfyUIFeatures }: ModelBrowserProps) => {
  return (
    <div>
      {comfyUIFeatures.supportsPreviewMetadata && (
        <PreviewMetadataPanel />
      )}
      {comfyUIFeatures.supportsMaxUploadSize && (
        <UploadSizeIndicator />
      )}
    </div>
  );
};

const ModelBrowser = withComfyUIFeatures(ModelBrowserBase);
```

### Virtual Scrolling for Performance

```tsx
// Virtual scrolling for large lists - optimized for performance
interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
}

const VirtualScroll = <T,>({ items, itemHeight, containerHeight, renderItem, keyExtractor }: VirtualScrollProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, items.length);
  
  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;
  
  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={keyExtractor(item, startIndex + index)} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

These advanced React patterns provide flexible, performant, and maintainable solutions for complex UI requirements while maintaining integration with ComfyUI's systems.
```
