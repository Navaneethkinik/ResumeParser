from utils.file_utils import extract_text
from services.gemini_service import call_gemini

def process_resume(file):
    text = extract_text(file)

    if not text.strip():
        raise ValueError("Empty resume")

    result = call_gemini(text)

    return result