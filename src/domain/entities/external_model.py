"""
Domain entities for external model management.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any
from .base import Entity


class ComfyUIModelType(Enum):
    """ComfyUI model types for categorization."""
    CHECKPOINT = "checkpoint"
    LORA = "lora"
    VAE = "vae"
    EMBEDDING = "embedding"
    CONTROLNET = "controlnet"
    UPSCALER = "upscaler"
    UNKNOWN = "unknown"


@dataclass
class ComfyUICompatibility:
    """ComfyUI-specific compatibility information."""
    is_compatible: bool
    model_folder: Optional[str] = None  # checkpoints, loras, vae, etc.
    compatibility_notes: Optional[str] = None
    required_nodes: List[str] = field(default_factory=list)


@dataclass
class ExternalModel(Entity):
    """External model entity representing models from CivitAI, HuggingFace, etc."""
    
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
    model_type: Optional[ComfyUIModelType] = None
    base_model: Optional[str] = None  # SD1.5, SDXL, etc.
    file_size: Optional[int] = None
    file_format: Optional[str] = None  # safetensors, ckpt, etc.

    def __post_init__(self):
        """Post-initialization validation and processing."""
        
        # Validate platform
        if self.platform not in ['civitai', 'huggingface']:
            raise ValueError(f"Invalid platform: {self.platform}")
        
        # Ensure tags is a list
        if not isinstance(self.tags, list):
            self.tags = []
        
        # Ensure metadata is a dict
        if not isinstance(self.metadata, dict):
            self.metadata = {}
        
        # Validate rating if provided
        if self.rating is not None and (self.rating < 0 or self.rating > 5):
            raise ValueError("Rating must be between 0 and 5")
        
        # Validate download count
        if self.download_count < 0:
            raise ValueError("Download count cannot be negative")

    @property
    def is_comfyui_compatible(self) -> bool:
        """Check if the model is compatible with ComfyUI."""
        return self.comfyui_compatibility.is_compatible

    @property
    def comfyui_folder_path(self) -> Optional[str]:
        """Get the ComfyUI folder path for this model type."""
        return self.comfyui_compatibility.model_folder

    def get_display_name(self) -> str:
        """Get a display-friendly name for the model."""
        return f"{self.name} by {self.author}"

    def get_file_size_mb(self) -> Optional[float]:
        """Get file size in MB if available."""
        if self.file_size:
            return round(self.file_size / (1024 * 1024), 2)
        return None

    def has_tag(self, tag: str) -> bool:
        """Check if the model has a specific tag (case-insensitive)."""
        return tag.lower() in [t.lower() for t in self.tags]

    def to_dict(self) -> Dict[str, Any]:
        """Convert the external model to a dictionary for API responses."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'author': self.author,
            'platform': self.platform,
            'thumbnailUrl': self.thumbnail_url,
            'tags': self.tags,
            'downloadCount': self.download_count,
            'rating': self.rating,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat(),
            'metadata': self.metadata,
            'comfyuiCompatibility': {
                'isCompatible': self.comfyui_compatibility.is_compatible,
                'modelFolder': self.comfyui_compatibility.model_folder,
                'compatibilityNotes': self.comfyui_compatibility.compatibility_notes,
                'requiredNodes': self.comfyui_compatibility.required_nodes
            },
            'modelType': self.model_type.value if self.model_type else None,
            'baseModel': self.base_model,
            'fileSize': self.file_size,
            'fileFormat': self.file_format
        }


@dataclass
class CivitAIFile:
    """Represents a file from CivitAI model version."""
    name: str
    size_kb: int
    file_type: str
    format: str  # safetensors, ckpt, etc.
    download_url: str
    hashes: Dict[str, str] = field(default_factory=dict)


@dataclass
class CivitAIVersion:
    """Represents a version of a CivitAI model."""
    id: int
    name: str
    description: str
    base_model: str
    files: List[CivitAIFile]
    images: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class CivitAIMetadata:
    """CivitAI-specific metadata."""
    model_type: str
    base_model: str
    nsfw: bool
    allow_commercial_use: str
    favorite_count: int
    comment_count: int
    versions: List[CivitAIVersion]
    
    # ComfyUI-specific mappings
    comfyui_model_type: ComfyUIModelType
    comfyui_folder: str
    compatibility_score: float  # 0-1 based on ComfyUI compatibility


@dataclass
class HuggingFaceSibling:
    """Represents a file in a HuggingFace model repository."""
    filename: str
    size: Optional[int] = None


@dataclass
class HuggingFaceMetadata:
    """HuggingFace-specific metadata."""
    library: str
    pipeline_tag: str
    license: str
    languages: List[str]
    datasets: List[str]
    metrics: List[str]
    siblings: List[HuggingFaceSibling]
    
    # ComfyUI-specific mappings
    comfyui_compatible: bool
    comfyui_model_type: ComfyUIModelType
    supported_formats: List[str]
    diffusion_type: str  # stable-diffusion, stable-diffusion-xl, etc.


