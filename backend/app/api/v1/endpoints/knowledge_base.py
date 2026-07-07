import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, require_admin
from app.db.session import get_db
from app.models.knowledge_base import KnowledgeBaseDocument
from app.models.user import User
from app.repositories.knowledge_base_repository import KnowledgeBaseRepository
from app.schemas.knowledge_base import KBDocumentOut, KBSearchRequest, KBSearchResult
from app.services.audit import record_audit_event
from app.services.rag.retriever import retrieve
from app.services.storage import build_storage_key, upload_bytes
from app.tasks.kb_tasks import index_kb_document

router = APIRouter(prefix="/knowledge-base", tags=["knowledge-base"])

ALLOWED_KB_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "text/plain",
}


@router.get("/documents", response_model=list[KBDocumentOut])
async def list_kb_documents(
    category: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[KBDocumentOut]:
    docs = await KnowledgeBaseRepository(db).list_all(category=category)
    return [KBDocumentOut.model_validate(d) for d in docs]


@router.post("/documents", response_model=KBDocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_kb_document(
    title: str,
    category: str = "general",
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> KBDocumentOut:
    if file.content_type not in ALLOWED_KB_MIME_TYPES:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, f"Unsupported file type: {file.content_type}")

    contents = await file.read()
    storage_key = build_storage_key("knowledge-base", file.filename)
    upload_bytes(storage_key, contents, file.content_type)

    kb_doc = KnowledgeBaseDocument(
        title=title,
        category=category,
        uploaded_by=admin.id,
        storage_key=storage_key,
        mime_type=file.content_type,
        size_bytes=len(contents),
    )
    db.add(kb_doc)
    await db.commit()
    await db.refresh(kb_doc)

    index_kb_document.delay(str(kb_doc.id))
    await record_audit_event(db, admin.id, "knowledge_base.upload", "kb_document", str(kb_doc.id))

    return KBDocumentOut.model_validate(kb_doc)


@router.delete("/documents/{kb_document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_kb_document(
    kb_document_id: uuid.UUID, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)
) -> None:
    repo = KnowledgeBaseRepository(db)
    kb_doc = await repo.get(kb_document_id)
    if kb_doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Knowledge base document not found")
    await repo.delete(kb_doc)
    await repo.commit()
    await record_audit_event(db, admin.id, "knowledge_base.delete", "kb_document", str(kb_document_id))


@router.post("/documents/{kb_document_id}/reindex", status_code=status.HTTP_202_ACCEPTED)
async def reindex_kb_document(
    kb_document_id: uuid.UUID, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)
) -> dict:
    kb_doc = await db.get(KnowledgeBaseDocument, kb_document_id)
    if kb_doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Knowledge base document not found")
    index_kb_document.delay(str(kb_doc.id))
    return {"status": "reindexing"}


@router.post("/search", response_model=list[KBSearchResult])
async def search_knowledge_base(
    payload: KBSearchRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
) -> list[KBSearchResult]:
    from app.models.analytics import UsageEvent

    results = await retrieve(db, payload.query, top_k=payload.top_k, category=payload.category)
    db.add(UsageEvent(user_id=current_user.id, event_type="kb_search"))
    await db.commit()
    return [KBSearchResult(**r) for r in results]
