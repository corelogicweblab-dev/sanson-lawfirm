"""Environment validation for development, staging, and production."""

from dataclasses import dataclass, field

from app.core.config import Settings


@dataclass
class EnvValidationResult:
    environment: str
    valid: bool
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "environment": self.environment,
            "valid": self.valid,
            "errors": self.errors,
            "warnings": self.warnings,
        }


REQUIRED_PRODUCTION = [
    ("database_url", "DATABASE_URL"),
    ("firebase_project_id", "FIREBASE_PROJECT_ID"),
    ("firebase_client_email", "FIREBASE_CLIENT_EMAIL"),
    ("firebase_private_key", "FIREBASE_PRIVATE_KEY"),
]

RECOMMENDED_PRODUCTION = [
    ("openai_api_key", "OPENAI_API_KEY"),
    ("qdrant_url", "QDRANT_URL"),
    ("r2_access_key_id", "R2_ACCESS_KEY_ID"),
    ("supabase_url", "SUPABASE_URL"),
    ("field_encryption_key", "FIELD_ENCRYPTION_KEY"),
]


def validate_environment(settings: Settings) -> EnvValidationResult:
    env = (settings.environment or "development").lower()
    result = EnvValidationResult(environment=env, valid=True)

    db_issues = settings.database_url_issues()
    if db_issues:
        result.errors.extend(db_issues)
        result.valid = False

    if env == "production":
        for attr, label in REQUIRED_PRODUCTION:
            if not str(getattr(settings, attr, "") or "").strip():
                result.errors.append(f"Missing required production variable: {label}")
                result.valid = False

        for attr, label in RECOMMENDED_PRODUCTION:
            if not str(getattr(settings, attr, "") or "").strip():
                result.warnings.append(f"Recommended for production: {label}")

        if not settings.cors_origins_list:
            result.warnings.append("CORS_ORIGINS is empty")

    if env == "staging" and not settings.database_url.strip():
        result.errors.append("DATABASE_URL required for staging")
        result.valid = False

    return result
