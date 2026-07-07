import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_admin
from app.db.session import get_db
from app.models.ai_provider import AIProviderConfig
from app.models.assistant import Assistant
from app.models.conversation import Conversation, Message
from app.models.notification import Notification
from app.models.settings import FeatureFlag, SystemSetting
from app.models.user import User
from app.schemas.admin import (
    AdminConversationOut,
    AIProviderConfigOut,
    AIProviderConfigUpdate,
    AnnouncementCreate,
    FeatureFlagOut,
    FeatureFlagUpdate,
    SystemSettingOut,
    SystemSettingUpdate,
)
from app.services.audit import record_audit_event

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/conversations", response_model=list[AdminConversationOut])
async def list_all_conversations(
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[AdminConversationOut]:
    message_count = (
        select(Message.conversation_id, func.count(Message.id).label("message_count"))
        .group_by(Message.conversation_id)
        .subquery()
    )
    stmt = (
        select(
            Conversation,
            User.email,
            User.full_name,
            Assistant.name,
            func.coalesce(message_count.c.message_count, 0),
        )
        .join(User, User.id == Conversation.user_id)
        .outerjoin(Assistant, Assistant.id == Conversation.assistant_id)
        .outerjoin(message_count, message_count.c.conversation_id == Conversation.id)
        .order_by(Conversation.updated_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)

    return [
        AdminConversationOut(
            id=conversation.id,
            title=conversation.title,
            user_id=conversation.user_id,
            user_email=email,
            user_full_name=full_name,
            assistant_name=assistant_name,
            provider=conversation.provider,
            is_archived=conversation.is_archived,
            message_count=count,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
        )
        for conversation, email, full_name, assistant_name, count in result.all()
    ]


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_conversation(
    conversation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> None:
    conversation = await db.get(Conversation, conversation_id)
    if conversation is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")
    await db.delete(conversation)
    await db.commit()
    await record_audit_event(db, admin.id, "admin.conversation.delete", "conversation", str(conversation_id))


def _provider_out(config: AIProviderConfig) -> AIProviderConfigOut:
    return AIProviderConfigOut(
        id=config.id,
        provider=config.provider,
        display_name=config.display_name,
        default_model=config.default_model,
        available_models=config.available_models,
        is_enabled=config.is_enabled,
        is_default=config.is_default,
        priority=config.priority,
        data_retention_days=config.data_retention_days,
        has_api_key=bool(config.api_key_encrypted),
    )


@router.get("/ai-providers", response_model=list[AIProviderConfigOut])
async def list_ai_providers(db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)) -> list[AIProviderConfigOut]:
    result = await db.execute(select(AIProviderConfig).order_by(AIProviderConfig.priority))
    return [_provider_out(c) for c in result.scalars().all()]


@router.patch("/ai-providers/{provider_id}", response_model=AIProviderConfigOut)
async def update_ai_provider(
    provider_id: uuid.UUID,
    payload: AIProviderConfigUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> AIProviderConfigOut:
    from app.core.security import encrypt_secret

    config = await db.get(AIProviderConfig, provider_id)
    if config is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "AI provider config not found")

    data = payload.model_dump(exclude_unset=True)
    api_key = data.pop("api_key", None)
    if api_key:
        # Encrypted at rest (Fernet/AES). The raw value is never returned by the API —
        # callers only ever see `has_api_key: bool`.
        config.api_key_encrypted = encrypt_secret(api_key)

    for field, value in data.items():
        setattr(config, field, value)

    await db.commit()
    await db.refresh(config)
    await record_audit_event(db, admin.id, "admin.ai_provider.update", "ai_provider_config", str(config.id))
    return _provider_out(config)


@router.get("/feature-flags", response_model=list[FeatureFlagOut])
async def list_feature_flags(db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)) -> list[FeatureFlagOut]:
    result = await db.execute(select(FeatureFlag))
    return [FeatureFlagOut.model_validate(f) for f in result.scalars().all()]


@router.patch("/feature-flags/{flag_id}", response_model=FeatureFlagOut)
async def update_feature_flag(
    flag_id: uuid.UUID, payload: FeatureFlagUpdate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)
) -> FeatureFlagOut:
    flag = await db.get(FeatureFlag, flag_id)
    if flag is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Feature flag not found")
    flag.is_enabled = payload.is_enabled
    await db.commit()
    await db.refresh(flag)
    await record_audit_event(db, admin.id, "admin.feature_flag.update", "feature_flag", str(flag.id))
    return FeatureFlagOut.model_validate(flag)


@router.get("/settings", response_model=list[SystemSettingOut])
async def list_settings(db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)) -> list[SystemSettingOut]:
    result = await db.execute(select(SystemSetting))
    return [SystemSettingOut.model_validate(s) for s in result.scalars().all()]


@router.put("/settings/{key}", response_model=SystemSettingOut)
async def upsert_setting(
    key: str, payload: SystemSettingUpdate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)
) -> SystemSettingOut:
    result = await db.execute(select(SystemSetting).where(SystemSetting.key == key))
    setting = result.scalar_one_or_none()
    if setting is None:
        setting = SystemSetting(key=key, value=payload.value, updated_by=admin.id)
        db.add(setting)
    else:
        setting.value = payload.value
        setting.updated_by = admin.id

    await db.commit()
    await db.refresh(setting)
    await record_audit_event(db, admin.id, "admin.setting.update", "system_setting", key, extra=payload.value)
    return SystemSettingOut.model_validate(setting)


@router.post("/announcements", status_code=status.HTTP_201_CREATED)
async def create_announcement(
    payload: AnnouncementCreate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)
) -> dict:
    notification = Notification(
        user_id=None, type="admin_announcement", title=payload.title, body=payload.body, link=payload.link
    )
    db.add(notification)
    await db.commit()
    await record_audit_event(db, admin.id, "admin.announcement.create", "notification", str(notification.id))
    return {"status": "sent"}
