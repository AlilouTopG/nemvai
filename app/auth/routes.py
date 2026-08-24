"""
app/auth/routes.py — Registration / Login / Me / Logout
Secure: bcrypt, JWT HttpOnly cookies + CSRF, rate limit, validation, sanitization
"""
from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, set_access_cookies, set_refresh_cookies, unset_jwt_cookies
)
from app.extensions import db, limiter, revoked_jtis
from app.models import User
from app.auth.utils import validate_username, validate_password, validate_email_addr, sanitize_str

auth_bp = Blueprint("auth", __name__)

def _get_payload():
    # Prefer sanitized JSON from middleware, fallback to raw
    if hasattr(g, "sanitized_json") and g.sanitized_json is not None:
        return g.sanitized_json
    return request.get_json(silent=True) or {}

@auth_bp.route("/register", methods=["POST"])
@limiter.limit("5 per minute")
def register():
    data = _get_payload()
    username = sanitize_str(data.get("username", ""), 30)
    email_raw = sanitize_str(data.get("email", ""), 120)
    password = data.get("password", "")  # don't sanitize password chars

    ok, msg = validate_username(username)
    if not ok:
        return jsonify({"error": msg}), 400
    ok, email_or_err = validate_email_addr(email_raw)
    if not ok:
        return jsonify({"error": f"بريد غير صالح: {email_or_err}"}), 400
    email = email_or_err
    ok, msg = validate_password(password)
    if not ok:
        return jsonify({"error": msg}), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({"error": "اسم المستخدم أو البريد مستخدم مسبقاً"}), 409

    user = User(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    access = create_access_token(identity=str(user.id))
    refresh = create_refresh_token(identity=str(user.id))
    data = {"msg": "تم إنشاء الحساب بنجاح", "user": user.to_dict(), "access_token": access, "refresh_token": refresh}
    resp = jsonify(data)
    set_access_cookies(resp, access)
    set_refresh_cookies(resp, refresh)
    return resp, 201

@auth_bp.route("/login", methods=["POST"])
@limiter.limit("5 per minute")
def login():
    data = _get_payload()
    identifier = sanitize_str(data.get("identifier", "") or data.get("email", "") or data.get("username", ""), 120)
    password = data.get("password", "")

    if not identifier or not password:
        return jsonify({"error": "بيانات ناقصة"}), 400

    user = User.query.filter((User.username == identifier) | (User.email == identifier)).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "بيانات الدخول غير صحيحة"}), 401
    if not user.is_active:
        return jsonify({"error": "الحساب معطّل"}), 403

    access = create_access_token(identity=str(user.id))
    refresh = create_refresh_token(identity=str(user.id))
    data = {"msg": "تم تسجيل الدخول", "user": user.to_dict(), "access_token": access, "refresh_token": refresh}
    resp = jsonify(data)
    set_access_cookies(resp, access)
    set_refresh_cookies(resp, refresh)
    return resp, 200

@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    ident = get_jwt_identity()
    access = create_access_token(identity=ident)
    data = {"msg": "تم التحديث", "access_token": access}
    resp = jsonify(data)
    set_access_cookies(resp, access)
    return resp, 200

@auth_bp.route("/logout", methods=["POST"])
@jwt_required(optional=True)
def logout():
    # Revoke current tokens إن وُجدت (يمنع إعادة الاستخدام حتى بعد مسح الكوكيز)
    try:
        from flask_jwt_extended import get_jwt
        jwt_data = get_jwt()
        jti = jwt_data.get("jti")
        if jti:
            revoked_jtis.add(jti)
    except Exception:
        pass
    # وأيضاً revoke الـ refresh إن أُرسل
    resp = jsonify({"msg": "تم تسجيل الخروج"})
    unset_jwt_cookies(resp)
    return resp, 200

@auth_bp.route("/me", methods=["GET"])
@jwt_required(optional=True)
def me():
    ident = get_jwt_identity()
    if not ident:
        # try header cookie already handled by jwt_required
        return jsonify({"authenticated": False}), 200
    user = db.session.get(User, int(ident))
    if not user:
        return jsonify({"authenticated": False}), 200
    return jsonify({"authenticated": True, "user": user.to_dict()}), 200
