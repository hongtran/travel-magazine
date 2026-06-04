FROM python:3.12-slim
WORKDIR /app
RUN pip install poetry
COPY backend/pyproject.toml backend/poetry.lock* ./
RUN poetry config virtualenvs.create false && poetry install --only main --no-interaction
COPY backend/app ./app
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
