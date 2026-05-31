from decimal import Decimal

from app.models.ai_chat import (
    AiClassification,
    AiIntakeResponse,
    AiRecommendation,
    AiSummary,
    ChatMessage,
    ChatSession,
)


def _dt(v):
    return v.isoformat() if v else None


def _enum(v):
    return v.value if v and hasattr(v, "value") else v


def to_chat_session(session: ChatSession) -> dict:
    return {
        "id": str(session.id),
        "clientId": str(session.client_id),
        "sessionReference": session.session_reference,
        "status": _enum(session.status),
        "legalRequestId": str(session.legal_request_id) if session.legal_request_id else None,
        "startedAt": _dt(session.started_at),
        "lastActivityAt": _dt(session.last_activity_at),
        "endedAt": _dt(session.ended_at),
        "createdAt": _dt(session.created_at),
        "updatedAt": _dt(session.updated_at),
    }


def to_chat_message(msg: ChatMessage) -> dict:
    return {
        "id": str(msg.id),
        "sessionId": str(msg.session_id),
        "senderType": _enum(msg.sender_type),
        "message": msg.message,
        "messageType": _enum(msg.message_type),
        "tokenUsage": msg.token_usage,
        "createdAt": _dt(msg.created_at),
    }


def to_classification(row: AiClassification) -> dict:
    score = row.confidence_score
    if isinstance(score, Decimal):
        score = float(score)
    return {
        "id": str(row.id),
        "sessionId": str(row.session_id),
        "category": _enum(row.category),
        "subcategory": row.subcategory,
        "priority": _enum(row.priority),
        "urgency": _enum(row.urgency),
        "confidenceScore": score,
        "potentialLegalArea": row.potential_legal_area,
        "createdAt": _dt(row.created_at),
    }


def to_summary(row: AiSummary) -> dict:
    return {
        "id": str(row.id),
        "sessionId": str(row.session_id),
        "clientId": str(row.client_id),
        "summaryText": row.summary_text,
        "keyFacts": row.key_facts or [],
        "partiesInvolved": row.parties_involved or [],
        "relevantDates": row.relevant_dates or [],
        "evidenceMentioned": row.evidence_mentioned or [],
        "missingInformation": row.missing_information or [],
        "recommendedNextSteps": row.recommended_next_steps or [],
        "urgency": _enum(row.urgency),
        "classificationId": str(row.classification_id) if row.classification_id else None,
        "generatedAt": _dt(row.generated_at),
    }


def to_intake_response(row: AiIntakeResponse) -> dict:
    return {
        "id": str(row.id),
        "sessionId": str(row.session_id),
        "questionKey": row.question_key,
        "questionText": row.question_text,
        "answerText": row.answer_text,
        "createdAt": _dt(row.created_at),
    }


def to_recommendation(row: AiRecommendation) -> dict:
    return {
        "id": str(row.id),
        "sessionId": str(row.session_id),
        "recommendationType": _enum(row.recommendation_type),
        "message": row.message,
        "metadata": row.metadata_ or {},
        "createdAt": _dt(row.created_at),
    }
