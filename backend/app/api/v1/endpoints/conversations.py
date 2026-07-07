import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.assistant import Assistant
from app.models.conversation import ConversationShare
from app.models.user import User
from app.repositories.conversation_repository import ConversationRepository
from app.schemas.conversation import (
    ConversationCreate,
    ConversationOut,
    ConversationShareCreate,
    ConversationUpdate,
    ConversationWithMessages,
)
from app.services.audit import record_audit_event

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.get("", response_model=list[ConversationOut])
async def list_conversations(
    search: str | None = None,
    pinned: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ConversationOut]:
    repo = ConversationRepository(db)
    conversations = await repo.list_for_user(current_user.id, search=search, pinned_only=pinned)
    return [ConversationOut.model_validate(c) for c in conversations]


@router.post("", response_model=ConversationOut, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    payload: ConversationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ConversationOut:
    from app.models.conversation import Conversation

    assistant_id = None
    title = payload.title
    if payload.assistant_slug:
        result = await db.execute(select(Assistant).where(Assistant.slug == payload.assistant_slug))
        assistant = result.scalar_one_or_none()
        if assistant is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Assistant not found")
        assistant_id = assistant.id
        if title == "New conversation":
            title = f"New {assistant.name} chat"

    conversation = Conversation(
        user_id=current_user.id, assistant_id=assistant_id, provider=payload.provider, title=title
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    return ConversationOut.model_validate(conversation)


@router.get("/{conversation_id}", response_model=ConversationWithMessages)
async def get_conversation(
    conversation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ConversationWithMessages:
    repo = ConversationRepository(db)
    conversation = await repo.get_with_messages(conversation_id)
    if conversation is None or not await _can_access(db, conversation, current_user):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")
    return ConversationWithMessages.model_validate(conversation)


@router.patch("/{conversation_id}", response_model=ConversationOut)
async def update_conversation(
    conversation_id: uuid.UUID,
    payload: ConversationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ConversationOut:
    repo = ConversationRepository(db)
    conversation = await repo.get(conversation_id)
    if conversation is None or conversation.user_id != current_user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(conversation, field, value)

    await repo.commit()
    await repo.refresh(conversation)
    return ConversationOut.model_validate(conversation)


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    repo = ConversationRepository(db)
    conversation = await repo.get(conversation_id)
    if conversation is None or conversation.user_id != current_user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")

    await repo.delete(conversation)
    await repo.commit()
    await record_audit_event(
        db, current_user.id, "conversation.delete", "conversation", str(conversation_id), request=request
    )


@router.post("/{conversation_id}/share", status_code=status.HTTP_204_NO_CONTENT)
async def share_conversation(
    conversation_id: uuid.UUID,
    payload: ConversationShareCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    repo = ConversationRepository(db)
    conversation = await repo.get(conversation_id)
    if conversation is None or conversation.user_id != current_user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")

    for user_id in payload.shared_with_user_ids:
        db.add(
            ConversationShare(
                conversation_id=conversation_id, shared_with_user_id=user_id, shared_by_user_id=current_user.id
            )
        )
    await db.commit()


@router.get("/{conversation_id}/export")
async def export_conversation(
    conversation_id: uuid.UUID,
    format: str = "markdown",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    repo = ConversationRepository(db)
    conversation = await repo.get_with_messages(conversation_id)
    if conversation is None or not await _can_access(db, conversation, current_user):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")

    if format == "markdown":
        lines = [f"# {conversation.title}", ""]
        for m in conversation.messages:
            speaker = "**You**" if m.role == "user" else "**Assistant**"
            lines.append(f"{speaker}: {m.content}\n")
        content = "\n".join(lines)
    else:
        content = "\n\n".join(f"{m.role}: {m.content}" for m in conversation.messages)

    return {"filename": f"{conversation.title}.{('md' if format == 'markdown' else 'txt')}", "content": content}


async def _can_access(db: AsyncSession, conversation, user: User) -> bool:
    if conversation.user_id == user.id:
        return True
    result = await db.execute(
        select(ConversationShare).where(
            ConversationShare.conversation_id == conversation.id,
            ConversationShare.shared_with_user_id == user.id,
        )
    )
    return result.scalar_one_or_none() is not None
