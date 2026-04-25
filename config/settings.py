from pydantic_settings import BaseSettings
from typing import Literal

class Settings(BaseSettings):
    # --- Gemini Settings ---
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # --- Groq Settings ---
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # --- Provider Selection ---
    # Set to "gemini" or "groq"
    MODEL_PROVIDER: str = "groq"

    # --- Infrastructure Settings ---
    REDIS_URL: str = "redis://localhost:6379/0"
    MAX_FILE_SIZE_MB: int = 10
    CACHE_TTL: int = 3600

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()