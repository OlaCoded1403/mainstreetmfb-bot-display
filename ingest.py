# ingest.py

from pathlib import Path
from langchain_text_splitters import RecursiveCharacterTextSplitter


DATA_DIR = Path("data")

documents = []

for file_path in DATA_DIR.glob("*.txt"):
    text = file_path.read_text(encoding="utf-8")

    documents.append(
        {
            "source": file_path.name,
            "content": text,
        }
    )


for doc in documents:
    print(f"\n--- {doc['source']} ---")
    print(doc["content"][:300])


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 50) -> list[str]:
    """Split text into overlapping chunks for better context."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=overlap,
        separators=["\n\n", "\n", ".", " "],
    )
    return splitter.split_text(text)


for doc in documents:
    chunks = chunk_text(doc["content"])

from embeddings import load_embedding_model, embed_chunks
from vector_store import (
    get_collection,
    store_embeddings,
    clear_collection,
)

model = load_embedding_model()
collection = get_collection()

clear_collection(collection)

for doc in documents:
    chunks = chunk_text(doc["content"])
    embeddings = embed_chunks(chunks, model)

    store_embeddings(
        chunks=chunks,
        embeddings=embeddings,
        collection=collection,
    )

print(f"Stored {collection.count()} chunks")
