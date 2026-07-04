"""
Async MongoDB client via Motor.
Exports a helper to get the users collection.
Creates a unique index on 'email' on first call.
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection
from .config import MONGODB_URI

_client: AsyncIOMotorClient | None = None
_index_created = False


def _get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        if not MONGODB_URI:
            raise RuntimeError(
                "MONGODB_URI is not configured. "
                "Add it to backend/.env — see .env.example for the format."
            )
        _client = AsyncIOMotorClient(MONGODB_URI)
    return _client


async def get_users_collection() -> AsyncIOMotorCollection:
    """Return the 'users' collection, ensuring a unique index on 'email'."""
    global _index_created
    collection = _get_client()["interview_evaluator"]["users"]
    if not _index_created:
        await collection.create_index("email", unique=True)
        _index_created = True
    return collection
