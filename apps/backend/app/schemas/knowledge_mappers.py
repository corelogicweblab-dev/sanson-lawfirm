from app.models.knowledge import KnowledgeArticle, KnowledgeCategory, SearchHistory


def _dt(v):
    return v.isoformat() if v else None


def _enum(v):
    return v.value if v and hasattr(v, "value") else v


def to_knowledge_category(c: KnowledgeCategory) -> dict:
    return {
        "id": str(c.id),
        "name": c.name,
        "displayName": c.display_name,
        "description": c.description,
        "sortOrder": c.sort_order,
    }


def to_knowledge_article(a: KnowledgeArticle) -> dict:
    return {
        "id": str(a.id),
        "title": a.title,
        "slug": a.slug,
        "categoryId": str(a.category_id) if a.category_id else None,
        "category": to_knowledge_category(a.category) if a.category else None,
        "content": a.content,
        "summary": a.summary,
        "authorId": str(a.author_id) if a.author_id else None,
        "visibility": _enum(a.visibility),
        "status": _enum(a.status),
        "keywords": a.keywords or [],
        "createdAt": _dt(a.created_at),
        "updatedAt": _dt(a.updated_at),
    }


def to_search_history(h: SearchHistory) -> dict:
    return {
        "id": str(h.id),
        "queryText": h.query_text,
        "searchMode": _enum(h.search_mode),
        "topResultType": h.top_result_type,
        "topResultId": str(h.top_result_id) if h.top_result_id else None,
        "createdAt": _dt(h.created_at),
    }
