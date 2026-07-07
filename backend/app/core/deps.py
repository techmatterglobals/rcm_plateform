import uuid

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import TokenType, decode_token
from app.db.session import get_db
from app.models.enums import RoleName
from app.models.user import Role, User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_user(
    request: Request,
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not token:
        # allow cookie-based auth as a fallback for browser sessions
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")

    try:
        payload = decode_token(token)
    except ValueError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token") from exc

    if payload.get("type") != TokenType.ACCESS.value:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token type")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token payload")

    result = await db.execute(
        select(User)
        .options(selectinload(User.role).selectinload(Role.permissions))
        .where(User.id == uuid.UUID(user_id))
    )
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found or inactive")

    return user


def require_roles(*allowed_roles: RoleName):
    async def checker(current_user: User = Depends(get_current_user)) -> User:
        if not any(current_user.is_role(r) for r in allowed_roles):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient role for this action")
        return current_user

    return checker


def require_permission(code: str):
    async def checker(current_user: User = Depends(get_current_user)) -> User:
        if not current_user.has_permission(code):
            raise HTTPException(status.HTTP_403_FORBIDDEN, f"Missing permission: {code}")
        return current_user

    return checker


require_admin = require_roles(RoleName.ADMIN)
require_supervisor_or_admin = require_roles(RoleName.ADMIN, RoleName.SUPERVISOR)
