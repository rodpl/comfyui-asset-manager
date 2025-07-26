"""Folder domain entity."""

from dataclasses import dataclass
from typing import Dict, Any, Optional
from pathlib import Path

from .base import Entity, ValidationError, validate_not_empty, validate_file_path, validate_positive_number
from .model import ModelType


@dataclass
class Folder(Entity):
    """Domain entity representing a model folder in ComfyUI."""
    
    name: str
    path: str
    model_type: ModelType
    model_count: int = 0
    parent_folder_id: Optional[str] = None
    
    def __post_init__(self):
        """Validate folder data after initialization."""
        self._validate()
    
    def _validate(self) -> None:
        """Validate folder entity data."""
        validate_not_empty(self.name, "name")
        validate_file_path(self.path, "path")
        
        if not isinstance(self.model_type, ModelType):
            raise ValidationError("model_type must be a valid ModelType", "model_type")
        
        if self.model_count < 0:
            raise ValidationError("model_count cannot be negative", "model_count")
        
        if self.parent_folder_id is not None:
            validate_not_empty(self.parent_folder_id, "parent_folder_id")
    
    @property
    def folder_name(self) -> str:
        """Get the folder name from the path."""
        return Path(self.path).name
    
    @property
    def is_root_folder(self) -> bool:
        """Check if this is a root folder (no parent)."""
        return self.parent_folder_id is None
    
    def increment_model_count(self) -> None:
        """Increment the model count for this folder."""
        self.model_count += 1
    
    def decrement_model_count(self) -> None:
        """Decrement the model count for this folder."""
        if self.model_count > 0:
            self.model_count -= 1
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert folder to dictionary representation."""
        return {
            "id": self.id,
            "name": self.name,
            "path": self.path,
            "model_type": self.model_type.value,
            "model_count": self.model_count,
            "parent_folder_id": self.parent_folder_id,
            "folder_name": self.folder_name,
            "is_root_folder": self.is_root_folder
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Folder":
        """Create folder from dictionary representation."""
        return cls(
            id=data["id"],
            name=data["name"],
            path=data["path"],
            model_type=ModelType(data["model_type"]),
            model_count=data.get("model_count", 0),
            parent_folder_id=data.get("parent_folder_id")
        )