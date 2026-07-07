import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CitationOut(BaseModel):
    kb_document_id: uuid.UUID
    title: str
    page_number: int | None = None
    snippet: str


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    conversation_id: uuid.UUID
    role: str
    content: str
    provider: str | None
    model: str | None
    citations: list[dict] | None
    attachment_ids: list[str] | None
    phi_detected: bool
    was_blocked: bool
    created_at: datetime


class ConversationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    assistant_id: uuid.UUID | None
    title: str
    provider: str
    model: str | None
    is_pinned: bool
    is_archived: bool
    created_at: datetime
    updated_at: datetime


class ConversationWithMessages(ConversationOut):
    messages: list[MessageOut] = []


class ConversationCreate(BaseModel):
    assistant_slug: str | None = None
    provider: str = "auto"
    title: str = "New conversation"


class ConversationUpdate(BaseModel):
    title: str | None = None
    is_pinned: bool | None = None
    is_archived: bool | None = None
    provider: str | None = None


class ConversationShareCreate(BaseModel):
    shared_with_user_ids: list[uuid.UUID]


class ChatRequest(BaseModel):
    conversation_id: uuid.UUID | None = None
    assistant_slug: str | None = None
    message: str
    provider: str | None = None
    attachment_ids: list[uuid.UUID] = []
