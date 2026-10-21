
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter
from core.llm_factory import get_shared_llm


def get_llm():
    # Uses your existing shared LLM factory.
    # Thinking mode is disabled only if the factory supports it.
    return get_shared_llm(
        temperature=0.3,
        disable_thinking=True,
    )


def split_transcript(transcript: str) -> list[str]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=2000,
        chunk_overlap=150,
    )
    return splitter.split_text(transcript)


def summarize(transcript: str) -> str:
    if not transcript or not transcript.strip():
        return "No transcript content available to summarize."

    llm = get_llm()

    # Step 1: Summarize each transcript chunk.
    map_prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """
                Summarize this portion of a meeting or video transcript.

                Preserve important facts, explanations, decisions,
                action items, and unresolved questions.

                Use concise sentences and clear bullet points.
                Do not invent information.
                Do not include reasoning or introductory commentary.
                """,
            ),
            ("human", "{text}"),
        ]
    )

    map_chain = map_prompt | llm | StrOutputParser()
    chunks = split_transcript(transcript)

    chunk_summaries = [
        map_chain.invoke({"text": chunk})
        for chunk in chunks
    ]

    combined = "\n\n".join(chunk_summaries)

    # Step 2: Combine the chunk summaries into a polished report.
    combined_prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """
                You are a professional meeting-report writer.

                Turn the supplied partial summaries into one clear,
                polished, structured Markdown report.

                FORMATTING RULES:
                - Start with # Meeting Summary.
                - Use ## headings for major sections.
                - Use ### only for necessary subsections.
                - Use concise paragraphs and properly formatted lists.
                - Use **bold** for important terms and short labels.
                - Leave blank lines between paragraphs and sections.
                - Avoid decorative emojis and excessive formatting.
                - Do not output raw HTML.
                - Do not include internal reasoning or <think> blocks.
                - Return only the final report.

                Suggested sections, when supported by the input:
                ## Main Discussion
                ## Key Decisions
                ## Action Items
                ## Open Questions
                ## Core Takeaway

                Do not invent names, deadlines, facts, or decisions.
                Do not create empty sections.
                Preserve the meaning of the source information.
                """,
            ),
            ("human", "{text}"),
        ]
    )

    combined_chain = combined_prompt | llm | StrOutputParser()

    return combined_chain.invoke({"text": combined})


def generate_title(transcript: str) -> str:
    if not transcript or not transcript.strip():
        return "Untitled Meeting"

    llm = get_llm()

    title_chain = (
        ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    """
                    Generate a short, professional title for this
                    meeting or video.

                    Return only the title, with a maximum of 8 words.
                    Do not use quotation marks, Markdown, emojis,
                    or introductory phrases.
                    """,
                ),
                ("human", "{text}"),
            ]
        )
        | llm
        | StrOutputParser()
    )

    title = title_chain.invoke(
        {"text": transcript[:2000]}
    ).strip()

    return title.strip("\"'").strip() or "Untitled Meeting"
