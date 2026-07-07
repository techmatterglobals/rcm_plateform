from datetime import date, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analytics import UsageEvent
from app.models.assistant import Assistant
from app.models.conversation import Conversation, Message
from app.models.document import Document
from app.models.prompt import PromptTemplate
from app.models.user import User
from app.schemas.analytics import AnalyticsOverview, TopItem, UsageSeriesPoint

# Rough heuristic: every AI-assisted message saves ~4 minutes of manual research/drafting time.
SECONDS_SAVED_PER_MESSAGE = 240


async def build_analytics_overview(db: AsyncSession, days: int = 30) -> AnalyticsOverview:
    since = datetime.utcnow() - timedelta(days=days)

    # Build each grouping expression once and reuse the same clause object in SELECT/GROUP
    # BY/ORDER BY — constructing it separately per clause binds "month"/date as distinct
    # parameters, and Postgres then rejects the GROUP BY as not matching the SELECT list.
    day_bucket = func.date(UsageEvent.created_at)
    daily_rows = await db.execute(
        select(day_bucket, func.count()).where(UsageEvent.created_at >= since).group_by(day_bucket).order_by(day_bucket)
    )
    daily_usage = [UsageSeriesPoint(date=d, count=c) for d, c in daily_rows.all()]

    month_bucket = func.date_trunc("month", UsageEvent.created_at)
    monthly_rows = await db.execute(
        select(month_bucket, func.count())
        .where(UsageEvent.created_at >= since - timedelta(days=365))
        .group_by(month_bucket)
        .order_by(month_bucket)
    )
    monthly_usage = [
        UsageSeriesPoint(date=d.date() if isinstance(d, datetime) else d, count=c)
        for d, c in monthly_rows.all()
    ]

    assistant_rows = await db.execute(
        select(Assistant.name, func.count(UsageEvent.id))
        .join(Assistant, Assistant.id == UsageEvent.assistant_id)
        .where(UsageEvent.created_at >= since)
        .group_by(Assistant.name)
        .order_by(func.count(UsageEvent.id).desc())
        .limit(10)
    )
    most_used_assistants = [TopItem(label=name, value=float(c)) for name, c in assistant_rows.all()]

    prompt_rows = await db.execute(
        select(PromptTemplate.title, PromptTemplate.usage_count)
        .order_by(PromptTemplate.usage_count.desc())
        .limit(10)
    )
    most_used_prompts = [TopItem(label=title, value=float(c)) for title, c in prompt_rows.all()]

    avg_latency = await db.scalar(
        select(func.avg(UsageEvent.latency_ms)).where(UsageEvent.created_at >= since)
    )

    conv_message_counts = (
        select(func.count(Message.id).label("message_count"))
        .select_from(Message)
        .group_by(Message.conversation_id)
        .subquery()
    )
    avg_conv_len = await db.scalar(select(func.avg(conv_message_counts.c.message_count)))

    total_seconds_saved = await db.scalar(
        select(func.coalesce(func.sum(UsageEvent.estimated_seconds_saved), 0)).where(
            UsageEvent.created_at >= since
        )
    )

    total_cost = await db.scalar(
        select(func.coalesce(func.sum(UsageEvent.estimated_cost_usd), 0)).where(
            UsageEvent.created_at >= since
        )
    )

    top_user_rows = await db.execute(
        select(User.full_name, func.count(UsageEvent.id))
        .join(User, User.id == UsageEvent.user_id)
        .where(UsageEvent.created_at >= since)
        .group_by(User.full_name)
        .order_by(func.count(UsageEvent.id).desc())
        .limit(10)
    )
    top_active_users = [TopItem(label=name, value=float(c)) for name, c in top_user_rows.all()]

    kb_searches = await db.scalar(
        select(func.count(UsageEvent.id)).where(
            UsageEvent.event_type == "kb_search", UsageEvent.created_at >= since
        )
    )
    doc_uploads = await db.scalar(
        select(func.count(Document.id)).where(Document.created_at >= since)
    )
    total_conversations = await db.scalar(
        select(func.count(Conversation.id)).where(Conversation.created_at >= since)
    )
    total_messages = await db.scalar(
        select(func.count(Message.id)).where(Message.created_at >= since)
    )

    return AnalyticsOverview(
        daily_usage=daily_usage,
        monthly_usage=monthly_usage,
        most_used_assistants=most_used_assistants,
        most_used_prompts=most_used_prompts,
        average_response_time_ms=float(avg_latency or 0),
        average_conversation_length=float(avg_conv_len or 0),
        estimated_time_saved_hours=round(float(total_seconds_saved or 0) / 3600, 1),
        estimated_api_cost_usd=round(float(total_cost or 0), 2),
        top_active_users=top_active_users,
        knowledge_base_searches=int(kb_searches or 0),
        document_uploads=int(doc_uploads or 0),
        total_conversations=int(total_conversations or 0),
        total_messages=int(total_messages or 0),
    )
