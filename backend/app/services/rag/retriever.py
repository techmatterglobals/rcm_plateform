import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.knowledge_base import KnowledgeBaseChunk, KnowledgeBaseDocument
from app.services.ai.router import ai_router


async def retrieve(
    db: AsyncSession, query: str, top_k: int = 6, category: str | None = None
) -> list[dict]:
    """Embed the query and return the top_k most similar KB chunks with citation metadata."""
    [query_embedding] = await ai_router.embed([query])

    stmt = (
        select(
            KnowledgeBaseChunk,
            KnowledgeBaseDocument.title,
            KnowledgeBaseDocument.category,
            KnowledgeBaseChunk.embedding.cosine_distance(query_embedding).label("distance"),
        )
        .join(KnowledgeBaseDocument, KnowledgeBaseChunk.kb_document_id == KnowledgeBaseDocument.id)
        .where(KnowledgeBaseDocument.status == "indexed")
    )
    if category:
        stmt = stmt.where(KnowledgeBaseDocument.category == category)

    stmt = stmt.order_by("distance").limit(top_k)

    result = await db.execute(stmt)
    rows = result.all()

    return [
        {
            "kb_document_id": chunk.kb_document_id,
            "title": title,
            "category": category_,
            "page_number": chunk.page_number,
            "snippet": chunk.content[:500],
            "score": max(0.0, 1 - float(distance)),
        }
        for chunk, title, category_, distance in rows
    ]


def format_citations_for_prompt(results: list[dict]) -> str:
    if not results:
        return ""
    lines = ["Relevant company knowledge base excerpts (cite these as [Source N] in your answer):"]
    for i, r in enumerate(results, start=1):
        page = f", p.{r['page_number']}" if r.get("page_number") else ""
        lines.append(f"[Source {i}] {r['title']}{page}: {r['snippet']}")
    return "\n".join(lines)


def to_citation_payload(results: list[dict]) -> list[dict]:
    return [
        {
            "kb_document_id": str(r["kb_document_id"]),
            "title": r["title"],
            "page_number": r["page_number"],
            "snippet": r["snippet"],
        }
        for r in results
    ]
