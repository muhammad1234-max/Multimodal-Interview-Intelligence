"""
Auth configuration — reads from environment variables.
All secrets must be set in backend/.env (never committed).
"""
import os
from dotenv import load_dotenv

# Load .env from the backend directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

MONGODB_URI: str = os.getenv("MONGODB_URI", "")
JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "CHANGE_ME_IN_PRODUCTION")
JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

if not MONGODB_URI:
    print("[auth/config] WARNING: MONGODB_URI is not set. Authentication will not work.")

if JWT_SECRET_KEY == "CHANGE_ME_IN_PRODUCTION":
    print("[auth/config] WARNING: JWT_SECRET_KEY is using default insecure value. Set it in backend/.env")
