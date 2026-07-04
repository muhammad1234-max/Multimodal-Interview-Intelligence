"""
Pydantic models for the auth system.
No database coupling — pure data contracts.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# ── Request Models ────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


# ── Database Model ────────────────────────────────────────────────────────────

class UserInDB(BaseModel):
    id: str
    full_name: str
    email: str
    hashed_password: str
    created_at: datetime
    is_active: bool = True


# ── Response Models ───────────────────────────────────────────────────────────

class UserPublic(BaseModel):
    """Safe user representation — never includes the password hash."""
    id: str
    full_name: str
    email: str
    created_at: datetime
    is_active: bool


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Internal model for decoded JWT payload."""
    user_id: Optional[str] = None
    token_type: Optional[str] = None  # "access" or "refresh"
