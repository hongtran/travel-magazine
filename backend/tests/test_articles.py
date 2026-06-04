from contextlib import contextmanager
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.auth import get_current_user_id

client = TestClient(app)

@contextmanager
def mock_user(uid="user-123"):
    app.dependency_overrides[get_current_user_id] = lambda: uid
    try:
        yield
    finally:
        app.dependency_overrides.pop(get_current_user_id, None)

def mock_db(rows=None):
    sb = MagicMock()
    chain = sb.table.return_value.select.return_value.eq.return_value
    chain.order.return_value.range.return_value.execute.return_value.data = rows or []
    return patch("app.routers.articles.get_supabase", return_value=sb)

def test_list_articles_returns_200():
    rows = [{"id": "abc", "title": "Komodo", "status": "draft", "created_at": "2026-06-01", "updated_at": "2026-06-01", "regeneration_count": 0}]
    with mock_user(), mock_db(rows):
        resp = client.get("/articles", headers={"Authorization": "Bearer token"})
    assert resp.status_code == 200
    assert resp.json()["articles"][0]["title"] == "Komodo"

def test_list_articles_requires_auth():
    resp = client.get("/articles")
    assert resp.status_code in (401, 403)
