from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from services.parser_service import process_resume_async
from typing import List, Optional
from config.settings import settings

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
    results = []
    for file in files:
        content = await file.read()
        try:
            result = await process_resume_async(content, file.filename, provider=provider, model=model)
            results.append({"filename": file.filename, "status": "success", "data": result})
        except Exception as e:
            results.append({"filename": file.filename, "status": "error", "message": str(e)})
    
    return {"status": "success", "results": results}