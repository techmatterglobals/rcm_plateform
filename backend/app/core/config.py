from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    APP_NAME: str = "RCM AI Platform"
    APP_ENV: Literal["development", "staging", "production"] = "development"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False
    FRONTEND_URL: str = "http://localhost:3000"

    # Security
    JWT_SECRET_KEY: str = Field(..., description="Secret used to sign access/refresh tokens")
    JWT_ALGORITHM: str = "HS256"
    ENCRYPTION_KEY: str = Field(
        ..., description="Fernet key (32 url-safe base64 bytes) used to encrypt secrets at rest, e.g. provider API keys"
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    SESSION_IDLE_TIMEOUT_MINUTES: int = 30

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://rcm:rcm@localhost:5432/rcm_ai_platform"
    )
    DATABASE_URL_SYNC: str = Field(
        default="postgresql+psycopg2://rcm:rcm@localhost:5432/rcm_ai_platform"
    )

    # Redis / Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Object storage (S3-compatible)
    S3_ENDPOINT_URL: str | None = None
    S3_ACCESS_KEY_ID: str | None = None
    S3_SECRET_ACCESS_KEY: str | None = None
    S3_BUCKET_NAME: str = "rcm-ai-platform"
    S3_REGION: str = "us-east-1"
    S3_USE_SSL: bool = True

    # AI providers
    ANTHROPIC_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    GOOGLE_API_KEY: str | None = None
    DEFAULT_AI_PROVIDER: Literal["anthropic", "openai", "gemini", "auto"] = "auto"
    ANTHROPIC_DEFAULT_MODEL: str = "claude-sonnet-5"
    OPENAI_DEFAULT_MODEL: str = "gpt-4.1"
    GEMINI_DEFAULT_MODEL: str = "gemini-2.0-pro"
    AI_PROVIDER_DATA_RETENTION_DAYS: int = 0  # 0 = provider default / zero retention where supported

    # SSO
    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None
    AZURE_AD_CLIENT_ID: str | None = None
    AZURE_AD_CLIENT_SECRET: str | None = None
    AZURE_AD_TENANT_ID: str | None = None

    # RAG
    EMBEDDING_MODEL: str = "text-embedding-3-large"
    EMBEDDING_DIMENSIONS: int = 1536
    RAG_CHUNK_SIZE: int = 800
    RAG_CHUNK_OVERLAP: int = 150
    RAG_TOP_K: int = 6

    # Compliance
    PHI_BLOCK_ON_DETECTION_DEFAULT: bool = True
    CONVERSATION_RETENTION_DAYS_DEFAULT: int = 365
    AUDIT_LOG_RETENTION_DAYS: int = 730

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
