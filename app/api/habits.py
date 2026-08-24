"""
app/api/habits.py — Habit Tracker + Streaks (RLS 100%)
"""
from datetime import date, datetime
from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required
from app.extensions import db, limiter
from app.models import Habit, HabitLog
from app.auth.utils import sanitize_str
from app.security.rls import get_current_user_id, get_owned_or_404, owned_query, assert_no_user_id_override

habits_bp = Blueprint("habits", __name__)

def _uid():
    return get_current_user_id(required=True)

def _payload():
    raw = getattr(g, "sanitized_json", None) or request.get_json(silent=True) or {}
    if isinstance(raw, dict):
        assert_no_user_id_override(raw)
    return raw

@habits_bp.route("", methods=["GET"])
@jwt_required()
def list_habits():
    uid = _uid()
    habits = owned_query(Habit, uid).order_by(Habit.created_at.desc()).all()
    return jsonify([h.to_dict(include_streak=True) for h in habits])

@habits_bp.route("", methods=["POST"])
@jwt_required()
@limiter.limit("30 per minute")
def create_habit():
    uid = _uid()
    data = _payload()
    name = sanitize_str(data.get("name", ""), 100)
    if not name or len(name) < 2:
        return jsonify({"error": "اسم العادة مطلوب"}), 400
    desc = sanitize_str(data.get("description", ""), 255)
    icon = sanitize_str(data.get("icon", "🔥"), 10) or "🔥"
    color = sanitize_str(data.get("color", "#8b5cf6"), 20)
    if not color.startswith("#"):
        color = "#8b5cf6"
    h = Habit(user_id=uid, name=name, description=desc, icon=icon, color=color)
    db.session.add(h)
    db.session.commit()
    return jsonify(h.to_dict(include_streak=True)), 201

@habits_bp.route("/<int:hid>", methods=["DELETE"])
@jwt_required()
def delete_habit(hid):
    uid = _uid()
    h = get_owned_or_404(Habit, hid, uid)
    if not h:
        return jsonify({"error": "غير موجود"}), 404
    db.session.delete(h)
    db.session.commit()
    return jsonify({"msg": "تم الحذف"}), 200

@habits_bp.route("/<int:hid>/toggle", methods=["POST"])
@jwt_required()
def toggle_habit(hid):
    uid = _uid()
    h = get_owned_or_404(Habit, hid, uid)
    if not h:
        return jsonify({"error": "غير موجود"}), 404
    data = _payload()
    target = date.today()
    if data.get("date"):
        try:
            target = datetime.fromisoformat(str(data["date"]).strip()).date()
        except Exception:
            return jsonify({"error": "صيغة date غير صالحة"}), 400
    # RLS على السجلات أيضاً
    log = HabitLog.query.filter_by(habit_id=hid, user_id=uid, log_date=target).first()
    if log:
        log.completed = not log.completed
    else:
        log = HabitLog(habit_id=hid, user_id=uid, log_date=target, completed=True)
        db.session.add(log)
    db.session.commit()
    return jsonify({
        "habit": h.to_dict(include_streak=True),
        "log": log.to_dict(),
        "streak": h.current_streak()
    })

@habits_bp.route("/logs", methods=["GET"])
@jwt_required()
def habit_logs():
    uid = _uid()
    q = owned_query(HabitLog, uid)
    hid = request.args.get("habit_id", type=int)
    if hid:
        # تحقق إضافي: هل العادة مملوكة لك قبل عرض سجلاتها؟
        habit = get_owned_or_404(Habit, hid, uid)
        if not habit:
            return jsonify({"error": "غير موجود"}), 404
        q = q.filter(HabitLog.habit_id == hid)
    logs = q.order_by(HabitLog.log_date.desc()).limit(500).all()
    return jsonify([l.to_dict() for l in logs])
