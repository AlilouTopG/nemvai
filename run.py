"""
ArenaX Productivity Hub — Entry point
"""
from app import create_app

app = create_app()

if __name__ == "__main__":
    import os
    debug = os.getenv("FLASK_ENV") != "production"
    # 0.0.0.0 للسماح بالمعاينة عبر المنصة / الشبكة
    app.run(host="0.0.0.0", port=5000, debug=debug, use_reloader=False)
