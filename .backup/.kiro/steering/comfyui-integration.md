---
inclusion: always
---

# ComfyUI Integration Guidelines

## Extension Registration and Lifecycle

### Python Extension Entry Point

```python
# __init__.py - Main extension entry point
from .src.adapters.driving.web_api_adapter import WebAPIAdapter
from .src.main import create_application

# ComfyUI extension registration
NODE_CLASS_MAPPINGS = {}  # No custom nodes in this extension
WEB_DIRECTORY = "./dist"  # Serve built React assets

# Initialize the application when ComfyUI loads
app = create_application()
```

### Frontend Extension Registration

```typescript
// main.tsx - Register with ComfyUI's extension system
import { app } from "/scripts/app.js";

// Register sidebar tab
app.extensionManager.registerSidebarTab({
  id: "asset-manager",
  icon: "pi pi-folder",
  title: "Asset Manager",
  tooltip: "Manage your ComfyUI assets",
  component: AssetManagerApp,
  type: "custom",
});
```

## ComfyUI API Integration

### Graph Manipulation

```typescript
// Access ComfyUI's graph for workflow integration
const addModelToWorkflow = (modelPath: string, nodeType: string) => {
  const graph = app.graph;

  // Create new node
  const node = LiteGraph.createNode(nodeType);
  node.title = `Load ${nodeType}`;

  // Set model path
  if (node.widgets) {
    const modelWidget = node.widgets.find(
      (w) => w.name === "ckpt_name" || w.name === "lora_name"
    );
    if (modelWidget) {
      modelWidget.value = modelPath;
    }
  }

  // Add to graph
  graph.add(node);

  // Position node
  node.pos = [100, 100];

  // Trigger graph update
  app.graph.setDirtyCanvas(true);
};
```

### Settings Integration

```typescript
// Add extension settings to ComfyUI's settings panel
app.ui.settings.addSetting({
  id: "AssetManager.cacheSize",
  name: "Asset Manager Cache Size (MB)",
  type: "number",
  defaultValue: 500,
  onChange: (value) => {
    // Handle setting change
    localStorage.setItem("assetManager.cacheSize", value.toString());
  },
});
```

### API Client Usage

```typescript
// Use ComfyUI's API client for backend communication
const fetchAssets = async () => {
  try {
    const response = await api.fetchApi("/asset_manager/models");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch assets:", error);
    throw error;
  }
};
```

## Feature Flags and Capability Negotiation

### Backend Feature Flag Support

```python
# In your web adapter, check client capabilities
def supports_feature(self, client_id: str, feature: str) -> bool:
    """Check if client supports a specific feature."""
    client_features = self.server_instance.sockets_metadata.get(client_id, {})
    return client_features.get('features', {}).get(feature, False)

async def get_models(self, request):
    client_id = request.headers.get('X-Client-ID')

    if self.supports_feature(client_id, 'supports_preview_metadata'):
        # Send enhanced response with metadata
        return web.json_response({
            'models': models,
            'metadata': enhanced_metadata
        })
    else:
        # Send basic response for older clients
        return web.json_response({'models': models})
```

### Frontend Feature Detection

```typescript
// Check ComfyUI capabilities
const useComfyUICapabilities = () => {
  const [capabilities, setCapabilities] = useState({
    supportsPreviewMetadata: false,
    supportsMaxUploadSize: false,
    supportsExtensionAPI: false,
  });

  useEffect(() => {
    // Check for ComfyUI features
    const checkCapabilities = () => {
      setCapabilities({
        supportsPreviewMetadata: !!app.features?.supports_preview_metadata,
        supportsMaxUploadSize: !!app.features?.max_upload_size,
        supportsExtensionAPI: !!app.extensionManager,
      });
    };

    checkCapabilities();
  }, []);

  return capabilities;
};
```

## Model and Asset Integration

### folder_paths Integration

```python
# Use ComfyUI's folder_paths for model discovery
import folder_paths

class ComfyUIFolderAdapter:
    def get_model_folders(self) -> Dict[str, str]:
        """Get all model folder paths from ComfyUI."""
        return {
            'checkpoints': folder_paths.get_folder_paths('checkpoints')[0],
            'loras': folder_paths.get_folder_paths('loras')[0],
            'vae': folder_paths.get_folder_paths('vae')[0],
            'embeddings': folder_paths.get_folder_paths('embeddings')[0],
            'controlnet': folder_paths.get_folder_paths('controlnet')[0],
            'upscale_models': folder_paths.get_folder_paths('upscale_models')[0]
        }

    def get_supported_extensions(self, folder_type: str) -> List[str]:
        """Get supported file extensions for a folder type."""
        return folder_paths.supported_pt_extensions
```

### Drag and Drop Integration

```typescript
// Implement drag and drop from asset manager to ComfyUI canvas
const ModelCard = ({ model, onDragStart }) => {
  const handleDragStart = (e: DragEvent) => {
    // Set drag data for ComfyUI
    e.dataTransfer?.setData(
      "text/plain",
      JSON.stringify({
        type: "model",
        path: model.filePath,
        modelType: model.modelType,
      })
    );

    onDragStart?.(model);
  };

  return (
    <div draggable onDragStart={handleDragStart} className="model-card">
      {/* Model card content */}
    </div>
  );
};
```

