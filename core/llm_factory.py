import os
from langchain_ollama import ChatOllama
from dotenv import load_dotenv

load_dotenv()

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:8b")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")

# Singleton cached instances
_cached_llms = {}

def get_shared_llm(temperature: float = 0.2, disable_thinking: bool = True) -> ChatOllama:
    """
    Returns a shared, configured ChatOllama instance.
    Disables thinking/reasoning mode to eliminate long latency delays for extraction and summarization.
    """
    cache_key = (OLLAMA_MODEL, temperature, disable_thinking)
    if cache_key not in _cached_llms:
        kwargs = {
            "model": OLLAMA_MODEL,
            "base_url": OLLAMA_BASE_URL,
            "temperature": temperature,
        }
        if disable_thinking:
            # LangChain Ollama reasoning=False explicitly sets think=False on Ollama
            kwargs["reasoning"] = False

        _cached_llms[cache_key] = ChatOllama(**kwargs)

    return _cached_llms[cache_key]
