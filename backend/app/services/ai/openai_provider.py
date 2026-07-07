from collections.abc import AsyncIterator

import openai
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.services.ai.base import (
    AIProvider,
    AIProviderError,
    ChatMessage,
    ProviderCapabilities,
    StreamChunk,
)


class OpenAIProvider(AIProvider):
    name = "openai"
    capabilities = ProviderCapabilities(
        supports_vision=True, supports_documents=True, max_context_tokens=128_000
    )

    def __init__(self) -> None:
        self._client = (
            openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            if settings.OPENAI_API_KEY
            else None
        )

    def is_configured(self) -> bool:
        return self._client is not None

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        retry=retry_if_exception_type((openai.APIConnectionError, openai.RateLimitError)),
        reraise=True,
    )
    async def stream_chat(
        self,
        messages: list[ChatMessage],
        model: str | None = None,
        temperature: float = 0.3,
        max_tokens: int = 4096,
    ) -> AsyncIterator[StreamChunk]:
        if not self._client:
            raise AIProviderError("OpenAI provider is not configured")

        model = model or settings.OPENAI_DEFAULT_MODEL
        payload = [{"role": m.role.value, "content": m.content} for m in messages]

        try:
            stream = await self._client.chat.completions.create(
                model=model,
                messages=payload,
                max_tokens=max_tokens,
                temperature=temperature,
                stream=True,
                stream_options={"include_usage": True},
            )
            async for chunk in stream:
                if chunk.usage is not None:
                    yield StreamChunk(
                        delta="",
                        finished=True,
                        tokens_input=chunk.usage.prompt_tokens,
                        tokens_output=chunk.usage.completion_tokens,
                        model=model,
                    )
                    continue
                delta = chunk.choices[0].delta.content if chunk.choices else None
                if delta:
                    yield StreamChunk(delta=delta, model=model)
        except openai.APIError as exc:
            raise AIProviderError(f"OpenAI API error: {exc}") from exc

    async def embed(self, texts: list[str], model: str | None = None) -> list[list[float]]:
        if not self._client:
            raise AIProviderError("OpenAI provider is not configured")
        model = model or settings.EMBEDDING_MODEL
        try:
            response = await self._client.embeddings.create(
                model=model, input=texts, dimensions=settings.EMBEDDING_DIMENSIONS
            )
        except openai.APIError as exc:
            raise AIProviderError(f"OpenAI embeddings error: {exc}") from exc
        return [item.embedding for item in response.data]
