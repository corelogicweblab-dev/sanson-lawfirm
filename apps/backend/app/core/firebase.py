import json
from typing import Any

import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials

from app.core.config import get_settings

_settings = get_settings()
_firebase_app: firebase_admin.App | None = None


def _get_firebase_app() -> firebase_admin.App | None:
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    if not _settings.firebase_configured:
        return None

    private_key = _settings.firebase_private_key.replace("\\n", "\n")
    cred = credentials.Certificate(
        {
            "type": "service_account",
            "project_id": _settings.firebase_project_id,
            "private_key": private_key,
            "client_email": _settings.firebase_client_email,
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    )
    _firebase_app = firebase_admin.initialize_app(cred)
    return _firebase_app


def verify_firebase_token(id_token: str) -> dict[str, Any] | None:
    """Verify Firebase ID token and return decoded claims."""
    app = _get_firebase_app()
    if app is None:
        return None
    try:
        decoded = firebase_auth.verify_id_token(id_token, app=app)
        return decoded
    except Exception:
        return None


def is_firebase_configured() -> bool:
    return _settings.firebase_configured
