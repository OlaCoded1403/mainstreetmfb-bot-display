from groq import Groq
from dotenv import load_dotenv
import os


def load_llm_client():
    """Load environment variables and return an authenticated Groq client."""
    load_dotenv()
    api_key = os.getenv("GROQ_API_KEY")
    chat = Groq(api_key=api_key)
    return chat


system_prompt = """You are a customer support assistant for Mainstreet Microfinance Bank.
   Answer only from the provided context.
If the answer is not in the context, say you don't have that information."""


def generate_answer(chunks: list[str], question, client):
    """take question and retrieved chunks and generate answer"""
    retrieved_chunk = "\n\n".join(chunks)

    user_prompt = f"""
                          Context:
                          {retrieved_chunk}
                          
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
