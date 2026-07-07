from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.settings import SystemSetting

PHI_BLOCK_SETTING_KEY = "phi_block_on_detection"


async def is_phi_blocking_enabled(db: AsyncSession) -> bool:
    result = await db.execute(select(SystemSetting).where(SystemSetting.key == PHI_BLOCK_SETTING_KEY))
    setting = result.scalar_one_or_none()
    if setting is None:
        return settings.PHI_BLOCK_ON_DETECTION_DEFAULT
    return bool(setting.value.get("enabled", settings.PHI_BLOCK_ON_DETECTION_DEFAULT))
