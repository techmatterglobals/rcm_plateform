from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "rcm_ai_platform",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.tasks.document_tasks", "app.tasks.kb_tasks", "app.tasks.retention_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=600,
    worker_max_tasks_per_child=200,
)

celery_app.conf.beat_schedule = {
    "apply-retention-policies-daily": {
        "task": "app.tasks.retention_tasks.apply_retention_policies",
        "schedule": 86400.0,
    },
}
