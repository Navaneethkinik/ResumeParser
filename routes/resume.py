from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from services.parser_service import process_resume_async
from typing import List, Optional
from config.settings import settings
import base64
from workers.celery_worker import process_batch_task, celery_app

router = APIRouter(prefix="/api/v1", tags=["resume"])

@router.post("/parse-resume")
async def parse_resume(
    file: UploadFile = File(...),
    provider: Optional[str] = Query(None, description="LLM Provider (gemini or groq)"),
    model: Optional[str] = Query(None, description="Model to use")
):
    # Validate file size
    if file.size and file.size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File too large. Max size is {settings.MAX_FILE_SIZE_MB}MB")

    content = await file.read()
    try:
        result = await process_resume_async(content, file.filename, provider=provider, model=model)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/parse-batch")
async def parse_batch(
    files: List[UploadFile] = File(...),
    provider: Optional[str] = Query(None, description="LLM Provider (gemini or groq)"),
    model: Optional[str] = Query(None, description="Model to use")
):
    files_data = []
    for file in files:
        content = await file.read()
        files_data.append({
            "filename": file.filename,
            "content_b64": base64.b64encode(content).decode('utf-8')
        })
    
    # Trigger background task
    task = process_batch_task.delay(files_data, provider=provider, model=model)
    
    return {
        "status": "processing", 
        "job_id": task.id,
        "message": f"Processing {len(files)} resumes in the background"
    }

@router.get("/batch/{job_id}")
async def get_batch_results(job_id: str):
    task_result = celery_app.AsyncResult(job_id)
    
    if task_result.status == 'PENDING':
        return {"status": "processing", "job_id": job_id}
    elif task_result.status == 'SUCCESS':
        return {"status": "completed", "job_id": job_id, "results": task_result.result}
    elif task_result.status == 'FAILURE':
        return {"status": "failed", "job_id": job_id, "error": str(task_result.info)}
    else:
        return {"status": task_result.status, "job_id": job_id}