import pytest
from unittest.mock import MagicMock, patch
from app.services.generator import generate_article
from app.models.article import ArticleOutput, SourcedField, BodySection

def _make_output():
    return ArticleOutput(
        title=SourcedField(value="Komodo Trip", sourced=True),
        hook=SourcedField(value="A wild dawn...", sourced=True),
        body=[BodySection(section_title="Getting There", content="Fly to Labuan Bajo")],
        best_for=SourcedField(value="Divers", sourced=True),
        not_for=SourcedField(value="Luxury seekers", sourced=False),
        key_facts={"price": SourcedField(value="$120/night", sourced=True)},
    )

@pytest.mark.asyncio
async def test_returns_article_output():
    mock_response = MagicMock()
    mock_response.parsed = _make_output()

    with patch("app.services.generator.openai_client.beta.chat.completions.parse", return_value=mock_response):
        result = await generate_article("Some notes.", word_count_target=800, house_style="")

    assert result.title.value == "Komodo Trip"
    assert result.not_for.sourced is False

@pytest.mark.asyncio
async def test_retries_once_on_failure():
    call_count = 0
    good_response = MagicMock()
    good_response.parsed = _make_output()

    def side_effect(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            raise Exception("timeout")
        return good_response

    with patch("app.services.generator.openai_client.beta.chat.completions.parse", side_effect=side_effect):
        result = await generate_article("Some notes.", word_count_target=800, house_style="")

    assert call_count == 2
    assert result.title.value == "Komodo Trip"

@pytest.mark.asyncio
async def test_raises_on_second_failure():
    with patch("app.services.generator.openai_client.beta.chat.completions.parse", side_effect=Exception("timeout")):
        with pytest.raises(Exception):
            await generate_article("Some notes.", word_count_target=800, house_style="")
