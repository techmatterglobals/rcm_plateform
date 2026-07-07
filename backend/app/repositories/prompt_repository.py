from sqlalchemy import select

from app.models.prompt import PromptTemplate
from app.repositories.base import BaseRepository


class PromptRepository(BaseRepository[PromptTemplate]):
    model = PromptTemplate

    async def list_all(self, category: str | None = None, search: str | None = None) -> list[PromptTemplate]:
        stmt = select(PromptTemplate).order_by(PromptTemplate.usage_count.desc())
        if category:
            stmt = stmt.where(PromptTemplate.category == category)
        if search:
            stmt = stmt.where(PromptTemplate.title.ilike(f"%{search}%"))
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
