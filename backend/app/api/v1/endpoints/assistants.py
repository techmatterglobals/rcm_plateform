import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, require_admin
from app.db.session import get_db
from app.models.assistant import Assistant
from app.models.user import User
from app.schemas.assistant import AssistantCreate, AssistantOut, AssistantUpdate

router = APIRouter(prefix="/assistants", tags=["assistants"])


@router.get("", response_model=list[AssistantOut])
async def list_assistants(
    db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)
) -> list[AssistantOut]:
    result = await db.execute(
        select(Assistant).where(Assistant.is_active.is_(True)).order_by(Assistant.sort_order)
    )
    return [AssistantOut.model_validate(a) for a in result.scalars().all()]


@router.get("/{slug}", response_model=AssistantOut)
async def get_assistant(
    slug: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)
) -> AssistantOut:
    result = await db.execute(select(Assistant).where(Assistant.slug == slug))
    assistant = result.scalar_one_or_none()
    if assistant is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Assistant not found")
    return AssistantOut.model_validate(assistant)


@router.post("", response_model=AssistantOut, status_code=status.HTTP_201_CREATED)
async def create_assistant(
    payload: AssistantCreate, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)
) -> AssistantOut:
    assistant = Assistant(**payload.model_dump())
    db.add(assistant)
    await db.commit()
    await db.refresh(assistant)
    return AssistantOut.model_validate(assistant)


@router.patch("/{assistant_id}", response_model=AssistantOut)
async def update_assistant(
    assistant_id: uuid.UUID,
    payload: AssistantUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> AssistantOut:
    assistant = await db.get(Assistant, assistant_id)
    if assistant is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Assistant not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(assistant, field, value)
    await db.commit()
    await db.refresh(assistant)
    return AssistantOut.model_validate(assistant)
