"""
FastAPI dependencies for injecting the authenticated user into route handlers.
Usage: add `current_user: UserPublic = Depends(get_current_user)` to any route.
"""
from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from .database import get_users_collection
from .security import decode_token
from .models import UserPublic

# Tells FastAPI where the token endpoint is (used for OpenAPI docs)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserPublic:
    """
    Validate the Bearer token from the Authorization header.
    Returns the authenticated UserPublic, or raises HTTP 401.
    """
    token_data = decode_token(token, expected_type="access")

    collection = await get_users_collection()
    user_doc = await collection.find_one({"_id": ObjectId(token_data.user_id)})

    if user_doc is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user_doc.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )

    return UserPublic(
        id=str(user_doc["_id"]),
        full_name=user_doc["full_name"],
        email=user_doc["email"],
        created_at=user_doc["created_at"],
        is_active=user_doc["is_active"],
    )
