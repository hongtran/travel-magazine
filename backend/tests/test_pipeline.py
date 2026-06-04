import pytest
import io
from contextlib import contextmanager
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from docx import Document
from app.main import app
from app.auth import get_current_user_id

client = TestClient(app)

DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def make_docx_bytes(text: str) -> bytes:
    doc = Document()
    doc.add_paragraph(text)
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


@contextmanager
def mock_user(uid="user-123"):
    app.dependency_overrides[get_current_user_id] = lambda: uid
    try:
        yield
    finally:
        app.dependency_overrides.pop(get_current_user_id, None)


def test_parse_rejects_non_docx():
    with mock_user():
        resp = client.post(
            "/articles/parse",
            files={"file": ("notes.pdf", b"content", "application/pdf")},
        )
    assert resp.status_code == 422
    assert "docx" in resp.json()["detail"].lower()


def test_parse_rejects_empty_doc():
    docx_bytes = make_docx_bytes("Short.")
    with mock_user():
        with patch("app.routers.pipeline.get_supabase", return_value=MagicMock()):
            with patch("app.routers.pipeline.upload_docx", return_value="path/to/file.docx"):
                resp = client.post(
                    "/articles/parse",
                    files={"file": ("notes.docx", docx_bytes, DOCX_MIME)},
                )
    assert resp.status_code == 422
    assert "too short" in resp.json()["detail"].lower()
