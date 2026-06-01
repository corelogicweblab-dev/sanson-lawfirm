"""Google Gemini — chat + structured JSON for SANSON AI Assistant."""

from __future__ import annotations

import json
from typing import Any, AsyncIterator

import httpx
import structlog

from app.core.config import get_settings
from app.services.openai_service import (
    SYSTEM_ASSISTANT,
    _parse_json_response,
    build_conversation_messages,
    sanitize_ai_output,
)
from app.utils.circuit_breaker import openai_breaker

logger = structlog.get_logger()

FALLBACK_REPLY = (
    "I apologize — I'm temporarily unable to process your message. "
    "Please try again in a moment, or use **Request Legal Representation** "
    "to reach our team directly."
)

STREAM_FALLBACK = (
    "I apologize — I'm temporarily unable to respond. Please try again shortly."
)


def _openai_messages_to_gemini(
    messages: list[dict[str, str]],
) -> tuple[list[dict[str, Any]], dict[str, Any] | None]:
    system_chunks: list[str] = []
    contents: list[dict[str, Any]] = []
    for item in messages:
        role = item.get("role", "user")
        text = (item.get("content") or "")[:4000]
        if role == "system":
            system_chunks.append(text)
            continue
        gemini_role = "user" if role == "user" else "model"
        if contents and contents[-1]["role"] == gemini_role:
            prev = contents[-1]["parts"][0]["text"]
            contents[-1]["parts"][0]["text"] = f"{prev}\n{text}"
        else:
            contents.append({"role": gemini_role, "parts": [{"text": text}]})
    system_instruction = None
    if system_chunks:
        system_instruction = {"parts": [{"text": "\n\n".join(system_chunks)}]}
    return contents, system_instruction


