from sqlalchemy import JSON, Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPKMixin


class Assistant(Base, UUIDPKMixin, TimestampMixin):
    """A specialized AI assistant module (Medical Coding, Billing, Eligibility, ...).

    All specialty modules share one chat engine; behavior is driven entirely by this
    configuration row (system prompt, capabilities, suggested prompts) rather than
    bespoke code per module.
    """

    __tablename__ = "assistants"

    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    category: Mapped[str] = mapped_column(String(50), nullable=False, default="general")
    icon: Mapped[str] = mapped_column(String(50), nullable=False, default="sparkles")

    system_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    capabilities: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    suggested_prompts: Mapped[list] = mapped_column(JSON, nullable=False, default=list)

    requires_kb: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    supports_file_upload: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    supports_confidence_score: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
