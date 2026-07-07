import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import KBDocumentStatus
from app.models.knowledge_base import KnowledgeBaseChunk, KnowledgeBaseDocument
from app.services.ai.router import ai_router
from app.services.documents.extractor import extract_pages
from app.services.rag.chunking import chunk_pages

EMBED_BATCH_SIZE = 32


async def ingest_kb_document(db: AsyncSession, kb_document_id: uuid.UUID, file_bytes: bytes) -> None:
    """Extract text, chunk it, embed each chunk, and persist to pgvector.

    Runs inside a Celery task after upload; updates the document's status as it progresses so
    the frontend (polling or notified via websocket/notification) can reflect indexing state.
    """
    kb_doc = await db.get(KnowledgeBaseDocument, kb_document_id)
    if kb_doc is None:
        return

    kb_doc.status = KBDocumentStatus.INDEXING.value
    await db.commit()

    try:
        pages = extract_pages(file_bytes, kb_doc.mime_type)
        chunks = chunk_pages(pages)

        if not chunks:
            kb_doc.status = KBDocumentStatus.FAILED.value
            kb_doc.error_message = "No extractable text found in document"
            await db.commit()
            return

        for batch_start in range(0, len(chunks), EMBED_BATCH_SIZE):
            batch = chunks[batch_start : batch_start + EMBED_BATCH_SIZE]
            embeddings = await ai_router.embed([c.content for c in batch])
            for chunk, embedding in zip(batch, embeddings, strict=True):
                db.add(
                    KnowledgeBaseChunk(
                        kb_document_id=kb_doc.id,
                        chunk_index=chunk.chunk_index,
                        page_number=chunk.page_number,
                        content=chunk.content,
                        embedding=embedding,
                    )
                )

        kb_doc.chunk_count = len(chunks)
        kb_doc.status = KBDocumentStatus.INDEXED.value
        kb_doc.error_message = None
        await db.commit()
    except Exception as exc:  # noqa: BLE001 - persist failure reason for admin visibility
        await db.rollback()
        kb_doc = await db.get(KnowledgeBaseDocument, kb_document_id)
        if kb_doc:
            kb_doc.status = KBDocumentStatus.FAILED.value
            kb_doc.error_message = str(exc)
            await db.commit()
        raise


async def reindex_kb_document(db: AsyncSession, kb_document_id: uuid.UUID, file_bytes: bytes) -> None:
    await db.execute(
        KnowledgeBaseChunk.__table__.delete().where(
            KnowledgeBaseChunk.kb_document_id == kb_document_id
        )
    )
    await db.commit()
    await ingest_kb_document(db, kb_document_id, file_bytes)