class GeminiService:
    def __init__(self) -> None:
        settings = get_settings()
        self.api_key = settings.gemini_api_key.strip()
        self.model = settings.gemini_model.strip() or "gemini-1.5-flash"
        base = (
            settings.gemini_base_url.strip().rstrip("/")
            or "https://generativelanguage.googleapis.com/v1beta"
        )
        self.base_url = base
        self.enabled = bool(self.api_key)

    def _auth(self) -> tuple[dict[str, str], dict[str, str]]:
        """Support Google AI Studio keys (x-goog-api-key) and Bearer-style tokens."""
        headers = {"Content-Type": "application/json"}
        params: dict[str, str] = {}
        if self.api_key.startswith("AQ.") or self.api_key.startswith("ya29."):
            headers["Authorization"] = f"Bearer {self.api_key}"
        else:
            headers["x-goog-api-key"] = self.api_key
            params["key"] = self.api_key
        return headers, params

    def _url(self, action: str) -> str:
        return f"{self.base_url}/models/{self.model}:{action}"

    async def _generate(
        self,
        contents: list[dict[str, Any]],
        system_instruction: dict[str, Any] | None,
        *,
        temperature: float = 0.4,
        max_output_tokens: int = 1200,
        json_mode: bool = False,
    ) -> tuple[str, int | None]:
        body: dict[str, Any] = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_output_tokens,
            },
        }
        if system_instruction:
            body["systemInstruction"] = system_instruction
        if json_mode:
            body["generationConfig"]["responseMimeType"] = "application/json"

        headers, params = self._auth()
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                self._url("generateContent"),
                headers=headers,
                params=params,
                json=body,
            )
            if response.status_code == 404 and "/v1/" in self.base_url:
                fallback_url = self.base_url.replace("/v1", "/v1beta", 1)
                response = await client.post(
                    f"{fallback_url}/models/{self.model}:generateContent",
                    headers=headers,
                    params=params,
                    json=body,
                )
            response.raise_for_status()
            data = response.json()

        candidates = data.get("candidates") or []
        if not candidates:
            raise RuntimeError("Gemini returned no candidates")
        parts = (candidates[0].get("content") or {}).get("parts") or []
        text = "".join(p.get("text", "") for p in parts)
        usage = (data.get("usageMetadata") or {}).get("totalTokenCount")
        return text, usage

    async def chat_completion(
        self,
        history: list[dict[str, str]],
        user_message: str,
    ) -> tuple[str, int | None]:
        if not self.enabled:
            return FALLBACK_REPLY, None
        if not openai_breaker.allow_request():
            logger.warning("gemini_circuit_open")
            return FALLBACK_REPLY, None

        messages = build_conversation_messages(history, user_message)
        contents, system_instruction = _openai_messages_to_gemini(messages)
        try:
            text, usage = await self._generate(
                contents,
                system_instruction,
                temperature=0.4,
                max_output_tokens=1200,
            )
            openai_breaker.record_success()
            return sanitize_ai_output(text), usage
        except Exception as exc:
            openai_breaker.record_failure()
            logger.error("gemini_chat_failed", error=str(exc), model=self.model)
            return FALLBACK_REPLY, None

    async def stream_chat(
        self,
        history: list[dict[str, str]],
        user_message: str,
    ) -> AsyncIterator[str]:
        if not self.enabled:
            yield STREAM_FALLBACK
            return

        messages = build_conversation_messages(history, user_message)
        contents, system_instruction = _openai_messages_to_gemini(messages)
        body: dict[str, Any] = {
            "contents": contents,
            "generationConfig": {"temperature": 0.4, "maxOutputTokens": 1200},
        }
        if system_instruction:
            body["systemInstruction"] = system_instruction

        headers, params = self._auth()
        params = {**params, "alt": "sse"}

        async def _iter_stream(stream_url: str) -> AsyncIterator[str]:
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream(
                    "POST",
                    stream_url,
                    headers=headers,
                    params=params,
                    json=body,
                ) as response:
                    if response.status_code >= 400:
                        body_text = await response.aread()
                        raise RuntimeError(
                            f"Gemini stream HTTP {response.status_code}: {body_text[:300]}"
                        )
                    async for line in response.aiter_lines():
                        chunk = _parse_sse_text(line)
                        if chunk:
                            yield chunk

        try:
            url = self._url("streamGenerateContent")
            try:
                async for chunk in _iter_stream(url):
                    yield chunk
            except Exception as first_exc:
                if "/v1/" in self.base_url and "404" in str(first_exc):
                    fallback = self.base_url.replace("/v1", "/v1beta", 1)
                    url = f"{fallback}/models/{self.model}:streamGenerateContent"
                    async for chunk in _iter_stream(url):
                        yield chunk
                else:
                    raise
            openai_breaker.record_success()
        except Exception as exc:
            openai_breaker.record_failure()
            logger.error("gemini_stream_failed", error=str(exc), model=self.model)
            yield STREAM_FALLBACK

    async def structured_json(
        self,
        system_extra: str,
        conversation_text: str,
    ) -> dict[str, Any]:
        if not self.enabled:
            return {}

        contents = [
            {
                "role": "user",
                "parts": [{"text": conversation_text[:12000]}],
            }
        ]
        system_instruction = {
            "parts": [{"text": f"{SYSTEM_ASSISTANT}\n\n{system_extra}"}]
        }
        try:
            raw, _ = await self._generate(
                contents,
                system_instruction,
                temperature=0.2,
                max_output_tokens=1500,
                json_mode=True,
            )
            return _parse_json_response(raw)
        except Exception as exc:
            logger.error("gemini_json_failed", error=str(exc))
            return {}

    async def classify(self, conversation_text: str) -> dict[str, Any]:
        from app.services.prompts import CLASSIFY_PROMPT

        return await self.structured_json(CLASSIFY_PROMPT, conversation_text)

    async def summarize(self, conversation_text: str) -> dict[str, Any]:
        from app.services.prompts import SUMMARY_PROMPT

        return await self.structured_json(SUMMARY_PROMPT, conversation_text)

    async def recommend(self, conversation_text: str) -> dict[str, Any]:
        from app.services.prompts import RECOMMENDATION_PROMPT

        return await self.structured_json(RECOMMENDATION_PROMPT, conversation_text)

    async def extract_intake(self, conversation_text: str) -> dict[str, Any]:
        from app.services.prompts import INTAKE_EXTRACT_PROMPT

        return await self.structured_json(INTAKE_EXTRACT_PROMPT, conversation_text)


def _parse_sse_text(line: str) -> str:
    line = line.strip()
    if not line.startswith("data:"):
        return ""
    payload = line[5:].strip()
    if not payload or payload == "[DONE]":
        return ""
    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        return ""
    candidates = data.get("candidates") or []
    if not candidates:
        return ""
    parts = (candidates[0].get("content") or {}).get("parts") or []
    return "".join(p.get("text", "") for p in parts)
