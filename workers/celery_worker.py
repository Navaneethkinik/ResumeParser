from celery import Celery
from config.settings import settings
import asyncio
from services.parser_service import process_resume_async

celery_app = Celery(
    "resumeparser",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

@celery_app.task(name="process_resume_task")
def process_resume_task(file_content_base64: str, filename: str):
    import base64
    content = base64.b64decode(file_content_base64)
    
    # Celery tasks are sync by default, so we run our async function in a loop
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(process_resume_async(content, filename))
