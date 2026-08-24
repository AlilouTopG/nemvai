"""
app/config.py — Secure by Design configuration (OWASP Top 10 Ready + Persistent DB)
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
    gen = secrets.token_urlsafe(48)
    print(f"[WARN] {name} not set — using ephemeral dev secret. Set it in .env for persistence.")
    return gen

def _get_database_uri() -> str:
    """Robust DATABASE_URL handling — persistent SQLite/PostgreSQL switch (Render free tier safe)"""
    raw = os.getenv("DATABASE_URL", "").strip()
    if not raw:
        # Default: persistent local SQLite in instance/ (works on Render ephemeral, but free tier okay)
        # For true persistence on Render, set DATABASE_URL=sqlite:////data/nemvai.db with disk mount at /data
        return "sqlite:///arenax.db"

    # Prevent credential leak in logs — never log raw URI
    # Handle postgres:// (Render/Heroku old) -> postgresql:// (SQLAlchemy)
    if raw.startswith("postgres://"):
        raw = raw.replace("postgres://", "postgresql://", 1)

    # Handle sqlite with custom path — ensure directory exists hint (actual mkdir in app factory)
    # e.g., sqlite:////data/nemvai.db, sqlite:///instance/custom.db, sqlite:////opt/render/project/src/data/nemvai.db
    # If it's a bare path without scheme, convert to sqlite URI
    if raw.startswith("/") or raw.startswith("E:") or raw.endswith(".db") and "://" not in raw:
        # Bare file path -> convert to sqlite URI with 4 slashes for absolute
        if raw.startswith("/"):
            return f"sqlite:////{raw.lstrip('/')}"
        return f"sqlite:///{raw}"

    # Validate scheme — whitelist only
    allowed_prefixes = ("sqlite://", "postgresql://", "postgresql+psycopg2://")
    if not raw.startswith(allowed_prefixes):
        # Fallback to sqlite to avoid injection via crafted URI
        print(f"[WARN] DATABASE_URL scheme not allowed — falling back to sqlite")
        return "sqlite:///arenax.db"

    return raw

def _get_engine_options(uri: str) -> dict:
    """Pooling + security per DB type (prevents injection via URI params)"""
    base = {"pool_pre_ping": True}
    if uri.startswith("sqlite"):
        # SQLite: single thread, no pooling size, check_same_thread for Flask
        base.update({
            "connect_args": {"check_same_thread": False},
            # No pool_size for SQLite (uses NullPool internally but we keep pre_ping)
        })
    elif uri.startswith("postgresql"):
        # PostgreSQL: robust pooling for production (Render)
        base.update({
            "pool_size": int(os.getenv("DB_POOL_SIZE", "5")),
            "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "10")),
            "pool_recycle": int(os.getenv("DB_POOL_RECYCLE", "300")),
            "pool_timeout": int(os.getenv("DB_POOL_TIMEOUT", "30")),
            "connect_args": {
                "connect_timeout": 10,
                "sslmode": os.getenv("DB_SSLMODE", "prefer"),  # Render requires prefer/require
            }
        })
    return base

class Config:
    SECRET_KEY = _require_secret("SECRET_KEY")
    JWT_SECRET_KEY = _require_secret("JWT_SECRET_KEY")

    # Database — persistent switch (SQLite default for free tier, PostgreSQL for production)
    SQLALCHEMY_DATABASE_URI = _get_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = _get_engine_options(SQLALCHEMY_DATABASE_URI)
    # Prevent leaking DB errors
    PROPAGATE_EXCEPTIONS = False

    # JWT — HttpOnly, Secure, SameSite=Strict (OWASP)
    JWT_TOKEN_LOCATION = ["headers", "cookies"]
    JWT_COOKIE_SECURE = os.getenv("FLASK_ENV") == "production"
    JWT_COOKIE_HTTPONLY = True
    JWT_COOKIE_SAMESITE = "Strict"
    JWT_COOKIE_CSRF_PROTECT = os.getenv("FLASK_ENV") == "production"
    JWT_ACCESS_COOKIE_NAME = "access_token_cookie"
    JWT_REFRESH_COOKIE_NAME = "refresh_token_cookie"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_HOURS", "2")))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES_DAYS", "7")))
    JWT_COOKIE_DOMAIN = None

    # Flask session cookies
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SECURE = os.getenv("FLASK_ENV") == "production"
    SESSION_COOKIE_SAMESITE = "Strict"
    REMEMBER_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_SECURE = os.getenv("FLASK_ENV") == "production"
    REMEMBER_COOKIE_SAMESITE = "Strict"

    # Rate limiting
    RATELIMIT_DEFAULT = os.getenv("RATE_LIMIT_API", "60 per minute")
    RATELIMIT_STORAGE_URI = "memory://"
    RATELIMIT_HEADERS_ENABLED = True

    # App
    APP_NAME = os.getenv("APP_NAME", "Nemvai")
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
