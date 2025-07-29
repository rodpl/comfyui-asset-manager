"""Output domain entity."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Dict, Any
from pathlib import Path

from .base import Entity, ValueObject, ValidationError, validate_not_empty, validate_positive_number, validate_file_path


@dataclass(frozen=True)
class ImageDimensions(ValueObject):
    """Value object representing image dimensions."""
    
    width: int
    height: int
    
    def __post_init__(self):
        """Validate dimensions after initialization."""
        validate_positive_number(self.width, "width")
        validate_positive_number(self.height, "height")
    
    @property
    def aspect_ratio(self) -> float:
        """Calculate aspect ratio (width/height)."""
        return self.width / self.height if self.height > 0 else 1.0


@dataclass(frozen=True)
class FileInfo(ValueObject):
    """Value object representing file information."""
    
    size: int
    format: str
    created_at: datetime
    modified_at: datetime
    
    def __post_init__(self):
        """Validate file info after initialization."""
        validate_positive_number(self.size, "size")
        validate_not_empty(self.format, "format")
        
        if not isinstance(self.created_at, datetime):
            raise ValidationError("created_at must be a datetime", "created_at")
        
        if not isinstance(self.modified_at, datetime):
            raise ValidationError("modified_at must be a datetime", "modified_at")
    
    @property
    def size_formatted(self) -> str:
        """Return human-readable file size."""
        size = float(self.size)
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"


@dataclass
class Output(Entity):
    """Domain entity representing a generated output image from ComfyUI."""
    
    filename: str
    file_path: str
    file_size: int
    created_at: datetime
    modified_at: datetime
    image_width: int
    image_height: int
    file_format: str
    thumbnail_path: Optional[str] = None
    workflow_metadata: Optional[Dict[str, Any]] = field(default_factory=dict)
    
    def __post_init__(self):
        """Validate output data after initialization."""
        self._validate()
    
    def _validate(self) -> None:
        """Validate output entity data."""
        validate_not_empty(self.filename, "filename")
        validate_file_path(self.file_path, "file_path")
        validate_positive_number(self.file_size, "file_size")
        validate_positive_number(self.image_width, "image_width")
        validate_positive_number(self.image_height, "image_height")
        validate_not_empty(self.file_format, "file_format")
        
        if not isinstance(self.created_at, datetime):
            raise ValidationError("created_at must be a datetime", "created_at")
        
        if not isinstance(self.modified_at, datetime):
            raise ValidationError("modified_at must be a datetime", "modified_at")
        
        if self.thumbnail_path is not None:
            validate_file_path(self.thumbnail_path, "thumbnail_path")
        
        # Validate supported image formats
        supported_formats = {'png', 'jpg', 'jpeg', 'webp'}
        if self.file_format.lower() not in supported_formats:
            raise ValidationError(
                f"file_format must be one of {supported_formats}", 
                "file_format"
            )
    
    @property
    def file_name(self) -> str:
        """Get the filename from the file path."""
        return Path(self.file_path).name
    
    @property
    def file_extension(self) -> str:
        """Get the file extension."""
        return Path(self.file_path).suffix.lower()
    
    @property
    def dimensions(self) -> ImageDimensions:
        """Get image dimensions as value object."""
        return ImageDimensions(width=self.image_width, height=self.image_height)
    
    @property
    def file_info(self) -> FileInfo:
        """Get file information as value object."""
        return FileInfo(
            size=self.file_size,
            format=self.file_format,
            created_at=self.created_at,
            modified_at=self.modified_at
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert output to dictionary representation."""
        return {
            "id": self.id,
            "filename": self.filename,
            "file_path": self.file_path,
            "file_size": self.file_size,
            "created_at": self.created_at.isoformat(),
            "modified_at": self.modified_at.isoformat(),
            "image_width": self.image_width,
            "image_height": self.image_height,
            "file_format": self.file_format,
            "thumbnail_path": self.thumbnail_path,
            "workflow_metadata": self.workflow_metadata or {},
            "file_name": self.file_name,
            "file_extension": self.file_extension
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Output":
        """Create output from dictionary representation."""
        return cls(
            id=data["id"],
            filename=data["filename"],
            file_path=data["file_path"],
            file_size=data["file_size"],
            created_at=datetime.fromisoformat(data["created_at"]),
            modified_at=datetime.fromisoformat(data["modified_at"]),
            image_width=data["image_width"],
            image_height=data["image_height"],
            file_format=data["file_format"],
            thumbnail_path=data.get("thumbnail_path"),
            workflow_metadata=data.get("workflow_metadata", {})
        )