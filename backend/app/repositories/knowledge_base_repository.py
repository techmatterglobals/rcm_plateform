from sqlalchemy import select

from app.models.knowledge_base import KnowledgeBaseDocument
from app.repositories.base import BaseRepository


class KnowledgeBaseRepository(BaseRepository[KnowledgeBaseDocument]):
    model = KnowledgeBaseDocument

    async def list_all(self, category: str | None = None) -> list[KnowledgeBaseDocument]:
        stmt = select(KnowledgeBaseDocument).order_by(KnowledgeBaseDocument.created_at.desc())
        if category:
            stmt = stmt.where(KnowledgeBaseDocument.category == category)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
