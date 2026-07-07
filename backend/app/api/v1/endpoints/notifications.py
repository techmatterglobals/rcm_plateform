import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.admin import NotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
async def list_notifications(
    unread_only: bool = False, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
) -> list[NotificationOut]:
    stmt = select(Notification).where(
        or_(Notification.user_id == current_user.id, Notification.user_id.is_(None))
    )
    if unread_only:
        stmt = stmt.where(Notification.is_read.is_(False))
    stmt = stmt.order_by(Notification.created_at.desc()).limit(50)
    result = await db.execute(stmt)
    return [NotificationOut.model_validate(n) for n in result.scalars().all()]


@router.post("/{notification_id}/read", response_model=NotificationOut)
async def mark_notification_read(
    notification_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
) -> NotificationOut:
    notification = await db.get(Notification, notification_id)
    if notification is None or (
        notification.user_id is not None and notification.user_id != current_user.id
    ):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification not found")
    notification.is_read = True
    await db.commit()
    await db.refresh(notification)
    return NotificationOut.model_validate(notification)
