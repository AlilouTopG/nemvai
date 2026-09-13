import os

# منفذ التشغيل
bind = f"0.0.0.0:{os.getenv('PORT', '10000')}"

# ✅ تحديد عدد العمال برقم مناسب لخطة 512MB RAM لمنع انهيار الذاكرة
workers = int(os.getenv("WEB_CONCURRENCY", 2))

# استخدام الخيوط بدلاً من العمليات الثقيلة
worker_class = "gthread"
threads = 2

# إدارة الذاكرة وتفريغها تلقائياً بعد عدد معين من الطلبات
max_requests = 1000
max_requests_jitter = 100

# أوقات الاستجابة
timeout = 120
keepalive = 5

# تسجيل الأحداث
accesslog = "-"
errorlog = "-"
loglevel = "info"