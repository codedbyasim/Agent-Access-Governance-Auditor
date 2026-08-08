FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend dependencies
COPY backend/app /app/app
COPY backend/tests /app/tests
COPY pyproject.toml /app/ 2>/dev/null || true

# Install Python requirements
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    pydantic \
    sqlalchemy \
    pyjwt \
    passlib \
    bcrypt \
    requests \
    pytest \
    acryl-datahub \
    mcp \
    mcp-server-datahub

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
