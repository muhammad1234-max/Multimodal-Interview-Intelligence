"""
Coaching Service — Coordinates RAG coaching pipelines.
If the database 'coaching_documents' is empty on first boot, it automatically
ingests a set of high-quality standard coaching files to seed the system,
guaranteeing retrieved context is always available.
"""
import logging
from typing import Dict, Any
from sessions.service import session_service
from .vector_store import add_coaching_document, similarity_search
from .llm import generate_coaching, get_model_name_used

logger = logging.getLogger(__name__)

DEFAULT_DOCUMENTS = [
    {
        "title": "The STAR Method Framework",
        "category": "Structure",
        "content": (
            "The STAR method is a structured technique for answering behavioral interview questions. "
            "S: Situation - Describe the context or challenge you faced. Keep it brief. "
            "T: Task - Explain your responsibility or what needed to be done. "
            "A: Action - Detail the specific actions you took to address the challenge. This should be the core of your answer. "
            "R: Result - Share the outcome achieved, quantifiably if possible. "
            "Using the STAR framework ensures your answers are logical, concise, and highlight your direct contributions."
        )
    },
    {
        "title": "Managing Interview Anxiety and Composure",
        "category": "Body Language",
        "content": (
            "Physiological composure is critical during interviews. Nervousness shows in rapid speech, eye avoidance, "
            "and defensive posture. To regulate composure: "
            "1. Practice Box Breathing: Inhale for 4 seconds, hold for 4 seconds, exhale for 4 seconds, hold for 4 seconds. "
            "This lowers heart rate and stabilizes the voice. "
            "2. Maintain eye contact with the lens, not the screen, to project focus and assurance. "
            "3. Hold a professional upright posture to project confidence and open your diaphragm for vocal projection."
        )
    },
    {
        "title": "Vocal Confidence and Projection",
        "category": "Speech",
        "content": (
            "Monotone speech and low vocal projection indicate hesitation. To sound confident: "
            "1. Vary your pitch: Emphasize key action words and structure phrases with downward inflections at the end of sentences. "
            "2. Speed: Maintain a comfortable cadence of 130 to 150 words per minute (around 3 to 4 syllables per second). "
            "3. Filler words: Avoid 'um', 'uh', and 'like'. When you need to think, pause silently. "
            "Silence is perceived as thoughtful composure; filler words are perceived as anxiety."
        )
    },
    {
        "title": "Ensuring Semantic Answer Relevance",
        "category": "Relevance",
        "content": (
            "Relevance is the alignment between the question asked and your spoken answer. "
            "Many candidates fail because they wander off-topic or give generic answers. To maintain relevance: "
            "1. Address the prompt directly in your first sentence. Use keywords from the question. "
            "2. Listen for the core skills tested (e.g., leadership, conflict resolution). "
            "3. Check yourself midway: ask 'does this story directly answer the interviewer's question?'"
        )
    }
]


async def _ensure_seeded():
    """Ensure the coaching documents collection is seeded with core frameworks."""
    # Try a broad query to check if docs exist
    existing = await similarity_search("interview", limit=1)
    if not existing:
        print("[coaching/service] Seeding default coaching documents...", flush=True)
        for doc in DEFAULT_DOCUMENTS:
            await add_coaching_document(
                title=doc["title"],
                category=doc["category"],
                content=doc["content"]
            )
        print("[coaching/service] Seeding complete.", flush=True)


class CoachingService:
    """Manages retrieving coaching documents and generating suggestions."""

    async def get_coaching(self, session_id: str, user_id: str) -> Dict[str, Any]:
        """
        Retrieves context documents and generates coaching suggestions for a session.
        Grounded in retrieved documents.
        """
        # 1. Fetch the session details (IDOR-safe)
        session = await session_service.get(session_id, user_id)
        if not session:
            raise ValueError("Session not found.")

        # Fetch history (last 3 sessions)
        history_docs = await session_service.list(user_id=user_id, limit=4)
        history = [h for h in history_docs if str(h.id) != session_id][:3]
        history_summary = []
        for h in history:
            history_summary.append({
                "timestamp": str(h.timestamp),
                "score": h.final_score,
                "confidence": h.confidence_label,
                "relevance": h.relevance
            })

        # 2. Make sure RAG database is seeded
        await _ensure_seeded()

        # 3. Determine query queries based on metrics
        search_queries = ["general interview coaching STAR method technical depth"]

        if session.relevance and session.relevance < 0.65:
            search_queries.append("how to maintain semantic answer relevance in interviews")

        if session.confidence_label in ["Low", "Medium"]:
            search_queries.append("vocal confidence projection speech rate filler words")

        # Check for anxiety
        anxious_prob = session.emotion_probs.get("anxious", 0.0) if session.emotion_probs else 0.0
        if anxious_prob > 0.35:
            search_queries.append("managing stress interview anxiety composure eye contact breathing body language")

        # Technical depth (generic check for now, can be tied to a metric)
        if session.final_score and session.final_score < 75:
            search_queries.append("improving technical communication metrics leadership storytelling")

        # 4. Search and retrieve unique relevant documents
        retrieved_docs = []
        seen_titles = set()

        for q in search_queries:
            docs = await similarity_search(q, limit=2)
            for d in docs:
                if d["title"] not in seen_titles:
                    seen_titles.add(d["title"])
                    retrieved_docs.append(d)

        # Truncate to top 4 most relevant documents overall to keep context tight but rich
        retrieved_docs = sorted(retrieved_docs, key=lambda x: x.get("score", 0.0), reverse=True)[:4]
        
        logger.debug(f"[RAG] Retrieved {len(retrieved_docs)} documents.")
        
        # Determine data confidence
        metrics_present = 0
        if session.audio_features: metrics_present += 1
        if session.emotion_probs: metrics_present += 1
        if session.relevance is not None: metrics_present += 1
        
        analysis_confidence = "High"
        if metrics_present == 2: analysis_confidence = "Medium"
        elif metrics_present < 2: analysis_confidence = "Low"

        # 5. Pack metrics
        metrics = {
            "question": session.question,
            "transcription": session.transcription,
            "final_score": session.final_score,
            "relevance": session.relevance,
            "sentiment": session.sentiment,
            "confidence_label": session.confidence_label,
            "emotion_probs": session.emotion_probs,
            "audio_features": session.audio_features.dict() if session.audio_features else None,
            "history": history_summary
        }

        # 6. Generate coaching
        suggestions = generate_coaching(metrics, retrieved_docs)
        model_name = get_model_name_used()

        return {
            "session_id": session_id,
            "score": session.final_score,
            "suggestions": suggestions,
            "transparency": {
                "model_used": model_name,
                "retrieval_count": len(retrieved_docs),
                "analysis_confidence": analysis_confidence
            }
        }


coaching_service = CoachingService()
