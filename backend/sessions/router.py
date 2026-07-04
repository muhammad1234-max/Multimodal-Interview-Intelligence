"""
Sessions API router — all endpoints are prefixed with /api/sessions.
All endpoints require authentication.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query

from auth.dependencies import get_current_user
from auth.models import UserPublic
from .models import SessionPublic, SessionSummary
from .service import session_service

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


class PaginatedSessions:
    """Response envelope for list endpoints."""
    def __init__(self, items: list[SessionSummary], total: int, skip: int, limit: int):
        self.items = items
        self.total = total
        self.skip = skip
        self.limit = limit


@router.get("", response_model=dict)
async def list_sessions(
    skip: int = Query(0, ge=0, description="Number of sessions to skip"),
    limit: int = Query(20, ge=1, le=100, description="Max sessions to return"),
    current_user: UserPublic = Depends(get_current_user),
) -> dict:
    """
    Return a paginated list of the authenticated user's interview sessions.
    Results are sorted newest-first. Uses the lightweight SessionSummary model.
    """
    items = await session_service.list(
        user_id=current_user.id,
        skip=skip,
        limit=limit,
    )
    total = await session_service.count(user_id=current_user.id)

    return {
        "items": [s.model_dump() for s in items],
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": (skip + limit) < total,
    }


@router.get("/{session_id}", response_model=SessionPublic)
async def get_session(
    session_id: str,
    current_user: UserPublic = Depends(get_current_user),
) -> SessionPublic:
    """
    Fetch the full detail of a single interview session.
    Returns 404 if not found or if the session belongs to a different user.
    """
    session = await session_service.get(
        session_id=session_id,
        user_id=current_user.id,
    )
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )
    return session


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: str,
    current_user: UserPublic = Depends(get_current_user),
) -> None:
    """
    Delete an interview session owned by the authenticated user.
    Returns 404 if not found or access denied (IDOR-safe).
    """
    deleted = await session_service.delete(
        session_id=session_id,
        user_id=current_user.id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )
    return None
