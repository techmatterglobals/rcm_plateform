from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from enum import Enum


class ChatRole(str, Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


@dataclass
class ChatMessage:
    role: ChatRole
    content: str


@dataclass
class StreamChunk:
    """One increment of a streaming AI response."""

    delta: str
    finished: bool = False
    tokens_input: int | None = None
    tokens_output: int | None = None
    model: str | None = None


@dataclass
class ProviderCapabilities:
    supports_vision: bool = False
    supports_documents: bool = False
    max_context_tokens: int = 128_000


class AIProviderError(Exception):
    """Raised when an upstream AI provider call fails after retries."""


class AIProvider(ABC):
    """Provider-agnostic interface every AI backend (Claude, GPT, Gemini, ...) implements.

    New providers are added by subclassing this and registering with AIProviderRouter —
    no other code in the platform needs to change.
    """

    name: str
    capabilities: ProviderCapabilities = field(default_factory=ProviderCapabilities)

    @abstractmethod
    async def stream_chat(
        self,
        messages: list[ChatMessage],
        model: str | None = None,
        temperature: float = 0.3,
        max_tokens: int = 4096,
    ) -> AsyncIterator[StreamChunk]:
        """Yield StreamChunk pieces as the model generates its response."""
        raise NotImplementedError

    @abstractmethod
    async def embed(self, texts: list[str], model: str | None = None) -> list[list[float]]:
        """Return one embedding vector per input text."""
        raise NotImplementedError

    @abstractmethod
    def is_configured(self) -> bool:
        raise NotImplementedError
