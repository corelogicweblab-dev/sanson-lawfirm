"""Cloudflare R2 alternative — store case files in Supabase Storage (same project as Postgres)."""

from __future__ import annotations

import urllib.parse
from uuid import UUID

import httpx

from app.core.config import get_settings
from app.services.r2_storage import R2StorageService


class SupabaseStorageService:
    PREFIX = "supabase://"

    def __init__(self) -> None:
        self.settings = get_settings()
        self._validator = R2StorageService()

    @property
    def configured(self) -> bool:
        return bool(
            self.settings.supabase_url.strip()
            and self.settings.supabase_service_role_key.strip()
        )

    @property
    def bucket(self) -> str:
        return (self.settings.supabase_storage_bucket or "documents").strip()

    def validate_file(self, filename: str, mime_type: str, size: int) -> None:
        self._validator.validate_file(filename, mime_type, size)

    def build_storage_path(self, user_id: UUID, filename: str) -> str:
        return self._validator.build_storage_path(user_id, filename)

    def _base_url(self) -> str:
        return self.settings.supabase_url.rstrip("/")

    def _headers(self, content_type: str | None = None) -> dict[str, str]:
        key = self.settings.supabase_service_role_key.strip()
        headers = {
            "Authorization": f"Bearer {key}",
            "apikey": key,
        }
        if content_type:
            headers["Content-Type"] = content_type
        return headers

    def full_storage_key(self, relative_path: str) -> str:
        return f"{self.PREFIX}{self.bucket}/{relative_path}"

    def parse_storage_key(self, storage_path: str) -> tuple[str, str] | None:
        if not storage_path.startswith(self.PREFIX):
            return None
        rest = storage_path[len(self.PREFIX) :]
        if "/" not in rest:
            return None
        bucket, key = rest.split("/", 1)
        return bucket, key

    async def upload_bytes(self, relative_path: str, data: bytes, mime_type: str) -> str:
        encoded = "/".join(urllib.parse.quote(part) for part in relative_path.split("/"))
        url = f"{self._base_url()}/storage/v1/object/{self.bucket}/{encoded}"
        headers = {**self._headers(mime_type), "x-upsert": "true"}
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, content=data, headers=headers)
        if response.status_code >= 400:
            detail = response.text[:200]
            hint = (
                "Create a public or private bucket named "
                f"'{self.bucket}' in Supabase → Storage, then retry."
            )
            if response.status_code == 404:
                raise ValueError(f"Supabase Storage bucket '{self.bucket}' not found. {hint}")
            raise ValueError(
                f"Supabase Storage upload failed ({response.status_code}). {detail or hint}"
            )
        return self.full_storage_key(relative_path)

    async def object_exists(self, storage_path: str) -> bool:
        parsed = self.parse_storage_key(storage_path)
        if not parsed:
            return False
        bucket, key = parsed
        encoded = "/".join(urllib.parse.quote(part) for part in key.split("/"))
        url = f"{self._base_url()}/storage/v1/object/info/{bucket}/{encoded}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=self._headers())
        return response.status_code == 200

    async def create_signed_upload(self, relative_path: str) -> dict:
        encoded = "/".join(urllib.parse.quote(part) for part in relative_path.split("/"))
        url = f"{self._base_url()}/storage/v1/object/upload/sign/{self.bucket}/{encoded}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                headers=self._headers("application/json"),
                json={"expiresIn": self.settings.document_signed_url_ttl_seconds},
            )
        if response.status_code >= 400:
            raise ValueError(
                f"Could not create Supabase upload URL ({response.status_code}). "
                f"Ensure Storage bucket '{self.bucket}' exists in your Supabase project."
            )
        data = response.json()
        return {
            "upload_url": data.get("url"),
            "upload_token": data.get("token"),
            "storage_path": self.full_storage_key(relative_path),
            "expires_in": self.settings.document_signed_url_ttl_seconds,
        }

    async def download_bytes(self, storage_path: str) -> bytes:
        parsed = self.parse_storage_key(storage_path)
        if not parsed:
            raise ValueError("Invalid Supabase storage path")
        bucket, key = parsed
        encoded = "/".join(urllib.parse.quote(part) for part in key.split("/"))
        url = f"{self._base_url()}/storage/v1/object/{bucket}/{encoded}"
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.get(url, headers=self._headers())
        if response.status_code >= 400:
            raise ValueError(f"Supabase download failed ({response.status_code})")
        return response.content

    async def create_signed_download(self, storage_path: str) -> str:
        parsed = self.parse_storage_key(storage_path)
        if not parsed:
            raise ValueError("Invalid Supabase storage path")
        bucket, key = parsed
        encoded = "/".join(urllib.parse.quote(part) for part in key.split("/"))
        url = f"{self._base_url()}/storage/v1/object/sign/{bucket}/{encoded}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                headers=self._headers("application/json"),
                json={"expiresIn": self.settings.document_signed_url_ttl_seconds},
            )
        if response.status_code >= 400:
            raise ValueError("Could not create download link")
        data = response.json()
        signed = data.get("signedURL") or data.get("signedUrl")
        if not signed:
            raise ValueError("Could not create download link")
        if signed.startswith("/"):
            return f"{self._base_url()}{signed}"
        return signed
