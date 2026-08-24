"""
ArenaX Productivity Hub — App Factory (Secure by Design)
"""
import os
from flask import Flask, render_template, jsonify, request, send_from_directory
from .config import Config
from .extensions import db, jwt, cors, limiter
from .security.middleware import register_security_hooks
from .security.rls import register_rls_engine_hooks, register_rls_request_hooks

def create_app():
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(Config)

    # Ensure instance folder exists (for sqlite)
    try:
        os.makedirs(app.instance_path, exist_ok=True)
    except OSError:
        pass

    # Init extensions
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, supports_credentials=True, origins=[os.getenv("FRONTEND_URL", "http://localhost:5000")])
    limiter.init_app(app)

    register_security_hooks(app)
    # RLS — Row Level Security (Request hooks أولاً)
    register_rls_request_hooks(app, db)

    # JWT blocklist — يمنع Authorization Bypass عبر توكن مُلغى (بعد logout)
    from .extensions import revoked_jtis
    @jwt.token_in_blocklist_loader
    def _is_revoked(jwt_header, jwt_payload):
        return jwt_payload.get("jti") in revoked_jtis

    @jwt.revoked_token_loader
    def _revoked(jwt_header, jwt_payload):
        return jsonify({"error": "الجلسة أُلغيت — سجل الدخول مجدداً"}), 401

    # JWT error handlers — Secure (لا تسريب تفاصيل في الإنتاج)
    @jwt.unauthorized_loader
    def _unauth(msg):
        if app.config.get("FLASK_ENV") == "production":
            return jsonify({"error": "غير مصرح — سجل الدخول أولاً"}), 401
        return jsonify({"error": "غير مصرح — سجل الدخول أولاً", "detail": msg}), 401

    @jwt.invalid_token_loader
    def _invalid(msg):
        if app.config.get("FLASK_ENV") == "production":
            return jsonify({"error": "توكن غير صالح"}), 422
        return jsonify({"error": "توكن غير صالح", "detail": msg}), 422

    @jwt.expired_token_loader
    def _expired(jwt_header, jwt_payload):
        return jsonify({"error": "انتهت الجلسة — سجل الدخول مجدداً"}), 401

    # Blueprints
    from .auth.routes import auth_bp
    from .api.tasks import tasks_bp
    from .api.habits import habits_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(tasks_bp, url_prefix="/api/tasks")
    app.register_blueprint(habits_bp, url_prefix="/api/habits")

    # Frontend routes — فصل معماري نظيف (OWASP + Factory)
    @app.route("/")
    def index():
        # Homepage مخصص حصرياً لـ To-Do (مواصفات جديدة) — JS سيتحقق من الجلسة ويحول لـ /auth إن لزم
        return render_template("todos.html")

    @app.route("/todos")
    def todos_page():
        return render_template("todos.html")

    @app.route("/calendar")
    def calendar_page():
        return render_template("calendar.html")

    @app.route("/habits")
    def habits_page():
        return render_template("habits.html")

    @app.route("/auth")
    def auth_page():
        return render_template("auth.html")

    @app.route("/dashboard")
    def dashboard():
        # legacy — تحويل للمسار الجديد
        from flask import redirect
        return redirect("/todos", code=302)

    @app.route("/health")
    def health():
        return jsonify({"status": "ok", "app": app.config["APP_NAME"]})

    # Error handlers — Secure (OWASP: لا تسريب مسارات/Stack traces في الإنتاج)
    @app.errorhandler(404)
    def not_found(e):
        # في الـ API نعيد JSON عام بدون تفاصيل، في الواجهة نعيد الصفحة
        if request.path.startswith("/api/"):
            return jsonify({"error": "غير موجود"}), 404
        return render_template("auth.html"), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "طريقة غير مسموحة"}), 405

    @app.errorhandler(429)
    def ratelimit(e):
        # في الإنتاج لا نُسرب تفاصيل الـ limiter
        if app.config.get("FLASK_ENV") == "production":
            return jsonify({"error": "عدد طلبات كثير — حاول لاحقاً"}), 429
        return jsonify({"error": "عدد طلبات كثير — حاول لاحقاً", "detail": str(e)}), 429

    @app.errorhandler(500)
    def server_err(e):
        # لا نُسرب أي تفاصيل تقنية أو مسارات ملفات
        app.logger.error(f"Internal error at {request.path}: {type(e).__name__}")
        return jsonify({"error": "خطأ داخلي"}), 500

    @app.errorhandler(Exception)
    def _unhandled(e):
        # أي استثناء غير متوقع — لا نعرض Stack trace للمستخدم
        if isinstance(e, (KeyError, ValueError, TypeError, AttributeError)):
            app.logger.error(f"Unhandled {type(e).__name__} at {request.path}")
            return jsonify({"error": "خطأ في الطلب"}), 400
        # Let Flask handle HTTPExceptions normally
        from werkzeug.exceptions import HTTPException
        if isinstance(e, HTTPException):
            return e
        app.logger.error(f"Unhandled exception at {request.path}: {type(e).__name__}")
        return jsonify({"error": "خطأ داخلي"}), 500

    # Create tables + تفعيل RLS على مستوى المحرك
    with app.app_context():
        from . import models  # noqa
        db.create_all()
        # تفعيل PRAGMA بعد إنشاء الجداول (SQLite)
        try:
            register_rls_engine_hooks(app, db)
        except Exception:
            pass

    return app
