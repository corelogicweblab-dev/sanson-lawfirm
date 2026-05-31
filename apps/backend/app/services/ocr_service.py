import io
from decimal import Decimal

import structlog
from pypdf import PdfReader

from app.core.config import get_settings
from app.services.openai_service import OpenAIService

logger = structlog.get_logger()

IMAGE_MIMES = {"image/png", "image/jpeg", "image/jpg", "image/webp"}


class OcrService:
    def __init__(self) -> None:
        self.openai = OpenAIService()

    def extract_text(self, data: bytes, mime_type: str, filename: str) -> tuple[str, float, dict]:
        meta: dict = {"engine": "local", "filename": filename}

        if mime_type == "application/pdf" or filename.lower().endswith(".pdf"):
            return self._extract_pdf(data, meta)

        if mime_type == "text/plain" or filename.lower().endswith(".txt"):
            text = data.decode("utf-8", errors="replace")
            return text, 99.0, {**meta, "engine": "plain_text"}

        if (
            mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            or filename.lower().endswith(".docx")
        ):
            return self._extract_docx(data, meta)

        if mime_type in IMAGE_MIMES or filename.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
            return self._extract_image(data, mime_type, meta)

        return "", 0.0, {**meta, "error": "unsupported_type"}

    def _extract_pdf(self, data: bytes, meta: dict) -> tuple[str, float, dict]:
        try:
            reader = PdfReader(io.BytesIO(data))
            pages = []
            for page in reader.pages:
                pages.append(page.extract_text() or "")
            text = "\n\n".join(pages).strip()
            confidence = 92.0 if len(text) > 50 else 60.0
            return text, confidence, {**meta, "engine": "pypdf", "page_count": len(reader.pages)}
        except Exception as exc:
            logger.error("pdf_ocr_failed", error=str(exc))
            return "", 0.0, {**meta, "error": str(exc)}

    def _extract_docx(self, data: bytes, meta: dict) -> tuple[str, float, dict]:
        try:
            from docx import Document as DocxDocument

            doc = DocxDocument(io.BytesIO(data))
            text = "\n".join(p.text for p in doc.paragraphs if p.text).strip()
            return text, 90.0, {**meta, "engine": "python-docx"}
        except Exception as exc:
            logger.error("docx_ocr_failed", error=str(exc))
            return "", 0.0, {**meta, "error": str(exc)}

    def _extract_image(self, data: bytes, mime_type: str, meta: dict) -> tuple[str, float, dict]:
        return self._vision_ocr_sync(data, mime_type, meta)

    def _vision_ocr_sync(self, data: bytes, mime_type: str, meta: dict) -> tuple[str, float, dict]:
        if not self.openai.enabled:
            return "[Image OCR requires OpenAI or manual review]", 40.0, {**meta, "engine": "placeholder"}
        import base64
        import json

        import httpx

        settings = get_settings()
        b64 = base64.standard_b64encode(data).decode("ascii")
        payload = {
            "model": settings.openai_model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Extract all text from this document image for legal intake."},
                        {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64}"}},
                    ],
                }
            ],
            "max_tokens": 2000,
        }
        try:
            with httpx.Client(timeout=60.0) as client:
                resp = client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                    json=payload,
                )
                resp.raise_for_status()
                text = resp.json()["choices"][0]["message"]["content"]
                return text.strip(), 85.0, {**meta, "engine": "openai_vision"}
        except Exception as exc:
            logger.error("vision_ocr_failed", error=str(exc))
            return "", 0.0, {**meta, "error": str(exc)}

    @staticmethod
    def to_decimal_confidence(score: float) -> Decimal:
        return Decimal(str(round(min(max(score, 0), 100), 2)))
