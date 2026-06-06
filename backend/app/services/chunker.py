import asyncio
import logging

from openai import AsyncOpenAI

from app.config import settings

log = logging.getLogger(__name__)

CHUNK_WORD_LIMIT = 1500
SUMMARISE_THRESHOLD = 6000

openai_client = AsyncOpenAI(api_key=settings.openai_api_key)


async def chunk_and_summarise(text: str) -> str:
    words = text.split()
    if len(words) <= SUMMARISE_THRESHOLD:
        return text

    chunks = [words[i: i + CHUNK_WORD_LIMIT] for i in range(0, len(words), CHUNK_WORD_LIMIT)]
    summaries = []
    for chunk in chunks:
        for attempt in range(2):
            try:
                response = await openai_client.chat.completions.create(
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
                content = response.choices[0].message.content
                if content is None:
                    raise ValueError("OpenAI returned no content for chunk")
                summaries.append(content)
                break
            except Exception as exc:
                log.warning("OpenAI chunk call failed (attempt %d): %s", attempt, exc)
                if attempt == 1:
                    raise
                await asyncio.sleep(1)

    return "\n\n".join(summaries)
