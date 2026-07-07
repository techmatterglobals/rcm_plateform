import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AIProviderConfigOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    provider: str
    display_name: str
    default_model: str
    available_models: list[str]
    is_enabled: bool
    is_default: bool
    priority: int
    data_retention_days: int
    has_api_key: bool = False


class AIProviderConfigUpdate(BaseModel):
    display_name: str | None = None
    api_key: str | None = None
    default_model: str | None = None
    available_models: list[str] | None = None
    is_enabled: bool | None = None
    is_default: bool | None = None
    priority: int | None = None
    data_retention_days: int | None = None


class FeatureFlagOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    key: str
    name: str
    description: str
    is_enabled: bool


class FeatureFlagUpdate(BaseModel):
    is_enabled: bool


class SystemSettingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    key: str
    value: dict
    description: str


class SystemSettingUpdate(BaseModel):
    value: dict


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    type: str
    title: str
    body: str
    link: str | None
    is_read: bool


class AnnouncementCreate(BaseModel):
    title: str
    body: str
    link: str | None = None


class AdminConversationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    user_id: uuid.UUID
    user_email: str
    user_full_name: str
    assistant_name: str | None
    provider: str
    is_archived: bool
    message_count: int
    created_at: datetime
    updated_at: datetime


class SearchResultItem(BaseModel):
    type: str
    id: str
    title: str
    snippet: str
    url: str


class SearchResults(BaseModel):
    conversations: list[SearchResultItem] = []
    knowledge_base: list[SearchResultItem] = []
    prompts: list[SearchResultItem] = []
    documents: list[SearchResultItem] = []
    users: list[SearchResultItem] = []
