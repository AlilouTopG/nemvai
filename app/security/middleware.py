"""
app/security/middleware.py — Defence in depth
- Security headers (CSP, HSTS, X-Frame, etc.)
- Input sanitization (XSS via bleach)
- NoSQL/SQL injection: ORM + validation (never string concat)
"""
import bleach
from flask import request, g

ALLOWED_TAGS = []  # strip all HTML by default
ALLOWED_ATTRS = {}

def sanitize_input(value: str) -> str:
    if not isinstance(value, str):
        return value
    # Strip HTML tags, then trim
    cleaned = bleach.clean(value, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS, strip=True)
    return cleaned.strip()

def sanitize_payload(data):
    if isinstance(data, dict):
        return {k: sanitize_payload(v) for k, v in data.items()}
    if isinstance(data, list):
        return [sanitize_payload(v) for v in data]
    if isinstance(data, str):
        return sanitize_input(data)
    return data

def register_security_hooks(app):
    @app.before_request
    def _sanitize():
        # sanitize JSON payload early (XSS prevention)
        if request.is_json:
            try:
                raw = request.get_json(silent=True)
                if isinstance(raw, dict):
                    g.sanitized_json = sanitize_payload(raw)
                else:
                    g.sanitized_json = raw
            except Exception:
                g.sanitized_json = None

    @app.after_request
    def _headers(resp):
        # ——— Helmet-like headers ———
        resp.headers["X-Content-Type-Options"] = "nosniff"
        resp.headers["X-Frame-Options"] = "DENY"
        resp.headers["X-XSS-Protection"] = "0"  # modern: rely on CSP
        resp.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        resp.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        # CSP — strict, allows self + inline styles needed for luxury UI (nonce would be better in prod)
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self'; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; form-action 'self'"
        )
        resp.headers["Content-Security-Policy"] = csp
        if app.config.get("FLASK_ENV") == "production":
            resp.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        # No cache for API sensitive data
        if request.path.startswith("/api/"):
            resp.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
            resp.headers["Pragma"] = "no-cache"
        return resp
