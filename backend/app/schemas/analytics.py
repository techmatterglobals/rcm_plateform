from datetime import date

from pydantic import BaseModel


class UsageSeriesPoint(BaseModel):
    date: date
    count: int


class TopItem(BaseModel):
    label: str
    value: float


class AnalyticsOverview(BaseModel):
    daily_usage: list[UsageSeriesPoint]
    monthly_usage: list[UsageSeriesPoint]
    most_used_assistants: list[TopItem]
    most_used_prompts: list[TopItem]
    average_response_time_ms: float
    average_conversation_length: float
    estimated_time_saved_hours: float
    estimated_api_cost_usd: float
    top_active_users: list[TopItem]
    knowledge_base_searches: int
    document_uploads: int
    total_conversations: int
    total_messages: int
