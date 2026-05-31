import json
import re
from datetime import datetime, timezone

from app.services.openai_service import OpenAIService

ANALYSIS_PROMPT = """Analyze this legal document text for SANSON Law Firm intake.
Return JSON only:
{
  "summary_text": "string",
  "important_findings": ["..."],
  "parties": ["..."],
  "dates_found": ["..."],
  "legal_significance": "string",
  "risk_indicators": ["..."],
  "missing_attachments": ["..."],
  "extracted_entities": {
    "people": [], "organizations": [], "addresses": [],
    "phone_numbers": [], "email_addresses": [], "monetary_values": [],
    "case_references": [], "legal_keywords": []
  },
  "keywords": ["..."]
}
"""

TIMELINE_PROMPT = """Extract chronological events from this legal document text.
Return JSON only:
{
  "timeline_summary": "string",
  "confidence_score": 0-100,
  "events": [
    {
      "event_date": "YYYY-MM-DD",
      "event_title": "string",
      "event_description": "string",
      "location": "string or null",
      "people": [],
      "organizations": []
    }
  ]
}
"""


class DocumentAiService:
    def __init__(self) -> None:
        self.openai = OpenAIService()

    async def analyze_document(self, text: str) -> dict:
        if not text.strip():
            return self._empty_analysis()
        if not self.openai.enabled:
            return self._fallback_analysis(text)
        data = await self.openai.structured_json(ANALYSIS_PROMPT, text[:15000])
        return data if data else self._fallback_analysis(text)

    async def extract_timeline(self, text: str) -> dict:
        if not text.strip():
            return {"events": [], "timeline_summary": "", "confidence_score": 0}
        if not self.openai.enabled:
            return {"events": [], "timeline_summary": "AI timeline requires OpenAI.", "confidence_score": 0}
        return await self.openai.structured_json(TIMELINE_PROMPT, text[:15000])

    def _empty_analysis(self) -> dict:
        return {
            "summary_text": "No extractable text.",
            "important_findings": [],
            "parties": [],
            "dates_found": [],
            "legal_significance": "",
            "risk_indicators": [],
            "missing_attachments": [],
            "extracted_entities": {},
            "keywords": [],
        }

    def _fallback_analysis(self, text: str) -> dict:
        preview = text[:500] + ("..." if len(text) > 500 else "")
        dates = re.findall(r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b", text)
        emails = re.findall(r"[\w.+-]+@[\w-]+\.[\w.-]+", text)
        phones = re.findall(r"\+?\d[\d\s\-()]{8,}\d", text)
        return {
            "summary_text": preview,
            "important_findings": ["Automated preview — configure OpenAI for full analysis."],
            "parties": [],
            "dates_found": dates[:10],
            "legal_significance": "Pending full AI analysis.",
            "risk_indicators": [],
            "missing_attachments": [],
            "extracted_entities": {
                "email_addresses": emails[:5],
                "phone_numbers": phones[:5],
            },
            "keywords": [],
            "embedding_text": text[:8000],
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
