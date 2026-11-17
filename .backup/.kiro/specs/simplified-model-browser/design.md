# Design Document

## Overview

The simplified model browser feature will extend the existing model browser tab to provide browsing capabilities for CivitAI and HuggingFace platforms. The design follows the established patterns in the codebase, utilizing a sub-tab interface within the existing Model Browser tab. The implementation will focus on browsing and discovery without download functionality, maintaining consistency with the existing UI patterns and architecture.

**Key Design Decisions:**

- **Sub-tab Architecture**: Separate sub-tabs for CivitAI and HuggingFace provide platform-specific browsing experiences while maintaining a unified interface
- **State Preservation**: Tab switching preserves previous state and scroll position for seamless user experience
- **ComfyUI-First Filtering**: Prioritize models compatible with ComfyUI to reduce cognitive load and improve workflow integration
- **Progressive Enhancement**: Start with core browsing functionality, prepare architecture for future download capabilities

## Architecture

### Frontend Architecture

The model browser will follow the existing feature-based structure:

```
ui/src/features/model-browser/
├── ModelBrowserTab.tsx           # Main tab component with sub-tab navigation
├── ModelBrowserTab.css           # Existing styles, enhanced for sub-tabs
├── components/
│   ├── CivitAIBrowser.tsx       # CivitAI browsing component
│   ├── CivitAIBrowser.css       # CivitAI-specific styles
│   ├── HuggingFaceBrowser.tsx   # HuggingFace browsing component
│   ├── HuggingFaceBrowser.css   # HuggingFace-specific styles
│   ├── ModelCard.tsx            # Reusable model card component
│   ├── ModelCard.css            # Model card styles
│   ├── ModelDetailModal.tsx     # Model detail view modal
│   ├── ModelDetailModal.css     # Modal styles
│   ├── SearchFilterBar.tsx      # Search and filter component
│   └── SearchFilterBar.css      # Search filter styles
├── types.ts                     # TypeScript interfaces for external models
├── services/
│   ├── civitaiService.ts        # CivitAI API integration
│   └── huggingfaceService.ts    # HuggingFace API integration
└── utils/
    └── modelUtils.ts            # Utility functions for model data
```

### Backend Architecture

Following the hexagonal architecture pattern:

```
src/domain/entities/
├── external_model.py            # External model entity

src/domain/ports/driven/
├── external_model_port.py       # Port for external model data access

src/adapters/driven/
├── civitai_api_adapter.py       # CivitAI API adapter
└── huggingface_api_adapter.py   # HuggingFace API adapter

src/adapters/driving/
└── web_api_adapter.py           # Enhanced with external model endpoints
```

## Components and Interfaces

### Frontend Components

#### ModelBrowserTab (Enhanced)

- **Purpose**: Main container with sub-tab navigation
- **State**: Active sub-tab, shared search state
- **Props**: None (root component)
- **Features**:
  - Sub-tab navigation (CivitAI, HuggingFace)
  - Preserves tab state when switching
  - Shared search context

#### CivitAIBrowser

- **Purpose**: Browse and display CivitAI models
- **State**: Models list, pagination, loading, error states
- **Props**: Search query, filters
- **Features**:
  - Grid display of model cards
  - Infinite scroll or pagination
  - Platform-specific filters (model type, sort order)
  - Error handling with retry mechanisms

#### HuggingFaceBrowser

- **Purpose**: Browse and display HuggingFace models
- **State**: Models list, pagination, loading, error states
- **Props**: Search query, filters
- **Features**:
  - Grid display of model cards
  - Infinite scroll or pagination
  - Platform-specific filters (task type, library)
  - Error handling with retry mechanisms

#### ModelCard

- **Purpose**: Reusable card component for displaying model information
- **Props**: Model data, platform type, onClick handler
- **Features**:
  - Responsive design
  - Platform-specific styling
  - Hover effects
  - Loading states for images

#### ModelDetailModal

