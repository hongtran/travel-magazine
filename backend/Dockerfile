FROM python:3.12-slim
WORKDIR /app
RUN pip install poetry
COPY backend/pyproject.toml backend/poetry.lock* ./
RUN poetry install --only main --no-interaction --no-root
COPY backend/app ./app
EXPOSE 8000
CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
