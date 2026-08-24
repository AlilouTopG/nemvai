# ArenaX Productivity Hub — Secure by Design

> **Full-Stack إنتاجي فاخر** — مهام ذكية + عادات بسلاسل إنجاز + بومودورو — مبني بأعلى معايير الأمان.

![Secure](https://img.shields.io/badge/Secure-by--Design-7c3aed)
![Python](https://img.shields.io/badge/Flask-3.1-000?logo=flask)
![Dark](https://img.shields.io/badge/Theme-Modern%20Dark-11111a)

## 🔒 الأمان أولاً (Secure by Design)

- **تشفير كلمات المرور**: `bcrypt` cost 12 + salt عشوائي
- **جلسات**: JWT + HttpOnly Cookies + SameSite Strict + CSRF double-submit + Secure flag في الإنتاج
- **حماية XSS**: تنظيف كل مدخلات بـ `bleach` + CSP headers + عدم استخدام `innerHTML` لبيانات المستخدم (textContent فقط)
- **حماية SQL/NoSQL Injection**: SQLAlchemy ORM + استعلامات مُعاملة + فلترة صارمة بـ `user_id`
- **عزل البيانات**: كل `Task/Habit/Log` مرتبط بـ `user_id` — لا يمكن لمستخدم رؤية بيانات آخر (404 موحد)
- **Headers**: HSTS, X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy, CSP, Permissions-Policy
- **Rate Limiting**: 5/min للمصادقة، 60/min للـ API
- **Validation**: email-validator + regex قوي + قوة كلمة مرور (8+ مع كبير/صغير/رقم/رمز)

## 🚀 التشغيل السريع

```powershell
cd arenax-productivity-hub
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# عدّل SECRET_KEY و JWT_SECRET_KEY بقيم قوية 32+ حرف
python run.py
# افتح http://127.0.0.1:5000
```

الإنتاج (PostgreSQL):
```env
DATABASE_URL=postgresql://user:pass@host:5432/arenax
FLASK_ENV=production
```

## 📁 الهيكل

```
arenax-productivity-hub/
├── app/
│   ├── __init__.py          # App factory + blueprints + error handlers
│   ├── config.py            # إعدادات آمنة من Env
│   ├── models.py            # User/Task/Habit/HabitLog (معزولة بـ user_id)
│   ├── security/middleware.py # CSP + sanitization
│   ├── auth/                # تسجيل/دخول + JWT cookies
│   ├── api/                 # tasks + habits (كلها jwt_required)
│   ├── static/css/          # Dark luxury theme
│   ├── static/js/           # auth + dashboard + pomodoro (XSS-safe)
│   └── templates/           # auth.html + dashboard.html
├── instance/                # SQLite (لا يُرفع)
├── run.py
├── requirements.txt
├── .gitignore
└── .env.example
```

## 🔑 API المختصر

- `POST /api/auth/register` — `{username,email,password}`
- `POST /api/auth/login` — `{identifier,password}`
- `GET  /api/auth/me`
- `POST /api/auth/refresh` (refresh token)
- `POST /api/auth/logout`
- `GET/POST /api/tasks` + `PATCH/DELETE /api/tasks/<id>` — كلها تتطلب JWT وتفلتر بـ user_id
- `GET/POST /api/habits` + `POST /api/habits/<id>/toggle` + `DELETE`

## 🎨 الواجهة

- **Auth**: زجاج ضبابي فاخر + تقييم قوة كلمة مرور حي
- **Dashboard**: إحصائيات، فلترة مهام، بومودورو دائري مع صوت، ستريك عادات، Responsive كامل

## ☁️ جاهز للسحاب

- 12-factor via `.env`
- `instance/` محلية فقط
- `gunicorn` جاهز: `gunicorn "app:create_app()"`

---
© 2026 ArenaX — Built Secure, Built to Scale
