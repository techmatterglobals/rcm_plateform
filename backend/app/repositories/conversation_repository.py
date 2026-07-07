import uuid

from sqlalchemy import or_, select
from sqlalchemy.orm import selectinload

from app.models.conversation import Conversation, ConversationShare, Message
from app.repositories.base import BaseRepository


class ConversationRepository(BaseRepository[Conversation]):
    model = Conversation

    async def get_with_messages(self, conversation_id: uuid.UUID) -> Conversation | None:
        result = await self.db.execute(
            select(Conversation)
            .options(selectinload(Conversation.messages))
            .where(Conversation.id == conversation_id)
        )
        return result.scalar_one_or_none()

    async def list_for_user(
        self, user_id: uuid.UUID, search: str | None = None, pinned_only: bool = False
    ) -> list[Conversation]:
        stmt = select(Conversation).where(
            or_(
                Conversation.user_id == user_id,
                Conversation.id.in_(
                    select(ConversationShare.conversation_id).where(
                        ConversationShare.shared_with_user_id == user_id
                    )
                ),
            )
        )
        if search:
            stmt = stmt.where(Conversation.title.ilike(f"%{search}%"))
        if pinned_only:
            stmt = stmt.where(Conversation.is_pinned.is_(True))
        stmt = stmt.order_by(Conversation.is_pinned.desc(), Conversation.updated_at.desc())

        result = await self.db.execute(stmt)
        return list(result.scalars().unique().all())

    async def add_message(self, message: Message) -> Message:
        self.db.add(message)
        return message
