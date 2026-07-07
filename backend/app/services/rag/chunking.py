from dataclasses import dataclass
from functools import lru_cache

import tiktoken

from app.core.config import settings


@lru_cache(maxsize=1)
def _get_encoder() -> tiktoken.Encoding:
    # Loaded lazily (and cached) on first real use, not at import time — avoids a network
    # fetch during app startup / import in offline or restricted-egress environments.
    return tiktoken.get_encoding("cl100k_base")


@dataclass
class TextChunk:
    content: str
    chunk_index: int
    page_number: int | None


def chunk_pages(pages: list[str], chunk_size: int | None = None, overlap: int | None = None) -> list[TextChunk]:
    """Token-aware sliding-window chunking that tracks source page number per chunk.

    `pages` is one string per source page (page 1 at index 0). For documents without a
    natural page concept (docx/xlsx), callers pass a single "page".
    """
    chunk_size = chunk_size or settings.RAG_CHUNK_SIZE
    overlap = overlap or settings.RAG_CHUNK_OVERLAP
    encoder = _get_encoder()

    chunks: list[TextChunk] = []
    index = 0

    for page_number, page_text in enumerate(pages, start=1):
        tokens = encoder.encode(page_text)
        if not tokens:
            continue

        start = 0
        while start < len(tokens):
            end = min(start + chunk_size, len(tokens))
            chunk_text = encoder.decode(tokens[start:end])
            if chunk_text.strip():
                chunks.append(TextChunk(content=chunk_text.strip(), chunk_index=index, page_number=page_number))
                index += 1
            if end == len(tokens):
                break
            start = end - overlap

    return chunks
