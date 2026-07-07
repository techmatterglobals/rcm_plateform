import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PromptTemplateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    description: str
    category: str
    content: str
    created_by: uuid.UUID | None
    is_shared: bool
    usage_count: int
    created_at: datetime
    updated_at: datetime


class PromptTemplateCreate(BaseModel):
    title: str
    description: str = ""
    category: str = "general"
    content: str
    is_shared: bool = True


class PromptTemplateUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    content: str | None = None
    is_shared: bool | None = None
