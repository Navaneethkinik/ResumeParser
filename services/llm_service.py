import os
import json
from google import genai
from openai import AsyncOpenAI
from config.settings import settings
from models.resume_schema import ResumeData
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from google.genai.errors import ClientError
from utils.logger import logger

# ─── Clients ───────────────────────────────────────────────────────────────────
gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)

groq_client = AsyncOpenAI(
    api_key=settings.GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
)

# ─── Prompt ────────────────────────────────────────────────────────────────────
PROMPT_PATH = os.path.join(os.path.dirname(__file__), "..", "prompts", "resume_parser_prompt.txt")
with open(PROMPT_PATH, "r") as f:
    PROMPT_TEMPLATE = f.read()


# ─── Public entry point ────────────────────────────────────────────────────────
async def call_llm_async(text: str, provider: str = None, model: str = None):
    """
    Route the request to the correct LLM provider.

    Args:
        text:     Extracted resume text.
        provider: "gemini" | "groq"  (falls back to settings.MODEL_PROVIDER)
        model:    Override the default model for the chosen provider.
    """
    provider = (provider or settings.MODEL_PROVIDER).lower()
    prompt = PROMPT_TEMPLATE.format(text=text)

    if provider == "groq":
        model = model or settings.GROQ_MODEL
        logger.info("llm_call", provider="groq", model=model)
        return await _call_groq(prompt, model)
    else:
        model = model or settings.GEMINI_MODEL
        logger.info("llm_call", provider="gemini", model=model)
        return await _call_gemini(prompt, model)


# ─── Gemini ────────────────────────────────────────────────────────────────────
@retry(
    retry=retry_if_exception_type(ClientError),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    stop=stop_after_attempt(3),
)
async def _call_gemini(prompt: str, model: str):
    response = await gemini_client.aio.models.generate_content(
        model=model,
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_schema": ResumeData,
            "temperature": 0.1,
        },
    )
    raw = response.parsed if response.parsed else json.loads(response.text)
    # Validate + strip extra keys via Pydantic
    if isinstance(raw, dict):
        return ResumeData.model_validate(raw).model_dump()
    return raw.model_dump() if hasattr(raw, 'model_dump') else raw


# ─── Groq ──────────────────────────────────────────────────────────────────────
@retry(
    wait=wait_exponential(multiplier=1, min=2, max=10),
    stop=stop_after_attempt(3),
)
async def _call_groq(prompt: str, model: str):
    response = await groq_client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": "You are a resume parser. Always respond with valid JSON only.",
            },
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.1,
    )
    content = response.choices[0].message.content
    raw = json.loads(content)
    # Validate against schema + strip extra keys
    return ResumeData.model_validate(raw).model_dump()