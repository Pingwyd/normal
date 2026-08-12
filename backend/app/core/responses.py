from typing import Any


def error_envelope(code: str, message: str) -> dict[str, Any]:
    return {
        "data": None,
        "meta": None,
        "error": {"code": code, "message": message},
    }


def success_envelope(data: Any, meta: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        "data": data,
        "meta": meta,
        "error": None,
    }
