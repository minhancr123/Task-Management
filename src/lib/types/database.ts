// ============================================================
// Enterprise Task Management – Database Types
// ============================================================

// --- Enums ---

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'team_lead' | 'member' | 'viewer';

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export type LeaveType = 'annual' | 'sick' | 'personal' | 'wfh';

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export type KPIReviewStatus = 'draft' | 'submitted' | 'reviewed';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type DepartmentRole = 'head' | 'deputy' | 'member';

export type ProjectRole = 'owner' | 'manager' | 'member' | 'viewer';

// --- Entity Interfaces ---

export interface Profile {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
    location: string | null;
    bio: string | null;
    role: UserRole;
    position: string | null;
    department_id: string | null;
    join_date: string | null;
    annual_leave_quota: number;
    created_at: string;
    updated_at: string;
}

export interface Department {
    id: string;
    name: string;
    description: string | null;
    head_id: string | null;
    parent_dept_id: string | null;
    created_at: string;
    updated_at: string;
    // Joined
    head?: Profile | null;
    member_count?: number;
}

export interface DepartmentMember {
    id: string;
    department_id: string;
    user_id: string;
    role: DepartmentRole;
    created_at: string;
    // Joined
    user?: Profile | null;
    department?: Department | null;
}

export interface Team {
    id: string;
    name: string;
    description: string | null;
    department_id: string;
    lead_id: string | null;
    created_at: string;
    updated_at: string;
    // Joined
    lead?: Profile | null;
    department?: Department | null;
    member_count?: number;
}

export interface TeamMember {
    id: string;
    team_id: string;
    user_id: string;
    created_at: string;
    // Joined
    user?: Profile | null;
}

export interface Project {
    id: string;
    name: string;
    description: string | null;
    department_id: string | null;
    created_by: string;
    status: ProjectStatus;
    priority: Priority;
    start_date: string | null;
    end_date: string | null;
    budget: number | null;
    spent: number | null;
    created_at: string;
    updated_at: string;
    // Joined
    department?: Department | null;
    creator?: Profile | null;
    members?: ProjectMember[];
    task_count?: number;
    completed_task_count?: number;
}

export interface ProjectMember {
    id: string;
    project_id: string;
    user_id: string;
    role: ProjectRole;
    created_at: string;
    // Joined
    user?: Profile | null;
    project?: Project | null;
}

export interface Milestone {
    id: string;
    project_id: string;
    title: string;
    description: string | null;
    due_date: string;
    status: 'pending' | 'completed';
    created_at: string;
    updated_at: string;
}

export interface Task {
    id: string;
    title: string;
    description: string | null;
    project_id: string | null;
    assigned_to: string | null;
    created_by: string;
    parent_task_id: string | null;
    status: TaskStatus;
    priority: Priority;
    due_date: string | null;
    start_date: string | null;
    estimated_hours: number | null;
    actual_hours: number | null;
    is_recurring: boolean;
    recurrence_pattern: string | null;
    tags: string[];
    order_index: number;
    created_at: string;
    updated_at: string;
    // Joined
    assignee?: Profile | null;
    creator?: Profile | null;
    project?: Project | null;
    subtasks?: Task[];
    comments?: TaskComment[];
    attachments?: TaskAttachment[];
}

export interface TaskComment {
    id: string;
    task_id: string;
    user_id: string;
    content: string;
    created_at: string;
    updated_at: string;
    // Joined
    user?: Profile | null;
}

export interface TaskAttachment {
    id: string;
    task_id: string;
    uploaded_by: string;
    file_url: string;
    file_name: string;
    file_size: number;
    file_type: string;
    created_at: string;
    // Joined
    uploader?: Profile | null;
}

export interface TaskActivity {
    id: string;
    task_id: string;
    user_id: string;
    action: 'created' | 'updated' | 'status_changed' | 'assigned' | 'commented' | 'attachment_added' | 'deleted';
    old_value: Record<string, unknown> | null;
    new_value: Record<string, unknown> | null;
    created_at: string;
    // Joined
    user?: Profile | null;
}

export interface Timesheet {
    id: string;
    user_id: string;
    task_id: string | null;
    project_id: string | null;
    work_date: string;
    hours: number;
    description: string | null;
    status: TimesheetStatus;
    approved_by: string | null;
    created_at: string;
    updated_at: string;
    // Joined
    user?: Profile | null;
    task?: Task | null;
    project?: Project | null;
}

export interface LeaveRequest {
    id: string;
    user_id: string;
    approved_by: string | null;
    leave_type: LeaveType;
    start_date: string;
    end_date: string;
    total_days: number;
    reason: string | null;
    status: LeaveStatus;
    reviewer_note: string | null;
    created_at: string;
    updated_at: string;
    // Joined
    user?: Profile | null;
    approver?: Profile | null;
}

export interface KPIReview {
    id: string;
    user_id: string;
    reviewer_id: string | null;
    period: string; // e.g., "2026-Q1"
    self_score: number | null;
    manager_score: number | null;
    self_comments: string | null;
    manager_comments: string | null;
    goals: string | null;
    status: KPIReviewStatus;
    created_at: string;
    updated_at: string;
    // Joined
    user?: Profile | null;
    reviewer?: Profile | null;
}

export interface Document {
    id: string;
    project_id: string | null;
    department_id: string | null;
    uploaded_by: string;
    title: string;
    description: string | null;
    file_url: string;
    file_name: string;
    file_size: number;
    file_type: string;
    version: number;
    tags: string[];
    created_at: string;
    updated_at: string;
    // Joined
    uploader?: Profile | null;
    project?: Project | null;
}

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'task_assigned' | 'task_updated' | 'comment_added' | 'leave_status' | 'approval_needed' | 'mention' | 'system';
    entity_type: string | null;
    entity_id: string | null;
    is_read: boolean;
    created_at: string;
}

export interface AuditLog {
    id: string;
    user_id: string;
    action: string;
    entity_type: string;
    entity_id: string | null;
    details: Record<string, unknown> | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    // Joined
    user?: Profile | null;
}

export interface CompanySettings {
    id: string;
    company_name: string;
    logo_url: string | null;
    working_hours_start: string; // "09:00"
    working_hours_end: string; // "18:00"
    working_days: number[]; // [1,2,3,4,5] = Mon-Fri
    fiscal_year_start: number; // month 1-12
    default_leave_quota: number;
    timezone: string;
    created_at: string;
    updated_at: string;
}
