import pytest
from fastapi.testclient import TestClient
from jose import jwt
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def valid_token():
    return jwt.encode({"sub": "user-123"}, "test-secret", algorithm="HS256")


@pytest.fixture
def auth_headers(valid_token):
    return {"Authorization": f"Bearer {valid_token}"}
