from __future__ import annotations

import sys
from typing import Any


PREFIX = "[ComfyUI-Asset-Manager]"


def _format_message(*args: Any, sep: str = " ") -> str:
    return sep.join(str(a) for a in args)


def log(*args: Any, sep: str = " ", end: str = "\n", file=None) -> None:  # noqa: A002 - allow 'file' like print
    message = _format_message(*args, sep=sep)
    stream = file if file is not None else sys.stdout
    print(f"{PREFIX} {message}", end=end, file=stream)


def info(*args: Any, sep: str = " ", end: str = "\n") -> None:
    log(*args, sep=sep, end=end, file=None)


def warn(*args: Any, sep: str = " ", end: str = "\n") -> None:
    log(*args, sep=sep, end=end, file=sys.stderr)


def error(*args: Any, sep: str = " ", end: str = "\n") -> None:
    log(*args, sep=sep, end=end, file=sys.stderr)


