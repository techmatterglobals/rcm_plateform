from dataclasses import dataclass
from urllib.parse import urlencode

import httpx

from app.core.config import settings

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"


@dataclass
class SsoProfile:
    subject: str
    email: str
    full_name: str
    avatar_url: str | None


def google_authorize_url(redirect_uri: str, state: str) -> str:
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "hd": "*",  # restrict to Google Workspace accounts (any hosted domain)
        "access_type": "online",
        "prompt": "select_account",
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


async def google_exchange_code(code: str, redirect_uri: str) -> SsoProfile:
    async with httpx.AsyncClient(timeout=10) as client:
        token_resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "code": code,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        token_resp.raise_for_status()
        access_token = token_resp.json()["access_token"]

        userinfo_resp = await client.get(
            GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"}
        )
        userinfo_resp.raise_for_status()
        info = userinfo_resp.json()

    return SsoProfile(
        subject=info["sub"],
        email=info["email"],
        full_name=info.get("name", info["email"]),
        avatar_url=info.get("picture"),
    )


def azure_authority() -> str:
    return f"https://login.microsoftonline.com/{settings.AZURE_AD_TENANT_ID}/oauth2/v2.0"


def azure_authorize_url(redirect_uri: str, state: str) -> str:
    params = {
        "client_id": settings.AZURE_AD_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "response_mode": "query",
        "scope": "openid email profile User.Read",
        "state": state,
    }
    return f"{azure_authority()}/authorize?{urlencode(params)}"


async def azure_exchange_code(code: str, redirect_uri: str) -> SsoProfile:
    async with httpx.AsyncClient(timeout=10) as client:
        token_resp = await client.post(
            f"{azure_authority()}/token",
            data={
                "client_id": settings.AZURE_AD_CLIENT_ID,
                "client_secret": settings.AZURE_AD_CLIENT_SECRET,
                "code": code,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
                "scope": "openid email profile User.Read",
            },
        )
        token_resp.raise_for_status()
        access_token = token_resp.json()["access_token"]

        graph_resp = await client.get(
            "https://graph.microsoft.com/v1.0/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        graph_resp.raise_for_status()
        info = graph_resp.json()

    return SsoProfile(
        subject=info["id"],
        email=info.get("mail") or info.get("userPrincipalName"),
        full_name=info.get("displayName", info.get("userPrincipalName", "")),
        avatar_url=None,
    )
