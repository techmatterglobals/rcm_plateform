import json
import time
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.analytics import UsageEvent
from app.models.assistant import Assistant
from app.models.conversation import Conversation, Message
from app.models.document import Document
from app.models.user import User
from app.repositories.conversation_repository import ConversationRepository
from app.schemas.conversation import ChatRequest
from app.services.ai.base import AIProviderError, ChatMessage, ChatRole
from app.services.ai.router import ai_router
from app.services.phi.detector import detected_phi_types, has_phi
from app.services.phi.policy import is_phi_blocking_enabled
from app.services.rag.retriever import format_citations_for_prompt, retrieve, to_citation_payload

router = APIRouter(prefix="/chat", tags=["chat"])

DEFAULT_SYSTEM_PROMPT = (
    "You are the RCM AI Platform assistant, a specialized AI workspace for a medical billing "
    "and revenue cycle management company. Only assist with medical billing, coding, "
    "eligibility, prior authorization, denials, appeals, and related RCM operations. "
    "Be precise, cite sources when knowledge base context is provided, flag uncertainty, and "
    "never fabricate CPT/ICD-10/HCPCS codes or payer policy. Treat all patient data as PHI."
)

PLATFORM_TASK_KEY_BY_CATEGORY = {
    "medical_coding": "medical_coding",
    "medical_billing": "medical_billing",
    "eligibility": "eligibility_vob",
    "prior_authorization": "prior_authorization",
    "denial_management": "denial_management",
    "appeals": "appeal_generator",
    "medical_record_review": "medical_record_review",
    "document_analysis": "document_analyzer",
}


async def _load_conversation(db: AsyncSession, payload: ChatRequest, user: User) -> Conversation:
    repo = ConversationRepository(db)
    if payload.conversation_id:
        conversation = await repo.get(payload.conversation_id)
        if conversation is None or conversation.user_id != user.id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")
        return conversation

    assistant_id = None
    if payload.assistant_slug:
        result = await db.execute(select(Assistant).where(Assistant.slug == payload.assistant_slug))
        assistant = result.scalar_one_or_none()
        assistant_id = assistant.id if assistant else None

    conversation = Conversation(
        user_id=user.id, assistant_id=assistant_id, provider=payload.provider or "auto"
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    return conversation


@router.post("")
async def chat(
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    conversation = await _load_conversation(db, payload, current_user)

    assistant: Assistant | None = None
    if conversation.assistant_id:
        assistant = await db.get(Assistant, conversation.assistant_id)

    # --- PHI compliance gate -------------------------------------------------
    phi_types = detected_phi_types(payload.message) if has_phi(payload.message) else []
    if phi_types and await is_phi_blocking_enabled(db):
        blocked_message = Message(
            conversation_id=conversation.id,
            role="user",
            content=payload.message,
            phi_detected=True,
            phi_types=phi_types,
            was_blocked=True,
        )
        db.add(blocked_message)
        await db.commit()

        async def blocked_stream():
            yield _sse(
                {
                    "type": "blocked",
                    "reason": "phi_detected",
                    "phi_types": phi_types,
                    "message": (
                        "This message was not sent to the AI provider because it appears to "
                        "contain PHI (" + ", ".join(phi_types) + "). Remove the sensitive data, "
                        "or ask an admin to approve this conversation for PHI handling."
                    ),
                }
            )

        return StreamingResponse(blocked_stream(), media_type="text/event-stream")

    # --- Build message context ----------------------------------------------
    system_prompt = assistant.system_prompt if assistant else DEFAULT_SYSTEM_PROMPT
    citations: list[dict] = []

    if assistant and assistant.requires_kb:
        results = await retrieve(db, payload.message, top_k=6)
        if results:
            system_prompt = f"{system_prompt}\n\n{format_citations_for_prompt(results)}"
            citations = to_citation_payload(results)

    attachment_context = await _build_attachment_context(db, payload.attachment_ids)
    user_content = payload.message if not attachment_context else f"{payload.message}\n\n{attachment_context}"

    history_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id, Message.was_blocked.is_(False))
        .order_by(Message.created_at)
    )
    history = history_result.scalars().all()

    messages = [ChatMessage(role=ChatRole.SYSTEM, content=system_prompt)]
    for m in history:
        role = ChatRole.ASSISTANT if m.role == "assistant" else ChatRole.USER
        messages.append(ChatMessage(role=role, content=m.content))
    messages.append(ChatMessage(role=ChatRole.USER, content=user_content))

    user_message = Message(
        conversation_id=conversation.id, role="user", content=payload.message, attachment_ids=[
            str(a) for a in payload.attachment_ids
        ] or None,
    )
    db.add(user_message)
    await db.commit()

    task_key = PLATFORM_TASK_KEY_BY_CATEGORY.get(assistant.category if assistant else "", "general_chat")
    provider_choice = payload.provider or conversation.provider

    async def event_stream():
        full_text = ""
        model_used = None
        tokens_in = tokens_out = 0
        started = time.perf_counter()

        try:
            async for chunk in ai_router.stream_chat(messages, provider_choice, task_key=task_key):
                if chunk.delta:
                    full_text += chunk.delta
                    yield _sse({"type": "delta", "content": chunk.delta})
                if chunk.finished:
                    model_used = chunk.model
                    tokens_in = chunk.tokens_input or 0
                    tokens_out = chunk.tokens_output or 0
        except AIProviderError as exc:
            yield _sse({"type": "error", "message": str(exc)})
            return

        latency_ms = int((time.perf_counter() - started) * 1000)

        assistant_message = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=full_text,
            provider=provider_choice,
            model=model_used,
            tokens_input=tokens_in,
            tokens_output=tokens_out,
            latency_ms=latency_ms,
            citations=citations or None,
        )
        db.add(assistant_message)

        if conversation.title == "New conversation":
            conversation.title = payload.message[:80]
        conversation.model = model_used

        db.add(
            UsageEvent(
                user_id=current_user.id,
                event_type="chat_message",
                assistant_id=conversation.assistant_id,
                conversation_id=conversation.id,
                provider=provider_choice,
                model=model_used,
                tokens_input=tokens_in,
                tokens_output=tokens_out,
                latency_ms=latency_ms,
                estimated_seconds_saved=240,
            )
        )
        await db.commit()

        yield _sse(
            {
                "type": "done",
                "conversation_id": str(conversation.id),
                "message_id": str(assistant_message.id),
                "citations": citations,
                "model": model_used,
            }
        )

    return StreamingResponse(event_stream(), media_type="text/event-stream")


async def _build_attachment_context(db: AsyncSession, attachment_ids: list[uuid.UUID]) -> str:
    if not attachment_ids:
        return ""
    parts = []
    for attachment_id in attachment_ids:
        doc = await db.get(Document, attachment_id)
        if doc is None:
            continue
        text = doc.extracted_summary or (doc.extracted_text or "")[:4000]
        parts.append(f"--- Attached file: {doc.filename} ---\n{text}")
    return "\n\n".join(parts)


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"
