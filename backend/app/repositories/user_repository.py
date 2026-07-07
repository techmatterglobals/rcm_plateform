import uuid

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.user import Role, User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    model = User

    async def get_with_role(self, user_id: uuid.UUID) -> User | None:
        result = await self.db.execute(
            select(User).options(selectinload(User.role)).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(
            select(User).options(selectinload(User.role)).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def list_all(self) -> list[User]:
        result = await self.db.execute(select(User).options(selectinload(User.role)))
        return list(result.scalars().all())


class RoleRepository(BaseRepository[Role]):
    model = Role

    async def get_with_permissions(self, role_id: uuid.UUID) -> Role | None:
        result = await self.db.execute(
            select(Role).options(selectinload(Role.permissions)).where(Role.id == role_id)
        )
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str) -> Role | None:
        result = await self.db.execute(
            select(Role).options(selectinload(Role.permissions)).where(Role.name == name)
        )
        return result.scalar_one_or_none()

    async def list_all(self) -> list[Role]:
        result = await self.db.execute(select(Role).options(selectinload(Role.permissions)))
        return list(result.scalars().all())
