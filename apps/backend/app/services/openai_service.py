import json
import re
from typing import Any, AsyncIterator

import structlog
from openai import AsyncOpenAI

from app.core.config import get_settings
from app.utils.circuit_breaker import openai_breaker
from app.services.prompts import (
    CLASSIFY_PROMPT,
    INTAKE_EXTRACT_PROMPT,
    RECOMMENDATION_PROMPT,
    SUMMARY_PROMPT,
    SYSTEM_ASSISTANT,
)
from app.utils.language_detect import detect_client_language, language_system_addon

logger = structlog.get_logger()

LEGAL_DISCLAIMER_SHORT = (
    "Reminder: This assistant provides intake assistance only, not legal advice."
)

MAX_USER_MESSAGE_LENGTH = 4000
INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
    r"disregard\s+(the\s+)?system\s+prompt",
    r"you\s+are\s+now\s+",
    r"reveal\s+(your\s+)?(system\s+)?prompt",
    r"jailbreak",
]


def sanitize_user_input(text: str) -> str:
    cleaned = text.strip()[:MAX_USER_MESSAGE_LENGTH]
    for pattern in INJECTION_PATTERNS:
        cleaned = re.sub(pattern, "[filtered]", cleaned, flags=re.IGNORECASE)
    return cleaned


def sanitize_ai_output(text: str) -> str:
    return text.strip()[:8000]


def build_conversation_messages(
    history: list[dict[str, str]],
    user_message: str,
) -> list[dict[str, str]]:
    lang = detect_client_language(user_message, history)
    system = SYSTEM_ASSISTANT + language_system_addon(lang)
    messages: list[dict[str, str]] = [{"role": "system", "content": system}]
    for item in history[-20:]:
        role = "user" if item.get("role") == "user" else "assistant"
        messages.append({"role": role, "content": item.get("content", "")[:4000]})
    messages.append({"role": "user", "content": sanitize_user_input(user_message)})
    return messages


def _parse_json_response(raw: str) -> dict[str, Any]:
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            return json.loads(match.group())
        raise


class OpenAIService:
    def __init__(self) -> None:
        settings = get_settings()
        self._client: AsyncOpenAI | None = None
        self.model = settings.openai_model
        self.enabled = settings.openai_configured

    @property
    def client(self) -> AsyncOpenAI:
        if not self.enabled:
            raise RuntimeError("OpenAI is not configured")
        if self._client is None:
            settings = get_settings()
            self._client = AsyncOpenAI(api_key=settings.openai_api_key)
        return self._client

    async def chat_completion(
        self,
        history: list[dict[str, str]],
        user_message: str,
    ) -> tuple[str, int | None]:
        if not self.enabled:
            return self._fallback_reply(user_message), None
        if not openai_breaker.allow_request():
            logger.warning("openai_circuit_open")
            return self._fallback_reply(user_message), None

        messages = build_conversation_messages(history, user_message)
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.4,
                max_tokens=1200,
            )
            content = response.choices[0].message.content or ""
            usage = response.usage.total_tokens if response.usage else None
            openai_breaker.record_success()
            return sanitize_ai_output(content), usage
        except Exception as exc:
            openai_breaker.record_failure()
            logger.error("openai_chat_failed", error=str(exc))
            return (
                "I apologize — I'm temporarily unable to process your message. "
                "Please try again in a moment, or use **Request Legal Representation** "
                "to reach our team directly.",
                None,
            )

    async def stream_chat(
        self,
        history: list[dict[str, str]],
        user_message: str,
    ) -> AsyncIterator[str]:
        if not self.enabled:
            yield self._fallback_reply(user_message)
            return

        messages = build_conversation_messages(history, user_message)
        try:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.4,
                max_tokens=1200,
                stream=True,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta
        except Exception as exc:
            logger.error("openai_stream_failed", error=str(exc))
            yield (
                "I apologize — I'm temporarily unable to respond. Please try again shortly."
            )

    async def structured_json(
        self,
        system_extra: str,
        conversation_text: str,
    ) -> dict[str, Any]:
        if not self.enabled:
            return {}

        messages = [
            {"role": "system", "content": f"{SYSTEM_ASSISTANT}\n\n{system_extra}"},
            {"role": "user", "content": conversation_text[:12000]},
        ]
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.2,
                max_tokens=1500,
                response_format={"type": "json_object"},
            )
            raw = response.choices[0].message.content or "{}"
            return _parse_json_response(raw)
        except Exception as exc:
            logger.error("openai_json_failed", error=str(exc))
            return {}

    async def classify(self, conversation_text: str) -> dict[str, Any]:
        return await self.structured_json(CLASSIFY_PROMPT, conversation_text)

    async def summarize(self, conversation_text: str) -> dict[str, Any]:
        return await self.structured_json(SUMMARY_PROMPT, conversation_text)

    async def recommend(self, conversation_text: str) -> dict[str, Any]:
        return await self.structured_json(RECOMMENDATION_PROMPT, conversation_text)

    async def extract_intake(self, conversation_text: str) -> dict[str, Any]:
        return await self.structured_json(INTAKE_EXTRACT_PROMPT, conversation_text)

    def _fallback_reply(self, user_message: str) -> str:
        return (
            "Thank you for reaching out to SANSON Law Firm. "
            "Our AI assistant is being configured. "
            "Please describe your legal concern, and a member of our team "
            "can review your request when you submit **Request Legal Representation**.\n\n"
            f"{LEGAL_DISCLAIMER_SHORT}"
        )
