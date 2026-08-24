"""
app/api/habits.py — Habit Tracker + Streaks (isolated per user)
"""
from datetime import date, datetime
from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db, limiter
from app.models import Habit, HabitLog
from app.auth.utils import sanitize_str

habits_bp = Blueprint("habits", __name__)

def _uid():
    return int(get_jwt_identity())

def _payload():
    return getattr(g, "sanitized_json", None) or request.get_json(silent=True) or {}

@habits_bp.route("", methods=["GET"])
@jwt_required()
def list_habits():
    uid = _uid()
    habits = Habit.query.filter_by(user_id=uid).order_by(Habit.created_at.desc()).all()
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
    # basic color validation
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
    h = Habit.query.filter_by(id=hid, user_id=uid).first()
    if not h:
        return jsonify({"error": "غير موجود"}), 404
    db.session.delete(h)
    db.session.commit()
    return jsonify({"msg": "تم الحذف"}), 200

@habits_bp.route("/<int:hid>/toggle", methods=["POST"])
@jwt_required()
def toggle_habit(hid):
    uid = _uid()
    h = Habit.query.filter_by(id=hid, user_id=uid).first()
    if not h:
        return jsonify({"error": "غير موجود"}), 404
    data = _payload()
    # allow specific date or default today
    target = date.today()
    if data.get("date"):
        try:
            target = datetime.fromisoformat(str(data["date"]).strip()).date()
        except Exception:
            return jsonify({"error": "صيغة date غير صالحة"}), 400

    log = HabitLog.query.filter_by(habit_id=hid, user_id=uid, log_date=target).first()
    if log:
        log.completed = not log.completed
        if not log.completed:
            # keep record but mark incomplete (for streak calc we ignore false)
            pass
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
    # ?habit_id=1&from=2025-01-01&to=2025-12-31
    q = HabitLog.query.filter_by(user_id=uid)
    hid = request.args.get("habit_id", type=int)
    if hid:
        q = q.filter(HabitLog.habit_id == hid)
    logs = q.order_by(HabitLog.log_date.desc()).limit(500).all()
    return jsonify([l.to_dict() for l in logs])
