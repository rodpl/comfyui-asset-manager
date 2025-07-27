"""Driving adapters (primary adapters) for external actors.

These adapters translate external requests (HTTP, CLI, etc.) 
into domain operations using the driving ports.
"""

from .web_api_adapter import WebAPIAdapter

__all__ = ["WebAPIAdapter"]