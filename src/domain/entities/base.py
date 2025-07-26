"""Base classes for domain entities."""

from abc import ABC
from dataclasses import dataclass
from typing import Any, Dict
from datetime import datetime


@dataclass
class Entity(ABC):
    """Base class for domain entities with identity."""
    
    id: str
    
    def __eq__(self, other: Any) -> bool:
        """Entities are equal if they have the same ID and type."""
        if not isinstance(other, self.__class__):
            return False
        return self.id == other.id
    
    def __hash__(self) -> int:
        """Hash based on entity ID."""
        return hash(self.id)


@dataclass(frozen=True)
class ValueObject(ABC):
    """Base class for value objects - immutable objects without identity."""
    pass


class DomainError(Exception):
    """Base exception for domain-related errors."""
    pass


class ValidationError(DomainError):
    """Exception raised when domain validation fails."""
    
    def __init__(self, message: str, field: str = None):
        super().__init__(message)
        self.field = field
        self.message = message


class NotFoundError(DomainError):
    """Exception raised when a requested entity is not found."""
    
    def __init__(self, entity_type: str, identifier: str):
        message = f"{entity_type} with identifier '{identifier}' not found"
        super().__init__(message)
        self.entity_type = entity_type
        self.identifier = identifier


def validate_not_empty(value: str, field_name: str) -> None:
    """Validate that a string value is not empty or whitespace."""
    if not value or not value.strip():
        raise ValidationError(f"{field_name} cannot be empty", field_name)


def validate_positive_number(value: int | float, field_name: str) -> None:
    """Validate that a number is positive."""
    if value <= 0:
        raise ValidationError(f"{field_name} must be positive", field_name)


def validate_file_path(path: str, field_name: str) -> None:
    """Validate that a file path is not empty and has reasonable format."""
    validate_not_empty(path, field_name)
    if not path.strip().startswith(('/', './', '../')) and '\\' not in path and '/' not in path:
        raise ValidationError(f"{field_name} must be a valid file path", field_name)