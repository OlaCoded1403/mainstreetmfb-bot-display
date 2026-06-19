from sentence_transformers import SentenceTransformer


def load_embedding_model():
    model = SentenceTransformer("all-MiniLM-L6-v2")
    return model


def embed_chunks(chunks: list[str], model) -> list[list]:
    """Embed text chunks using the provided model."""
    embeddings = model.encode(chunks)
    return embeddings.tolist()
