import asyncio
from datetime import datetime, timedelta

from sqlalchemy import delete, select

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.audit import AuditLog
from app.models.conversation import Conversation
from app.models.settings import SystemSetting
from app.tasks.celery_app import celery_app

RETENTION_SETTING_KEY = "conversation_retention_days"


@celery_app.task(name="app.tasks.retention_tasks.apply_retention_policies")
def apply_retention_policies() -> None:
    asyncio.run(_apply_retention_policies())


async def _apply_retention_policies() -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(SystemSetting).where(SystemSetting.key == RETENTION_SETTING_KEY))
        setting = result.scalar_one_or_none()
        retention_days = (
            setting.value.get("days", settings.CONVERSATION_RETENTION_DAYS_DEFAULT)
            if setting
            else settings.CONVERSATION_RETENTION_DAYS_DEFAULT
        )

        if retention_days > 0:
            cutoff = datetime.utcnow() - timedelta(days=retention_days)
            await db.execute(
                delete(Conversation).where(
                    Conversation.updated_at < cutoff, Conversation.is_pinned.is_(False)
                )
            )

        audit_cutoff = datetime.utcnow() - timedelta(days=settings.AUDIT_LOG_RETENTION_DAYS)
        await db.execute(delete(AuditLog).where(AuditLog.created_at < audit_cutoff))

        await db.commit()
