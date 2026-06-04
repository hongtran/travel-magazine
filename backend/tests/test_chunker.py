import pytest
from unittest.mock import MagicMock, patch
from app.services.chunker import chunk_and_summarise

SHORT_TEXT = "Komodo notes. Short trip."
LONG_TEXT = "word " * 7000  # 7000 words, over SUMMARISE_THRESHOLD of 6000

@pytest.mark.asyncio
async def test_short_text_returned_unchanged():
    result = await chunk_and_summarise(SHORT_TEXT)
    assert result == SHORT_TEXT

@pytest.mark.asyncio
async def test_long_text_is_summarised():
    mock_choice = MagicMock()
    mock_choice.message.content = "Summarised chunk."
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]

    with patch("app.services.chunker.openai_client.chat.completions.create", return_value=mock_response) as mock_create:
        result = await chunk_and_summarise(LONG_TEXT)

    assert mock_create.called
    assert "Summarised chunk." in result
    assert len(result) < len(LONG_TEXT)
