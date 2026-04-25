import io
from utils.file_utils import extract_text
from services.llm_service import call_llm_async
from utils.cache import get_content_hash, get_cached_result, set_cached_result


def normalize_llm_output(data: dict) -> dict:
    """
    Normalize the raw LLM JSON to match the strict schema.
    Handles common LLM naming deviations before Pydantic validation.
    """
    if not isinstance(data, dict):
        return data

    # --- Fix experience field names ---
    for exp in data.get("experience", []):
        if isinstance(exp, dict):
            # jobTitle → title
            if "jobTitle" in exp and "title" not in exp:
                exp["title"] = exp.pop("jobTitle")
            # startDate → start_date
            if "startDate" in exp and "start_date" not in exp:
                exp["start_date"] = exp.pop("startDate")
            # endDate → end_date
            if "endDate" in exp and "end_date" not in exp:
                exp["end_date"] = exp.pop("endDate")
            # description must be a list of strings
            desc = exp.get("description")
            if isinstance(desc, str):
                exp["description"] = [desc]
            elif not isinstance(desc, list):
                exp["description"] = []

    # --- Flatten skills if the LLM returned a nested object ---
    skills = data.get("skills")
    if isinstance(skills, dict):
        flat = []
        for v in skills.values():
            if isinstance(v, list):
                flat.extend(str(s) for s in v)
            elif isinstance(v, str):
                flat.append(v)
        data["skills"] = flat

    # --- Fix project description if it's a list ---
    for proj in data.get("projects", []):
        if isinstance(proj, dict):
            desc = proj.get("description")
            if isinstance(desc, list):
                proj["description"] = " ".join(str(d) for d in desc)

    # --- Fix languages if null ---
    if data.get("languages") is None:
        data["languages"] = []

    return data


async def process_resume_async(file_content: bytes, filename: str, provider: str = None, model: str = None):
    # 1. Check cache first
    content_hash = get_content_hash(file_content)
    cached = get_cached_result(content_hash)
    if cached:
        return cached

    # 2. Extract text
    file_obj = io.BytesIO(file_content)
    file_obj.filename = filename
    text = extract_text(file_obj)

    if not text.strip():
        raise ValueError("Empty resume or unsupported format")

    # 3. Call LLM async
    raw_result = await call_llm_async(text, provider=provider, model=model)

    # 4. Normalize to strict schema
    if isinstance(raw_result, dict):
        result = normalize_llm_output(raw_result)
    else:
        # Pydantic model returned by Gemini — convert to dict first
        result = normalize_llm_output(raw_result.model_dump() if hasattr(raw_result, 'model_dump') else dict(raw_result))

    # 5. Cache and return
    set_cached_result(content_hash, result)
    return result