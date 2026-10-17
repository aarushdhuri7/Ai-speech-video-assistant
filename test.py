from langchain_ollama import ChatOllama

llm = ChatOllama(
    model="qwen3:8b",
    temperature=0.2,
)

response = llm.invoke("Hello")
print(response)
