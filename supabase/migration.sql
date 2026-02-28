-- ============================================================
-- Enterprise Task Management – Supabase Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Upgrade profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS position text,
  ADD COLUMN IF NOT EXISTS department_id uuid,
  ADD COLUMN IF NOT EXISTS join_date date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS annual_leave_quota integer DEFAULT 12;

-- Update role column to support new roles
-- First drop the old constraint if exists
DO $$ 
BEGIN
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Allow new role values (column stays as text, we validate in app)

-- 2. Departments
CREATE TABLE IF NOT EXISTS departments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  head_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  parent_dept_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Department Members
CREATE TABLE IF NOT EXISTS department_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('head', 'deputy', 'member')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(department_id, user_id)
);

-- 4. Teams
CREATE TABLE IF NOT EXISTS teams (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Team Members
CREATE TABLE IF NOT EXISTS team_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- 6. Projects
CREATE TABLE IF NOT EXISTS projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  start_date date,
  end_date date,
  budget decimal(15,2),
  spent decimal(15,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. Project Members
CREATE TABLE IF NOT EXISTS project_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('owner', 'manager', 'member', 'viewer')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- 8. Milestones
CREATE TABLE IF NOT EXISTS milestones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date date NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 9. Upgrade tasks table (add new columns)
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS parent_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS estimated_hours integer,
  ADD COLUMN IF NOT EXISTS actual_hours integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurrence_pattern text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;

-- Update tasks status constraint to allow new statuses
DO $$ 
BEGIN
  ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Update tasks priority constraint
DO $$ 
BEGIN
  ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Migrate existing user_id to created_by if user_id exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'user_id') THEN
    UPDATE tasks SET created_by = user_id WHERE created_by IS NULL AND user_id IS NOT NULL;
  END IF;
END $$;

-- 10. Task Comments
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 11. Task Attachments
CREATE TABLE IF NOT EXISTS task_attachments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size integer DEFAULT 0,
  file_type text,
  created_at timestamptz DEFAULT now()
);

-- 12. Task Activities
CREATE TABLE IF NOT EXISTS task_activities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz DEFAULT now()
);

