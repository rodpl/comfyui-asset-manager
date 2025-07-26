"""External metadata domain entities."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Dict, Any, Optional
from enum import Enum

from .base import ValueObject, ValidationError, validate_not_empty, validate_positive_number


class MetadataSource(Enum):
    """Enumeration of external metadata sources."""
    CIVITAI = "civitai"
    HUGGINGFACE = "huggingface"


@dataclass(frozen=True)
class CivitAIMetadata(ValueObject):
    """Value object for CivitAI metadata."""
    
    model_id: int
    name: str
    description: str
    tags: List[str] = field(default_factory=list)
    images: List[str] = field(default_factory=list)
    download_count: int = 0
    rating: float = 0.0
    creator: str = ""
    version_name: str = ""
    base_model: str = ""
    
    def __post_init__(self):
        """Validate CivitAI metadata after initialization."""
        self._validate()
    
    def _validate(self) -> None:
        """Validate CivitAI metadata."""
        validate_positive_number(self.model_id, "model_id")
        validate_not_empty(self.name, "name")
        validate_not_empty(self.description, "description")
        
        if self.download_count < 0:
            raise ValidationError("download_count cannot be negative", "download_count")
        
        if not 0.0 <= self.rating <= 5.0:
            raise ValidationError("rating must be between 0.0 and 5.0", "rating")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "model_id": self.model_id,
            "name": self.name,
            "description": self.description,
            "tags": self.tags,
            "images": self.images,
            "download_count": self.download_count,
            "rating": self.rating,
            "creator": self.creator,
            "version_name": self.version_name,
            "base_model": self.base_model
        }


@dataclass(frozen=True)
class HuggingFaceMetadata(ValueObject):
    """Value object for HuggingFace metadata."""
    
    model_id: str
    description: str
    tags: List[str] = field(default_factory=list)
    downloads: int = 0
    likes: int = 0
    library: str = ""
    pipeline_tag: str = ""
    license: str = ""
    
    def __post_init__(self):
        """Validate HuggingFace metadata after initialization."""
        self._validate()
    
    def _validate(self) -> None:
        """Validate HuggingFace metadata."""
        validate_not_empty(self.model_id, "model_id")
        validate_not_empty(self.description, "description")
        
        if self.downloads < 0:
            raise ValidationError("downloads cannot be negative", "downloads")
        
        if self.likes < 0:
            raise ValidationError("likes cannot be negative", "likes")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "model_id": self.model_id,
            "description": self.description,
            "tags": self.tags,
            "downloads": self.downloads,
            "likes": self.likes,
            "library": self.library,
            "pipeline_tag": self.pipeline_tag,
            "license": self.license
        }


@dataclass(frozen=True)
class ExternalMetadata(ValueObject):
    """Value object containing external metadata from various sources."""
    
    model_hash: str
    civitai: Optional[CivitAIMetadata] = None
    huggingface: Optional[HuggingFaceMetadata] = None
    cached_at: Optional[datetime] = None
    
    def __post_init__(self):
        """Validate external metadata after initialization."""
        self._validate()
    
    def _validate(self) -> None:
        """Validate external metadata."""
        validate_not_empty(self.model_hash, "model_hash")
        
        if self.civitai is None and self.huggingface is None:
            raise ValidationError("At least one metadata source must be provided", "metadata")
    
    @property
    def has_civitai_data(self) -> bool:
        """Check if CivitAI metadata is available."""
        return self.civitai is not None
    
    @property
    def has_huggingface_data(self) -> bool:
        """Check if HuggingFace metadata is available."""
        return self.huggingface is not None
    
    @property
    def is_cached(self) -> bool:
        """Check if metadata is cached."""
        return self.cached_at is not None
    
    def get_primary_description(self) -> str:
        """Get the primary description from available sources."""
        if self.civitai:
            return self.civitai.description
        elif self.huggingface:
            return self.huggingface.description
        return ""
    
    def get_all_tags(self) -> List[str]:
        """Get all tags from all sources."""
        all_tags = []
        if self.civitai:
            all_tags.extend(self.civitai.tags)
        if self.huggingface:
            all_tags.extend(self.huggingface.tags)
        return list(set(all_tags))  # Remove duplicates
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "model_hash": self.model_hash,
            "civitai": self.civitai.to_dict() if self.civitai else None,
            "huggingface": self.huggingface.to_dict() if self.huggingface else None,
            "cached_at": self.cached_at.isoformat() if self.cached_at else None
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ExternalMetadata":
        """Create external metadata from dictionary representation."""
        civitai = None
        if data.get("civitai"):
            civitai = CivitAIMetadata(**data["civitai"])
        
        huggingface = None
        if data.get("huggingface"):
            huggingface = HuggingFaceMetadata(**data["huggingface"])
        
        cached_at = None
        if data.get("cached_at"):
            cached_at = datetime.fromisoformat(data["cached_at"])
        
        return cls(
            model_hash=data["model_hash"],
            civitai=civitai,
            huggingface=huggingface,
            cached_at=cached_at
        )