"""
app/security/audit.py — Structured Security Audit Logging (OWASP, masking)
Logs: failed logins, suspicious access, unauthorized API calls — no sensitive data leak.
"""
import logging
import json
import os
import re
from datetime import datetime, timezone
from flask import request, g

# Setup audit logger — writes to instance/audit.log (not in git) + stdout
_audit_logger = None

def _get_audit_logger(app=None):
    global _audit_logger
    if _audit_logger:
        return _audit_logger
    logger = logging.getLogger("nemvai.audit")
    logger.setLevel(logging.INFO)
    logger.propagate = False
    # Prevent duplicate handlers
    if not logger.handlers:
        # File handler — instance/audit.log
        try:
            log_dir = os.path.join(os.getcwd(), "instance")
            os.makedirs(log_dir, exist_ok=True)
            fh = logging.FileHandler(os.path.join(log_dir, "audit.log"), encoding="utf-8")
            fh.setLevel(logging.INFO)
            logger.addHandler(fh)
        except Exception:
            pass
        # Stream handler for Render logs
        sh = logging.StreamHandler()
        sh.setLevel(logging.INFO)
        logger.addHandler(sh)
    _audit_logger = logger
    return logger

def _mask_email(email: str) -> str:
    if not email or "@" not in email:
        return "***"
    name, domain = email.split("@", 1)
    if len(name) <= 2:
        masked = name[0] + "***"
    else:
        masked = name[0] + "***" + name[-1]
    return f"{masked}@{domain}"

def _mask_token(token: str) -> str:
    if not token:
        return "***"
    if len(token) <= 8:
        return "***"
    return token[:4] + "***" + token[-4:]

def _mask_payload(data: dict) -> dict:
    if not isinstance(data, dict):
        return {}
    masked = {}
    for k, v in data.items():
        lk = k.lower()
        if "password" in lk or "pwd" in lk:
            masked[k] = "***"
        elif "token" in lk:
            masked[k] = _mask_token(str(v))
        elif "email" in lk and isinstance(v, str):
            masked[k] = _mask_email(v)
        elif lk in ("authorization", "cookie", "set-cookie"):
            masked[k] = "***"
        else:
            # Truncate long values
            masked[k] = str(v)[:200] if isinstance(v, str) else v
    return masked

def audit_log(event: str, details: dict = None, level: str = "INFO"):
    """Structured audit log — JSON, masked, timestamp, IP, user_id"""
    try:
        logger = _get_audit_logger()
        # Get request context safely
        try:
            ip = request.remote_addr or "unknown"
            path = request.path
            method = request.method
            ua = request.headers.get("User-Agent", "")[:120]
            user_id = getattr(g, "current_user_id", None) or getattr(g, "audit_user_id", None)
        except Exception:
            ip = "unknown"
            path = "unknown"
            method = "unknown"
            ua = ""
            user_id = None

        record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event": event,
            "ip": ip,
            "method": method,
            "path": path,
            "user_id": user_id,
            "user_agent": ua,
            "details": _mask_payload(details or {}),
        }
        # Also add X-Request-ID if present
        try:
            req_id = request.headers.get("X-Request-ID")
            if req_id:
                record["request_id"] = req_id[:40]
        except Exception:
            pass

        msg = json.dumps(record, ensure_ascii=False)
        if level == "WARNING":
            logger.warning(msg)
        elif level == "ERROR":
            logger.error(msg)
        else:
            logger.info(msg)
    except Exception:
        # Never break request due to logging
        pass

def register_audit_hooks(app):
    """Hook into request lifecycle for suspicious patterns"""
    @app.before_request
    def _audit_before():
        # Track IP for rate limit / suspicious
        g.audit_start = datetime.now(timezone.utc)
        # Mark user_id if JWT present (for logging)
        try:
            from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
            verify_jwt_in_request(optional=True)
            ident = get_jwt_identity()
            if ident:
                g.audit_user_id = int(ident)
        except Exception:
            pass

    @app.after_request
    def _audit_after(resp):
        # Log unauthorized / forbidden
        try:
            if resp.status_code in (401, 403, 422):
                # Only log for API and auth
                if request.path.startswith("/api/"):
                    # Avoid logging health checks
                    if request.path != "/api/auth/me":
                        audit_log(
                            "unauthorized_access",
                            {"status": resp.status_code, "path": request.path, "method": request.method},
                            level="WARNING"
                        )
            # Log rate limit
            if resp.status_code == 429:
                audit_log(
                    "rate_limit_exceeded",
                    {"path": request.path, "method": request.method, "limit": resp.headers.get("X-RateLimit-Limit", "")},
                    level="WARNING"
                )
        except Exception:
            pass
        return resp

# Convenience helpers for auth routes
def log_failed_login(identifier: str, reason: str = "invalid_credentials"):
    audit_log("failed_login", {"identifier": _mask_email(identifier) if "@" in identifier else identifier[:20], "reason": reason}, level="WARNING")

def log_success_login(user_id: int, username: str):
    audit_log("successful_login", {"user_id": user_id, "username": username[:30]})

def log_logout(user_id):
    audit_log("logout", {"user_id": user_id})

def log_suspicious(event: str, details: dict):
    audit_log(f"suspicious_{event}", details, level="WARNING")
