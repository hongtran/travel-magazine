from openai import OpenAI
from app.config import settings
from app.models.article import ArticleOutput

openai_client = OpenAI(api_key=settings.openai_api_key)

SYSTEM_PROMPT = """\
You are an editorial assistant for a travel magazine. Convert rough author notes into a structured article.

Rules:
- Only use information present in the provided notes
- If a field cannot be filled from the notes, set value to null
- NEVER invent facts, prices, dates, safety information, or details not in the notes
- Set sourced: false for any field you inferred or extrapolated; sourced: true only for explicitly stated information
- Write in a warm, curious editorial voice
{house_style}
Target length: approximately {word_count} words for the full article body combined."""

async def generate_article(
    text: str,
    word_count_target: int,
    house_style: str,
) -> ArticleOutput:
    system = SYSTEM_PROMPT.format(
        house_style=f"\nHouse style guidance: {house_style}" if house_style else "",
        word_count=word_count_target,
    )
    for attempt in range(2):
        try:
            response = openai_client.beta.chat.completions.parse(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": f"Convert these notes into a magazine article:\n\n{text}"},
                ],
                response_format=ArticleOutput,
            )
            return response.parsed
        except Exception:
            if attempt == 1:
                raise
