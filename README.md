# Nemvai — Secure by Design

> **منصة الإنتاجية والحسابات الآمنة** — مهام ذكية + عادات بسلاسل إنجاز + بومودورو — مبني بأعلى معايير الأمان (Security First).

![Secure](https://img.shields.io/badge/Secure-by--Design-7c3aed)
![Python](https://img.shields.io/badge/Flask-3.1-000?logo=flask)
![Dark](https://img.shields.io/badge/Theme-Modern%20Dark-11111a)

## 🔒 الأمان المُطلق (Security First) — الأربع أولويات المطلوبة

| التهديد | الحل في `nemvai` | الملف |
|---|---|---|
| **SQL Injection** | SQLAlchemy ORM معاملات مُحضّرة، لا يوجد concat، `user_id` مفلتر في كل طلب | `app/models.py:36`, `app/api/tasks.py:15` |
| **XSS** | `bleach` تنظيف كل JSON + CSP header + `textContent` فقط (لا `innerHTML`) | `app/security/middleware.py:14`, `app/static/js/dashboard.js:45` |
| **CSRF** | JWT HttpOnly + `SameSite=Strict` + `JWT_COOKIE_CSRF_PROTECT=True` في الإنتاج + `X-CSRF-TOKEN` | `app/config.py:38`, `app/static/js/auth.js:22` |
| **Broken Auth** | `bcrypt` cost 12 + JWT expiry 2h/7d + rate limit 5/min + تحقق جلسة في كل طلب `jwt_required` | `app/models.py:21`, `app/auth/routes.py:22` |
| **Plain Text** | كلمات المرور لا تُحفظ أبداً كنص — `password_hash` فقط | `app/models.py:14` |
| **Data Isolation** | كل `Task/Habit/Log` مرتبط بـ `user_id` و `filter_by(user_id=uid)` والتحقق `404` لو ليس مالكاً | `app/api/tasks.py:30`, `app/api/habits.py:18` |
| **Secrets** | لا مفاتيح في الكود — كل شيء من `.env` فقط، و `.env` مجمّد في `.gitignore` | `app/config.py:11`, `.gitignore:6` |

## 🚀 التشغيل المباشر (جاهز للتجربة في المتصفح)

```powershell
cd arenax-productivity-hub   # ← هذا هو مستودع nemvai المحلي (origin https://github.com/AlilouTopG/nemvai.git)
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# عدّل SECRET_KEY و JWT_SECRET_KEY بقيم 32+ حرف قوية
python run.py
# افتح http://127.0.0.1:5000  → تسجيل/دخول → لوحة التحكم
```

تم اختباره: `GET /health → 200`, `POST /api/auth/register → 201`, XSS تم تنظيفه, SQLi لم يسقط الجدول, Bob لا يرى مهام Alice.

الإنتاج (PostgreSQL):
```env
DATABASE_URL=postgresql://user:pass@host:5432/nemvai
FLASK_ENV=production
```

## 📁 الهيكل (Backend + Frontend Dark)

```
nemvai/  (arenax-productivity-hub)
├── app/
│   ├── __init__.py          # App factory + blueprints + error handlers + CSP
│   ├── config.py            # ← يقرأ .env فقط، يرفض المفاتيح الضعيفة في prod
│   ├── models.py            # User(bcrypt)/Task/Habit/HabitLog (معزولة بـ user_id)
│   ├── security/middleware.py # CSP + sanitization (bleach)
│   ├── auth/                # register/login/logout + JWT + rate limit
│   ├── api/                 # /api/tasks + /api/habits (كلها jwt_required + isolation)
│   ├── static/css/          # main.css + auth.css — Modern Dark Theme responsive
│   ├── static/js/           # auth.js + dashboard.js + pomodoro.js (XSS-safe)
│   └── templates/           # auth.html + dashboard.html
├── instance/                # SQLite محلي (لا يُرفع)
├── run.py                   # python run.py → http://127.0.0.1:5000
├── requirements.txt
├── .gitignore               # يحمي .env تماماً
└── .env.example
```

## 🔑 المصادقة

- `POST /api/auth/register` `{username,email,password}` → bcrypt + JWT HttpOnly
- `POST /api/auth/login` `{identifier,password}` → تحقق + cookies
- `GET  /api/auth/me` → حالة الجلسة
- `POST /api/auth/logout` → `unset_jwt_cookies`

## 📋 لوحة التحكم

1. **المهام الذكية** — إضافة/تعديل/حذف + `priority` (low/medium/high/urgent) + `status` (todo/in_progress/done) + فلترة
2. **العادات اليومية** — إنشاء عادة + `toggle` يومي + حساب `streak` تلقائياً من `HabitLog`
3. **Pomodoro** — 25/5 محلي مع صوت، بدون إرسال بيانات

## ☁️ جاهز للسحاب
- 12-factor via `.env`
- `gunicorn "app:create_app()"` جاهز

---
© 2026 Nemvai — Built Secure, Built to Scale (Security First)
