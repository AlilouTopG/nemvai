"""
app/models.py — Isolated per-user data models
All queries MUST filter by user_id — enforced at API layer.
"""
from datetime import datetime, timezone, date
from .extensions import db
import bcrypt
try:
    from argon2 import PasswordHasher
    from argon2.exceptions import VerifyMismatchError, InvalidHash
    _ph = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4, hash_len=32, salt_len=16)
    _argon2_available = True
except Exception:
    _ph = None
    _argon2_available = False
    VerifyMismatchError = Exception
    InvalidHash = Exception

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    is_active = db.Column(db.Boolean, default=True)

    tasks = db.relationship("Task", backref="user", lazy=True, cascade="all, delete-orphan")
    habits = db.relationship("Habit", backref="user", lazy=True, cascade="all, delete-orphan")

    def set_password(self, raw: str):
        # Argon2id — gold standard (OWASP), fallback to bcrypt if unavailable
        if _argon2_available and _ph is not None:
            self.password_hash = _ph.hash(raw)
        else:
            hashed = bcrypt.hashpw(raw.encode("utf-8"), bcrypt.gensalt(rounds=12))
            self.password_hash = hashed.decode("utf-8")

    def check_password(self, raw: str) -> bool:
        # Try Argon2id first
        if _argon2_available and _ph is not None:
            try:
                # Argon2 hashes start with $argon2
                if self.password_hash.startswith("$argon2"):
                    return _ph.verify(self.password_hash, raw)
            except (VerifyMismatchError, InvalidHash):
                pass
            except Exception:
                pass
            # Fallback: check if it's Argon2 but mismatched
            try:
                if self.password_hash.startswith("$argon2"):
                    _ph.verify(self.password_hash, raw)
                    return True
                # If not argon2, try bcrypt
            except (VerifyMismatchError, InvalidHash):
                # Try bcrypt for old hashes
                try:
                    return bcrypt.checkpw(raw.encode("utf-8"), self.password_hash.encode("utf-8"))
                except Exception:
                    return False
            except Exception:
                pass
        # Fallback bcrypt (for old hashes or if argon2 unavailable)
        try:
            # If hash is bcrypt, verify
            if self.password_hash.startswith("$2b$") or self.password_hash.startswith("$2a$") or self.password_hash.startswith("$2y$"):
                result = bcrypt.checkpw(raw.encode("utf-8"), self.password_hash.encode("utf-8"))
                # Upgrade old bcrypt hash to Argon2id on successful login (transparent migration)
                if result and _argon2_available and _ph is not None:
                    try:
                        # Avoid rehashing in same request if DB not in app context — caller may handle
                        pass
                    except Exception:
                        pass
                return result
            # Try argon2 verify for any other case
            if _argon2_available and _ph is not None:
                return _ph.verify(self.password_hash, raw)
        except (VerifyMismatchError, InvalidHash):
            return False
        except Exception:
            return False
        return False

    def to_dict(self):
        return {"id": self.id, "username": self.username, "email": self.email, "created_at": self.created_at.isoformat()}


class Task(db.Model):
    __tablename__ = "tasks"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(30), default="personal")  # work, personal, study, health, other
    priority = db.Column(db.String(20), default="medium")  # low, medium, high, urgent
    status = db.Column(db.String(20), default="todo")  # todo, in_progress, done
    due_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (db.Index("ix_tasks_user_status", "user_id", "status"),)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "priority": self.priority,
            "status": self.status,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Habit(db.Model):
    __tablename__ = "habits"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    icon = db.Column(db.String(50), default="🔥")
    color = db.Column(db.String(20), default="#8b5cf6")
    # Advanced configuration — rich workflow
    frequency_per_week = db.Column(db.Integer, default=7)  # 1-7
    duration_minutes = db.Column(db.Integer, default=30)  # 5-480
    target_months = db.Column(db.Integer, default=1)  # 1-36
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    logs = db.relationship("HabitLog", backref="habit", lazy=True, cascade="all, delete-orphan")

    def to_dict(self, include_streak=False):
        data = {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "icon": self.icon,
            "color": self.color,
            "frequency_per_week": self.frequency_per_week,
            "duration_minutes": self.duration_minutes,
            "target_months": self.target_months,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_streak:
            data["streak"] = self.current_streak()
            data["completed_today"] = self.is_completed_today()
        return data

    def current_streak(self) -> int:
        """حساب سلسلة الإنجاز المتتالية (Streak) — من اليوم للخلف"""
        logs = HabitLog.query.filter_by(habit_id=self.id, user_id=self.user_id).order_by(HabitLog.log_date.desc()).all()
        if not logs:
            return 0
        completed_dates = {l.log_date for l in logs if l.completed}
        streak = 0
        cursor = date.today()
        # إذا لم يكتمل اليوم، نبدأ من أمس للسماح باحتساب السلسلة (UX decision)
        # لكن للعرض الدقيق: نحسب فقط الأيام المتتالية المكتملة حتى اليوم
        # نحسب من اليوم backwards
        while cursor in completed_dates:
            streak += 1
            cursor = date.fromordinal(cursor.toordinal() - 1)
        # إذا لم يكتمل اليوم، streak قد يكون 0 لكن قد يكون هناك سلسلة تنتهي أمس
        if streak == 0:
            cursor = date.fromordinal(date.today().toordinal() - 1)
            while cursor in completed_dates:
                streak += 1
                cursor = date.fromordinal(cursor.toordinal() - 1)
        return streak

    def is_completed_today(self) -> bool:
        return HabitLog.query.filter_by(habit_id=self.id, user_id=self.user_id, log_date=date.today(), completed=True).first() is not None


class HabitLog(db.Model):
    __tablename__ = "habit_logs"
    id = db.Column(db.Integer, primary_key=True)
    habit_id = db.Column(db.Integer, db.ForeignKey("habits.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    log_date = db.Column(db.Date, nullable=False, default=date.today)
    completed = db.Column(db.Boolean, default=True)

    __table_args__ = (
        db.UniqueConstraint("habit_id", "log_date", name="uq_habit_day"),
        db.Index("ix_habitlog_user_date", "user_id", "log_date"),
    )

    def to_dict(self):
        return {"id": self.id, "habit_id": self.habit_id, "log_date": self.log_date.isoformat(), "completed": self.completed}
