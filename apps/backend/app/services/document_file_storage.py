"""Document blobs: Supabase Storage (preferred) → Cloudflare R2 → metadata-only fallback."""

from __future__ import annotations

from uuid import UUID

from app.services.r2_storage import R2StorageService
from app.services.supabase_storage import SupabaseStorageService


class DocumentFileStorage:
    def __init__(self) -> None:
        self.supabase = SupabaseStorageService()
        self.r2 = R2StorageService()

    @property
    def backend(self) -> str:
        if self.supabase.configured:
            return "supabase"
        if self.r2.configured:
            return "r2"
        return "none"

    @property
    def configured(self) -> bool:
        return self.backend != "none"

    def validate_file(self, filename: str, mime_type: str, size: int) -> None:
        self.r2.validate_file(filename, mime_type, size)

    def build_storage_path(
        self, user_id: UUID, filename: str, case_id: UUID | None = None
    ) -> str:
        if self.supabase.configured:
            return self.supabase.build_storage_path(user_id, filename, case_id)
        return self.r2.build_storage_path(user_id, filename, case_id)

    async def upload_bytes(self, relative_path: str, data: bytes, mime_type: str) -> str:
        if self.supabase.configured:
            return await self.supabase.upload_bytes(relative_path, data, mime_type)
        if self.r2.configured:
            return self.r2.upload_bytes(relative_path, data, mime_type)
        return f"local-fallback/{relative_path}"

    async def object_exists(self, storage_path: str) -> bool:
        if storage_path.startswith(SupabaseStorageService.PREFIX):
            return await self.supabase.object_exists(storage_path)
        if self.r2.configured and not storage_path.startswith("local-fallback/"):
            return self.r2.object_exists(storage_path)
        return True

    async def presigned_upload(
        self,
        user_id: UUID,
        filename: str,
        mime_type: str,
        size: int,
        case_id: UUID | None = None,
    ) -> dict:
        self.validate_file(filename, mime_type, size)
        relative = self.build_storage_path(user_id, filename, case_id)
        if self.supabase.configured:
            signed = await self.supabase.create_signed_upload(relative)
            return {**signed, "direct_upload_required": False, "storage_backend": "supabase"}
        if self.r2.configured:
            url = self.r2.generate_presigned_upload_url(relative, mime_type)
            return {
                **url,
                "storage_path": relative,
                "direct_upload_required": False,
                "storage_backend": "r2",
            }
        return {
            "upload_url": None,
            "storage_path": f"local-fallback/{relative}",
            "direct_upload_required": True,
            "storage_backend": "none",
            "message": "Configure SUPABASE_SERVICE_ROLE_KEY on Render for file storage.",
        }

    async def download_bytes(self, storage_path: str) -> bytes:
        if storage_path.startswith(SupabaseStorageService.PREFIX):
            return await self.supabase.download_bytes(storage_path)
        key = storage_path
        if key.startswith("local-fallback/"):
            key = key[len("local-fallback/") :]
        if self.r2.configured:
            return self.r2.download_bytes(key)
        raise ValueError("File content is not available (storage not configured)")

    async def download_url(self, storage_path: str) -> str | None:
        if storage_path.startswith(SupabaseStorageService.PREFIX):
            return await self.supabase.create_signed_download(storage_path)
        if storage_path.startswith("local-fallback/"):
            return None
        if self.r2.configured:
            return self.r2.generate_presigned_download_url(storage_path)
        return None
