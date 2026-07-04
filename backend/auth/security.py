"""
Pure cryptography utilities — bcrypt password hashing and JWT signing/verification.
No database or HTTP layer here; just functions that take and return plain values.
"""
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Literal

from jose import JWTError, jwt
from fastapi import HTTPException, status

from .config import JWT_SECRET_KEY, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
from .models import TokenData


# ── Password Utilities ────────────────────────────────────────────────────────

def hash_password(plain_password: str) -> str:
    """Return a bcrypt hash of the given plaintext password."""
    pwd_bytes = plain_password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return True if the plain password matches the stored bcrypt hash."""
    pwd_bytes = plain_password.encode('utf-8')
    hash_bytes = hashed_password.encode('utf-8')
    try:
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False


# ── JWT Utilities ─────────────────────────────────────────────────────────────

def _create_token(
    data: dict,
    token_type: Literal["access", "refresh"],
    expire_delta: timedelta,
) -> str:
    payload = data.copy()
    expire = datetime.now(timezone.utc) + expire_delta
    payload.update({"exp": expire, "token_type": token_type})
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def create_access_token(user_id: str) -> str:
    """Create a short-lived access JWT for the given user ID."""
    return _create_token(
        data={"sub": user_id},
        token_type="access",
        expire_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(user_id: str) -> str:
    """Create a long-lived refresh JWT for the given user ID."""
    return _create_token(
        data={"sub": user_id},
        token_type="refresh",
        expire_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )


def decode_token(token: str, expected_type: Literal["access", "refresh"] = "access") -> TokenData:
    """
    Decode and validate a JWT.
    Raises HTTP 401 if the token is invalid, expired, or the wrong type.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("token_type")
        if user_id is None or token_type != expected_type:
            raise credentials_exception
        return TokenData(user_id=user_id, token_type=token_type)
    except JWTError:
        raise credentials_exception
