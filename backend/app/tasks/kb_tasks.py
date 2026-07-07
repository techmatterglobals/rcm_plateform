import asyncio
import uuid

from app.db.session import AsyncSessionLocal
from app.models.knowledge_base import KnowledgeBaseDocument
from app.models.notification import Notification
from app.services.rag.ingestion import ingest_kb_document
from app.services.storage import download_bytes
from app.tasks.celery_app import celery_app


@celery_app.task(name="app.tasks.kb_tasks.index_kb_document")
def index_kb_document(kb_document_id: str) -> None:
    asyncio.run(_index_kb_document(uuid.UUID(kb_document_id)))


async def _index_kb_document(kb_document_id: uuid.UUID) -> None:
    async with AsyncSessionLocal() as db:
        kb_doc = await db.get(KnowledgeBaseDocument, kb_document_id)
        if kb_doc is None:
            return

        file_bytes = download_bytes(kb_doc.storage_key)
        await ingest_kb_document(db, kb_document_id, file_bytes)

        kb_doc = await db.get(KnowledgeBaseDocument, kb_document_id)
        if kb_doc and kb_doc.status == "indexed":
            db.add(
                Notification(
                    user_id=kb_doc.uploaded_by,
                    type="kb_indexing_complete",
                    title="Knowledge base document indexed",
                    body=f'"{kb_doc.title}" is now searchable in the Knowledge Base.',
                    link="/knowledge-base",
                )
            )
            await db.commit()
