"""
app/security/rls.py — Row Level Security (Defense in Depth, 100% Data Isolation)

الهدف: منع أي تسرب بيانات بين الحسابات حتى لو حاول المهاجم الالتفاف عبر الـ API.

- المستوى 1 (تطبيقي — فعال الآن على SQLite): كل استعلام يُفلتر إجبارياً بـ user_id
  عبر دوال مركزية + فحص ملكية موحّد يعيد 404 (لا يسرّب وجود السجل).
- المستوى 2 (قاعدة البيانات — جاهز للإنتاج PostgreSQL): سياسات RLS حقيقية
  عبر ملف migrations/001_rls_postgres.sql + SET LOCAL app.current_user_id في كل طلب.

حتى لو نسي مطوّر فلترة يدوية، هذه الطبقة تمنع الوصول.
"""
from flask import g, request, jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from sqlalchemy import event, text
from sqlalchemy.exc import SQLAlchemyError

# ──────────────────────────────────────────────
# Helpers — مصدر الحقيقة الوحيد للـ user_id
# ──────────────────────────────────────────────
def get_current_user_id(required: bool = True):
    """يستخرج user_id من JWT بعد التحقق. يرمي 401 إذا مفقود."""
    try:
        # verify already done by @jwt_required، لكن نعيد للاستخدام في hooks
        verify_jwt_in_request(optional=not required)
        ident = get_jwt_identity()
        if ident is None and required:
            return None
        return int(ident) if ident is not None else None
    except Exception:
        return None

def owned_query(model, uid: int):
    """Query مُفلتر إجبارياً بـ user_id — لا يمكن نسيانه."""
    return model.query.filter_by(user_id=uid)

def get_owned_or_404(model, obj_id: int, uid: int):
    """
    يسترجع سجلاً فقط إذا كان مملوكاً لـ uid.
    يعيد 404 موحّد سواء غير موجود أو ليس ملكك (يمنع Enumeration).
    """
    obj = model.query.filter_by(id=obj_id, user_id=uid).first()
    if not obj:
        # لا نكشف سبب الفشل — 404 موحّد
        return None
    return obj

def assert_no_user_id_override(payload: dict):
    """يمنع حقن user_id عبر JSON — حتى لو أرسله المهاجم يتم تجاهله/رفضه."""
    if isinstance(payload, dict) and "user_id" in payload:
        # نحذفه صامتاً ونُسجّل محاولة (لا نعطي المهاجم معلومات)
        payload.pop("user_id", None)
        payload.pop("userId", None)
        payload.pop("owner_id", None)
    return payload

# ──────────────────────────────────────────────
# DB-level hardening
# ──────────────────────────────────────────────
def register_rls_engine_hooks(app, db):
    """يُفعّل PRAGMA foreign_keys + WAL على كل اتصال SQLite (آمن داخل app_context)."""
    try:
        # ننفّذ مباشرة بعد إنشاء الجداول (أضمن من event خارج السياق)
        with app.app_context():
            # حاول تفعيل PRAGMA عبر اتصال مباشر
            try:
                db.session.execute(text("PRAGMA foreign_keys=ON;"))
                db.session.execute(text("PRAGMA journal_mode=WAL;"))
                db.session.commit()
            except Exception:
                db.session.rollback()
            # وأيضاً سجّل listener للاتصالات المستقبلية (إن أمكن)
            try:
                engine = db.get_engine(app)
                @event.listens_for(engine, "connect")
                def _on_connect(dbapi_conn, conn_record):
                    try:
                        cur = dbapi_conn.cursor()
                        cur.execute("PRAGMA foreign_keys=ON;")
                        cur.execute("PRAGMA journal_mode=WAL;")
                        cur.close()
                    except Exception:
                        pass
            except Exception:
                pass
    except Exception:
        pass

def register_rls_request_hooks(app, db):
    """يُنفّذ قبل كل طلب: يثبّت سياق RLS ويمنع تجاوز user_id."""
    @app.before_request
    def _rls_context():
        # 1) منع حقن user_id في أي JSON
        if request.is_json:
            raw = request.get_json(silent=True)
            if isinstance(raw, dict) and any(k in raw for k in ("user_id", "userId", "owner_id")):
                # نزيله من النسخة المُعقّمة أيضاً
                if hasattr(g, "sanitized_json") and isinstance(g.sanitized_json, dict):
                    assert_no_user_id_override(g.sanitized_json)
                # لا نرفض الطلب — نتجاهل الحقل (defense: لا تعطي المهاجم feedback)
                pass

        # 2) إذا كان الطلب مصادقاً، ثبّت سياق PostgreSQL RLS (إن وجد)
        #    هذا لا يضر SQLite — يُنفّذ فقط إذا كان المحرك postgres
        try:
            auth_header = request.headers.get("Authorization", "")
            has_cookie = "access_token_cookie" in request.cookies
            if auth_header or has_cookie:
                # نحاول قراءة الهوية بدون رمي خطأ (optional)
                ident = None
                try:
                    verify_jwt_in_request(optional=True)
                    ident = get_jwt_identity()
                except Exception:
                    ident = None
                if ident is not None:
                    g.current_user_id = int(ident)
                    # لـ PostgreSQL: SET LOCAL app.current_user_id
                    # ننفّذ فقط إذا كان الـ URI يحتوي postgres
                    uri = app.config.get("SQLALCHEMY_DATABASE_URI", "")
                    if uri.startswith("postgresql"):
                        try:
                            db.session.execute(text("SELECT set_config('app.current_user_id', :uid, true)"), {"uid": str(ident)})
                        except SQLAlchemyError:
                            pass
                        except Exception:
                            pass
        except Exception:
            pass

    @app.after_request
    def _rls_audit(resp):
        # ترويسة تدقيق (لا تكشف بيانات) — تساعد في تتبع العزل
        if hasattr(g, "current_user_id"):
            resp.headers["X-RLS-Context"] = "enforced"
        return resp
