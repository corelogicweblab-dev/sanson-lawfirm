"""Lightweight client language detection for AI chat (no external deps)."""

import re

LANGUAGE_NAMES: dict[str, str] = {
    "en": "English",
    "fil": "Filipino/Tagalog",
    "es": "Spanish",
    "zh": "Chinese (Simplified)",
    "ja": "Japanese",
    "ko": "Korean",
    "ar": "Arabic",
    "vi": "Vietnamese",
    "ceb": "Cebuano",
    "ilo": "Ilocano",
}

_TAGALOG_RE = re.compile(
    r"\b("
    r"ako|ikaw|siya|kami|tayo|mga|ang|ng|sa|na|po|ho|nga|naman|bakit|paano|salamat|"
    r"abogado|kaso|trabaho|asawa|anak|pero|dahil|kung|hindi|oo|wala|mayroon|"
    r"naman|lang|din|rin|ba|po|ho|kayo|ninyo|akin|iyo|kanila|dito|diyan|doon"
    r")\b",
    re.IGNORECASE,
)

_CEBUANO_RE = re.compile(
    r"\b(ko|ikaw|siya|namo|ninyo|unsa|asa|kanus-a|salamat|abogado|kaso)\b",
    re.IGNORECASE,
)


def detect_client_language(text: str, history: list[dict[str, str]] | None = None) -> str:
    """Detect primary language from latest user text and recent user turns."""
    parts: list[str] = []
    if history:
        for item in reversed(history):
            if item.get("role") == "user" and item.get("content"):
                parts.append(str(item["content"]))
                if len(parts) >= 3:
                    break
    parts.append(text or "")
    sample = " ".join(reversed(parts)).strip()[:4000]
    if not sample:
        return "en"

    if re.search(r"[\u4e00-\u9fff]", sample):
        return "zh"
    if re.search(r"[\u3040-\u30ff]", sample):
        return "ja"
    if re.search(r"[\uac00-\ud7af]", sample):
        return "ko"
    if re.search(r"[\u0600-\u06FF]", sample):
        return "ar"
    if re.search(r"[\u0400-\u04FF]", sample):
        return "ru"

    tagalog_hits = len(_TAGALOG_RE.findall(sample))
    cebuano_hits = len(_CEBUANO_RE.findall(sample))
    if tagalog_hits >= 2 and tagalog_hits >= cebuano_hits:
        return "fil"
    if cebuano_hits >= 2:
        return "ceb"

    if re.search(
        r"\b(hola|gracias|abogado|necesito|por favor|qué|como|está|ayuda|legal)\b",
        sample,
        re.IGNORECASE,
    ):
        return "es"
    if re.search(
        r"\b(xin chào|cảm ơn|luật sư|vụ án|giúp|tôi|bạn)\b",
        sample,
        re.IGNORECASE,
    ):
        return "vi"

    return "en"


def language_system_addon(code: str) -> str:
    name = LANGUAGE_NAMES.get(code, "the same language the client is using")
    return (
        f"\nLanguage: The client's primary language is {name} ({code}). "
        f"Always reply in {name}. If they switch languages mid-conversation, "
        f"follow their latest message language. Never ask them to use English only."
    )
