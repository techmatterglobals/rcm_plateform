from sqlalchemy import JSON, Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPKMixin


class AIProviderConfig(Base, UUIDPKMixin, TimestampMixin):
    """Admin-managed configuration for an AI provider (API key, default model, enabled state)."""

    __tablename__ = "ai_provider_configs"

    provider: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    api_key_encrypted: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    default_model: Mapped[str] = mapped_column(String(100), nullable=False)
    available_models: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    data_retention_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
