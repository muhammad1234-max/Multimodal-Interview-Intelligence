"""
Coaching API Router — Exposes endpoints under /api/coaching.
All endpoints require authentication.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from auth.dependencies import get_current_user
from auth.models import UserPublic
from .service import coaching_service

router = APIRouter(prefix="/api/coaching", tags=["coaching"])


@router.get("/{session_id}", response_model=dict)
async def get_coaching_suggestions(
    session_id: str,
    current_user: UserPublic = Depends(get_current_user),
) -> dict:
    """
    Generate personalized coaching suggestions for a completed session.
    Retrieves grounding frameworks based on score metrics and runs local/cloud LLM completion.
    """
    try:
        result = await coaching_service.get_coaching(
            session_id=session_id,
            user_id=current_user.id
        )
        return result
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(val_err)
        )
    except Exception as err:
        import traceback
        print(f"[coaching/router] Error: {err}", flush=True)
        print(traceback.format_exc(), flush=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while generating coaching: {err}"
        )
