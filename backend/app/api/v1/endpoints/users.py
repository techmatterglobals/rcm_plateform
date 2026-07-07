import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, require_admin
from app.core.security import hash_password
from app.db.session import get_db
from app.models.user import Permission, Role, User
from app.repositories.user_repository import RoleRepository, UserRepository
from app.schemas.user import (
    PermissionOut,
    RoleCreate,
    RoleDetailOut,
    RoleUpdate,
    UserCreate,
    UserOut,
    UserUpdate,
)
from app.services.audit import record_audit_event

router = APIRouter(tags=["users"])


@router.get("/permissions", response_model=list[PermissionOut])
async def list_permissions(
    db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)
) -> list[PermissionOut]:
    result = await db.execute(select(Permission).order_by(Permission.code))
    return [PermissionOut.model_validate(p) for p in result.scalars().all()]


@router.get("/users", response_model=list[UserOut])
async def list_users(
    db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)
) -> list[UserOut]:
    return [UserOut.model_validate(u) for u in await UserRepository(db).list_all()]


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> UserOut:
    users = UserRepository(db)
    if await users.get_by_email(payload.email):
        raise HTTPException(status.HTTP_409_CONFLICT, "A user with this email already exists")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        role_id=payload.role_id,
        department=payload.department,
        title=payload.title,
        hashed_password=hash_password(payload.password) if payload.password else None,
    )
    users.add(user)
    await users.commit()
    await record_audit_event(db, admin.id, "user.create", "user", str(user.id), request=request)
    user = await users.get_with_role(user.id)
    return UserOut.model_validate(user)


@router.patch("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: uuid.UUID,
    payload: UserUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> UserOut:
    users = UserRepository(db)
    user = await users.get(user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)

    await users.commit()
    await record_audit_event(db, admin.id, "user.update", "user", str(user.id), request=request)
    user = await users.get_with_role(user.id)
    return UserOut.model_validate(user)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_user(
    user_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> None:
    users = UserRepository(db)
    user = await users.get(user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    user.is_active = False
    await users.commit()
    await record_audit_event(db, admin.id, "user.deactivate", "user", str(user.id), request=request)


@router.get("/roles", response_model=list[RoleDetailOut])
async def list_roles(db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)) -> list[RoleDetailOut]:
    return [RoleDetailOut.model_validate(r) for r in await RoleRepository(db).list_all()]


@router.post("/roles", response_model=RoleDetailOut, status_code=status.HTTP_201_CREATED)
async def create_role(
    payload: RoleCreate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)
) -> RoleDetailOut:
    permissions = [p for pid in payload.permission_ids if (p := await db.get(Permission, pid))]

    role = Role(name=payload.name, description=payload.description, permissions=permissions)
    db.add(role)
    await db.commit()
    await record_audit_event(db, admin.id, "role.create", "role", str(role.id))
    role = await RoleRepository(db).get_with_permissions(role.id)
    return RoleDetailOut.model_validate(role)


@router.patch("/roles/{role_id}", response_model=RoleDetailOut)
async def update_role(
    role_id: uuid.UUID,
    payload: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> RoleDetailOut:
    roles = RoleRepository(db)
    role = await roles.get(role_id)
    if role is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Role not found")
    if role.is_system:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "System roles cannot be modified")

    data = payload.model_dump(exclude_unset=True)
    if "permission_ids" in data:
        permission_ids = data.pop("permission_ids")
        role.permissions = [p for pid in permission_ids if (p := await db.get(Permission, pid))]
    for field, value in data.items():
        setattr(role, field, value)

    await roles.commit()
    await record_audit_event(db, admin.id, "role.update", "role", str(role.id))
    role = await roles.get_with_permissions(role.id)
    return RoleDetailOut.model_validate(role)
