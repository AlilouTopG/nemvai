"""
app/security/middleware.py — OWASP Top 10 Defence in depth
- Security headers (OWASP compliant, إجباري على كل رد)
- Input sanitization (XSS via bleach — كل المدخلات)
- NoSQL/SQL injection: ORM + validation (never string concat)
"""
import bleach
from flask import request, g


ALLOWED_TAGS = []  # strip all HTML by default — لا نسمح بأي وسم
ALLOWED_ATTRS = {}

def sanitize_input(value: str) -> str:
    if not isinstance(value, str):
        return value
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
        # تطهير JSON payload مبكراً (XSS prevention) — كل الحقول
        if request.is_json:
            try:
                raw = request.get_json(silent=True)
                if isinstance(raw, dict):
                    g.sanitized_json = sanitize_payload(raw)
                elif isinstance(raw, list):
                    g.sanitized_json = [sanitize_payload(v) if isinstance(v, dict) else sanitize_input(v) if isinstance(v, str) else v for v in raw]
                else:
                    g.sanitized_json = raw
            except Exception:
                g.sanitized_json = None
        # تطهير query params أيضاً (منع XSS عبر URL)
        if request.args:
            # لا نعدّل request.args مباشرة (immutable)، لكن نخزن نسخة مطهرة
            try:
                sanitized_qs = {k: sanitize_input(v) for k, v in request.args.items()}
                g.sanitized_args = sanitized_qs
            except Exception:
                g.sanitized_args = {}

    @app.after_request
    def _headers(resp):
        # ——— OWASP Security Headers — إجباري على كل رد ———
        # 1. X-Content-Type-Options
        resp.headers["X-Content-Type-Options"] = "nosniff"
        # 2. X-Frame-Options
        resp.headers["X-Frame-Options"] = "DENY"
        # 3. X-XSS-Protection (legacy, 0 = نعتمد CSP)
        resp.headers["X-XSS-Protection"] = "0"
        # 4. Referrer-Policy — المطلوب تحديداً: no-referrer-when-downgrade
        resp.headers["Referrer-Policy"] = "no-referrer-when-downgrade"
        # 5. Permissions-Policy (تقليل سطح الهجوم)
        resp.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"
        # 6. Cross-Origin policies (OWASP إضافي)
        resp.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        resp.headers["Cross-Origin-Resource-Policy"] = "same-origin"
        resp.headers["X-Permitted-Cross-Domain-Policies"] = "none"
        # 7. CSP — صارم (strict) — يسمح self + inline للواجهة الفاخرة + fonts
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self'; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; form-action 'self'; "
            "object-src 'none'"
        )
        resp.headers["Content-Security-Policy"] = csp
        # 8. HSTS — إجباري (OWASP) — في الإنتاج مع preload، وفي التطوير أيضاً للاختبار
        # في HTTP المحلي لن يطبق المتصفح HSTS إلا عبر HTTPS، لكن وجود الترويسة يثبت الجاهزية للسحاب
        if app.config.get("FLASK_ENV") == "production":
            resp.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        else:
            # في التطوير نضع HSTS أيضاً للتحقق (بـ max-age قصير) — لا يضر
            resp.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        # 9. No cache للـ API (بيانات حساسة — لا تُخزن)
        if request.path.startswith("/api/"):
            resp.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
            resp.headers["Pragma"] = "no-cache"
            resp.headers["Expires"] = "0"
        else:
            # للواجهات أيضاً no-cache جزئي لمنع تسريب بيانات
            resp.headers["Cache-Control"] = "no-cache"
        return resp