class ModelTypeMapping:
    """Utility class for mapping between platform types and ComfyUI types."""
    
    # CivitAI type mappings
    CIVITAI_TYPE_MAPPINGS = {
        'Checkpoint': {
            'comfyui_type': ComfyUIModelType.CHECKPOINT,
            'comfyui_folder': 'checkpoints',
            'description': 'Full model checkpoint'
        },
        'LORA': {
            'comfyui_type': ComfyUIModelType.LORA,
            'comfyui_folder': 'loras',
            'description': 'Low-Rank Adaptation model'
        },
        'TextualInversion': {
            'comfyui_type': ComfyUIModelType.EMBEDDING,
            'comfyui_folder': 'embeddings',
            'description': 'Textual Inversion embedding'
        },
        'Hypernetwork': {
            'comfyui_type': ComfyUIModelType.UNKNOWN,
            'comfyui_folder': 'hypernetworks',
            'description': 'Hypernetwork model'
        },
        'AestheticGradient': {
            'comfyui_type': ComfyUIModelType.UNKNOWN,
            'comfyui_folder': 'embeddings',
            'description': 'Aesthetic gradient'
        },
        'Controlnet': {
            'comfyui_type': ComfyUIModelType.CONTROLNET,
            'comfyui_folder': 'controlnet',
            'description': 'ControlNet model'
        },
        'Poses': {
            'comfyui_type': ComfyUIModelType.CONTROLNET,
            'comfyui_folder': 'controlnet',
            'description': 'Pose control model'
        },
        'VAE': {
            'comfyui_type': ComfyUIModelType.VAE,
            'comfyui_folder': 'vae',
            'description': 'Variational Autoencoder'
        },
        'Upscaler': {
            'comfyui_type': ComfyUIModelType.UPSCALER,
            'comfyui_folder': 'upscale_models',
            'description': 'Image upscaling model'
        }
    }
    
    # HuggingFace pipeline tag mappings
    HUGGINGFACE_PIPELINE_MAPPINGS = {
        'text-to-image': {
            'comfyui_type': ComfyUIModelType.CHECKPOINT,
            'comfyui_folder': 'checkpoints',
            'description': 'Text-to-image diffusion model'
        },
        'image-to-image': {
            'comfyui_type': ComfyUIModelType.CHECKPOINT,
            'comfyui_folder': 'checkpoints',
            'description': 'Image-to-image diffusion model'
        },
        'unconditional-image-generation': {
            'comfyui_type': ComfyUIModelType.CHECKPOINT,
            'comfyui_folder': 'checkpoints',
            'description': 'Unconditional image generation model'
        }
    }
    
    @classmethod
    def get_comfyui_type_from_civitai(cls, civitai_type: str) -> ComfyUIModelType:
        """Get ComfyUI model type from CivitAI type."""
        mapping = cls.CIVITAI_TYPE_MAPPINGS.get(civitai_type, {})
        return mapping.get('comfyui_type', ComfyUIModelType.UNKNOWN)
    
    @classmethod
    def get_comfyui_folder_from_civitai(cls, civitai_type: str) -> str:
        """Get ComfyUI folder from CivitAI type."""
        mapping = cls.CIVITAI_TYPE_MAPPINGS.get(civitai_type, {})
        return mapping.get('comfyui_folder', 'models')
    
    @classmethod
    def get_comfyui_type_from_huggingface(cls, pipeline_tag: str) -> ComfyUIModelType:
        """Get ComfyUI model type from HuggingFace pipeline tag."""
        mapping = cls.HUGGINGFACE_PIPELINE_MAPPINGS.get(pipeline_tag, {})
        return mapping.get('comfyui_type', ComfyUIModelType.UNKNOWN)
    
    @classmethod
    def get_comfyui_folder_from_huggingface(cls, pipeline_tag: str) -> str:
        """Get ComfyUI folder from HuggingFace pipeline tag."""
        mapping = cls.HUGGINGFACE_PIPELINE_MAPPINGS.get(pipeline_tag, {})
        return mapping.get('comfyui_folder', 'models')
    
    @classmethod
    def is_format_supported(cls, file_format: str) -> bool:
        """Check if a file format is supported by ComfyUI."""
        supported_formats = {
            'safetensors', 'ckpt', 'pt', 'pth', 'bin', 'pkl'
        }
        return file_format.lower() in supported_formats
    
    @classmethod
    def get_compatibility_score(cls, model_type: str, file_format: str, base_model: str) -> float:
        """Calculate compatibility score for ComfyUI (0-1)."""
        score = 0.0
        
        # Base score for known model types
        if model_type in cls.CIVITAI_TYPE_MAPPINGS:
            score += 0.4
        
        # Bonus for supported file formats
        if cls.is_format_supported(file_format):
            score += 0.3
            # Extra bonus for safetensors
            if file_format.lower() == 'safetensors':
                score += 0.1
        
        # Bonus for known base models
        known_base_models = {'SD 1.5', 'SDXL 1.0', 'SD 2.1', 'SD 2.0'}
        if base_model in known_base_models:
            score += 0.2
        
        return min(score, 1.0)