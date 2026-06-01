"""Unified LLM facade — prefers Gemini when configured, else OpenAI."""

from __future__ import annotations

from typing import Any, AsyncIterator

from app.core.config import get_settings
from app.services.gemini_service import GeminiService
from app.services.openai_service import OpenAIService


class LLMService:
    """Single entry point for client chat AI (Gemini free tier or OpenAI)."""

    def __init__(self) -> None:
        settings = get_settings()
        if settings.gemini_configured:
            self._impl: GeminiService | OpenAIService = GeminiService()
            self.provider = "gemini"
        elif settings.openai_configured:
            self._impl = OpenAIService()
            self.provider = "openai"
        else:
            self._impl = OpenAIService()
            self.provider = "none"

    @property
    def enabled(self) -> bool:
        return self._impl.enabled

    @property
    def model(self) -> str:
        return getattr(self._impl, "model", "none")

    async def chat_completion(
        self,
        history: list[dict[str, str]],
        user_message: str,
    ) -> tuple[str, int | None]:
        return await self._impl.chat_completion(history, user_message)

    async def stream_chat(
        self,
        history: list[dict[str, str]],
        user_message: str,
    ) -> AsyncIterator[str]:
        async for chunk in self._impl.stream_chat(history, user_message):
            yield chunk

    async def classify(self, conversation_text: str) -> dict[str, Any]:
        return await self._impl.classify(conversation_text)

    async def summarize(self, conversation_text: str) -> dict[str, Any]:
        return await self._impl.summarize(conversation_text)

    async def recommend(self, conversation_text: str) -> dict[str, Any]:
        return await self._impl.recommend(conversation_text)

    async def extract_intake(self, conversation_text: str) -> dict[str, Any]:
        return await self._impl.extract_intake(conversation_text)
