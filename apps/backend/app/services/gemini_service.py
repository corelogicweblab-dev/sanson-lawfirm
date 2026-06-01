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

# Models to try if the configured id returns 404 (Google renames often).
MODEL_FALLBACK_CHAIN = (
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.5-flash",
    "gemini-1.5-flash-8b",
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
    if not contents:
        contents.append({"role": "user", "parts": [{"text": "Hello"}]})
    system_instruction = None
    if system_chunks:
        system_instruction = {"parts": [{"text": "\n\n".join(system_chunks)}]}
    return contents, system_instruction


class GeminiService:
    def __init__(self) -> None:
        settings = get_settings()
        self.api_key = settings.gemini_api_key.strip()
        self.model = settings.gemini_model.strip() or "gemini-2.0-flash"
        base = (
            settings.gemini_base_url.strip().rstrip("/")
            or "https://generativelanguage.googleapis.com/v1beta"
        )
        if "/v1" in base and "/v1beta" not in base:
            base = "https://generativelanguage.googleapis.com/v1beta"
        self.base_url = base
        self.enabled = bool(self.api_key)

    def _auth(self) -> tuple[dict[str, str], dict[str, str]]:
        """Google AI Studio keys (including AQ.*) use x-goog-api-key — not Bearer."""
        return (
            {
                "Content-Type": "application/json",
                "x-goog-api-key": self.api_key,
            },
            {"key": self.api_key},
        )

    def _models_to_try(self) -> list[str]:
        seen: set[str] = set()
        ordered: list[str] = []
        for name in (self.model, *MODEL_FALLBACK_CHAIN):
            if name and name not in seen:
                seen.add(name)
                ordered.append(name)
        return ordered

    def _url(self, model: str, action: str) -> str:
        return f"{self.base_url}/models/{model}:{action}"

    async def _post_generate(
        self,
        client: httpx.AsyncClient,
        model: str,
        body: dict[str, Any],
        headers: dict[str, str],
        params: dict[str, str],
    ) -> dict[str, Any]:
        response = await client.post(
            self._url(model, "generateContent"),
            headers=headers,
            params=params,
            json=body,
        )
        if response.status_code >= 400:
            detail = response.text[:500]
            raise RuntimeError(f"HTTP {response.status_code}: {detail}")
        return response.json()

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
        last_error = "unknown"
        async with httpx.AsyncClient(timeout=120.0) as client:
            for model in self._models_to_try():
                try:
                    data = await self._post_generate(client, model, body, headers, params)
                    candidates = data.get("candidates") or []
                    if not candidates:
                        block = (data.get("promptFeedback") or {}).get("blockReason")
                        raise RuntimeError(f"No candidates (block={block})")
                    parts = (candidates[0].get("content") or {}).get("parts") or []
                    text = "".join(p.get("text", "") for p in parts)
                    if not text.strip():
                        raise RuntimeError("Empty model text")
                    usage = (data.get("usageMetadata") or {}).get("totalTokenCount")
                    if model != self.model:
                        logger.info("gemini_model_fallback", configured=self.model, used=model)
                    return text, usage
                except Exception as exc:
                    last_error = str(exc)
                    logger.warning("gemini_model_try_failed", model=model, error=last_error)
                    continue
        raise RuntimeError(last_error)

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

    async def _stream_generate(
        self,
        model: str,
        body: dict[str, Any],
        headers: dict[str, str],
        params: dict[str, str],
    ) -> str:
        """Collect streamed text; returns full reply."""
        params = {**params, "alt": "sse"}
        pieces: list[str] = []
        last_full = ""

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                self._url(model, "streamGenerateContent"),
                headers=headers,
                params=params,
                json=body,
            ) as response:
                if response.status_code >= 400:
                    detail = (await response.aread()).decode("utf-8", errors="replace")[:500]
                    raise RuntimeError(f"HTTP {response.status_code}: {detail}")
                async for line in response.aiter_lines():
                    chunk = _parse_sse_text(line)
                    if not chunk:
                        continue
                    if chunk.startswith(last_full):
                        delta = chunk[len(last_full) :]
                        last_full = chunk
                    else:
                        delta = chunk
                        last_full = last_full + chunk if last_full else chunk
                    if delta:
                        pieces.append(delta)

        return "".join(pieces) if pieces else last_full

    async def stream_chat(
        self,
        history: list[dict[str, str]],
        user_message: str,
    ) -> AsyncIterator[str]:
        if not self.enabled:
            yield STREAM_FALLBACK
            return
        if not openai_breaker.allow_request():
            logger.warning("gemini_circuit_open")
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
        last_error = "unknown"

        try:
            for model in self._models_to_try():
                try:
                    full_text = await self._stream_generate(model, body, headers, params)
                    if full_text.strip():
                        openai_breaker.record_success()
                        yield sanitize_ai_output(full_text)
                        return
                    raise RuntimeError("Empty stream")
                except Exception as exc:
                    last_error = str(exc)
                    logger.warning("gemini_stream_try_failed", model=model, error=last_error)

            text, _ = await self._generate(
                contents,
                system_instruction,
                temperature=0.4,
                max_output_tokens=1200,
            )
            openai_breaker.record_success()
            yield sanitize_ai_output(text)
        except Exception as exc:
            openai_breaker.record_failure()
            logger.error("gemini_stream_failed", error=str(exc), last=last_error, model=self.model)
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
    if not line:
        return ""
    if line.startswith("data:"):
        payload = line[5:].strip()
    elif line.startswith("{"):
        payload = line
    else:
        return ""
    if not payload or payload == "[DONE]":
        return ""
    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        return ""
    if isinstance(data, list) and data:
        data = data[0]
    candidates = data.get("candidates") or []
    if not candidates:
        return ""
    parts = (candidates[0].get("content") or {}).get("parts") or []
    return "".join(p.get("text", "") for p in parts)
