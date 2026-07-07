import time

import redis.asyncio as redis
from fastapi import Request, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.core.config import settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adds baseline security headers, including a Content-Security-Policy, to every response."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; frame-ancestors 'none'; base-uri 'self'"
        )
        if settings.APP_ENV == "production":
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Fixed-window per-IP rate limiter backed by Redis, shared across all app instances."""

    def __init__(self, app, limit_per_minute: int | None = None) -> None:
        super().__init__(app)
        self.limit = limit_per_minute or settings.RATE_LIMIT_PER_MINUTE
        self._redis = redis.from_url(settings.REDIS_URL, decode_responses=True)

    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/health"):
            return await call_next(request)

        window = int(time.time() // 60)
        client_ip = request.client.host if request.client else "unknown"
        key = f"ratelimit:{client_ip}:{window}"

        try:
            count = await self._redis.incr(key)
            if count == 1:
                await self._redis.expire(key, 60)
        except Exception:
            # Redis unavailable: fail open rather than blocking all traffic
            return await call_next(request)

        if count > self.limit:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Rate limit exceeded. Please slow down."},
            )

        return await call_next(request)
