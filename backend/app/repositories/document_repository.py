import uuid

from sqlalchemy import select

from app.models.document import Document
from app.repositories.base import BaseRepository


class DocumentRepository(BaseRepository[Document]):
    model = Document

    async def list_for_owner(self, owner_id: uuid.UUID) -> list[Document]:
        result = await self.db.execute(
            select(Document).where(Document.owner_id == owner_id).order_by(Document.created_at.desc())
        )
        return list(result.scalars().all())
