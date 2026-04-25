import io
from utils.file_utils import extract_text
from services.gemini_service import call_llm_async
from utils.cache import get_content_hash, get_cached_result, set_cached_result

async def process_resume_async(file_content: bytes, filename: str, provider: str = None, model: str = None):
    # 1. Check cache first
    content_hash = get_content_hash(file_content)
    cached = get_cached_result(content_hash)
    if cached:
        return cached

    # 2. Extract text
    # Use io.BytesIO for a proper file-like object
    file_obj = io.BytesIO(file_content)
    file_obj.filename = filename  # Attach filename for our extractor
    text = extract_text(file_obj)

    if not text.strip():
        raise ValueError("Empty resume or unsupported format")

    # 3. Call LLM async
    result = await call_llm_async(text, provider=provider, model=model)

    # 4. Cache and return
    set_cached_result(content_hash, result)
    return result