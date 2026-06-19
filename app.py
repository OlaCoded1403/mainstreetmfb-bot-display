from fastapi import FastAPI
from schemas import ChatRequest, ChatResponse
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from embeddings import load_embedding_model
from vector_store import get_collection, search_similar_chunks
from llm import load_llm_client, generate_answer

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

model = load_embedding_model()
collection = get_collection()
client = load_llm_client()


@app.get("/")
def home():
    return FileResponse("static/index.html")


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    results = search_similar_chunks(
        query=request.question,
        model=model,
        collection=collection,
        top_k=5,
    )

    answer = generate_answer(
        chunks=results["documents"],
        question=request.question,
        client=client,
    )

    return ChatResponse(answer=answer)