- **Purpose**: Display detailed model information
- **Props**: Model data, platform type, onClose handler
- **Features**:
  - Modal overlay with backdrop click to close
  - Comprehensive model information (description, tags, version info)
  - Image gallery with example outputs
  - Platform-specific metadata display
  - ComfyUI compatibility indicators and warnings
  - Model requirements and file size information for download planning
  - Model folder destination display (checkpoints/, loras/, etc.)
  - State restoration to previous browse position on close

#### SearchFilterBar

- **Purpose**: Search input and filter controls
- **Props**: Search value, filters, onChange handlers
- **Features**:
  - Debounced search input (300ms delay to prevent excessive API calls)
  - Platform-specific filter options (model type, sort order, base model)
  - ComfyUI-specific filters (compatibility, model folder, file format)
  - Clear filters functionality with reset to default state
  - Empty state handling with "no results found" messaging and suggestions

### State Management and Persistence

#### Tab State Preservation

- **Scroll Position**: Maintain scroll position when switching between sub-tabs
- **Search Context**: Preserve search queries and filter selections per tab
- **Selection State**: Remember selected models and browsing history
- **Navigation Context**: Restore previous browsing state when returning to tab

#### Performance State Management

- **Lazy State Hydration**: Load tab state only when tab becomes active
- **Memory Management**: Implement LRU cache for tab states to prevent memory leaks
- **State Serialization**: Persist critical browsing context to localStorage for session recovery

### Backend Components

#### ExternalModel Entity

```python
@dataclass
class ExternalModel:
    id: str
    name: str
    description: str
    author: str
    platform: str  # 'civitai' or 'huggingface'
    thumbnail_url: Optional[str]
    tags: List[str]
    download_count: int
    rating: Optional[float]
    created_at: datetime
    updated_at: datetime
    metadata: Dict[str, Any]  # Platform-specific metadata
    # ComfyUI-specific fields
    comfyui_compatibility: ComfyUICompatibility
    model_type: Optional[ComfyUIModelType] = None  # checkpoint, lora, vae, etc.
    base_model: Optional[str] = None  # SD1.5, SDXL, etc.
    file_size: Optional[int] = None
    file_format: Optional[str] = None  # safetensors, ckpt, etc.

@dataclass
class ComfyUICompatibility:
    """ComfyUI-specific compatibility information."""
    is_compatible: bool
    compatibility_score: float  # 0.0 to 1.0 based on format, size, dependencies
    model_folder: Optional[str] = None  # checkpoints, loras, vae, etc.
    compatibility_notes: Optional[str] = None
    required_nodes: List[str] = field(default_factory=list)
    compatibility_issues: List[str] = field(default_factory=list)  # Specific issues preventing compatibility
    recommended_settings: Dict[str, Any] = field(default_factory=dict)  # Suggested ComfyUI settings

@enum
class ComfyUIModelType(Enum):
    CHECKPOINT = "checkpoint"
    LORA = "lora"
    VAE = "vae"
    EMBEDDING = "embedding"
    CONTROLNET = "controlnet"
    UPSCALER = "upscaler"
    UNKNOWN = "unknown"
```

#### ExternalModelPort (Driven Port)

```python
class ExternalModelPort(ABC):
    @abstractmethod
    async def search_models(
        self,
        platform: str,
        query: str = "",
        limit: int = 20,
        offset: int = 0,
        filters: Dict[str, Any] = None
    ) -> List[ExternalModel]:
        pass

    @abstractmethod
    async def get_model_details(self, platform: str, model_id: str) -> ExternalModel:
        pass
```

### API Endpoints

All endpoints will be prefixed with `/asset_manager/external/`:

- `GET /asset_manager/external/models` - Search models across platforms
  - Query parameters: `q` (search query), `platform`, `limit`, `offset`, `sort`, `model_type`, `base_model`, `comfyui_compatible`
- `GET /asset_manager/external/models/{platform}` - Search models on specific platform
  - Query parameters: `q`, `limit`, `offset`, `sort`, platform-specific filters
