import secrets
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import get_current_user
from app.core.security import TokenType, create_token, decode_token, verify_password
from app.db.session import get_db
from app.models.enums import RoleName, SsoProvider
from app.models.user import User
from app.repositories.user_repository import RoleRepository, UserRepository
from app.schemas.auth import LoginRequest, LoginResponse, RefreshRequest, SsoCallbackRequest, TokenPair
from app.schemas.user import UserOut
from app.services.audit import record_audit_event
from app.services.sso import azure_authorize_url, azure_exchange_code, google_authorize_url, google_exchange_code

router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_MAX_AGE = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60


def _issue_tokens(response: Response, user: User) -> TokenPair:
    access_token = create_token(user.id, TokenType.ACCESS)
    refresh_token = create_token(user.id, TokenType.REFRESH)
    response.set_cookie(
        "access_token",
        access_token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        secure=settings.APP_ENV == "production",
        samesite="lax",
    )
    return TokenPair(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=LoginResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> LoginResponse:
    users = UserRepository(db)
    user = await users.get_by_email(payload.email)

    if user is None or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is deactivated")

    user.last_login_at = datetime.utcnow()
    await db.commit()

    tokens = _issue_tokens(response, user)
    await record_audit_event(db, user.id, "auth.login", "user", str(user.id), request=request)

    return LoginResponse(**tokens.model_dump(), user=UserOut.model_validate(user))


@router.post("/refresh", response_model=TokenPair)
async def refresh(payload: RefreshRequest, response: Response, db: AsyncSession = Depends(get_db)) -> TokenPair:
    try:
        decoded = decode_token(payload.refresh_token)
    except ValueError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token") from exc

    if decoded.get("type") != TokenType.REFRESH.value:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token type")

    user = await UserRepository(db).get(uuid.UUID(decoded["sub"]))
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found or inactive")

    return _issue_tokens(response, user)


@router.post("/logout")
async def logout(response: Response, current_user: User = Depends(get_current_user)) -> dict:
    response.delete_cookie("access_token")
    return {"status": "ok"}


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(current_user)


async def _upsert_sso_user(
    db: AsyncSession, provider: SsoProvider, subject: str, email: str, full_name: str, avatar_url: str | None
) -> User:
    users = UserRepository(db)
    user = await users.get_by_email(email)

    if user is None:
        default_role = await RoleRepository(db).get_by_name(RoleName.EMPLOYEE.value)
        if default_role is None:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Default role not seeded")
        user = User(
            email=email,
            full_name=full_name,
            avatar_url=avatar_url,
            role_id=default_role.id,
            sso_provider=provider.value,
            sso_subject=subject,
        )
        db.add(user)
    else:
        user.sso_provider = provider.value
        user.sso_subject = subject
        user.full_name = full_name or user.full_name
        user.avatar_url = avatar_url or user.avatar_url

    user.last_login_at = datetime.utcnow()
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/sso/google/login")
async def google_login(redirect_uri: str) -> dict:
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Google SSO is not configured")
    state = secrets.token_urlsafe(24)
    return {"authorize_url": google_authorize_url(redirect_uri, state), "state": state}


@router.post("/sso/google/callback", response_model=LoginResponse)
async def google_callback(
    payload: SsoCallbackRequest, response: Response, db: AsyncSession = Depends(get_db)
) -> LoginResponse:
    profile = await google_exchange_code(payload.code, payload.redirect_uri)
    user = await _upsert_sso_user(
        db, SsoProvider.GOOGLE, profile.subject, profile.email, profile.full_name, profile.avatar_url
    )
    tokens = _issue_tokens(response, user)
    await record_audit_event(db, user.id, "auth.login.google", "user", str(user.id))
    return LoginResponse(**tokens.model_dump(), user=UserOut.model_validate(user))


@router.get("/sso/microsoft/login")
async def microsoft_login(redirect_uri: str) -> dict:
    if not settings.AZURE_AD_CLIENT_ID:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Microsoft Entra ID SSO is not configured")
    state = secrets.token_urlsafe(24)
    return {"authorize_url": azure_authorize_url(redirect_uri, state), "state": state}


@router.post("/sso/microsoft/callback", response_model=LoginResponse)
async def microsoft_callback(
    payload: SsoCallbackRequest, response: Response, db: AsyncSession = Depends(get_db)
) -> LoginResponse:
    profile = await azure_exchange_code(payload.code, payload.redirect_uri)
    user = await _upsert_sso_user(
        db, SsoProvider.MICROSOFT, profile.subject, profile.email, profile.full_name, profile.avatar_url
    )
    tokens = _issue_tokens(response, user)
    await record_audit_event(db, user.id, "auth.login.microsoft", "user", str(user.id))
    return LoginResponse(**tokens.model_dump(), user=UserOut.model_validate(user))
