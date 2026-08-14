from __future__ import annotations

import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import get_settings
from app.core.errors import validation_error


def _build_fernet() -> Fernet:
    settings = get_settings()
    raw_key = settings.research_credentials_encryption_key
    if not raw_key:
        raise validation_error(
            "Research provider keys are not configured on the server. "
            "Set RESEARCH_CREDENTIALS_ENCRYPTION_KEY."
        )
    try:
        return Fernet(raw_key.encode("utf-8"))
    except ValueError:
        digest = hashlib.sha256(raw_key.encode("utf-8")).digest()
        derived = base64.urlsafe_b64encode(digest)
        return Fernet(derived)


def encrypt_api_key(api_key: str) -> str:
    fernet = _build_fernet()
    return fernet.encrypt(api_key.encode("utf-8")).decode("utf-8")


def decrypt_api_key(encrypted_api_key: str) -> str:
    fernet = _build_fernet()
    try:
        return fernet.decrypt(encrypted_api_key.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        msg = "Stored provider key could not be decrypted."
        raise validation_error(msg) from exc


def key_hint_for(api_key: str) -> str:
    trimmed = api_key.strip()
    if len(trimmed) <= 4:
        return "****"
    return f"...{trimmed[-4:]}"
