"""
Auth API router — all endpoints are prefixed with /api/auth.
This router is completely isolated from the ML pipeline.
"""
from datetime import datetime
from bson import ObjectId
from fastapi import APIRouter, HTTPException, status, Depends

from .database import get_users_collection
from .models import UserCreate, UserLogin, UserPublic, Token, RefreshRequest
from .security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from .dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _doc_to_user_public(doc: dict) -> UserPublic:
    """Convert a MongoDB document to a safe UserPublic response model."""
    return UserPublic(
        id=str(doc["_id"]),
        full_name=doc["full_name"],
        email=doc["email"],
        created_at=doc["created_at"],
        is_active=doc.get("is_active", True),
    )


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate) -> Token:
    """
    Create a new user account.
    Returns a JWT token pair on success.
    Raises 409 if the email is already registered.
    """
    collection = await get_users_collection()

    # Check for duplicate email
    existing = await collection.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # Create the user document
    user_doc = {
        "full_name": user_data.full_name.strip(),
        "email": user_data.email.lower().strip(),
        "hashed_password": hash_password(user_data.password),
        "created_at": datetime.utcnow(),
        "is_active": True,
    }

    result = await collection.insert_one(user_doc)
    user_id = str(result.inserted_id)

    return Token(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin) -> Token:
    """
    Verify email and password, return a JWT token pair.
    Raises 401 on invalid credentials (intentionally vague for security).
    """
    collection = await get_users_collection()

    user_doc = await collection.find_one({"email": credentials.email.lower()})

    invalid_creds_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if user_doc is None:
        raise invalid_creds_error

    if not verify_password(credentials.password, user_doc["hashed_password"]):
        raise invalid_creds_error

    if not user_doc.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been disabled.",
        )

    user_id = str(user_doc["_id"])
    return Token(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(body: RefreshRequest) -> Token:
    """
    Exchange a valid refresh token for a new access + refresh token pair.
    Implements token rotation for better security.
    """
    token_data = decode_token(body.refresh_token, expected_type="refresh")

    # Verify user still exists and is active
    collection = await get_users_collection()
    user_doc = await collection.find_one({"_id": ObjectId(token_data.user_id)})

    if user_doc is None or not user_doc.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token.",
        )

    user_id = str(user_doc["_id"])
    return Token(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout():
    """
    Stateless logout — the client is responsible for discarding the tokens.
    This endpoint exists for API completeness and future server-side blocklist support.
    """
    return None


@router.get("/me", response_model=UserPublic)
async def get_me(current_user: UserPublic = Depends(get_current_user)) -> UserPublic:
    """Return the profile of the currently authenticated user."""
    return current_user
