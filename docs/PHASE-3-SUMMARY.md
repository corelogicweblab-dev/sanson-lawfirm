# Phase 3 Summary — AI Legal Assistant & Intelligent Intake Engine

**Powered By: CoreLogic**

## Objective

Phase 3 delivers the AI-first consultation layer: multi-turn chat, case classification, urgency assessment, missing-information detection, intake summaries, recommendations, and automated legal request creation when a client chooses **Request Legal Representation**.

## What Was Built

### Database (`005_phase3_schema.sql`, `006_phase3_seed.sql`)

| Table | Purpose |
|-------|---------|
| `chat_sessions` | Client AI sessions with reference, status, optional `legal_request_id` |
| `chat_messages` | CLIENT / AI / SYSTEM messages with optional token usage |
| `ai_classifications` | Category, subcategory, priority, urgency, confidence |
| `ai_summaries` | Structured intake summary + missing info + next steps |
| `ai_intake_responses` | Extracted Q&A pairs from conversation |
| `ai_recommendations` | Action recommendations for client/staff |

Extended `legal_requests` with `chat_session_id`, `ai_summary_id`, `ai_metadata`.

Extended `case_category` enum: `IMMIGRATION`, `ESTATE_PROBATE`, `TAX`.

Permissions: `chat:read`, `chat:write`, `chat:create`, `ai:read`, `ai:generate`.

### Backend Modules

| Module | Path |
|--------|------|
| OpenAI layer | `app/services/openai_service.py` |
| Prompt templates | `app/services/prompts.py` |
| Chat & intake orchestration | `app/services/chat_service.py` |
| Models | `app/models/ai_chat.py` |
| Chat API | `app/api/v1/chat.py` |
| AI API | `app/api/v1/ai.py` |

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/chat/session` | Start session |
| GET | `/api/v1/chat/session` | List client sessions |
| GET | `/api/v1/chat/session/{id}` | Session detail |
| GET | `/api/v1/chat/history?session_id=` | Message history |
| GET | `/api/v1/chat/session/{id}/insights` | Summary, classification, recommendations |
| POST | `/api/v1/chat/session/{id}/messages` | Send message (`?stream=true` for SSE) |
| POST | `/api/v1/chat/session/{id}/decision` | CONTINUE_CHAT / RETURN_LATER / REQUEST_LEGAL_REPRESENTATION |
| GET | `/api/v1/chat/suggested-questions` | Starter prompts |
| POST | `/api/v1/ai/classify` | Generate classification |
| POST | `/api/v1/ai/summary` | Generate summary |
| POST | `/api/v1/ai/recommendation` | Generate recommendations |
| POST | `/api/v1/ai/intake` | Extract intake Q&A |

### Frontend

- **Page:** `/dashboard/client/ai-assistant`
- **Components:** `legal-disclaimer`, `ai-assistant-chat` (sidebar, streaming chat, insights panel, decision CTAs)
- **Nav:** Client sidebar — “AI Legal Assistant”
- **API client:** Streaming SSE + session/decision methods in `apps/web/src/lib/api.ts`

### Security

- Authenticated sessions; clients scoped to own `client_id`
- Input sanitization + prompt-injection pattern filtering
- Output length limits
- Rate limiting (global `slowapi` + configurable AI limits)
- Audit events: `chat.started`, `chat.ended`, `ai.summary_generated`, `ai.classification_generated`, `chat.representation_requested`

### Representation Request Flow

On `REQUEST_LEGAL_REPRESENTATION`:

1. Extract intake responses
2. Classify case + urgency
3. Generate summary + recommendations
4. Create `legal_request` with AI summary in description
5. Link session ↔ request; mark session `COMPLETED`

## Configuration

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
AI_RATE_LIMIT_PER_MINUTE=30
```

Set on Render (`render.yaml` includes keys) and local `apps/backend/.env`.

Without `OPENAI_API_KEY`, the assistant returns a graceful fallback message; structured AI features return empty/minimal data.

## Migrations

Run in Supabase SQL Editor (after Phase 1–2):

1. `scripts/migrations/005_phase3_schema.sql`
2. `scripts/migrations/006_phase3_seed.sql`

## Pending (Future Phases — Not Built)

- OCR / document parsing
- Document AI analysis
- Vector search / Qdrant
- Mobile app
- Advanced realtime (WebSockets)
- Notifications push infrastructure

## Architecture Diagram

```
Client (Next.js)
    │ Firebase Auth token
    ▼
FastAPI /api/v1/chat ──► ChatService ──► PostgreSQL (sessions, messages)
    │                         │
    │                         └──► OpenAIService ──► OpenAI API
    ▼
REQUEST_LEGAL_REPRESENTATION ──► LegalWorkflowService ──► legal_requests
```
