import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.enums import RoleName
from app.models.prompt import PromptTemplate
from app.models.user import User
from app.repositories.prompt_repository import PromptRepository
from app.schemas.prompt import PromptTemplateCreate, PromptTemplateOut, PromptTemplateUpdate

router = APIRouter(prefix="/prompts", tags=["prompts"])


@router.get("", response_model=list[PromptTemplateOut])
async def list_prompts(
    category: str | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[PromptTemplateOut]:
    prompts = await PromptRepository(db).list_all(category=category, search=search)
    return [PromptTemplateOut.model_validate(p) for p in prompts]


@router.post("", response_model=PromptTemplateOut, status_code=status.HTTP_201_CREATED)
async def create_prompt(
    payload: PromptTemplateCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
) -> PromptTemplateOut:
    prompt = PromptTemplate(**payload.model_dump(), created_by=current_user.id)
    db.add(prompt)
    await db.commit()
    await db.refresh(prompt)
    return PromptTemplateOut.model_validate(prompt)


@router.patch("/{prompt_id}", response_model=PromptTemplateOut)
async def update_prompt(
    prompt_id: uuid.UUID,
    payload: PromptTemplateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PromptTemplateOut:
    repo = PromptRepository(db)
    prompt = await repo.get(prompt_id)
    if prompt is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Prompt not found")
    if prompt.created_by != current_user.id and not current_user.is_role(RoleName.ADMIN):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You can only edit prompts you created")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(prompt, field, value)
    await repo.commit()
    await repo.refresh(prompt)
    return PromptTemplateOut.model_validate(prompt)


@router.delete("/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prompt(
    prompt_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
) -> None:
    repo = PromptRepository(db)
    prompt = await repo.get(prompt_id)
    if prompt is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Prompt not found")
    if prompt.created_by != current_user.id and not current_user.is_role(RoleName.ADMIN):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You can only delete prompts you created")
    await repo.delete(prompt)
    await repo.commit()


@router.post("/{prompt_id}/launch", response_model=PromptTemplateOut)
async def launch_prompt(
    prompt_id: uuid.UUID, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)
) -> PromptTemplateOut:
    repo = PromptRepository(db)
    prompt = await repo.get(prompt_id)
    if prompt is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Prompt not found")
    prompt.usage_count += 1
    await repo.commit()
    await repo.refresh(prompt)
    return PromptTemplateOut.model_validate(prompt)
