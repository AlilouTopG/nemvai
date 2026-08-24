"""
app/config.py — Secure by Design configuration
"""
import os
import secrets
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

def _require_secret(name: str, fallback_gen: bool = True) -> str:
    val = os.getenv(name)
    if val and len(val) >= 32:
        return val
    if os.getenv("FLASK_ENV") == "production":
        raise RuntimeError(f"Missing or weak {name} — set a strong 32+ char secret in .env")
    # Dev fallback: generate ephemeral secret (warn)
    gen = secrets.token_urlsafe(48)
    print(f"[WARN] {name} not set — using ephemeral dev secret. Set it in .env for persistence.")
    return gen

class Config:
    SECRET_KEY = _require_secret("SECRET_KEY")
    JWT_SECRET_KEY = _require_secret("JWT_SECRET_KEY")

    # Database — parameterized via SQLAlchemy (prevents SQLi)
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///arenax.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
    }

    # JWT — HttpOnly cookies, CSRF double-submit
    JWT_TOKEN_LOCATION = ["headers", "cookies"]
    JWT_COOKIE_SECURE = os.getenv("FLASK_ENV") == "production"  # True in prod (HTTPS only)
    JWT_COOKIE_SAMESITE = "Strict"
    # CSRF strict in production; relaxed in dev to simplify local testing (still secure via headers)
    JWT_COOKIE_CSRF_PROTECT = os.getenv("FLASK_ENV") == "production"
    JWT_ACCESS_COOKIE_NAME = "access_token_cookie"
    JWT_REFRESH_COOKIE_NAME = "refresh_token_cookie"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_HOURS", "2")))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES_DAYS", "7")))
    JWT_COOKIE_DOMAIN = None

    # Rate limiting defaults
    RATELIMIT_DEFAULT = os.getenv("RATE_LIMIT_API", "60 per minute")
    RATELIMIT_STORAGE_URI = "memory://"

    # App
    APP_NAME = os.getenv("APP_NAME", "Nemvai")
