from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_supervisor_or_admin
from app.db.session import get_db
from app.models.user import User
from app.repositories.audit_repository import AuditRepository
from app.schemas.audit import AuditLogOut

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])


@router.get("", response_model=list[AuditLogOut])
async def list_audit_logs(
    action: str | None = None,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_supervisor_or_admin),
) -> list[AuditLogOut]:
    logs = await AuditRepository(db).list_recent(limit=limit, action=action)
    return [AuditLogOut.model_validate(l) for l in logs]
