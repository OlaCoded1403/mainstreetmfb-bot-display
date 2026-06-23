from groq import Groq
from dotenv import load_dotenv
import os


def load_llm_client():
    """Load environment variables and return an authenticated Groq client."""
    load_dotenv()
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set in the environment.")

    chat = Groq(api_key=api_key)
    return chat


system_prompt = """You are a customer support assistant for Mainstreet Microfinance Bank.
Answer only from the provided context.
Use the conversation history only to understand follow-up questions.
If the answer is not in the context, say you don't have that information.
Format answers professionally:
- Use short paragraphs with clear line breaks.
- Use numbered lists when giving steps, requirements, options, or multiple items.
- Put each numbered item on a new line.
- Use **bold** for important labels or key answers.
- Use __underline__ sparingly for section labels.
- Keep answers concise and easy to scan."""


def generate_answer(chunks: list[str], question, client, history=None):
    """take question and retrieved chunks and generate answer"""
    valid_chunks = [chunk for chunk in chunks if isinstance(chunk, str) and chunk.strip()]
    if not valid_chunks:
        return "I don't have that information."

    retrieved_chunk = "\n\n".join(valid_chunks)
    history = history or []
    history_text = "\n".join(
        f"{item.role}: {item.content}"
        for item in history[-8:]
        if item.role in {"user", "assistant"} and item.content.strip()
    )

    user_prompt = f"""
                          Context:
                          {retrieved_chunk}

                          Conversation history:
                          {history_text or "No previous messages."}
                          
                          Question:
                          {question}
                          """

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        temperature=0.3,
        top_p=0.5,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    return response.choices[0].message.content
