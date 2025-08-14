"""External model domain entity for models from external platforms."""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any, List

from .base import Entity, ValidationError, validate_not_empty, validate_positive_number


class ComfyUIModelType(Enum):
    """Enumeration of ComfyUI model types."""
    CHECKPOINT = "checkpoint"
    LORA = "lora"
    VAE = "vae"
    EMBEDDING = "embedding"
    CONTROLNET = "controlnet"
    UPSCALER = "upscaler"
    UNKNOWN = "unknown"


class ExternalPlatform(Enum):
    """Enumeration of supported external platforms."""
    CIVITAI = "civitai"
    HUGGINGFACE = "huggingface"


@dataclass(frozen=True)
class ComfyUICompatibility:
    """ComfyUI-specific compatibility information."""
    is_compatible: bool
    model_folder: Optional[str] = None  # checkpoints, loras, vae, etc.
    compatibility_notes: Optional[str] = None
    required_nodes: List[str] = field(default_factory=list)
    
    def __post_init__(self):
        """Validate compatibility data after initialization."""
        if not isinstance(self.is_compatible, bool):
            raise ValidationError("is_compatible must be a boolean", "is_compatible")
        
        if self.model_folder is not None:
            validate_not_empty(self.model_folder, "model_folder")
        
        if self.compatibility_notes is not None:
            validate_not_empty(self.compatibility_notes, "compatibility_notes")
        
        if not isinstance(self.required_nodes, list):
            raise ValidationError("required_nodes must be a list", "required_nodes")
        
        for node in self.required_nodes:
            if not isinstance(node, str) or not node.strip():
                raise ValidationError("each required node must be a non-empty string", "required_nodes")


