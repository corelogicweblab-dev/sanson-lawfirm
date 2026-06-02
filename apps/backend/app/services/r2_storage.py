import uuid
from datetime import datetime, timezone

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

from app.core.config import get_settings

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
    "application/zip",
    "application/x-zip-compressed",
    "application/x-rar-compressed",
    "application/octet-stream",
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
    "video/x-matroska",
    "audio/mpeg",
    "audio/mp4",
    "audio/wav",
    "audio/x-wav",
    "audio/aac",
    "audio/ogg",
    "audio/flac",
}

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".doc",
    ".docx",
    ".txt",
    ".rtf",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".gif",
    ".zip",
    ".rar",
    ".7z",
    ".mp4",
    ".mov",
    ".avi",
    ".mkv",
    ".webm",
    ".m4v",
    ".mp3",
    ".wav",
    ".m4a",
    ".aac",
    ".ogg",
    ".flac",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
}


class R2StorageService:
    def __init__(self) -> None:
        self.settings = get_settings()

    @property
    def configured(self) -> bool:
        return self.settings.r2_configured

    def _client(self):
        if not self.configured:
            raise RuntimeError("Cloudflare R2 is not configured")
        return boto3.client(
            "s3",
            endpoint_url=self.settings.r2_endpoint,
            aws_access_key_id=self.settings.r2_access_key_id,
            aws_secret_access_key=self.settings.r2_secret_access_key,
            config=Config(signature_version="s3v4"),
            region_name="auto",
        )

    def validate_file(self, filename: str, mime_type: str, size: int) -> None:
        if size <= 0:
            raise ValueError("Empty file")
        ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext not in ALLOWED_EXTENSIONS:
            raise ValueError(f"File type not allowed: {ext or 'unknown'}")
        mime_type = (mime_type or "").strip()
        if mime_type and mime_type not in ALLOWED_MIME_TYPES:
            allowed_prefix = mime_type.startswith(("image/", "video/", "audio/", "application/"))
            if not allowed_prefix:
                raise ValueError(f"MIME type not allowed: {mime_type}")
        if size > self.settings.document_max_size_bytes:
            raise ValueError("File is too large for upload")

    def build_storage_path(self, user_id: uuid.UUID, filename: str) -> str:
        safe = "".join(c for c in filename if c.isalnum() or c in ".-_")[:200]
        date_prefix = datetime.now(timezone.utc).strftime("%Y/%m/%d")
        return f"documents/{user_id}/{date_prefix}/{uuid.uuid4()}_{safe}"

    def upload_bytes(self, storage_path: str, data: bytes, mime_type: str) -> str:
        client = self._client()
        try:
            client.put_object(
                Bucket=self.settings.r2_bucket_name,
                Key=storage_path,
                Body=data,
                ContentType=mime_type,
            )
        except ClientError as exc:
            code = exc.response.get("Error", {}).get("Code", "ClientError")
            raise ValueError(
                f"Document storage upload failed ({code}). "
                "Verify Cloudflare R2 bucket name, endpoint, and API keys on the server."
            ) from exc
        return storage_path

    def object_exists(self, storage_path: str) -> bool:
        if not self.configured:
            return True
        client = self._client()
        try:
            client.head_object(Bucket=self.settings.r2_bucket_name, Key=storage_path)
            return True
        except ClientError:
            return False

    def download_bytes(self, storage_path: str) -> bytes:
        client = self._client()
        obj = client.get_object(Bucket=self.settings.r2_bucket_name, Key=storage_path)
        return obj["Body"].read()

    def generate_presigned_upload_url(
        self, storage_path: str, mime_type: str, expires_in: int | None = None
    ) -> dict:
        client = self._client()
        ttl = expires_in or self.settings.document_signed_url_ttl_seconds
        url = client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": self.settings.r2_bucket_name,
                "Key": storage_path,
                "ContentType": mime_type,
            },
            ExpiresIn=ttl,
        )
        return {"upload_url": url, "storage_path": storage_path, "expires_in": ttl}

    def generate_presigned_download_url(
        self, storage_path: str, expires_in: int | None = None
    ) -> str:
        client = self._client()
        ttl = expires_in or self.settings.document_signed_url_ttl_seconds
        return client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.settings.r2_bucket_name, "Key": storage_path},
            ExpiresIn=ttl,
        )

    def delete_object(self, storage_path: str) -> None:
        try:
            self._client().delete_object(
                Bucket=self.settings.r2_bucket_name, Key=storage_path
            )
        except ClientError:
            pass
