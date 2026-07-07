import structlog
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.middleware import RateLimitMiddleware, SecurityHeadersMiddleware
from app.services.ai.base import AIProviderError

logger = structlog.get_logger()

app = FastAPI(
    title=settings.APP_NAME,
    description="Internal AI assistant platform for medical billing and revenue cycle management.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.exception_handler(AIProviderError)
async def ai_provider_error_handler(request: Request, exc: AIProviderError) -> JSONResponse:
    logger.error("ai_provider_error", error=str(exc), path=request.url.path)
    return JSONResponse(status_code=status.HTTP_502_BAD_GATEWAY, content={"detail": str(exc)})


@app.get("/health", tags=["health"])
async def health_check() -> dict:
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV}
