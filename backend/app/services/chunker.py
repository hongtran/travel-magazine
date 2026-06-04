from openai import OpenAI
from app.config import settings

CHUNK_WORD_LIMIT = 1500
SUMMARISE_THRESHOLD = 6000

openai_client = OpenAI(api_key=settings.openai_api_key)


async def chunk_and_summarise(text: str) -> str:
    words = text.split()
    if len(words) <= SUMMARISE_THRESHOLD:
        return text

    chunks = [words[i: i + CHUNK_WORD_LIMIT] for i in range(0, len(words), CHUNK_WORD_LIMIT)]
    summaries = []
    for chunk in chunks:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "Summarise the following travel notes, preserving all specific facts, prices, dates, names, and direct quotes verbatim.",
                },
                {"role": "user", "content": " ".join(chunk)},
            ],
            max_tokens=600,
        )
        summaries.append(response.choices[0].message.content)

    return "\n\n".join(summaries)
