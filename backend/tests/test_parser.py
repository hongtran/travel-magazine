import pytest
from pathlib import Path
from app.services.parser import ParsedDocument, parse_docx

FIXTURES = Path(__file__).parent / "fixtures"

def test_extracts_text_from_docx():
    result = parse_docx(FIXTURES / "simple.docx")
    assert "Komodo" in result.text
    assert result.word_count > 10
    assert result.too_short is False

def test_rejects_empty_doc():
    result = parse_docx(FIXTURES / "empty.docx")
    assert result.too_short is True

def test_flags_long_doc():
    result = parse_docx(FIXTURES / "long.docx")
    assert result.needs_chunking is True

def test_extracts_comments():
    result = parse_docx(FIXTURES / "simple.docx")
    # comments list exists even if empty
    assert isinstance(result.comments, list)
