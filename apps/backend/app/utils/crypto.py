"""Field-level encryption abstraction (storage-provider-ready)."""

import base64
import hashlib

from cryptography.fernet import Fernet

from app.core.config import get_settings


def _fernet() -> Fernet | None:
    key = get_settings().field_encryption_key
    if not key:
        return None
    digest = hashlib.sha256(key.encode()).digest()
    fkey = base64.urlsafe_b64encode(digest)
    return Fernet(fkey)


def encrypt_field(value: str) -> str:
    f = _fernet()
    if not f:
        return value
    return f.encrypt(value.encode()).decode()


def decrypt_field(value: str) -> str:
    f = _fernet()
    if not f:
        return value
    try:
        return f.decrypt(value.encode()).decode()
    except Exception:
        return value
