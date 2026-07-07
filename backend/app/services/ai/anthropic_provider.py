from collections.abc import AsyncIterator

import anthropic
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.services.ai.base import (
    AIProvider,
    AIProviderError,
    ChatMessage,
    ChatRole,
    ProviderCapabilities,
    StreamChunk,
)


class AnthropicProvider(AIProvider):
    name = "anthropic"
    capabilities = ProviderCapabilities(
        supports_vision=True, supports_documents=True, max_context_tokens=200_000
    )

    def __init__(self) -> None:
        self._client = (
            anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            if settings.ANTHROPIC_API_KEY
            else None
        )

    def is_configured(self) -> bool:
        return self._client is not None

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        retry=retry_if_exception_type((anthropic.APIConnectionError, anthropic.RateLimitError)),
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
            raise AIProviderError("Anthropic provider is not configured")

        model = model or settings.ANTHROPIC_DEFAULT_MODEL
        system_prompt = "\n\n".join(m.content for m in messages if m.role == ChatRole.SYSTEM)
        turn_messages = [
            {"role": m.role.value, "content": m.content}
            for m in messages
            if m.role != ChatRole.SYSTEM
        ]

        try:
            async with self._client.messages.stream(
                model=model,
                system=system_prompt or None,
                messages=turn_messages,
                max_tokens=max_tokens,
                temperature=temperature,
            ) as stream:
                async for text in stream.text_stream:
                    yield StreamChunk(delta=text, model=model)
                final = await stream.get_final_message()
                yield StreamChunk(
                    delta="",
                    finished=True,
                    tokens_input=final.usage.input_tokens,
                    tokens_output=final.usage.output_tokens,
                    model=model,
                )
        except anthropic.APIError as exc:
            raise AIProviderError(f"Anthropic API error: {exc}") from exc

    async def embed(self, texts: list[str], model: str | None = None) -> list[list[float]]:
        raise AIProviderError("Anthropic does not provide an embeddings API; use OpenAI or Gemini")
