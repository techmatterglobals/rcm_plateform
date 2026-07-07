import uuid

from sqlalchemy import JSON, BigInteger, Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPKMixin
from app.models.enums import DocumentSource, DocumentStatus


class Document(Base, UUIDPKMixin, TimestampMixin):
    """A user-uploaded file: chat attachment, Document Analyzer input, or medical record."""

    __tablename__ = "documents"

    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    conversation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="SET NULL"), nullable=True
    )

    filename: Mapped[str] = mapped_column(String(500), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(1000), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(150), nullable=False)
    size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    checksum_sha256: Mapped[str] = mapped_column(String(64), nullable=False)

    source: Mapped[str] = mapped_column(
        String(30), default=DocumentSource.CHAT_UPLOAD.value, nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20), default=DocumentStatus.UPLOADED.value, nullable=False
    )
    virus_scan_status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)

    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    extracted_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    extracted_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    phi_detected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    phi_types: Mapped[list | None] = mapped_column(JSON, nullable=True)

    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
