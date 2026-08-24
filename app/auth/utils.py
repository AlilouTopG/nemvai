"""
app/auth/utils.py — Validation & password strength
"""
import re
from email_validator import validate_email, EmailNotValidError
import bleach

USERNAME_RE = re.compile(r"^[a-zA-Z0-9_\-]{3,30}$")
# At least 8 chars, 1 upper, 1 lower, 1 digit, 1 symbol
PWD_RE = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$")

def validate_username(u: str):
    if not u or not USERNAME_RE.match(u):
        return False, "اسم المستخدم 3-30 حرف (أحرف/أرقام/_/-) فقط"
    return True, ""

def validate_password(p: str):
    if not p or not PWD_RE.match(p):
        return False, "كلمة المرور ضعيفة: 8+ أحرف وتحتوي حرف كبير/صغير/رقم/رمز"
    return True, ""

def validate_email_addr(e: str):
    try:
        v = validate_email(e, check_deliverability=False)
        return True, v.normalized
    except EmailNotValidError as ex:
        return False, str(ex)

def sanitize_str(s: str, max_len=200) -> str:
    if not isinstance(s, str):
        return ""
    s = bleach.clean(s, tags=[], strip=True).strip()
    return s[:max_len]