## Theme and Styling Integration

### Automatic Theme Detection

```typescript
// Detect and respond to ComfyUI theme changes
const useComfyUITheme = () => {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    // Check initial theme
    const isDark =
      document.body.classList.contains("dark") ||
      document.documentElement.getAttribute("data-theme") === "dark";
    setTheme(isDark ? "dark" : "light");

    // Watch for theme changes
    const observer = new MutationObserver(() => {
      const isDark =
        document.body.classList.contains("dark") ||
        document.documentElement.getAttribute("data-theme") === "dark";
      setTheme(isDark ? "dark" : "light");
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
};
```

### CSS Variable Integration

```css
/* Use ComfyUI's CSS variables for consistent styling */
.asset-manager-panel {
  background-color: var(--comfy-menu-bg);
  color: var(--comfy-input-text);
  border: 1px solid var(--comfy-menu-border);
}

.asset-card {
  background-color: var(--comfy-input-bg);
  border: 1px solid var(--comfy-input-border);
  border-radius: var(--comfy-border-radius);
}

.asset-card:hover {
  background-color: var(--comfy-input-bg-hover);
  border-color: var(--comfy-input-border-hover);
}
```

## Error Handling and User Feedback

### ComfyUI Toast Integration

```typescript
// Use ComfyUI's toast system for user notifications
const showNotification = (
  message: string,
  type: "info" | "success" | "error" = "info"
) => {
  if (app.ui?.dialog) {
    app.ui.dialog.show({
      type,
      content: message,
    });
  } else {
    // Fallback to console or custom notification
    console.log(`[Asset Manager] ${type.toUpperCase()}: ${message}`);
  }
};

// Usage in components
const handleAssetLoad = async (asset: Asset) => {
  try {
    await loadAssetToWorkflow(asset);
    showNotification(`Successfully loaded ${asset.name}`, "success");
  } catch (error) {
    showNotification(`Failed to load ${asset.name}: ${error.message}`, "error");
  }
};
```

## Performance Optimization

### ComfyUI Resource Management

```typescript
// Respect ComfyUI's resource constraints
const useResourceAwareLoading = () => {
  const [isComfyUIBusy, setIsComfyUIBusy] = useState(false);

  useEffect(() => {
    // Monitor ComfyUI's queue status
    const checkQueueStatus = () => {
      if (app.ui?.queue) {
        const queueSize = app.ui.queue.size;
        setIsComfyUIBusy(queueSize > 0);
      }
    };

    const interval = setInterval(checkQueueStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  return { isComfyUIBusy };
};
```

## Registry and Distribution

### pyproject.toml Configuration

```toml
[tool.comfy]
PublisherId = "your-publisher-id"
DisplayName = "ComfyUI Asset Manager"
Icon = "pi pi-folder"  # PrimeIcons icon name
includes = ["dist/"]   # Include built frontend assets
excludes = ["node_modules/", "ui/src/", "*.log"]

[tool.comfy.dependencies]
# Specify ComfyUI version compatibility
comfyui = ">=0.1.0"

[tool.comfy.metadata]
tags = ["asset-management", "models", "workflow"]
category = "utility"
```

### Publishing Workflow

```bash
# Development workflow
cd ui && pnpm run build && cd ..  # Build frontend
comfy-cli validate                # Validate extension
comfy-cli publish                 # Publish to registry

# Automated publishing via GitHub Actions
# Triggers on version changes in pyproject.toml
```

## Development Best Practices

### Extension Development Lifecycle

1. **Research Phase**: Use MCP tools to understand current ComfyUI capabilities
2. **Design Phase**: Plan integration points and compatibility requirements
3. **Implementation Phase**: Follow established patterns and test thoroughly
4. **Testing Phase**: Validate with Chrome MCP in real ComfyUI environment
5. **Publishing Phase**: Use ComfyUI Registry for distribution

### Integration Validation Checklist

- [ ] Extension appears in ComfyUI sidebar
- [ ] Theme switching works correctly (light/dark)
- [ ] API endpoints respond correctly
- [ ] Drag-and-drop functionality works
- [ ] Settings integration functions properly
- [ ] No conflicts with ComfyUI core functionality
- [ ] Performance is acceptable with large datasets
- [ ] Error handling provides meaningful feedback

### Troubleshooting Common Issues

#### Extension Not Loading

1. Check `dist/` directory contains built assets
2. Verify `__init__.py` registers web directory correctly
3. Check ComfyUI console for registration errors
4. Ensure no JavaScript errors prevent initialization

#### API Communication Failures

1. Verify backend server is running
2. Check network tab for failed requests
3. Validate endpoint URLs match frontend expectations
4. Test CORS configuration if needed

#### Theme Integration Issues

