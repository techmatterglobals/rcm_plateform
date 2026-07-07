import uuid

from pydantic import BaseModel, ConfigDict


class AssistantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    slug: str
    name: str
    description: str
    category: str
    icon: str
    capabilities: list[str]
    suggested_prompts: list[str]
    requires_kb: bool
    supports_file_upload: bool
    supports_confidence_score: bool
    is_active: bool
    sort_order: int


class AssistantCreate(BaseModel):
    slug: str
    name: str
    description: str = ""
    category: str = "general"
    icon: str = "sparkles"
    system_prompt: str
    capabilities: list[str] = []
    suggested_prompts: list[str] = []
    requires_kb: bool = False
    supports_file_upload: bool = True
    supports_confidence_score: bool = False
    sort_order: int = 0


class AssistantUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    icon: str | None = None
    system_prompt: str | None = None
    capabilities: list[str] | None = None
    suggested_prompts: list[str] | None = None
    is_active: bool | None = None
    sort_order: int | None = None
