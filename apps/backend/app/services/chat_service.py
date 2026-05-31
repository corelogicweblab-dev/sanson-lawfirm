import json
from datetime import datetime, timezone
from decimal import Decimal
from typing import AsyncIterator
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.ai_chat import (
    AiClassification,
    AiIntakeResponse,
    AiRecommendation,
    AiRecommendationTypeEnum,
    AiSummary,
    AiUrgencyLevelEnum,
    ChatMessage,
    ChatMessageTypeEnum,
    ChatSenderTypeEnum,
    ChatSession,
    ChatSessionStatusEnum,
    SessionDecisionTypeEnum,
)
from app.models.legal import CaseCategoryEnum, PriorityLevelEnum
from app.services.audit_service import AuditService
from app.services.legal_workflow import LegalWorkflowService
from app.services.openai_service import OpenAIService, sanitize_user_input
from app.utils.references import generate_chat_session_reference


class ChatService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit = AuditService(db)
        self.openai = OpenAIService()
        self.legal = LegalWorkflowService(db)

    async def create_session(
        self,
        client_id: UUID,
        ip: str | None = None,
        ua: str | None = None,
    ) -> ChatSession:
        now = datetime.now(timezone.utc)
        ref = await generate_chat_session_reference(self.db)
        session = ChatSession(
            client_id=client_id,
            session_reference=ref,
            status=ChatSessionStatusEnum.ACTIVE,
            started_at=now,
            last_activity_at=now,
        )
        self.db.add(session)
        await self.db.flush()

        welcome = (
            "Welcome to the SANSON Law Firm AI Legal Assistant. "
            "I'm here to help gather information about your legal concern "
            "before our attorneys review your matter.\n\n"
            "Please describe your situation, and I'll ask follow-up questions "
            "to better understand your case."
        )
        await self._add_message(
            session.id,
            ChatSenderTypeEnum.AI,
            welcome,
            ChatMessageTypeEnum.SYSTEM,
        )
        await self.audit.log(
            "chat.started",
            "chat_sessions",
            session.id,
            client_id,
            ip,
            ua,
            new_values={"reference": ref},
        )
        return session

    async def get_session(self, session_id: UUID, client_id: UUID | None = None) -> ChatSession | None:
        query = select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.deleted_at.is_(None),
        )
        if client_id:
            query = query.where(ChatSession.client_id == client_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def list_sessions(
        self,
        client_id: UUID,
        offset: int,
        limit: int,
    ) -> tuple[list[ChatSession], int]:
        base = select(ChatSession).where(
            ChatSession.client_id == client_id,
            ChatSession.deleted_at.is_(None),
        )
        count_q = select(func.count(ChatSession.id)).where(
            ChatSession.client_id == client_id,
            ChatSession.deleted_at.is_(None),
        )
        total = (await self.db.execute(count_q)).scalar() or 0
        result = await self.db.execute(
            base.order_by(ChatSession.last_activity_at.desc()).offset(offset).limit(limit)
        )
        return list(result.scalars().all()), total

    async def get_messages(self, session_id: UUID) -> list[ChatMessage]:
        result = await self.db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
        )
        return list(result.scalars().all())

    async def _conversation_history(self, session_id: UUID) -> list[dict[str, str]]:
        messages = await self.get_messages(session_id)
        history = []
        for m in messages:
            if m.message_type == ChatMessageTypeEnum.SYSTEM and m.sender_type == ChatSenderTypeEnum.AI:
                continue
            role = "user" if m.sender_type == ChatSenderTypeEnum.CLIENT else "assistant"
            history.append({"role": role, "content": m.message})
        return history

    async def _conversation_text(self, session_id: UUID) -> str:
        messages = await self.get_messages(session_id)
        lines = []
        for m in messages:
            if m.message_type == ChatMessageTypeEnum.SYSTEM:
                continue
            lines.append(f"{m.sender_type.value}: {m.message}")
        return "\n".join(lines)

    async def _touch_session(self, session: ChatSession) -> None:
        session.last_activity_at = datetime.now(timezone.utc)

    async def _add_message(
        self,
        session_id: UUID,
        sender: ChatSenderTypeEnum,
        text: str,
        msg_type: ChatMessageTypeEnum = ChatMessageTypeEnum.TEXT,
        token_usage: int | None = None,
    ) -> ChatMessage:
        msg = ChatMessage(
            session_id=session_id,
            sender_type=sender,
            message=text,
            message_type=msg_type,
            token_usage=token_usage,
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(msg)
        await self.db.flush()
        return msg

    async def send_message(
        self,
        session_id: UUID,
        client_id: UUID,
        content: str,
        ip: str | None = None,
        ua: str | None = None,
    ) -> tuple[ChatMessage, ChatMessage]:
        session = await self.get_session(session_id, client_id)
        if not session:
            raise ValueError("Session not found")
        if session.status != ChatSessionStatusEnum.ACTIVE:
            raise ValueError("Session is not active")

        user_text = sanitize_user_input(content)
        user_msg = await self._add_message(
            session_id, ChatSenderTypeEnum.CLIENT, user_text
        )
        await self._touch_session(session)

        history = await self._conversation_history(session_id)
        ai_text, tokens = await self.openai.chat_completion(history, user_text)
        ai_msg = await self._add_message(
            session_id,
            ChatSenderTypeEnum.AI,
            ai_text,
            token_usage=tokens,
        )
        await self._touch_session(session)
        return user_msg, ai_msg

    async def stream_message(
        self,
        session_id: UUID,
        client_id: UUID,
        content: str,
    ) -> AsyncIterator[str]:
        session = await self.get_session(session_id, client_id)
        if not session:
            yield 'data: {"error":"Session not found"}\n\n'
            return
        if session.status != ChatSessionStatusEnum.ACTIVE:
            yield 'data: {"error":"Session is not active"}\n\n'
            return

        user_text = sanitize_user_input(content)
        await self._add_message(session_id, ChatSenderTypeEnum.CLIENT, user_text)
        await self._touch_session(session)

        history = await self._conversation_history(session_id)
        full = []
        async for chunk in self.openai.stream_chat(history, user_text):
            full.append(chunk)
            payload = json.dumps({"delta": chunk})
            yield f"data: {payload}\n\n"

        ai_text = "".join(full)
        await self._add_message(session_id, ChatSenderTypeEnum.AI, ai_text)
        await self._touch_session(session)
        yield 'data: {"done":true}\n\n'

    def _map_category(self, raw: str | None) -> CaseCategoryEnum | None:
        if not raw:
            return None
        key = raw.upper().replace(" ", "_").replace("&", "").replace("__", "_")
        if key == "ESTATE__PROBATE":
            key = "ESTATE_PROBATE"
        try:
            return CaseCategoryEnum[key]
        except KeyError:
            return CaseCategoryEnum.OTHER

    def _map_priority(self, raw: str | None) -> PriorityLevelEnum | None:
        if not raw:
            return None
        try:
            return PriorityLevelEnum[raw.upper()]
        except KeyError:
            return PriorityLevelEnum.MEDIUM

    def _map_urgency(self, raw: str | None) -> AiUrgencyLevelEnum | None:
        if not raw:
            return None
        try:
            return AiUrgencyLevelEnum[raw.upper()]
        except KeyError:
            return AiUrgencyLevelEnum.MEDIUM

    async def run_classification(
        self,
        session_id: UUID,
        client_id: UUID | None,
        performed_by: UUID,
        ip: str | None = None,
        ua: str | None = None,
    ) -> AiClassification:
        session = await self.get_session(session_id, client_id)
        if not session:
            raise ValueError("Session not found")

        text = await self._conversation_text(session_id)
        data = await self.openai.classify(text)
        row = AiClassification(
            session_id=session_id,
            category=self._map_category(data.get("category")),
            subcategory=data.get("subcategory"),
            priority=self._map_priority(data.get("priority")),
            urgency=self._map_urgency(data.get("urgency")),
            confidence_score=Decimal(str(data.get("confidence_score", 0))),
            potential_legal_area=data.get("potential_legal_area"),
            raw_result=data,
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(row)
        await self.db.flush()
        await self.audit.log(
            "ai.classification_generated",
            "ai_classifications",
            row.id,
            performed_by,
            ip,
            ua,
            new_values={"session_id": str(session_id)},
        )
        return row

    async def run_summary(
        self,
        session_id: UUID,
        client_id: UUID | None,
        performed_by: UUID,
        ip: str | None = None,
        ua: str | None = None,
    ) -> AiSummary:
        session = await self.get_session(session_id, client_id)
        if not session:
            raise ValueError("Session not found")

        text = await self._conversation_text(session_id)
        data = await self.openai.summarize(text)

        classification = await self._latest_classification(session_id)
        urgency = classification.urgency if classification else None

        row = AiSummary(
            session_id=session_id,
            client_id=session.client_id,
            summary_text=data.get("summary_text", "Intake summary pending."),
            key_facts=data.get("key_facts"),
            parties_involved=data.get("parties_involved"),
            relevant_dates=data.get("relevant_dates"),
            evidence_mentioned=data.get("evidence_mentioned"),
            missing_information=data.get("missing_information"),
            recommended_next_steps=data.get("recommended_next_steps"),
            classification_id=classification.id if classification else None,
            urgency=urgency,
            generated_at=datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(row)
        await self.db.flush()
        await self.audit.log(
            "ai.summary_generated",
            "ai_summaries",
            row.id,
            performed_by,
            ip,
            ua,
            new_values={"session_id": str(session_id)},
        )
        return row

    async def run_recommendations(
        self,
        session_id: UUID,
        client_id: UUID | None,
        performed_by: UUID,
        ip: str | None = None,
        ua: str | None = None,
    ) -> list[AiRecommendation]:
        session = await self.get_session(session_id, client_id)
        if not session:
            raise ValueError("Session not found")

        text = await self._conversation_text(session_id)
        data = await self.openai.recommend(text)
        items = data.get("recommendations", [])
        rows = []
        for item in items:
            rtype = item.get("type", "CONTINUE_CONVERSATION")
            try:
                rec_type = AiRecommendationTypeEnum[rtype]
            except KeyError:
                rec_type = AiRecommendationTypeEnum.CONTINUE_CONVERSATION
            row = AiRecommendation(
                session_id=session_id,
                recommendation_type=rec_type,
                message=item.get("message", ""),
                metadata_={},
                created_at=datetime.now(timezone.utc),
            )
            self.db.add(row)
            rows.append(row)
        await self.db.flush()
        await self.audit.log(
            "ai.recommendation_generated",
            "ai_recommendations",
            session_id,
            performed_by,
            ip,
            ua,
            new_values={"count": len(rows)},
        )
        return rows

    async def run_intake_extract(
        self,
        session_id: UUID,
        client_id: UUID | None,
        performed_by: UUID,
    ) -> list[AiIntakeResponse]:
        session = await self.get_session(session_id, client_id)
        if not session:
            raise ValueError("Session not found")

        text = await self._conversation_text(session_id)
        data = await self.openai.extract_intake(text)
        rows = []
        for item in data.get("responses", []):
            row = AiIntakeResponse(
                session_id=session_id,
                question_key=item.get("question_key", "general"),
                question_text=item.get("question_text", ""),
                answer_text=item.get("answer_text", ""),
                created_at=datetime.now(timezone.utc),
            )
            self.db.add(row)
            rows.append(row)
        await self.db.flush()
        return rows

    async def _latest_classification(self, session_id: UUID) -> AiClassification | None:
        result = await self.db.execute(
            select(AiClassification)
            .where(AiClassification.session_id == session_id)
            .order_by(AiClassification.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_session_insights(
        self, session_id: UUID, client_id: UUID | None = None
    ) -> dict:
        session = await self.get_session(session_id, client_id)
        if not session:
            raise ValueError("Session not found")

        classification = await self._latest_classification(session_id)
        summary_result = await self.db.execute(
            select(AiSummary)
            .where(AiSummary.session_id == session_id)
            .order_by(AiSummary.generated_at.desc())
            .limit(1)
        )
        summary = summary_result.scalar_one_or_none()
        rec_result = await self.db.execute(
            select(AiRecommendation)
            .where(AiRecommendation.session_id == session_id)
            .order_by(AiRecommendation.created_at.desc())
            .limit(5)
        )
        recommendations = list(rec_result.scalars().all())
        intake_result = await self.db.execute(
            select(AiIntakeResponse).where(AiIntakeResponse.session_id == session_id)
        )
        intake = list(intake_result.scalars().all())

        from app.schemas.ai_mappers import (
            to_classification,
            to_intake_response,
            to_recommendation,
            to_summary,
        )

        return {
            "classification": to_classification(classification) if classification else None,
            "summary": to_summary(summary) if summary else None,
            "recommendations": [to_recommendation(r) for r in recommendations],
            "intakeResponses": [to_intake_response(i) for i in intake],
        }

    async def apply_decision(
        self,
        session_id: UUID,
        client_id: UUID,
        decision: str,
        performed_by: UUID,
        ip: str | None = None,
        ua: str | None = None,
    ) -> dict:
        session = await self.get_session(session_id, client_id)
        if not session:
            raise ValueError("Session not found")

        decision_enum = SessionDecisionTypeEnum[decision]

        if decision_enum == SessionDecisionTypeEnum.CONTINUE_CHAT:
            session.status = ChatSessionStatusEnum.ACTIVE
            await self._touch_session(session)
            return {"decision": decision, "legalRequestId": None}

        if decision_enum == SessionDecisionTypeEnum.RETURN_LATER:
            session.status = ChatSessionStatusEnum.PAUSED
            session.last_activity_at = datetime.now(timezone.utc)
            await self.audit.log(
                "chat.paused",
                "chat_sessions",
                session.id,
                performed_by,
                ip,
                ua,
            )
            return {"decision": decision, "legalRequestId": None}

        # REQUEST_LEGAL_REPRESENTATION
        await self.run_intake_extract(session_id, client_id, performed_by)
        classification = await self.run_classification(
            session_id, client_id, performed_by, ip, ua
        )
        summary = await self.run_summary(session_id, client_id, performed_by, ip, ua)
        await self.run_recommendations(session_id, client_id, performed_by, ip, ua)

        category = classification.category or CaseCategoryEnum.OTHER
        priority = classification.priority or PriorityLevelEnum.MEDIUM
        subject = classification.subcategory or f"AI Intake — {category.value}"
        description = (
            f"{summary.summary_text}\n\n---\n"
            f"Session: {session.session_reference}\n"
            f"Urgency: {classification.urgency.value if classification.urgency else 'MEDIUM'}\n"
            f"Confidence: {classification.confidence_score}%"
        )

        req = await self.legal.create_legal_request(
            client_id=client_id,
            case_category=category.name,
            subject=subject[:255],
            description=description,
            priority=priority.name,
            performed_by=performed_by,
            ip=ip,
            ua=ua,
        )
        req.chat_session_id = session.id
        req.ai_summary_id = summary.id
        req.ai_metadata = {
            "classification_id": str(classification.id),
            "session_reference": session.session_reference,
            "urgency": classification.urgency.value if classification.urgency else None,
        }
        session.legal_request_id = req.id
        session.status = ChatSessionStatusEnum.COMPLETED
        session.ended_at = datetime.now(timezone.utc)
        await self.db.flush()

        await self.audit.log(
            "chat.representation_requested",
            "legal_requests",
            req.id,
            performed_by,
            ip,
            ua,
            new_values={
                "session_id": str(session_id),
                "reference": req.request_reference,
            },
        )
        await self.audit.log(
            "chat.ended",
            "chat_sessions",
            session.id,
            performed_by,
            ip,
            ua,
        )

        return {
            "decision": decision,
            "legalRequestId": str(req.id),
            "requestReference": req.request_reference,
        }
