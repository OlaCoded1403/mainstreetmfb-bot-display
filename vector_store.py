import chromadb


def get_collection():
    """Initialize and return a ChromaDB collection."""
    client = chromadb.PersistentClient(path="./chroma_db")
    collection = client.get_or_create_collection(name="mainstreetmfb_docs")
    return collection


def store_embeddings(chunks, embeddings, collection):
    """Store text chunks and their embeddings in the ChromaDB collection."""
    collection.add(
        documents=chunks,
        embeddings=embeddings,
        ids=[f"chunk_{i}" for i in range(len(chunks))],
    )


def search_similar_chunks(query, model, collection, top_k=3):
    """Search for similar chunks in the collection based on the query embedding."""
    query_embedding = model.encode(query).tolist()
    results = collection.query(query_embeddings=[query_embedding], n_results=top_k)
    return {"documents": results["documents"][0], "distances": results["distances"][0]}


def clear_collection(collection):
    """
    Delete all documents from the ChromaDB collection.
    Called before storing new files to prevent duplicate chunks
    accumulating across multiple runs.
    """
    try:
        # Get all existing IDs in the collection
        existing = collection.get()
        if existing["ids"]:
            collection.delete(ids=existing["ids"])
            print(f"🗑️ Cleared {len(existing['ids'])} chunks from collection")
        else:
            print("🗑️ Collection already empty")
    except Exception as e:
        print(f"⚠️ Could not clear collection: {e}")
