"""
ArenaX Productivity Hub — Entry point
"""
from app import create_app

app = create_app()

if __name__ == "__main__":
    # Secure defaults: host 127.0.0.1 locally, debug off in prod
    import os
    debug = os.getenv("FLASK_ENV") != "production"
    app.run(host="127.0.0.1", port=5000, debug=debug)
