"""Model domain entity."""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any
from pathlib import Path

from .base import Entity, ValidationError, validate_not_empty, validate_positive_number, validate_file_path


class ModelType(Enum):
    """Enumeration of supported model types."""
    CHECKPOINT = "checkpoint"
    LORA = "lora"
    VAE = "vae"
    EMBEDDING = "embedding"
    CONTROLNET = "controlnet"
    UPSCALER = "upscaler"


@dataclass
class Model(Entity):
    """Domain entity representing an AI model file."""
    
    name: str
    file_path: str
    file_size: int
    created_at: datetime
    modified_at: datetime
    model_type: ModelType
    hash: str
    folder_id: str
    thumbnail_path: Optional[str] = None
    user_metadata: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        """Validate model data after initialization."""
        self._validate()
    
    def _validate(self) -> None:
        """Validate model entity data."""
        validate_not_empty(self.name, "name")
        validate_file_path(self.file_path, "file_path")
        validate_positive_number(self.file_size, "file_size")
        validate_not_empty(self.hash, "hash")
        validate_not_empty(self.folder_id, "folder_id")
        
        if not isinstance(self.model_type, ModelType):
            raise ValidationError("model_type must be a valid ModelType", "model_type")
        
        if not isinstance(self.created_at, datetime):
            raise ValidationError("created_at must be a datetime", "created_at")
        
        if not isinstance(self.modified_at, datetime):
            raise ValidationError("modified_at must be a datetime", "modified_at")
        
        if self.thumbnail_path is not None:
            validate_file_path(self.thumbnail_path, "thumbnail_path")
    
    @property
    def file_name(self) -> str:
        """Get the filename from the file path."""
        return Path(self.file_path).name
    
    @property
    def file_extension(self) -> str:
        """Get the file extension."""
        return Path(self.file_path).suffix.lower()
    
    def add_user_tag(self, tag: str) -> None:
        """Add a user tag to the model."""
        validate_not_empty(tag, "tag")
        if "tags" not in self.user_metadata:
            self.user_metadata["tags"] = []
        if tag not in self.user_metadata["tags"]:
            self.user_metadata["tags"].append(tag)
    
    def remove_user_tag(self, tag: str) -> None:
        """Remove a user tag from the model."""
        if "tags" in self.user_metadata and tag in self.user_metadata["tags"]:
            self.user_metadata["tags"].remove(tag)
    
    def set_user_rating(self, rating: int) -> None:
        """Set user rating for the model (1-5 stars)."""
        if not 1 <= rating <= 5:
            raise ValidationError("Rating must be between 1 and 5", "rating")
        self.user_metadata["rating"] = rating
    
    def set_user_description(self, description: str) -> None:
        """Set user description for the model."""
        validate_not_empty(description, "description")
        self.user_metadata["description"] = description
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary representation."""
        return {
            "id": self.id,
            "name": self.name,
            "file_path": self.file_path,
            "file_size": self.file_size,
            "created_at": self.created_at.isoformat(),
            "modified_at": self.modified_at.isoformat(),
            "model_type": self.model_type.value,
            "hash": self.hash,
            "folder_id": self.folder_id,
            "thumbnail_path": self.thumbnail_path,
            "user_metadata": self.user_metadata,
            "file_name": self.file_name,
            "file_extension": self.file_extension
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Model":
        """Create model from dictionary representation."""
        return cls(
            id=data["id"],
            name=data["name"],
            file_path=data["file_path"],
            file_size=data["file_size"],
            created_at=datetime.fromisoformat(data["created_at"]),
            modified_at=datetime.fromisoformat(data["modified_at"]),
            model_type=ModelType(data["model_type"]),
            hash=data["hash"],
            folder_id=data["folder_id"],
            thumbnail_path=data.get("thumbnail_path"),
            user_metadata=data.get("user_metadata", {})
        )