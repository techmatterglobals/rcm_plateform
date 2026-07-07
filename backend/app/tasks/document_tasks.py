import asyncio
import json
import uuid

from app.db.session import AsyncSessionLocal
from app.models.document import Document
from app.models.enums import DocumentSource, DocumentStatus
from app.models.notification import Notification
from app.services.ai.base import ChatMessage, ChatRole
from app.services.ai.router import ai_router
from app.services.documents.extractor import UnsupportedDocumentTypeError, extract_pages, is_image
from app.services.phi.detector import detected_phi_types, has_phi
from app.services.phi.masking import mask_phi
from app.services.storage import download_bytes
from app.tasks.celery_app import celery_app

DOCUMENT_ANALYZER_PROMPT = (
    "You are a medical billing document analysis assistant. Extract structured information "
    "from the provided document text and respond ONLY with a JSON object with keys: summary, "
    "key_dates (list of strings), diagnoses (list), procedures (list), insurance_details "
    "(object), key_actions (list). Mask any patient name, DOB, SSN, or MRN with "
    "[REDACTED-<TYPE>] in the summary text."
)


@celery_app.task(name="app.tasks.document_tasks.process_document")
def process_document(document_id: str) -> None:
    asyncio.run(_process_document(uuid.UUID(document_id)))


async def _process_document(document_id: uuid.UUID) -> None:
    async with AsyncSessionLocal() as db:
        document = await db.get(Document, document_id)
        if document is None:
            return

        document.status = DocumentStatus.PROCESSING.value
        await db.commit()

        try:
            file_bytes = download_bytes(document.storage_key)

            if is_image(document.mime_type):
                document.extracted_text = None
                summary = (
                    "Image document — visual analysis is performed inline in chat via a "
                    "vision-capable model rather than OCR."
                )
            else:
                pages = extract_pages(file_bytes, document.mime_type)
                full_text = "\n\n".join(pages)
                document.extracted_text = full_text
                summary = full_text

            phi_types = detected_phi_types(summary) if has_phi(summary) else []
            document.phi_detected = bool(phi_types)
            document.phi_types = phi_types or None

            if document.source == DocumentSource.DOCUMENT_ANALYZER.value and summary.strip():
                extracted = await _run_structured_extraction(summary)
                document.extracted_data = extracted
                document.extracted_summary = mask_phi(extracted.get("summary", ""))
            else:
                document.extracted_summary = mask_phi(summary[:2000])

            document.status = DocumentStatus.COMPLETED.value
            document.error_message = None

            db.add(
                Notification(
                    user_id=document.owner_id,
                    type="document_analysis_complete",
                    title="Document analysis complete",
                    body=f'"{document.filename}" has finished processing.',
                    link=f"/document-analyzer/{document.id}",
                )
            )
            await db.commit()
        except UnsupportedDocumentTypeError as exc:
            document.status = DocumentStatus.FAILED.value
            document.error_message = str(exc)
            await db.commit()
        except Exception as exc:  # noqa: BLE001 - persist failure reason, then re-raise for Celery retry/log
            await db.rollback()
            document = await db.get(Document, document_id)
            if document:
                document.status = DocumentStatus.FAILED.value
                document.error_message = str(exc)
                await db.commit()
            raise


async def _run_structured_extraction(text: str) -> dict:
    messages = [
        ChatMessage(role=ChatRole.SYSTEM, content=DOCUMENT_ANALYZER_PROMPT),
        ChatMessage(role=ChatRole.USER, content=text[:12000]),
    ]
    full_text = ""
    async for chunk in ai_router.stream_chat(messages, provider_name=None, task_key="document_analyzer"):
        full_text += chunk.delta
    try:
        start = full_text.index("{")
        end = full_text.rindex("}") + 1
        return json.loads(full_text[start:end])
    except (ValueError, json.JSONDecodeError):
        return {"summary": full_text.strip()}
