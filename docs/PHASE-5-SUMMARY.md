# Phase 5 Summary — AI Knowledge Engine, Semantic Search & Legal Intelligence

**Powered By: CoreLogic**

## Objective

Transform SANSON Legal OS into an intelligent legal knowledge system: natural-language search, Qdrant vector retrieval, document chunking, internal knowledge base, AI lawyer assistant context, and dashboard search UX.

## Search Architecture

```
Natural Language Query
        ↓
┌───────────────────────────────────────┐
│  SearchService (HYBRID default)       │
│  • SEMANTIC → Qdrant multi-collection  │
│  • KEYWORD  → PostgreSQL ILIKE         │
│  • HYBRID   → merge + rank scores      │
└───────────────────────────────────────┘
        ↓
SearchResult (title, type, scores, summary, openAction)
        ↓
search_queries + search_history + audit
```

**Supported targets:** cases, documents, evidence, AI summaries, knowledge articles (consultation notes / activities / timelines use keyword paths where indexed text exists).

**Ranking:** `similarityScore`, `confidenceScore`, `rankingScore` with type weights (case > document > evidence).

## Qdrant Architecture

| Collection | Content |
|------------|---------|
| `documents_collection` | Document chunks (OCR + analysis text) |
| `cases_collection` | Case title, number, description |
| `evidence_collection` | Evidence titles and descriptions |
| `summaries_collection` | AI document summaries |
| `knowledge_collection` | Published knowledge articles |

**Provider:** Qdrant Cloud via `qdrant-client`.

**Env:** `QDRANT_URL`, `QDRANT_API_KEY`

**Fallback:** If Qdrant or OpenAI is not configured, keyword search still works against PostgreSQL.

## Embedding Pipeline

```
Document Uploaded (Phase 4)
        ↓
OCR Extraction
        ↓
Document Analysis (embedding_text)
        ↓
Chunking (~800 chars, overlap 120)
        ↓
OpenAI text-embedding-3-small
        ↓
Qdrant upsert + document_chunks / document_embeddings
        ↓
Retrieval Ready
```

**Manual re-index:** `POST /api/v1/documents/{id}/index-embeddings`

**Knowledge publish:** `POST /api/v1/knowledge/{article_id}/index`

**Batch / background:** Embedding runs inline after document process; architecture supports future job queue (Phase 6 prep only).

### Chunk Tracking (`document_chunks`)

| Field | Purpose |
|-------|---------|
| `chunk_index` | Position in document |
| `chunk_text` | Chunk body |
| `char_start` / `char_end` | Source offsets |
| `embedding_status` | PENDING → INDEXED / FAILED |
| `qdrant_point_id` | Vector point reference |
| `version_number` | Reprocessing / versioning |

## Knowledge Base Design

**Tables:** `knowledge_categories`, `knowledge_articles`

**Article fields:** id, title, slug, category, content, summary, author, visibility, status, timestamps.

**Categories (seed):** Procedures, Guidelines, Templates, Policies, References, Training, Research.

**Visibility:** STAFF / LAWYERS / ALL_STAFF with RBAC `knowledge:read` / `knowledge:write`.

## Database Changes (`009`, `010`)

| Table | Purpose |
|-------|---------|
| `document_chunks` | Chunk metadata and status |
| `document_embeddings` | Per-chunk vector registry |
| `case_embeddings` | Case vectors |
| `evidence_embeddings` | Evidence vectors |
| `search_queries` | Query log with mode, filters, duration |
| `search_history` | Per-user recent queries |
| `knowledge_categories` | KB taxonomy |
| `knowledge_articles` | Internal articles |

**Migrations:**

1. `scripts/migrations/009_phase5_schema.sql`
2. `scripts/migrations/010_phase5_seed.sql`

## Backend Modules

| Module | Service | Responsibility |
|--------|---------|----------------|
| `search` | `SearchService` | Semantic, keyword, hybrid, history, analytics |
| `embeddings` | `EmbeddingService` | Chunk, embed, index all entity types |
| `retrieval` | `QdrantService` | Collections, upsert, multi-search |
| `knowledge-base` | `KnowledgeService` | CRUD, slug, views, publish |
| `recommendations` | `RecommendationService` | Lawyer suggestions, related entities |
| `context-engine` | `ContextEngine` | Case/document context bundles |

