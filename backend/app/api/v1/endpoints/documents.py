import hashlib
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import select

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.document import Document
from app.models.enums import DocumentSource
from app.models.user import User
from app.schemas.document import DocumentOut
from app.services.documents.virus_scan import get_virus_scanner
from app.services.storage import build_storage_key, presigned_download_url, upload_bytes
from app.tasks.document_tasks import process_document
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/documents", tags=["documents"])

MAX_UPLOAD_BYTES = 25 * 1024 * 1024
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/plain",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
}


@router.post("/upload", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    source: DocumentSource = Query(DocumentSource.CHAT_UPLOAD),
    conversation_id: uuid.UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DocumentOut:
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, f"Unsupported file type: {file.content_type}")

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "File exceeds the 25MB upload limit")

    scanner = get_virus_scanner()
    scan_result = scanner.scan(contents)
    if not scan_result.clean:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"File failed virus scan: {scan_result.detail}")

    storage_key = build_storage_key(f"documents/{current_user.id}", file.filename)
    upload_bytes(storage_key, contents, file.content_type)

    document = Document(
        owner_id=current_user.id,
        conversation_id=conversation_id,
        filename=file.filename,
        storage_key=storage_key,
        mime_type=file.content_type,
        size_bytes=len(contents),
        checksum_sha256=hashlib.sha256(contents).hexdigest(),
        source=source.value,
        virus_scan_status="clean",
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    process_document.delay(str(document.id))

    return DocumentOut.model_validate(document)


@router.get("", response_model=list[DocumentOut])
async def list_documents(
    source: DocumentSource | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DocumentOut]:
    stmt = select(Document).where(Document.owner_id == current_user.id)
    if source:
        stmt = stmt.where(Document.source == source.value)
    stmt = stmt.order_by(Document.created_at.desc())
    result = await db.execute(stmt)
    return [DocumentOut.model_validate(d) for d in result.scalars().all()]


@router.get("/{document_id}", response_model=DocumentOut)
async def get_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DocumentOut:
    document = await db.get(Document, document_id)
    if document is None or document.owner_id != current_user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
    return DocumentOut.model_validate(document)


@router.get("/{document_id}/download-url")
async def get_download_url(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    document = await db.get(Document, document_id)
    if document is None or document.owner_id != current_user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
    return {"url": presigned_download_url(document.storage_key)}
