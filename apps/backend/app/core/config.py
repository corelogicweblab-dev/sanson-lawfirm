from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "SANSON Legal OS"
    app_version: str = "1.0.0"
    api_version: str = "v1"
    debug: bool = False
    environment: str = "development"
    git_commit_sha: str = ""
    frontend_url: str = ""
    sentry_dsn: str = ""
    alert_webhook_url: str = ""

    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/sanson_legal"
    database_ssl: bool = False

    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    firebase_project_id: str = ""
    firebase_client_email: str = ""
    firebase_private_key: str = ""

    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    rate_limit_per_minute: int = 60
    field_encryption_key: str = ""

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"
    gemini_base_url: str = "https://generativelanguage.googleapis.com/v1beta"

    ai_rate_limit_per_minute: int = 30

    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = "sanson-legal-documents"
    r2_endpoint_url: str = ""
    r2_public_base_url: str = ""
    document_max_size_mb: int = 512
    document_signed_url_ttl_seconds: int = 3600

    qdrant_url: str = ""
    qdrant_api_key: str = ""
    openai_embedding_model: str = "text-embedding-3-small"
    embedding_chunk_size: int = 800
    embedding_chunk_overlap: int = 100
    search_default_limit: int = 20

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors(cls, v: str | List[str]) -> str:
        if isinstance(v, list):
            return ",".join(v)
        return v

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def async_database_url(self) -> str:
        url = self.database_url.strip()
        if url.startswith("postgres://"):
            url = "postgresql+asyncpg://" + url[len("postgres://") :]
        elif url.startswith("postgresql://") and "+asyncpg" not in url:
            url = "postgresql+asyncpg://" + url[len("postgresql://") :]
        return url

    def database_url_issues(self) -> list[str]:
        """Detect common Render/Supabase DATABASE_URL mistakes."""
        url = self.database_url.strip()
        if not url:
            return ["DATABASE_URL is empty"]
        issues: list[str] = []
        scheme_end = url.find("://")
        if scheme_end == -1:
            return ["DATABASE_URL must start with postgresql:// or postgresql+asyncpg://"]
        creds_host = url[scheme_end + 3 :]
        userinfo = creds_host.rsplit("@", 1)[0] if "@" in creds_host else creds_host
        if ":" not in userinfo:
            issues.append(
                "Missing ':' before password. Wrong: postgres.PROJECT_REF.password@host — "
                "Correct: postgres.PROJECT_REF:password@host (colon after project ref, not a dot)."
            )
        elif "." in userinfo.split(":", 1)[0] and userinfo.split(":", 1)[0].count(".") > 1:
            issues.append(
                "Username looks merged with password (dot instead of colon). "
                "Use: postgresql+asyncpg://postgres.PROJECT_REF:ENCODED_PASSWORD@pooler...:6543/postgres"
            )
        if creds_host.count("@") > 1:
            issues.append(
                "Password contains '@' — the URL parser breaks. "
                "Encode each @ as %40 (example: Matthew@541994@@ → Matthew%40541994%40%40) "
                "or copy the full URI from Supabase → Database → Connection string."
            )
        if "@@" in url.split("@")[-1]:
            issues.append("Host looks malformed (extra @). Fix password encoding first.")
        if "supabase.co" in url and ":6543" in url and "postgres." not in url.split("@")[0]:
            issues.append(
                "Port 6543 (pooler) often needs user postgres.PROJECT_REF — "
                "use Supabase 'Transaction pooler' connection string as-is."
            )
        return issues

    @property
    def requires_database_ssl(self) -> bool:
        if self.database_ssl:
            return True
        return "supabase.co" in self.async_database_url

    @property
    def openai_configured(self) -> bool:
        return bool(self.openai_api_key.strip())

    @property
    def gemini_configured(self) -> bool:
        return bool(self.gemini_api_key.strip())

    @property
    def ai_chat_configured(self) -> bool:
        return self.gemini_configured or self.openai_configured

    @property
    def r2_configured(self) -> bool:
        return bool(
            self.r2_access_key_id.strip()
            and self.r2_secret_access_key.strip()
            and (self.r2_endpoint_url.strip() or self.r2_account_id.strip())
        )

    @property
    def r2_endpoint(self) -> str:
        if self.r2_endpoint_url.strip():
            return self.r2_endpoint_url.strip()
        return f"https://{self.r2_account_id}.r2.cloudflarestorage.com"

    @property
    def document_max_size_bytes(self) -> int:
        return self.document_max_size_mb * 1024 * 1024

    @property
    def qdrant_configured(self) -> bool:
        return bool(self.qdrant_url.strip())

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def firebase_configured(self) -> bool:
        return bool(
            self.firebase_project_id
            and self.firebase_client_email
            and self.firebase_private_key
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
