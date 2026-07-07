import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class KBDocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    category: str
    mime_type: str
    size_bytes: int
    status: str
    version: int
    chunk_count: int
    error_message: str | None
    created_at: datetime
    updated_at: datetime


class KBSearchResult(BaseModel):
    kb_document_id: uuid.UUID
    title: str
    category: str
    page_number: int | None
    snippet: str
    score: float


class KBSearchRequest(BaseModel):
    query: str
    category: str | None = None
    top_k: int = 6
