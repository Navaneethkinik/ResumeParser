# Use official Python image
FROM python:3.12-slim

# Install system dependencies for pdfplumber and other libs
RUN apt-get update && apt-get install -y \
    build-essential \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy project files
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-cache

# Copy the rest of the application
COPY . .

# Expose port
EXPOSE 5000

# Default command (will be overridden in docker-compose for worker)
CMD ["uv", "run", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000"]
