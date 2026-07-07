from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_supervisor_or_admin
from app.db.session import get_db
from app.models.user import User
from app.schemas.analytics import AnalyticsOverview
from app.services.analytics.aggregator import build_analytics_overview

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview", response_model=AnalyticsOverview)
async def analytics_overview(
    days: int = 30, db: AsyncSession = Depends(get_db), _: User = Depends(require_supervisor_or_admin)
) -> AnalyticsOverview:
    return await build_analytics_overview(db, days=days)
