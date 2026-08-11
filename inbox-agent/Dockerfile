FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY config.yaml .
COPY agent/ ./agent/

# Cloud Run Jobs pass the mode as an argument, e.g. --mode=digest
ENTRYPOINT ["python", "-m", "agent.main"]
CMD ["--mode=sweep"]
