import uuid

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog


async def record_audit_event(
    db: AsyncSession,
    actor_id: uuid.UUID | None,
    action: str,
    resource_type: str,
    resource_id: str | None = None,
    extra: dict | None = None,
    request: Request | None = None,
) -> None:
    """Write a single immutable audit trail row. Called from endpoints on every sensitive action:
    logins, admin changes, PHI-gated prompts, document access, conversation sharing, exports.
    """
    db.add(
        AuditLog(
            actor_id=actor_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            extra=extra or {},
            ip_address=request.client.host if request and request.client else None,
            user_agent=request.headers.get("user-agent") if request else None,
        )
    )
    await db.commit()
