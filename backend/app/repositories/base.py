import uuid
from typing import Generic, TypeVar

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    model: type[ModelType]

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get(self, id_: uuid.UUID) -> ModelType | None:
        return await self.db.get(self.model, id_)

    async def list(self, limit: int = 50, offset: int = 0) -> list[ModelType]:
        result = await self.db.execute(select(self.model).limit(limit).offset(offset))
        return list(result.scalars().all())

    def add(self, instance: ModelType) -> ModelType:
        self.db.add(instance)
        return instance

    async def delete(self, instance: ModelType) -> None:
        await self.db.delete(instance)

    async def commit(self) -> None:
        await self.db.commit()

    async def refresh(self, instance: ModelType) -> None:
        await self.db.refresh(instance)
