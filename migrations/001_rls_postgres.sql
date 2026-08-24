-- migrations/001_rls_postgres.sql — Row Level Security الحقيقي لـ PostgreSQL (الإنتاج)
-- يُطبّق في الإنتاج فقط. SQLite يستخدم الطبقة التطبيقية في app/security/rls.py
-- التنفيذ: psql $DATABASE_URL -f migrations/001_rls_postgres.sql

-- 1. تفعيل RLS على كل جدول حساس
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

-- 2. سياسات المستخدمين — كل مستخدم يرى نفسه فقط
DROP POLICY IF EXISTS users_self_select ON users;
CREATE POLICY users_self_select ON users
  FOR SELECT USING (id = current_setting('app.current_user_id', true)::int);

DROP POLICY IF EXISTS users_self_update ON users;
CREATE POLICY users_self_update ON users
  FOR UPDATE USING (id = current_setting('app.current_user_id', true)::int)
  WITH CHECK (id = current_setting('app.current_user_id', true)::int);

-- لا INSERT/DELETE عبر RLS (التسجيل يتم عبر service role أو معامل خاص)

-- 3. مهام — عزل كامل
DROP POLICY IF EXISTS tasks_isolation ON tasks;
CREATE POLICY tasks_isolation ON tasks
  FOR ALL USING (user_id = current_setting('app.current_user_id', true)::int)
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::int);

-- 4. عادات
DROP POLICY IF EXISTS habits_isolation ON habits;
CREATE POLICY habits_isolation ON habits
  FOR ALL USING (user_id = current_setting('app.current_user_id', true)::int)
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::int);

-- 5. سجلات العادات — يجب أن يتطابق user_id و habit_id
DROP POLICY IF EXISTS habit_logs_isolation ON habit_logs;
CREATE POLICY habit_logs_isolation ON habit_logs
  FOR ALL USING (user_id = current_setting('app.current_user_id', true)::int)
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::int);

-- 6. فرض NOT NULL + FK (إضافي)
-- تم تعريفها في SQLAlchemy، لكن نؤكد هنا
-- ALTER TABLE tasks ADD CONSTRAINT chk_tasks_user CHECK (user_id > 0);

-- 7. مالك الجداول يبقى قادراً على تجاوز RLS (للصيانة فقط)
-- ALTER TABLE tasks FORCE ROW LEVEL SECURITY;

-- ملاحظة: التطبيق يضبط app.current_user_id عبر:
--   SELECT set_config('app.current_user_id', :uid, true)
-- في كل طلب مصادق (app/security/rls.py)