@dataclass
class ExternalModel(Entity):
    """Domain entity representing an AI model from external platforms."""
    
    name: str
    description: str
    author: str
    platform: ExternalPlatform
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
        """Validate external model data after initialization."""
        self._validate()
    
    def _validate(self) -> None:
        """Validate external model entity data."""
        validate_not_empty(self.name, "name")
        validate_not_empty(self.description, "description")
        validate_not_empty(self.author, "author")
        
        if not isinstance(self.platform, ExternalPlatform):
            raise ValidationError("platform must be a valid ExternalPlatform", "platform")
        
        if self.thumbnail_url is not None:
            validate_not_empty(self.thumbnail_url, "thumbnail_url")
        
        if not isinstance(self.tags, list):
            raise ValidationError("tags must be a list", "tags")
        
        for tag in self.tags:
            if not isinstance(tag, str) or not tag.strip():
                raise ValidationError("each tag must be a non-empty string", "tags")
        
        if self.download_count < 0:
            raise ValidationError("download_count must be non-negative", "download_count")
        
        if self.rating is not None:
            if not isinstance(self.rating, (int, float)) or not 0 <= self.rating <= 5:
                raise ValidationError("rating must be a number between 0 and 5", "rating")
        
        if not isinstance(self.created_at, datetime):
            raise ValidationError("created_at must be a datetime", "created_at")
        
        if not isinstance(self.updated_at, datetime):
            raise ValidationError("updated_at must be a datetime", "updated_at")
        
        if not isinstance(self.metadata, dict):
            raise ValidationError("metadata must be a dictionary", "metadata")
        
        if not isinstance(self.comfyui_compatibility, ComfyUICompatibility):
            raise ValidationError("comfyui_compatibility must be a ComfyUICompatibility instance", "comfyui_compatibility")
        
        if self.model_type is not None and not isinstance(self.model_type, ComfyUIModelType):
            raise ValidationError("model_type must be a valid ComfyUIModelType", "model_type")
        
        if self.base_model is not None:
            validate_not_empty(self.base_model, "base_model")
        
        if self.file_size is not None:
            validate_positive_number(self.file_size, "file_size")
        
        if self.file_format is not None:
            validate_not_empty(self.file_format, "file_format")
    
    @property
    def is_comfyui_compatible(self) -> bool:
        """Check if the model is compatible with ComfyUI."""
        return self.comfyui_compatibility.is_compatible
    
    @property
    def comfyui_model_folder(self) -> Optional[str]:
        """Get the ComfyUI model folder for this model."""
        return self.comfyui_compatibility.model_folder
    
    @property
    def platform_name(self) -> str:
        """Get the platform name as a string."""
        return self.platform.value
    
    @property
    def model_type_name(self) -> Optional[str]:
        """Get the model type name as a string."""
        return self.model_type.value if self.model_type else None
    
    def get_all_tags(self) -> List[str]:
        """Get all tags including platform-specific ones from metadata."""
        all_tags = self.tags.copy()
        
        # Add platform-specific tags from metadata
        if self.platform == ExternalPlatform.CIVITAI:
            civitai_tags = self.metadata.get("tags", [])
            if isinstance(civitai_tags, list):
                all_tags.extend(civitai_tags)
        elif self.platform == ExternalPlatform.HUGGINGFACE:
            hf_tags = self.metadata.get("tags", [])
            if isinstance(hf_tags, list):
                all_tags.extend(hf_tags)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_tags = []
        for tag in all_tags:
            if tag not in seen:
                seen.add(tag)
                unique_tags.append(tag)
        
        return unique_tags
    
    def get_primary_description(self) -> str:
        """Get the primary description, preferring platform-specific if available."""
        # Try to get platform-specific description first
        platform_description = self.metadata.get("description")
        if platform_description and isinstance(platform_description, str):
            return platform_description.strip()
        
        return self.description
    
    def get_download_url(self) -> Optional[str]:
        """Get the download URL from platform-specific metadata."""
        return self.metadata.get("download_url")
    
    def get_model_page_url(self) -> Optional[str]:
        """Get the model page URL from platform-specific metadata."""
        return self.metadata.get("model_page_url")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert external model to dictionary representation."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "author": self.author,
            "platform": self.platform.value,
            "thumbnail_url": self.thumbnail_url,
            "tags": self.tags,
            "download_count": self.download_count,
            "rating": self.rating,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "metadata": self.metadata,
            "comfyui_compatibility": {
                "is_compatible": self.comfyui_compatibility.is_compatible,
                "model_folder": self.comfyui_compatibility.model_folder,
                "compatibility_notes": self.comfyui_compatibility.compatibility_notes,
                "required_nodes": self.comfyui_compatibility.required_nodes
            },
            "model_type": self.model_type.value if self.model_type else None,
            "base_model": self.base_model,
            "file_size": self.file_size,
            "file_format": self.file_format,
            # Computed properties
            "is_comfyui_compatible": self.is_comfyui_compatible,
            "comfyui_model_folder": self.comfyui_model_folder,
            "platform_name": self.platform_name,
            "model_type_name": self.model_type_name,
            "all_tags": self.get_all_tags(),
            "primary_description": self.get_primary_description(),
            "download_url": self.get_download_url(),
            "model_page_url": self.get_model_page_url()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ExternalModel":
        """Create external model from dictionary representation."""
        compatibility_data = data.get("comfyui_compatibility", {})
        comfyui_compatibility = ComfyUICompatibility(
            is_compatible=compatibility_data.get("is_compatible", False),
            model_folder=compatibility_data.get("model_folder"),
            compatibility_notes=compatibility_data.get("compatibility_notes"),
            required_nodes=compatibility_data.get("required_nodes", [])
        )
        
        return cls(
            id=data["id"],
            name=data["name"],
            description=data["description"],
            author=data["author"],
            platform=ExternalPlatform(data["platform"]),
            thumbnail_url=data.get("thumbnail_url"),
            tags=data.get("tags", []),
            download_count=data.get("download_count", 0),
            rating=data.get("rating"),
            created_at=datetime.fromisoformat(data["created_at"]),
            updated_at=datetime.fromisoformat(data["updated_at"]),
            metadata=data.get("metadata", {}),
            comfyui_compatibility=comfyui_compatibility,
            model_type=ComfyUIModelType(data["model_type"]) if data.get("model_type") else None,
            base_model=data.get("base_model"),
            file_size=data.get("file_size"),
            file_format=data.get("file_format")
        )