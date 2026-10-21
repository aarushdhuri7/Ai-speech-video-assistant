from dotenv import load_dotenv
from utils.audio_processor import process_input
from core.transcriber import transcribe_all
from core.summarize import summarize, generate_title
from core.extractor import (
    extract_action_items,
    extract_key_decisions,
    extract_questions,
)
from core.rag_engine import build_rag_chain, ask_question


load_dotenv()


import time


def run_pipeline(source: str, language: str = "english") -> dict:
    total_start = time.perf_counter()
    print("starting AI Video Assistant...")

    t0 = time.perf_counter()
    chunks = process_input(source)
    t_input = time.perf_counter() - t0
    print(f"[TIMING] Preprocessing complete in {t_input:.2f}s ({len(chunks)} chunks)")

    t0 = time.perf_counter()
    transcript = transcribe_all(chunks, language)
    t_stt = time.perf_counter() - t0
    print(f"[TIMING] Transcription ({language}) complete in {t_stt:.2f}s")
    print(f"raw transcription (first 300 characters ) {transcript[:300]}")

    print("Generating title...")
    t0 = time.perf_counter()
    title = generate_title(transcript)
    t_title = time.perf_counter() - t0
    print(f"[TIMING] Title done in {t_title:.2f}s")

    print("Generating summary...")
    t0 = time.perf_counter()
    summary = summarize(transcript)
    t_summary = time.perf_counter() - t0
    print(f"[TIMING] Summary done in {t_summary:.2f}s")

    print("Extracting action items...")
    t0 = time.perf_counter()
    action_item = extract_action_items(transcript)
    t_actions = time.perf_counter() - t0
    print(f"[TIMING] Action items done in {t_actions:.2f}s")

    print("Extracting decisions...")
    t0 = time.perf_counter()
    decisions = extract_key_decisions(transcript)
    t_decisions = time.perf_counter() - t0
    print(f"[TIMING] Decisions done in {t_decisions:.2f}s")

    print("Extracting questions...")
    t0 = time.perf_counter()
    questions = extract_questions(transcript)
    t_questions = time.perf_counter() - t0
    print(f"[TIMING] Questions done in {t_questions:.2f}s")

    print("Building RAG vector store & chain...")
    t0 = time.perf_counter()
    rag_chain = build_rag_chain(transcript)
    t_rag = time.perf_counter() - t0
    print(f"[TIMING] RAG chain built in {t_rag:.2f}s")

    total_time = time.perf_counter() - total_start
    print(f"[TIMING] Total pipeline execution time: {total_time:.2f}s")

    return {
        "title": title,
        "transcript": transcript,
        "summary": summary,
        "action_items": action_item,
        "key_decisions": decisions,
        "open_questions": questions,
        "rag_chain": rag_chain,
    }


if __name__ == "__main__":
    # CLI entry point
    source = input("Enter YouTube URL or local file path: ").strip()
    language = input("Language (english/hinglish): ").strip() or "english"
    result = run_pipeline(source, language)

    print("\n" + "=" * 60)
    print(f"📌 Title: {result['title']}")
    print(f"\n📋 Summary:\n{result['summary']}")
    print(f"\n✅ Action Items:\n{result['action_items']}")
    print(f"\n🔑 Key Decisions:\n{result['key_decisions']}")
    print(f"\n❓ Open Questions:\n{result['open_questions']}")
    print("=" * 60)

    # Phase 2 — Chat with your meeting via RAG
    print("\n💬 Chat with your meeting (type 'exit' to quit)\n")
    rag_chain = result["rag_chain"]
    while True:
        question = input("You: ").strip()
        if question.lower() in ["exit", "quit", "q"]:
            print("👋 Goodbye!")
            break
        if not question:
            continue
        answer = ask_question(rag_chain, question)
        print(f"\n🤖 Assistant: {answer}\n")
