from fastapi import APIRouter
from config.settings import settings
import time

router = APIRouter(tags=["health"])

@router.get("/health")
async def health():
    return {
        "status": "up",
        "timestamp": time.time()
    }

@router.get("/health/ready")
async def health_ready():
    # In Phase 3, we will add Redis connectivity check here
    return {
        "status": "ready",
        "services": {
            "api": "up",
            "gemini": "connected" # Simple assumption for now
        }
    }
