"""
app/extensions.py — Centralized extensions (avoid circular imports)
"""
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_cors import CORS

db = SQLAlchemy()
jwt = JWTManager()
cors = CORS()
# JWT blocklist — يمنع استخدام التوكن بعد logout (حتى انتهاء صلاحيته)
revoked_jtis = set()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["60 per minute"],
    storage_uri="memory://",
)
