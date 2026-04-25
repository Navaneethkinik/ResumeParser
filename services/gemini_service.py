import json
from google import genai
from config.settings import Settings

client = genai.Client(api_key=Settings.GEMINI_API_KEY)

def call_gemini(text):
    prompt = f"""
You are a resume parser.

Return ONLY valid JSON:

{{
  "name": "",
  "contact": {{
    "email": "",
    "phone": ""
  }},
  "education": [],
  "experience": [],
  "skills": [],
  "projects": [],
  "certifications": []
}}

Resume:
{text}
"""

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "temperature": 0
        }
    )

    try:
        # If response_mime_type is application/json, text should be valid JSON
        return json.loads(response.text)
    except Exception:
        return response.text