## API Endpoints

| Method | Path | Permission |
|--------|------|------------|
| POST | `/api/v1/search/` | `search:read` |
| POST | `/api/v1/search/semantic` | `search:read` |
| POST | `/api/v1/search/keyword` | `search:read` |
| GET | `/api/v1/search/history` | `search:read` |
| GET | `/api/v1/search/analytics` | `search:admin` |
| GET | `/api/v1/knowledge/categories` | `knowledge:read` |
| GET | `/api/v1/knowledge/` | `knowledge:read` |
| GET | `/api/v1/knowledge/{slug}` | `knowledge:read` |
| POST | `/api/v1/knowledge/` | `knowledge:write` |
| POST | `/api/v1/knowledge/{id}/index` | `embeddings:run` |
| GET | `/api/v1/recommendations/` | `recommendations:read` |
| GET | `/api/v1/recommendations/related` | `recommendations:read` |
| POST | `/api/v1/recommendations/context` | `context:read` |
| POST | `/api/v1/documents/{id}/index-embeddings` | `embeddings:run` |

## AI Lawyer Assistant & Context Engine

**Assistant capabilities (lawyer dashboard + search):**

- Search related documents, cases, evidence, knowledge
- AI recommendations panel (pending reviews + case-related hits)
- Recent searches

**Context engine builders:**

- `build_case_context` — case metadata + related search results
- `build_document_context` — document + OCR/analysis + related hits

**Audit events:** `search.performed`, `knowledge.viewed`, `knowledge.created`, `embedding.generated`, `recommendation.generated`, `ai.context.generated`

## Security Controls

- Role-based search access (`search:read`, `search:admin`)
- Document visibility / ownership filters in keyword search
- Knowledge visibility enums + staff-only write
- Embedding operations gated by `embeddings:run`
- All search and knowledge views logged to audit trail

## Performance Optimizations

- Hybrid search limits per collection (`limit // 3`)
- In-memory merge deduplication by `sourceId`
- Pagination on knowledge list API
- Search history capped (20–50)
- Lazy embedding: only when Qdrant + OpenAI configured
- **Prepared (not built):** Redis search cache, dedicated worker queue

## Frontend

| Route | Purpose |
|-------|---------|
| `/dashboard/lawyer/search` | Full smart search (hybrid / semantic / keyword) |
| `/dashboard/lawyer/knowledge` | Knowledge center listing |
| `/dashboard/lawyer/knowledge/article?slug=` | Article viewer (static export friendly) |
| `/dashboard/admin/search-analytics` | Popular searches, Qdrant status |

**Components:**

- `GlobalSearch` — NL query, mode selector, results with scores
- `SearchModal` — header quick search (lawyer / paralegal / admin)
- `AiRecommendationsPanel` — lawyer dashboard upgrades

**Shell:** Smart Search + Knowledge nav items; admin Search Analytics link.

## Environment

```env
# Phase 5 — Qdrant Cloud
QDRANT_URL=https://xxxxx.cloud.qdrant.io
QDRANT_API_KEY=

# Phase 5 — Embeddings (uses OpenAI from Phase 3)
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_CHUNK_SIZE=800
EMBEDDING_CHUNK_OVERLAP=120
```

Requires existing `OPENAI_API_KEY` for vectors.

## Phase 6 Preparation (Not Built)

Architecture leaves hooks for:

- Mobile apps consuming same search/knowledge APIs
- Push notifications on new knowledge / case updates
- Realtime sync (WebSocket) for search index status
- Background job workers for batch embedding

## Not Built (Out of Scope)

- Mobile application
- Push notifications
- Realtime infrastructure
- Advanced enterprise monitoring
- Multi-tenant nationwide expansion
- Production deployment automation changes

## Pending / Optional Enhancements

- Dedicated Redis search result cache
- Admin UI to author knowledge articles (API ready)
- METADATA-only search filters UI
- Consultation note / activity dedicated Qdrant collections
- Virus scan before embedding (Phase 4 hook)