1. Verify CSS variables are used correctly
2. Test theme switching functionality
3. Check for CSS conflicts with ComfyUI styles
4. Validate responsive design at different screen sizes

## Advanced Integration Patterns

### Workflow Integration

```typescript
// Advanced workflow manipulation
const WorkflowIntegration = {
  // Add model to existing workflow
  addModelToWorkflow: (modelPath: string, nodeType: string, position?: [number, number]) => {
    const graph = window.app.graph;
    const node = LiteGraph.createNode(nodeType);
    
    // Set model path based on node type
    const modelWidget = node.widgets?.find(w => 
      ['ckpt_name', 'lora_name', 'vae_name', 'model_name'].includes(w.name)
    );
    
    if (modelWidget) {
      modelWidget.value = modelPath;
    }
    
    // Position node intelligently
    if (position) {
      node.pos = position;
    } else {
      // Find empty space on canvas
      node.pos = graph.findEmptyPosition();
    }
    
    graph.add(node);
    graph.setDirtyCanvas(true);
    
    return node;
  },
  
  // Create complete workflow from template
  createWorkflowFromTemplate: (template: WorkflowTemplate, models: ModelAssignment[]) => {
    const graph = window.app.graph;
    graph.clear();
    
    template.nodes.forEach(nodeConfig => {
      const node = LiteGraph.createNode(nodeConfig.type);
      node.pos = nodeConfig.position;
      
      // Apply model assignments
      const modelAssignment = models.find(m => m.nodeId === nodeConfig.id);
      if (modelAssignment && node.widgets) {
        const widget = node.widgets.find(w => w.name === modelAssignment.widgetName);
        if (widget) {
          widget.value = modelAssignment.modelPath;
        }
      }
      
      graph.add(node);
    });
    
    // Connect nodes based on template
    template.connections.forEach(conn => {
      const fromNode = graph.getNodeById(conn.fromNodeId);
      const toNode = graph.getNodeById(conn.toNodeId);
      
      if (fromNode && toNode) {
        fromNode.connect(conn.fromSlot, toNode, conn.toSlot);
      }
    });
    
    graph.setDirtyCanvas(true);
  }
};
```

### Extension Lifecycle Management

```python
# Advanced extension lifecycle handling
class ExtensionLifecycleManager:
    def __init__(self):
        self.is_initialized = False
        self.cleanup_callbacks = []
        
    async def initialize(self):
        """Initialize extension with proper error handling"""
        try:
            # Register API routes
            await self._register_api_routes()
            
            # Initialize services
            await self._initialize_services()
            
            # Register cleanup handlers
            self._register_cleanup_handlers()
            
            self.is_initialized = True
            logger.info("Asset Manager extension initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize extension: {e}")
            await self.cleanup()
            raise
    
    async def cleanup(self):
        """Clean up resources on extension shutdown"""
        for callback in reversed(self.cleanup_callbacks):
            try:
                await callback()
            except Exception as e:
                logger.error(f"Error during cleanup: {e}")
        
        self.cleanup_callbacks.clear()
        self.is_initialized = False
    
    def register_cleanup(self, callback):
        """Register cleanup callback"""
        self.cleanup_callbacks.append(callback)
```

### Real-time Communication

```typescript
// WebSocket integration for real-time updates
class ComfyUIWebSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  
  connect() {
    // Use ComfyUI's existing WebSocket connection
    if (window.api?.socket) {
      this.ws = window.api.socket;
      this.setupEventListeners();
    }
  }
  
  private setupEventListeners() {
    if (!this.ws) return;
    
    // Listen for ComfyUI events that affect our extension
    this.ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      
      // Handle queue updates
      if (data.type === 'status' && data.data.exec_info) {
        this.emit('queue_update', data.data.exec_info);
      }
      
      // Handle progress updates
      if (data.type === 'progress') {
        this.emit('progress_update', data.data);
      }
    });
  }
  
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }
  
  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }
}
```

### Memory Management

```typescript
// Efficient memory management for large datasets
class AssetMemoryManager {
  private cache = new Map<string, any>();
  private maxCacheSize = 100; // MB
  private currentCacheSize = 0;
  
  set(key: string, value: any) {
    const size = this.calculateSize(value);
    
    // Evict old entries if needed
    while (this.currentCacheSize + size > this.maxCacheSize && this.cache.size > 0) {
      this.evictOldest();
    }
    
    this.cache.set(key, { value, size, timestamp: Date.now() });
    this.currentCacheSize += size;
  }
  
  get(key: string) {
    const entry = this.cache.get(key);
    if (entry) {
      entry.timestamp = Date.now(); // Update access time
      return entry.value;
    }
    return null;
  }
  
  private evictOldest() {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      this.cache.delete(oldestKey);
      this.currentCacheSize -= entry!.size;
    }
  }
  
  private calculateSize(obj: any): number {
    // Rough size calculation in MB
    return JSON.stringify(obj).length / (1024 * 1024);
  }
}
```

This integration guide ensures seamless ComfyUI compatibility while maintaining extension functionality, performance, and user experience through advanced patterns and lifecycle management.
