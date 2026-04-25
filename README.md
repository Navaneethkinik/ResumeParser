# 🚀 AI-Powered Resume Parser

A robust, high-performance resume parsing application that uses state-of-the-art Large Language Models (LLMs) to transform unstructured resumes (PDF, DOCX, TXT) into structured JSON data. Featuring a premium, responsive dashboard for visualizing extraction results.

![Resume Parser Preview](https://via.placeholder.com/1200x600/1e1e1e/6e40c9?text=AI+Resume+Parser+Dashboard)

## ✨ Features

- **Multi-LLM Support**: Seamlessly switch between **Google Gemini** and **Groq** (Llama 3) for high-quality extraction.
- **Smart Batch Processing**: Upload multiple resumes at once. The system intelligently handles individual files or large batches.
- **Real-time Visualization**: A premium React dashboard that shows extracted data (Contact, Experience, Education, Skills, Projects, etc.) side-by-side with the raw JSON.
- **Advanced Extraction**:
    - Automatic identification of contact details, education, and professional experience.
    - Skill extraction and categorization.
    - Project and certification tracking.
- **Strict Data Enforcement**: Multi-layer defense system (Prompt Engineering + Custom Normalizer + Pydantic `extra='ignore'`) ensures zero application crashes from unpredictable AI responses.
- **Error Boundaries**: A React Error Boundary implementation to ensure a smooth user experience even if data rendering fails.
- **Responsive Design**: Fully compatible with mobile, tablet, and desktop devices.
- **Efficient Caching**: Uses Redis to cache extraction results, preventing redundant LLM calls and reducing costs.
- **Async Processing**: Leverages Celery and Redis with `asyncio.gather` for reliable, concurrent background processing of large batches.
- **Dynamic Model Overrides**: Test different models and providers directly from the UI without changing backend configurations.

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Task Queue**: Celery
- **Message Broker/Cache**: Redis
- **LLM SDKs**: `google-genai`, `openai` (for Groq)
- **Environment Management**: `uv`

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Styling**: Vanilla CSS (Modern CSS variables and glassmorphism)

## 🚀 Quick Start (Docker)

The easiest way to get started is using Docker Compose.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Navaneethkinik/ResumeParser.git
   cd ResumeParser
   ```

2. **Configure Environment**:
   Copy the example environment file and fill in your API keys:
   ```bash
   cp .env.example .env
   ```
   (Open `.env` and add your `GEMINI_API_KEY` and/or `GROQ_API_KEY`)

3. **Launch the application**:
   ```bash
   docker-compose up --build
   ```

4. **Access the App**:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:5000](http://localhost:5000)
   - API Docs (Swagger): [http://localhost:5000/docs](http://localhost:5000/docs)

## 💻 Local Setup (Development)

### Prerequisites
- Python 3.10+
- Node.js 18+
- Redis Server (running on `localhost:6379`)

### 1. Backend Setup
```bash
# Install uv (if not already installed)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Install dependencies and run the API
uv run uvicorn app:app --reload --port 5000

# In a separate terminal, start the Celery worker
uv run celery -A workers.celery_worker worker --loglevel=info
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🧪 Postman Collection

A complete Postman collection is included to easily test the API endpoints (Single Upload, Batch Upload, and Status Polling).
1. Open Postman.
2. Click **Import**.
3. Select `postman/ResumeParser.postman_collection.json` from this repository.

## 📂 Project Structure

```text
├── app.py                # FastAPI entry point
├── routes/               # API endpoints (resume, health)
├── services/             # Core logic (LLM routing, parsing, normalizer)
├── models/               # Strict Pydantic schemas
├── workers/              # Celery worker configuration (asyncio.gather)
├── utils/                # Helpers (caching, logging, file extraction)
├── prompts/              # Strict LLM prompt templates
├── postman/              # Postman collection for API testing
├── frontend/             # React application
│   ├── src/
│   │   ├── services/     # API client
│   │   ├── ErrorBoundary.tsx # React crash protection
│   │   └── App.tsx       # Main UI component
└── docker-compose.yml    # Container orchestration
```

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---
Built with ❤️ by [Navaneeth Kini K](https://github.com/Navaneethkinik)
