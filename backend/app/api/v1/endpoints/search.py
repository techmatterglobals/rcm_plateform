from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.conversation import Conversation
from app.models.document import Document
from app.models.enums import RoleName
from app.models.knowledge_base import KnowledgeBaseDocument
from app.models.prompt import PromptTemplate
from app.models.user import User
from app.schemas.admin import SearchResultItem, SearchResults

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=SearchResults)
async def global_search(
    q: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
) -> SearchResults:
    like = f"%{q}%"

    conv_result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == current_user.id, Conversation.title.ilike(like))
        .limit(10)
    )
    conversations = [
        SearchResultItem(type="conversation", id=str(c.id), title=c.title, snippet="", url=f"/chat/{c.id}")
        for c in conv_result.scalars().all()
    ]

    kb_result = await db.execute(
        select(KnowledgeBaseDocument).where(KnowledgeBaseDocument.title.ilike(like)).limit(10)
    )
    kb_docs = [
        SearchResultItem(
            type="knowledge_base", id=str(d.id), title=d.title, snippet=d.category, url="/knowledge-base"
        )
        for d in kb_result.scalars().all()
    ]

    prompt_result = await db.execute(
        select(PromptTemplate).where(PromptTemplate.title.ilike(like)).limit(10)
    )
    prompts = [
        SearchResultItem(
            type="prompt", id=str(p.id), title=p.title, snippet=p.description, url="/prompt-library"
        )
        for p in prompt_result.scalars().all()
    ]

    doc_result = await db.execute(
        select(Document).where(Document.owner_id == current_user.id, Document.filename.ilike(like)).limit(10)
    )
    documents = [
        SearchResultItem(
            type="document", id=str(d.id), title=d.filename, snippet=d.status, url="/document-analyzer"
        )
        for d in doc_result.scalars().all()
    ]

    users = []
    if current_user.is_role(RoleName.ADMIN):
        user_result = await db.execute(select(User).where(User.full_name.ilike(like)).limit(10))
        users = [
            SearchResultItem(type="user", id=str(u.id), title=u.full_name, snippet=u.email, url="/admin/users")
            for u in user_result.scalars().all()
        ]

    return SearchResults(
        conversations=conversations, knowledge_base=kb_docs, prompts=prompts, documents=documents, users=users
    )
