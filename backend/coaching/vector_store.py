"""
Vector Store — Manages storing and retrieving coaching documents with embeddings.
Saves documents to MongoDB collection 'coaching_documents'.

Calculates cosine similarity locally using numpy to ensure 100% vector search
functionality on any MongoDB Atlas cluster without requiring the user to manually
build Search Indexes in the Atlas Web UI.
"""
from typing import List, Dict, Any
import numpy as np
from motor.motor_asyncio import AsyncIOMotorCollection

import logging
from auth.config import MONGODB_URI
from .embedder import generate_embedding

logger = logging.getLogger(__name__)

_coaching_collection: AsyncIOMotorCollection | None = None


async def _get_collection() -> AsyncIOMotorCollection:
    """Return the 'coaching_documents' collection."""
    global _coaching_collection
    if _coaching_collection is None:
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient(MONGODB_URI)
        _coaching_collection = client["interview_evaluator"]["coaching_documents"]
        # Ensure index on category for fast filtering
        await _coaching_collection.create_index("category")
    return _coaching_collection


async def add_coaching_document(title: str, category: str, content: str) -> str:
    """
    Ingest a new coaching document, generate its embedding, and save it.
    """
    collection = await _get_collection()
    embedding = generate_embedding(content)

    doc = {
        "title": title,
        "category": category,
        "content": content,
        "embedding": embedding,
    }

    # Upsert based on title to avoid duplicates
    await collection.update_one(
        {"title": title},
        {"$set": doc},
        upsert=True
    )
    return title


async def similarity_search(query: str, limit: int = 3, category: str | None = None) -> List[Dict[str, Any]]:
    """
    Retrieve the most relevant coaching documents for a query.
    Generates query embedding and calculates cosine similarity over the collection.
    """
    logger.debug(f"[VectorStore] Generating embedding for query: '{query}'")
    collection = await _get_collection()
    query_vector = np.array(generate_embedding(query))

    # Fetch candidate documents (filter by category if specified)
    query_filter = {"category": category} if category else {}
    cursor = collection.find(query_filter, {"title": 1, "category": 1, "content": 1, "embedding": 1})
    docs = await cursor.to_list(length=200)

    if not docs:
        return []

    # Calculate similarity scores
    scored_docs = []
    for doc in docs:
        doc_vector = np.array(doc["embedding"])
        # Cosine similarity formula: dot(A, B) / (norm(A) * norm(B))
        dot_product = np.dot(query_vector, doc_vector)
        norm_a = np.linalg.norm(query_vector)
        norm_b = np.linalg.norm(doc_vector)
        similarity = dot_product / (norm_a * norm_b) if norm_a > 0 and norm_b > 0 else 0.0

        scored_docs.append({
            "title": doc["title"],
            "category": doc["category"],
            "content": doc["content"],
            "score": float(similarity)
        })

    # Sort descending by score
    scored_docs.sort(key=lambda x: x["score"], reverse=True)
    return scored_docs[:limit]
