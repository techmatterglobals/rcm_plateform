from sqlalchemy import select

from app.models.audit import AuditLog
from app.repositories.base import BaseRepository


class AuditRepository(BaseRepository[AuditLog]):
    model = AuditLog

    async def list_recent(self, limit: int = 100, action: str | None = None) -> list[AuditLog]:
        stmt = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
        if action:
            stmt = stmt.where(AuditLog.action == action)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
