from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin,
    analytics,
    assistants,
    audit_logs,
    auth,
    chat,
    conversations,
    documents,
    knowledge_base,
    notifications,
    prompts,
    search,
    users,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(assistants.router)
api_router.include_router(conversations.router)
api_router.include_router(chat.router)
api_router.include_router(documents.router)
api_router.include_router(knowledge_base.router)
api_router.include_router(prompts.router)
api_router.include_router(analytics.router)
api_router.include_router(audit_logs.router)
api_router.include_router(admin.router)
api_router.include_router(search.router)
api_router.include_router(notifications.router)
