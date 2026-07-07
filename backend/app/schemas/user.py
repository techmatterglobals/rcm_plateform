import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict


class RoleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    description: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    email: EmailStr
    full_name: str
    avatar_url: str | None
    department: str | None
    title: str | None
    role: RoleOut
    is_active: bool
    last_login_at: datetime | None
    created_at: datetime


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str | None = None
    role_id: uuid.UUID
    department: str | None = None
    title: str | None = None


class UserUpdate(BaseModel):
    full_name: str | None = None
    role_id: uuid.UUID | None = None
    department: str | None = None
    title: str | None = None
    is_active: bool | None = None


class PermissionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    code: str
    description: str


class RoleDetailOut(RoleOut):
    permissions: list[PermissionOut] = []


class RoleCreate(BaseModel):
    name: str
    description: str = ""
    permission_ids: list[uuid.UUID] = []


class RoleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    permission_ids: list[uuid.UUID] | None = None
