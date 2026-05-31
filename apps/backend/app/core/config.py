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

    @property
    def requires_database_ssl(self) -> bool:
        if self.database_ssl:
            return True
        return "supabase.co" in self.async_database_url

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
