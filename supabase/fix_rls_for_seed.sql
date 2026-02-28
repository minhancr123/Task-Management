-- Add migration to fix RLS for admin seeding
-- Run this in Supabase SQL Editor

-- 1. Timesheets: Allow admin to insert for others
DROP POLICY IF EXISTS "timesheets_insert" ON timesheets;
CREATE POLICY "timesheets_insert" ON timesheets FOR INSERT WITH CHECK (
  auth.uid() = user_id OR is_admin(auth.uid())
);

-- 2. Leave Requests: Allow admin to insert for others
DROP POLICY IF EXISTS "leave_requests_insert" ON leave_requests;
CREATE POLICY "leave_requests_insert" ON leave_requests FOR INSERT WITH CHECK (
  auth.uid() = user_id OR is_admin(auth.uid())
);

-- 3. KPI Reviews: Allow admin to insert
DROP POLICY IF EXISTS "kpi_reviews_insert" ON kpi_reviews;
CREATE POLICY "kpi_reviews_insert" ON kpi_reviews FOR INSERT WITH CHECK (
  auth.uid() = user_id OR is_manager_or_above(auth.uid())
);

-- 4. Documents: Allow admin to insert
DROP POLICY IF EXISTS "documents_insert" ON documents;
CREATE POLICY "documents_insert" ON documents FOR INSERT WITH CHECK (
  auth.uid() = uploaded_by OR is_admin(auth.uid())
);

-- 5. Task Comments: Allow admin to insert for others (migration simulation)
DROP POLICY IF EXISTS "task_comments_insert" ON task_comments;
CREATE POLICY "task_comments_insert" ON task_comments FOR INSERT WITH CHECK (
  auth.uid() = user_id OR is_admin(auth.uid())
);
