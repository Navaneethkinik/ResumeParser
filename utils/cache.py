import hashlib
import redis
import json
from typing import Optional, Any
from config.settings import settings
import structlog

logger = structlog.get_logger()

# In-memory fallback
_memory_cache = {}

try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    # Ping to verify connection
    redis_client.ping()
    REDIS_AVAILABLE = True
    logger.info("connected_to_redis", url=settings.REDIS_URL)
except Exception as e:
    REDIS_AVAILABLE = False
    logger.warning("redis_unavailable_using_memory_fallback", error=str(e))

def get_content_hash(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()

def get_cached_result(hash_key: str) -> Optional[Any]:
    if REDIS_AVAILABLE:
        try:
            data = redis_client.get(hash_key)
            return json.loads(data) if data else None
        except Exception as e:
            logger.error("redis_get_error", error=str(e))
    
    return _memory_cache.get(hash_key)

def set_cached_result(hash_key: str, result: Any):
    if REDIS_AVAILABLE:
        try:
            redis_client.setex(
                hash_key,
                settings.CACHE_TTL,
                json.dumps(result, default=lambda o: o.dict() if hasattr(o, 'dict') else o)
            )
            return
        except Exception as e:
            logger.error("redis_set_error", error=str(e))
            
    _memory_cache[hash_key] = result
