from fastapi import FastAPI, HTTPException
from schemas import ChatRequest, ChatResponse
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from groq import AuthenticationError

from embeddings import load_embedding_model
from vector_store import get_collection, search_similar_chunks
from llm import load_llm_client, generate_answer

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

model = None
collection = get_collection()
client = load_llm_client()


@app.get("/")
def home():
    return FileResponse("static/index.html")


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    global model

    if model is None:
        model = load_embedding_model()

    recent_user_context = " ".join(
        item.content
        for item in request.history[-6:]
        if item.role == "user" and item.content.strip()
    )
    retrieval_query = f"{recent_user_context} {request.question}".strip()

    results = search_similar_chunks(
        query=retrieval_query,
        model=model,
        collection=collection,
        top_k=5,
    )

    try:
        answer = generate_answer(
            chunks=results["documents"],
            question=request.question,
            client=client,
            history=request.history,
        )
    except AuthenticationError as exc:
        raise HTTPException(
            status_code=503,
            detail="Groq rejected the configured API key. Set a valid GROQ_API_KEY in .env and restart the server.",
        ) from exc

    return ChatResponse(answer=answer)
