# gunicorn.conf.py — Nemvai Production (OWASP + Secure)
import multiprocessing

bind = "0.0.0.0:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
timeout = 30
keepalive = 5
max_requests = 1000
max_requests_jitter = 100

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# Preload for performance + graceful reload
preload_app = True

def when_ready(server):
    server.log.info("Nemvai is ready — Secure by Design (OWASP + RLS)")

def on_starting(server):
    server.log.info("Starting Nemvai with Secure Headers + RLS + RateLimit")
