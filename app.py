from fastapi import FastAPI
from routes.resume import router as resume_router
from routes.health import router as health_router
from fastapi.middleware.cors import CORSMiddleware
from utils.logger import logger
import time
from fastapi import Request

app = FastAPI(
    title="ResumeParser API",
    description="A robust AI-powered resume parser using Google Gemini",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    logger.info(
        "request_processed",
        path=request.url.path,
        method=request.method,
        status_code=response.status_code,
        duration_ms=round(duration * 1000, 2)
    )
    return response

# Include routes
app.include_router(resume_router)
app.include_router(health_router)

@app.get("/")
async def root():
    return {"message": "Welcome to ResumeParser API. Go to /docs for API documentation."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)