- `GET /asset_manager/external/models/{platform}/{model_id}` - Get detailed model information
- `GET /asset_manager/external/platforms` - Get available platforms and their capabilities
- `GET /asset_manager/external/filters/{platform}` - Get available filter options for platform

### External API Integration

#### CivitAI API Integration

- **Base URL**: `https://civitai.com/api/v1/`
- **Key Endpoints**:
  - `/models` - List models with search and filtering
  - `/models/{modelId}` - Get model details
- **Rate Limiting**: Respect API rate limits with exponential backoff
- **Error Handling**: Handle API unavailability gracefully
- **ComfyUI Filtering**: Filter results to prioritize ComfyUI-compatible models
- **Model Type Mapping**: Map CivitAI model types to ComfyUI model categories

#### HuggingFace API Integration

- **Base URL**: `https://huggingface.co/api/`
- **Key Endpoints**:
  - `/models` - List models with search and filtering
  - `/models/{repo_id}` - Get model details
- **Authentication**: No authentication required for public models
- **Error Handling**: Handle API unavailability gracefully
- **ComfyUI Filtering**: Focus on diffusion models and ComfyUI-compatible formats
- **Library Filtering**: Prioritize diffusers, transformers, and other ComfyUI-supported libraries

## Data Models

### Frontend TypeScript Interfaces

```typescript
export interface ExternalModel {
  id: string;
  name: string;
  description: string;
  author: string;
  platform: "civitai" | "huggingface";
  thumbnailUrl?: string;
  tags: string[];
  downloadCount: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, any>;
}

export interface ModelSearchParams {
  query?: string;
  platform?: "civitai" | "huggingface";
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, any>;
}

export interface ModelSearchResponse {
  models: ExternalModel[];
  total: number;
  hasMore: boolean;
  nextOffset?: number;
}
```

### Platform-Specific Metadata

#### CivitAI Metadata

```typescript
interface CivitAIMetadata {
  modelType: string;
  baseModel: string;
  nsfw: boolean;
  allowCommercialUse: string;
  favoriteCount: number;
  commentCount: number;
  versions: Array<{
    id: number;
    name: string;
    downloadUrl: string;
    files: Array<{
      name: string;
      sizeKB: number;
      type: string;
      format: string; // safetensors, ckpt, etc.
    }>;
  }>;
  // ComfyUI-specific mappings
  comfyuiModelType: ComfyUIModelType;
  comfyuiFolder: string; // checkpoints, loras, etc.
  compatibilityScore: number; // 0-1 based on ComfyUI compatibility
}
```

#### HuggingFace Metadata

```typescript
interface HuggingFaceMetadata {
  library: string;
  pipeline_tag: string;
  license: string;
  languages: string[];
  datasets: string[];
  metrics: string[];
  siblings: Array<{
    rfilename: string;
    size: number;
  }>;
  // ComfyUI-specific mappings
  comfyuiCompatible: boolean;
  comfyuiModelType: ComfyUIModelType;
  supportedFormats: string[]; // safetensors, bin, etc.
  diffusionType: string; // stable-diffusion, stable-diffusion-xl, etc.
}
```

## Error Handling

### Frontend Error Handling

- **Network Errors**: Display retry buttons and offline indicators with clear messaging
- **API Errors**: Show user-friendly error messages with specific guidance (e.g., "CivitAI API unavailable")
- **Loading States**: Skeleton screens and loading spinners during data fetching
- **Empty States**: Informative messages when no results found with search suggestions
- **Image Loading Failures**: Placeholder images when thumbnails fail to load
- **State Recovery**: Maintain browsing context and position when recovering from errors
- **Retry Mechanisms**: Exponential backoff for failed requests with user-initiated retry options

### Backend Error Handling

- **API Rate Limiting**: Implement exponential backoff and retry logic
- **External API Failures**: Graceful degradation with cached data when possible
- **Validation Errors**: Proper error responses with meaningful messages
- **Timeout Handling**: Configurable timeouts for external API calls

