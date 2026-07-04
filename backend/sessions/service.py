"""
SessionService — all MongoDB operations for Interview Sessions.

Design principles:
  - One class, one responsibility: sessions CRUD only.
  - No HTTP, no FastAPI, no auth logic here.
  - All methods are async (Motor).
  - The collection is fetched lazily so the module is importable without
    a live database connection (e.g. during tests).
"""
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorCollection

from auth.config import MONGODB_URI
from .models import SessionCreate, SessionPublic, SessionSummary


# ── Collection helper ─────────────────────────────────────────────────────────

_sessions_collection: AsyncIOMotorCollection | None = None
_index_created = False


async def _get_collection() -> AsyncIOMotorCollection:
    """
    Return the 'sessions' collection, creating indexes on first call.
    Indexes:
      - user_id  (non-unique, for efficient per-user queries)
      - timestamp (descending, for chronological listing)
    """
    global _sessions_collection, _index_created
    if _sessions_collection is None:
        # Reuse the same Motor client that auth uses
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient(MONGODB_URI)
        _sessions_collection = client["interview_evaluator"]["sessions"]

    if not _index_created:
        await _sessions_collection.create_index("user_id")
        await _sessions_collection.create_index([("timestamp", -1)])
        _index_created = True

    return _sessions_collection


# ── Serialization helpers ─────────────────────────────────────────────────────

def _doc_to_public(doc: dict) -> SessionPublic:
    """Convert a raw MongoDB document to SessionPublic."""
    from .models import AudioFeaturesModel, FeedbackModel, VideoMetadata

    return SessionPublic(
        id=str(doc["_id"]),
        user_id=doc["user_id"],
        timestamp=doc["timestamp"],
        question=doc["question"],
        video=VideoMetadata(**doc["video"]),
        final_score=doc.get("final_score"),
        confidence_class=doc.get("confidence_class"),
        confidence_label=doc.get("confidence_label"),
        confidence_probability=doc.get("confidence_probability"),
        relevance=doc.get("relevance"),
        sentiment=doc.get("sentiment"),
        emotion_probs=doc.get("emotion_probs", {}),
        audio_features=AudioFeaturesModel(**doc["audio_features"]) if doc.get("audio_features") else None,
        weights_loaded=doc.get("weights_loaded", True),
        developer_payload=doc.get("developer_payload", doc.get("model_status", {})),
        feedback=FeedbackModel(**doc["feedback"]),
        explanations=doc.get("explanations")
    )


def _doc_to_summary(doc: dict) -> SessionSummary:
    """Convert a raw MongoDB document to a lightweight SessionSummary."""
    af = doc.get("audio_features")
    return SessionSummary(
        id=str(doc["_id"]),
        timestamp=doc["timestamp"],
        question=doc["question"],
        video_filename=doc["video"]["filename"],
        final_score=doc.get("final_score"),
        confidence_label=doc.get("confidence_label"),
        confidence_probability=doc.get("confidence_probability"),
        relevance=doc.get("relevance"),
        sentiment=doc.get("sentiment"),
        emotion_probs=doc.get("emotion_probs", {}),
        transcription=doc.get("transcription"),
        speech_rate=af.get("speech_rate") if af else None,
        developer_payload=doc.get("developer_payload", doc.get("model_status", {}))
    )


# ── Service class ─────────────────────────────────────────────────────────────

class SessionService:
    """
    Clean service layer for all Interview Session database operations.
    Instantiate once and inject wherever needed.
    """

    # ── Create ────────────────────────────────────────────────────────────────

    async def create(self, data: SessionCreate) -> SessionPublic:
        """
        Persist a new interview session linked to a user.
        Returns the fully hydrated SessionPublic with the new MongoDB _id.
        """
        collection = await _get_collection()

        doc = {
            "user_id": data.user_id,
            "timestamp": datetime.now(timezone.utc),
            "question": data.question,
            "video": data.video.model_dump(),
            "final_score": data.final_score,
            "confidence_class": data.confidence_class,
            "confidence_label": data.confidence_label,
            "confidence_probability": data.confidence_probability,
            "relevance": data.relevance,
            "sentiment": data.sentiment,
            "emotion_probs": data.emotion_probs,
            "audio_features": data.audio_features.dict() if data.audio_features else None,
            "weights_loaded": data.weights_loaded,
            "developer_payload": {k: v.dict() for k, v in data.developer_payload.items()},
            "feedback": data.feedback.model_dump(),
            "explanations": data.explanations.model_dump() if data.explanations else None,
        }

        result = await collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return _doc_to_public(doc)

    # ── Read (one) ────────────────────────────────────────────────────────────

    async def get(self, session_id: str, user_id: str) -> Optional[SessionPublic]:
        """
        Fetch a single session by ID.
        Returns None if not found or if the session belongs to a different user
        (prevents IDOR — insecure direct object reference).
        """
        try:
            oid = ObjectId(session_id)
        except InvalidId:
            return None

        collection = await _get_collection()
        doc = await collection.find_one({"_id": oid, "user_id": user_id})
        return _doc_to_public(doc) if doc else None

    # ── Read (list) ───────────────────────────────────────────────────────────

    async def list(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 20,
    ) -> list[SessionSummary]:
        """
        Return a paginated, chronologically sorted list of session summaries
        for a given user. Uses the lightweight SessionSummary model (no mfcc_mean,
        no full transcript) to keep response sizes small.
        """
        collection = await _get_collection()
        cursor = (
            collection
            .find(
                {"user_id": user_id},
                # Projection: exclude heavy mfcc_mean array to optimize query size
                {"audio_features.mfcc_mean": 0},
            )
            .sort("timestamp", -1)  # newest first
            .skip(skip)
            .limit(limit)
        )
        docs = await cursor.to_list(length=limit)
        return [_doc_to_summary(d) for d in docs]

    # ── Count ─────────────────────────────────────────────────────────────────

    async def count(self, user_id: str) -> int:
        """Return the total number of sessions for a user (for pagination metadata)."""
        collection = await _get_collection()
        return await collection.count_documents({"user_id": user_id})

    # ── Delete ────────────────────────────────────────────────────────────────

    async def delete(self, session_id: str, user_id: str) -> bool:
        """
        Delete a session by ID.
        Returns True if deleted, False if not found or access denied.
        IDOR-safe: enforces user_id match on the delete filter.
        """
        try:
            oid = ObjectId(session_id)
        except InvalidId:
            return False

        collection = await _get_collection()
        result = await collection.delete_one({"_id": oid, "user_id": user_id})
        return result.deleted_count == 1


# ── Module-level singleton ────────────────────────────────────────────────────

session_service = SessionService()
