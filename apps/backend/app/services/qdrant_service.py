import uuid
from typing import Any

import structlog
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

from app.core.config import get_settings
from app.models.knowledge import COLLECTIONS

logger = structlog.get_logger()

VECTOR_SIZE = 1536  # text-embedding-3-small


class QdrantService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._client: QdrantClient | None = None

    @property
    def configured(self) -> bool:
        return self.settings.qdrant_configured and self.settings.openai_configured

    @property
    def client(self) -> QdrantClient:
        if not self.settings.qdrant_configured:
            raise RuntimeError("Qdrant is not configured")
        if self._client is None:
            self._client = QdrantClient(
                url=self.settings.qdrant_url,
                api_key=self.settings.qdrant_api_key or None,
            )
        return self._client

    def ensure_collections(self) -> None:
        if not self.configured:
            return
        for name in COLLECTIONS.values():
            self._ensure_collection(name)

    def _ensure_collection(self, name: str) -> None:
        try:
            self.client.get_collection(name)
        except Exception:
            self.client.create_collection(
                collection_name=name,
                vectors_config=qmodels.VectorParams(
                    size=VECTOR_SIZE,
                    distance=qmodels.Distance.COSINE,
                ),
            )
            logger.info("qdrant_collection_created", collection=name)

    def upsert(
        self,
        collection: str,
        point_id: str,
        vector: list[float],
        payload: dict[str, Any],
    ) -> None:
        self._ensure_collection(collection)
        self.client.upsert(
            collection_name=collection,
            points=[
                qmodels.PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=payload,
                )
            ],
        )

    def search(
        self,
        collection: str,
        vector: list[float],
        limit: int = 10,
        filters: qmodels.Filter | None = None,
    ) -> list[qmodels.ScoredPoint]:
        self._ensure_collection(collection)
        return self.client.search(
            collection_name=collection,
            query_vector=vector,
            limit=limit,
            query_filter=filters,
        )

    def search_multi(
        self,
        collections: list[str],
        vector: list[float],
        limit_per_collection: int = 5,
    ) -> list[tuple[str, qmodels.ScoredPoint]]:
        results: list[tuple[str, qmodels.ScoredPoint]] = []
        for coll in collections:
            try:
                hits = self.search(coll, vector, limit_per_collection)
                for hit in hits:
                    results.append((coll, hit))
            except Exception as exc:
                logger.warning("qdrant_search_failed", collection=coll, error=str(exc))
        return results

    def delete_point(self, collection: str, point_id: str) -> None:
        try:
            self.client.delete(
                collection_name=collection,
                points_selector=qmodels.PointIdsList(points=[point_id]),
            )
        except Exception:
            pass

    @staticmethod
    def new_point_id() -> str:
        return str(uuid.uuid4())