-- 13. Timesheets
CREATE TABLE IF NOT EXISTS timesheets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  work_date date NOT NULL,
  hours decimal(4,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
  description text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 14. Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  leave_type text NOT NULL CHECK (leave_type IN ('annual', 'sick', 'personal', 'wfh')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days decimal(4,1) NOT NULL,
  reason text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 15. KPI Reviews
CREATE TABLE IF NOT EXISTS kpi_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  period text NOT NULL,
  self_score integer CHECK (self_score >= 0 AND self_score <= 100),
  manager_score integer CHECK (manager_score >= 0 AND manager_score <= 100),
  self_comments text,
  manager_comments text,
  goals text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 16. Documents
CREATE TABLE IF NOT EXISTS documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  uploaded_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size integer DEFAULT 0,
  file_type text,
  version integer DEFAULT 1,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 17. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'system',
  entity_type text,
  entity_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 18. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- 19. Company Settings
CREATE TABLE IF NOT EXISTS company_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name text DEFAULT 'My Company',
  logo_url text,
  working_hours_start text DEFAULT '09:00',
  working_hours_end text DEFAULT '18:00',
  working_days integer[] DEFAULT '{1,2,3,4,5}',
  fiscal_year_start integer DEFAULT 1,
  default_leave_quota integer DEFAULT 12,
  timezone text DEFAULT 'Asia/Ho_Chi_Minh',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default company settings if none exists
INSERT INTO company_settings (id) 
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM company_settings LIMIT 1);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_department_members_dept ON department_members(department_id);
CREATE INDEX IF NOT EXISTS idx_department_members_user ON department_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_dept ON projects(department_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_activities_task ON task_activities(task_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_user ON timesheets(user_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_date ON timesheets(work_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_user ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_kpi_reviews_user ON kpi_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);

-- ============================================================
-- RLS Policies (Row Level Security)
-- ============================================================

-- Enable RLS on all new tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid uuid)
RETURNS text AS $$
  SELECT role FROM profiles WHERE id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check admin/super_admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid)
RETURNS boolean AS $$
  SELECT role IN ('admin', 'super_admin') FROM profiles WHERE id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check manager+
CREATE OR REPLACE FUNCTION is_manager_or_above(user_uuid uuid)
RETURNS boolean AS $$
  SELECT role IN ('manager', 'admin', 'super_admin') FROM profiles WHERE id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Departments: everyone can read, admin+ can write
CREATE POLICY "departments_select" ON departments FOR SELECT USING (true);
CREATE POLICY "departments_insert" ON departments FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "departments_update" ON departments FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "departments_delete" ON departments FOR DELETE USING (is_admin(auth.uid()));

-- Department Members: everyone can read, admin+ can write
CREATE POLICY "dept_members_select" ON department_members FOR SELECT USING (true);
CREATE POLICY "dept_members_insert" ON department_members FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "dept_members_update" ON department_members FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "dept_members_delete" ON department_members FOR DELETE USING (is_admin(auth.uid()));

-- Teams: everyone can read, admin+ can write
CREATE POLICY "teams_select" ON teams FOR SELECT USING (true);
CREATE POLICY "teams_insert" ON teams FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "teams_update" ON teams FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "teams_delete" ON teams FOR DELETE USING (is_admin(auth.uid()));

-- Team Members
CREATE POLICY "team_members_select" ON team_members FOR SELECT USING (true);
CREATE POLICY "team_members_insert" ON team_members FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "team_members_update" ON team_members FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "team_members_delete" ON team_members FOR DELETE USING (is_admin(auth.uid()));

-- Projects: members can read their projects, manager+ can read all
CREATE POLICY "projects_select" ON projects FOR SELECT USING (
  is_manager_or_above(auth.uid()) 
  OR created_by = auth.uid()
  OR id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
);
CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (is_manager_or_above(auth.uid()) OR get_user_role(auth.uid()) = 'team_lead');
CREATE POLICY "projects_update" ON projects FOR UPDATE USING (is_manager_or_above(auth.uid()) OR created_by = auth.uid());
CREATE POLICY "projects_delete" ON projects FOR DELETE USING (is_admin(auth.uid()));

-- Project Members
CREATE POLICY "project_members_select" ON project_members FOR SELECT USING (true);
CREATE POLICY "project_members_insert" ON project_members FOR INSERT WITH CHECK (
  is_manager_or_above(auth.uid()) 
  OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role IN ('owner', 'manager'))
);
CREATE POLICY "project_members_update" ON project_members FOR UPDATE USING (is_manager_or_above(auth.uid()));
CREATE POLICY "project_members_delete" ON project_members FOR DELETE USING (is_manager_or_above(auth.uid()));

-- Milestones
CREATE POLICY "milestones_select" ON milestones FOR SELECT USING (true);
CREATE POLICY "milestones_insert" ON milestones FOR INSERT WITH CHECK (is_manager_or_above(auth.uid()) OR get_user_role(auth.uid()) = 'team_lead');
CREATE POLICY "milestones_update" ON milestones FOR UPDATE USING (is_manager_or_above(auth.uid()) OR get_user_role(auth.uid()) = 'team_lead');
CREATE POLICY "milestones_delete" ON milestones FOR DELETE USING (is_admin(auth.uid()));

-- Task Comments: everyone can read, authenticated can create own
CREATE POLICY "task_comments_select" ON task_comments FOR SELECT USING (true);
CREATE POLICY "task_comments_insert" ON task_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "task_comments_update" ON task_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "task_comments_delete" ON task_comments FOR DELETE USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Task Attachments
CREATE POLICY "task_attachments_select" ON task_attachments FOR SELECT USING (true);
CREATE POLICY "task_attachments_insert" ON task_attachments FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "task_attachments_delete" ON task_attachments FOR DELETE USING (auth.uid() = uploaded_by OR is_admin(auth.uid()));

-- Task Activities: read-only for users
CREATE POLICY "task_activities_select" ON task_activities FOR SELECT USING (true);
CREATE POLICY "task_activities_insert" ON task_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Timesheets: own + manager/admin
CREATE POLICY "timesheets_select" ON timesheets FOR SELECT USING (
  auth.uid() = user_id OR is_manager_or_above(auth.uid())
);
CREATE POLICY "timesheets_insert" ON timesheets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "timesheets_update" ON timesheets FOR UPDATE USING (
  auth.uid() = user_id OR is_manager_or_above(auth.uid())
);
CREATE POLICY "timesheets_delete" ON timesheets FOR DELETE USING (auth.uid() = user_id);

-- Leave Requests: own + manager/admin
CREATE POLICY "leave_requests_select" ON leave_requests FOR SELECT USING (
  auth.uid() = user_id OR is_manager_or_above(auth.uid())
);
CREATE POLICY "leave_requests_insert" ON leave_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "leave_requests_update" ON leave_requests FOR UPDATE USING (
  auth.uid() = user_id OR is_manager_or_above(auth.uid())
);

-- KPI Reviews: own + reviewer + admin
CREATE POLICY "kpi_reviews_select" ON kpi_reviews FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() = reviewer_id OR is_admin(auth.uid())
);
CREATE POLICY "kpi_reviews_insert" ON kpi_reviews FOR INSERT WITH CHECK (
  auth.uid() = user_id OR is_manager_or_above(auth.uid())
);
CREATE POLICY "kpi_reviews_update" ON kpi_reviews FOR UPDATE USING (
  auth.uid() = user_id OR auth.uid() = reviewer_id OR is_admin(auth.uid())
);

-- Documents
CREATE POLICY "documents_select" ON documents FOR SELECT USING (true);
CREATE POLICY "documents_insert" ON documents FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "documents_update" ON documents FOR UPDATE USING (auth.uid() = uploaded_by OR is_admin(auth.uid()));
CREATE POLICY "documents_delete" ON documents FOR DELETE USING (auth.uid() = uploaded_by OR is_admin(auth.uid()));

-- Notifications: only own
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Audit Logs: admin only
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT WITH CHECK (true);

-- Company Settings: everyone reads, admin writes
CREATE POLICY "company_settings_select" ON company_settings FOR SELECT USING (true);
CREATE POLICY "company_settings_update" ON company_settings FOR UPDATE USING (is_admin(auth.uid()));

-- ============================================================
-- Add FK from profiles to departments
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'profiles_department_id_fkey') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_department_id_fkey FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;
  END IF;
END $$;
