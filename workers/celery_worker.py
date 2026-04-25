from celery import Celery
from config.settings import settings
import asyncio
import base64
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
def process_resume_task(file_content_base64: str, filename: str, provider: str = None, model: str = None):
    import base64
    content = base64.b64decode(file_content_base64)
    
    # Celery tasks are sync by default, so we run our async function in a loop
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
    return loop.run_until_complete(process_resume_async(content, filename, provider=provider, model=model))

@celery_app.task(name="process_batch_task")
def process_batch_task(files_data: list, provider: str = None, model: str = None):
    """
    Processes multiple resumes in parallel using asyncio.gather.
    """
    async def _process_all():
        tasks = []
        for file_info in files_data:
            content = base64.b64decode(file_info["content_b64"])
            tasks.append(
                _process_single_safe(content, file_info["filename"], provider, model)
            )
        return await asyncio.gather(*tasks)

    async def _process_single_safe(content, filename, provider, model):
        try:
            result = await process_resume_async(content, filename, provider=provider, model=model)
            return {"filename": filename, "status": "success", "data": result}
        except Exception as e:
            return {"filename": filename, "status": "error", "message": str(e)}

    # Run the concurrent processing in a new or existing loop
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(_process_all())
