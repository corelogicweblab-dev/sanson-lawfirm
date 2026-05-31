from pydantic import BaseModel, Field


class ChatSessionCreate(BaseModel):
    pass


class ChatMessageCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)


class SessionDecisionRequest(BaseModel):
    decision: str = Field(
        ...,
        pattern="^(CONTINUE_CHAT|RETURN_LATER|REQUEST_LEGAL_REPRESENTATION)$",
    )


class AiAnalyzeRequest(BaseModel):
    session_id: str


class ChatSessionResponse(BaseModel):
    id: str
    session_reference: str
    status: str
    legal_request_id: str | None = None
    started_at: str
    last_activity_at: str
    ended_at: str | None = None
