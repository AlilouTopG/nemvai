"""
app/api/tasks.py — Smart Task Manager (RLS 100% — Row Level Security)
كل وصول يُفلتر إجبارياً عبر owned_query / get_owned_or_404
"""
from datetime import datetime
from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required
from app.extensions import db, limiter
from app.models import Task
from app.auth.utils import sanitize_str
from app.security.rls import get_current_user_id, get_owned_or_404, owned_query, assert_no_user_id_override

tasks_bp = Blueprint("tasks", __name__)

VALID_CATS = {"work", "personal", "study", "health", "other"}
VALID_PRIO = {"low", "medium", "high", "urgent"}
VALID_STATUS = {"todo", "in_progress", "done"}

def _uid():
    uid = get_current_user_id(required=True)
    if uid is None:
        # jwt_required سيُرجع 401 قبل الوصول، لكن كطبقة دفاع إضافية
        return None
    return uid

def _payload():
    raw = getattr(g, "sanitized_json", None) or request.get_json(silent=True) or {}
    # منع حقن user_id بأي شكل
    if isinstance(raw, dict):
        assert_no_user_id_override(raw)
    return raw

@tasks_bp.route("", methods=["GET"])
@jwt_required()
@limiter.limit("60 per minute")
def list_tasks():
    uid = _uid()
    # RLS: لا يمكن قراءة إلا صفوفك
    q = owned_query(Task, uid)
    status = request.args.get("status")
    category = request.args.get("category")
    priority = request.args.get("priority")
    if status in VALID_STATUS:
        q = q.filter(Task.status == status)
    if category in VALID_CATS:
        q = q.filter(Task.category == category)
    if priority in VALID_PRIO:
        q = q.filter(Task.priority == priority)
    # محاولة تمرير user_id عبر query تُجهل تماماً (RLS يمنعها)
    # لا نقرأ request.args.get("user_id") عمداً
    tasks = q.order_by(Task.created_at.desc()).all()
    return jsonify([t.to_dict() for t in tasks])

@tasks_bp.route("", methods=["POST"])
@jwt_required()
@limiter.limit("30 per minute")
def create_task():
    uid = _uid()
    data = _payload()
    title = sanitize_str(data.get("title", ""), 200)
    if not title or len(title) < 2:
        return jsonify({"error": "العنوان مطلوب (2+ أحرف)"}), 400
    desc = sanitize_str(data.get("description", ""), 2000)
    cat = sanitize_str(data.get("category", "personal"), 20).lower()
    prio = sanitize_str(data.get("priority", "medium"), 20).lower()
    status = sanitize_str(data.get("status", "todo"), 20).lower()
    if cat not in VALID_CATS:
        cat = "personal"
    if prio not in VALID_PRIO:
        prio = "medium"
    if status not in VALID_STATUS:
        status = "todo"
    due = None
    if data.get("due_date"):
        try:
            due = datetime.fromisoformat(str(data["due_date"]).strip()).date()
        except Exception:
            return jsonify({"error": "صيغة due_date غير صالحة (YYYY-MM-DD)"}), 400
    # RLS: user_id يُؤخذ حصراً من التوكن، لا من الـ payload
    t = Task(user_id=uid, title=title, description=desc, category=cat, priority=prio, status=status, due_date=due)
    db.session.add(t)
    db.session.commit()
    return jsonify(t.to_dict()), 201

@tasks_bp.route("/<int:tid>", methods=["PUT", "PATCH"])
@jwt_required()
def update_task(tid):
    uid = _uid()
    # RLS صارم: حتى لو خمّن المهاجم id لعائد لمستخدم آخر → 404 موحّد
    t = get_owned_or_404(Task, tid, uid)
    if not t:
        return jsonify({"error": "المهمة غير موجودة"}), 404
    data = _payload()
    # لا يمكن تغيير user_id أبداً — نتجاهل الحقل حتى لو أُرسل
    if "title" in data:
        title = sanitize_str(data["title"], 200)
        if not title or len(title) < 2:
            return jsonify({"error": "عنوان غير صالح"}), 400
        t.title = title
    if "description" in data:
        t.description = sanitize_str(data["description"], 2000)
    if "category" in data:
        cat = sanitize_str(data["category"], 20).lower()
        if cat in VALID_CATS:
            t.category = cat
    if "priority" in data:
        prio = sanitize_str(data["priority"], 20).lower()
        if prio in VALID_PRIO:
            t.priority = prio
    if "status" in data:
        st = sanitize_str(data["status"], 20).lower()
        if st in VALID_STATUS:
            t.status = st
    if "due_date" in data:
        if not data["due_date"]:
            t.due_date = None
        else:
            try:
                t.due_date = datetime.fromisoformat(str(data["due_date"]).strip()).date()
            except Exception:
                return jsonify({"error": "صيغة due_date غير صالحة"}), 400
    db.session.commit()
    return jsonify(t.to_dict())

@tasks_bp.route("/<int:tid>", methods=["DELETE"])
@jwt_required()
def delete_task(tid):
    uid = _uid()
    t = get_owned_or_404(Task, tid, uid)
    if not t:
        return jsonify({"error": "غير موجود"}), 404
    db.session.delete(t)
    db.session.commit()
    return jsonify({"msg": "تم الحذف"}), 200

# لضمان عدم نسيان أي مسار: لا يوجد مسار GET /<id> بدون RLS — لو أُضيف مستقبلاً يجب استخدام get_owned_or_404