## Testing Strategy

### Frontend Testing

- **Unit Tests**: Component logic and utility functions
- **Integration Tests**: API service integration
- **Visual Tests**: Component rendering and styling
- **User Interaction Tests**: Search, filtering, and modal interactions

### Backend Testing

- **Unit Tests**: Domain entities and services
- **Integration Tests**: External API adapters
- **Contract Tests**: API endpoint responses
- **Error Handling Tests**: Various failure scenarios

### Test Data

- **Mock Data**: Realistic model data for development and testing
- **API Mocking**: Mock external API responses for reliable testing
- **Error Scenarios**: Test various error conditions and edge cases

## Performance Considerations

### Frontend Performance

- **Lazy Loading**: Load images and components on demand to improve initial load time
- **Virtual Scrolling**: For large model lists (1000+ items) to maintain smooth scrolling
- **Debounced Search**: 300ms delay to prevent excessive API calls during typing
- **Caching**: Cache search results and model details with TTL-based invalidation
- **Image Optimization**: Lazy load and optimize thumbnail images with progressive loading
- **State Preservation**: Maintain scroll position and tab state when switching between sub-tabs
- **Pagination Strategy**: Infinite scroll with intelligent prefetching of next page

### Backend Performance

- **Response Caching**: Cache external API responses
- **Request Batching**: Batch multiple requests when possible
- **Connection Pooling**: Reuse HTTP connections for external APIs
- **Async Processing**: Non-blocking external API calls

## Security Considerations

### API Security

- **Input Validation**: Validate all search parameters and filters
- **Rate Limiting**: Implement rate limiting for API endpoints
- **CORS**: Proper CORS configuration for external API calls
- **Content Security**: Validate external content and images

### Data Privacy

- **No User Data**: No personal user data stored or transmitted
- **External Content**: Handle external images and content safely
- **API Keys**: Secure handling of any required API keys

## ComfyUI Integration Points

### Model Type Mapping and Compatibility

- **CivitAI Types**: Map CivitAI model types to ComfyUI folders

  - Checkpoint → checkpoints/
  - LORA → loras/
  - TextualInversion → embeddings/
  - VAE → vae/
  - ControlNet → controlnet/
  - Upscaler → upscale_models/

- **HuggingFace Types**: Map HuggingFace models to ComfyUI categories
  - diffusers/stable-diffusion → checkpoints/
  - diffusers/lora → loras/
  - diffusers/controlnet → controlnet/
  - transformers/clip → clip/

### Compatibility Detection and Prioritization

- **File Format Priority**: Prioritize .safetensors over .ckpt files for security and performance
- **Base Model Matching**: Match base models (SD1.5, SDXL, Flux, etc.) with ComfyUI support
- **File Size Warnings**: Alert users about very large models that may cause memory issues
- **Dependencies Check**: Identify required custom nodes or extensions
- **Compatibility Scoring**: Implement 0-1 compatibility score based on format, size, and dependencies
- **Model Prioritization**: Sort results to show ComfyUI-compatible models first

### User Experience Integration

- **Consistent Styling**: Match ComfyUI's design language and color scheme using CSS variables
- **Theme Integration**: Automatically adapt to ComfyUI's light/dark theme changes
- **State Preservation**: Maintain browsing context when switching tabs or navigating away
- **Performance Optimization**: Ensure browsing doesn't interfere with ComfyUI's generation queue
- **Accessibility**: Support keyboard navigation and screen reader compatibility
- **Context Awareness**: Show relevant models based on user's current workflow context

### Future Download Integration Preparation

- **Download Location Planning**: Architecture ready for downloading to appropriate ComfyUI model folders
- **File Validation Framework**: Prepare for validating downloaded models against ComfyUI requirements
- **Duplicate Detection System**: Design for checking existing models before download
- **Progress Tracking Infrastructure**: Architecture supports download progress monitoring
- **Queue Management**: Prepare for download queue integration with ComfyUI's task system
