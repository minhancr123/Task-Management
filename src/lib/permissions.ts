// ============================================================
// Enterprise RBAC – Permissions & Role System
// ============================================================

import { UserRole } from "./types/database";

// --- Permission Definitions ---
export const PERMISSIONS = {
    // System
    SYSTEM_SETTINGS: 'system.settings',
    SYSTEM_AUDIT_LOGS: 'system.audit_logs',

    // Users
    USERS_VIEW: 'users.view',
    USERS_CREATE: 'users.create',
    USERS_EDIT: 'users.edit',
    USERS_DELETE: 'users.delete',
    USERS_MANAGE_ROLES: 'users.manage_roles',

    // Departments
    DEPARTMENTS_VIEW: 'departments.view',
    DEPARTMENTS_CREATE: 'departments.create',
    DEPARTMENTS_EDIT: 'departments.edit',
    DEPARTMENTS_DELETE: 'departments.delete',
    DEPARTMENTS_MANAGE_MEMBERS: 'departments.manage_members',

    // Projects
    PROJECTS_VIEW: 'projects.view',
    PROJECTS_VIEW_ALL: 'projects.view_all',
    PROJECTS_CREATE: 'projects.create',
    PROJECTS_EDIT: 'projects.edit',
    PROJECTS_DELETE: 'projects.delete',
    PROJECTS_MANAGE_MEMBERS: 'projects.manage_members',
    PROJECTS_MANAGE_BUDGET: 'projects.manage_budget',

    // Tasks
    TASKS_VIEW: 'tasks.view',
    TASKS_VIEW_ALL: 'tasks.view_all',
    TASKS_CREATE: 'tasks.create',
    TASKS_EDIT: 'tasks.edit',
    TASKS_EDIT_ALL: 'tasks.edit_all',
    TASKS_DELETE: 'tasks.delete',
    TASKS_ASSIGN: 'tasks.assign',
    TASKS_CHANGE_STATUS: 'tasks.change_status',
    TASKS_APPROVE: 'tasks.approve',

    // Comments
    COMMENTS_CREATE: 'comments.create',
    COMMENTS_EDIT_OWN: 'comments.edit_own',
    COMMENTS_DELETE_ANY: 'comments.delete_any',

    // Timesheets
    TIMESHEETS_VIEW_OWN: 'timesheets.view_own',
    TIMESHEETS_VIEW_TEAM: 'timesheets.view_team',
    TIMESHEETS_VIEW_ALL: 'timesheets.view_all',
    TIMESHEETS_CREATE: 'timesheets.create',
    TIMESHEETS_APPROVE: 'timesheets.approve',

    // Leave
    LEAVE_VIEW_OWN: 'leave.view_own',
    LEAVE_VIEW_TEAM: 'leave.view_team',
    LEAVE_VIEW_ALL: 'leave.view_all',
    LEAVE_CREATE: 'leave.create',
    LEAVE_APPROVE: 'leave.approve',

    // KPI
    KPI_VIEW_OWN: 'kpi.view_own',
    KPI_VIEW_TEAM: 'kpi.view_team',
    KPI_VIEW_ALL: 'kpi.view_all',
    KPI_CREATE: 'kpi.create',
    KPI_REVIEW: 'kpi.review',

    // Reports
    REPORTS_VIEW_OWN: 'reports.view_own',
    REPORTS_VIEW_TEAM: 'reports.view_team',
    REPORTS_VIEW_ALL: 'reports.view_all',
    REPORTS_EXPORT: 'reports.export',

    // Documents
    DOCUMENTS_VIEW: 'documents.view',
    DOCUMENTS_UPLOAD: 'documents.upload',
    DOCUMENTS_DELETE: 'documents.delete',
    DOCUMENTS_MANAGE: 'documents.manage',

    // Notifications
    NOTIFICATIONS_SEND_SYSTEM: 'notifications.send_system',

    // Approvals
    APPROVALS_VIEW: 'approvals.view',
    APPROVALS_MANAGE: 'approvals.manage',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// --- Role → Permissions Mapping ---
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    super_admin: Object.values(PERMISSIONS), // All permissions

    admin: [
        PERMISSIONS.SYSTEM_SETTINGS,
        PERMISSIONS.SYSTEM_AUDIT_LOGS,
        PERMISSIONS.USERS_VIEW,
        PERMISSIONS.USERS_CREATE,
        PERMISSIONS.USERS_EDIT,
        PERMISSIONS.USERS_DELETE,
        PERMISSIONS.USERS_MANAGE_ROLES,
        PERMISSIONS.DEPARTMENTS_VIEW,
        PERMISSIONS.DEPARTMENTS_CREATE,
        PERMISSIONS.DEPARTMENTS_EDIT,
        PERMISSIONS.DEPARTMENTS_DELETE,
        PERMISSIONS.DEPARTMENTS_MANAGE_MEMBERS,
        PERMISSIONS.PROJECTS_VIEW,
        PERMISSIONS.PROJECTS_VIEW_ALL,
        PERMISSIONS.PROJECTS_CREATE,
        PERMISSIONS.PROJECTS_EDIT,
        PERMISSIONS.PROJECTS_DELETE,
        PERMISSIONS.PROJECTS_MANAGE_MEMBERS,
        PERMISSIONS.PROJECTS_MANAGE_BUDGET,
        PERMISSIONS.TASKS_VIEW,
        PERMISSIONS.TASKS_VIEW_ALL,
        PERMISSIONS.TASKS_CREATE,
        PERMISSIONS.TASKS_EDIT,
        PERMISSIONS.TASKS_EDIT_ALL,
        PERMISSIONS.TASKS_DELETE,
        PERMISSIONS.TASKS_ASSIGN,
        PERMISSIONS.TASKS_CHANGE_STATUS,
        PERMISSIONS.TASKS_APPROVE,
        PERMISSIONS.COMMENTS_CREATE,
        PERMISSIONS.COMMENTS_EDIT_OWN,
        PERMISSIONS.COMMENTS_DELETE_ANY,
        PERMISSIONS.TIMESHEETS_VIEW_OWN,
        PERMISSIONS.TIMESHEETS_VIEW_TEAM,
        PERMISSIONS.TIMESHEETS_VIEW_ALL,
        PERMISSIONS.TIMESHEETS_CREATE,
        PERMISSIONS.TIMESHEETS_APPROVE,
        PERMISSIONS.LEAVE_VIEW_OWN,
        PERMISSIONS.LEAVE_VIEW_TEAM,
        PERMISSIONS.LEAVE_VIEW_ALL,
        PERMISSIONS.LEAVE_CREATE,
        PERMISSIONS.LEAVE_APPROVE,
        PERMISSIONS.KPI_VIEW_OWN,
        PERMISSIONS.KPI_VIEW_TEAM,
        PERMISSIONS.KPI_VIEW_ALL,
        PERMISSIONS.KPI_CREATE,
        PERMISSIONS.KPI_REVIEW,
        PERMISSIONS.REPORTS_VIEW_OWN,
        PERMISSIONS.REPORTS_VIEW_TEAM,
        PERMISSIONS.REPORTS_VIEW_ALL,
        PERMISSIONS.REPORTS_EXPORT,
        PERMISSIONS.DOCUMENTS_VIEW,
        PERMISSIONS.DOCUMENTS_UPLOAD,
        PERMISSIONS.DOCUMENTS_DELETE,
        PERMISSIONS.DOCUMENTS_MANAGE,
        PERMISSIONS.NOTIFICATIONS_SEND_SYSTEM,
        PERMISSIONS.APPROVALS_VIEW,
        PERMISSIONS.APPROVALS_MANAGE,
    ],

    manager: [
        PERMISSIONS.USERS_VIEW,
        PERMISSIONS.DEPARTMENTS_VIEW,
        PERMISSIONS.PROJECTS_VIEW,
        PERMISSIONS.PROJECTS_VIEW_ALL,
        PERMISSIONS.PROJECTS_CREATE,
        PERMISSIONS.PROJECTS_EDIT,
        PERMISSIONS.PROJECTS_MANAGE_MEMBERS,
        PERMISSIONS.PROJECTS_MANAGE_BUDGET,
        PERMISSIONS.TASKS_VIEW,
        PERMISSIONS.TASKS_VIEW_ALL,
        PERMISSIONS.TASKS_CREATE,
        PERMISSIONS.TASKS_EDIT,
        PERMISSIONS.TASKS_EDIT_ALL,
        PERMISSIONS.TASKS_DELETE,
        PERMISSIONS.TASKS_ASSIGN,
        PERMISSIONS.TASKS_CHANGE_STATUS,
        PERMISSIONS.TASKS_APPROVE,
        PERMISSIONS.COMMENTS_CREATE,
        PERMISSIONS.COMMENTS_EDIT_OWN,
        PERMISSIONS.COMMENTS_DELETE_ANY,
        PERMISSIONS.TIMESHEETS_VIEW_OWN,
        PERMISSIONS.TIMESHEETS_VIEW_TEAM,
        PERMISSIONS.TIMESHEETS_CREATE,
        PERMISSIONS.TIMESHEETS_APPROVE,
        PERMISSIONS.LEAVE_VIEW_OWN,
        PERMISSIONS.LEAVE_VIEW_TEAM,
        PERMISSIONS.LEAVE_CREATE,
        PERMISSIONS.LEAVE_APPROVE,
        PERMISSIONS.KPI_VIEW_OWN,
        PERMISSIONS.KPI_VIEW_TEAM,
        PERMISSIONS.KPI_CREATE,
        PERMISSIONS.KPI_REVIEW,
        PERMISSIONS.REPORTS_VIEW_OWN,
        PERMISSIONS.REPORTS_VIEW_TEAM,
        PERMISSIONS.REPORTS_EXPORT,
        PERMISSIONS.DOCUMENTS_VIEW,
        PERMISSIONS.DOCUMENTS_UPLOAD,
        PERMISSIONS.DOCUMENTS_DELETE,
        PERMISSIONS.APPROVALS_VIEW,
        PERMISSIONS.APPROVALS_MANAGE,
    ],

    team_lead: [
        PERMISSIONS.USERS_VIEW,
        PERMISSIONS.DEPARTMENTS_VIEW,
        PERMISSIONS.PROJECTS_VIEW,
        PERMISSIONS.PROJECTS_CREATE,
        PERMISSIONS.PROJECTS_EDIT,
        PERMISSIONS.PROJECTS_MANAGE_MEMBERS,
        PERMISSIONS.TASKS_VIEW,
        PERMISSIONS.TASKS_VIEW_ALL,
        PERMISSIONS.TASKS_CREATE,
        PERMISSIONS.TASKS_EDIT,
        PERMISSIONS.TASKS_DELETE,
        PERMISSIONS.TASKS_ASSIGN,
        PERMISSIONS.TASKS_CHANGE_STATUS,
        PERMISSIONS.TASKS_APPROVE,
        PERMISSIONS.COMMENTS_CREATE,
        PERMISSIONS.COMMENTS_EDIT_OWN,
        PERMISSIONS.TIMESHEETS_VIEW_OWN,
        PERMISSIONS.TIMESHEETS_VIEW_TEAM,
        PERMISSIONS.TIMESHEETS_CREATE,
        PERMISSIONS.TIMESHEETS_APPROVE,
        PERMISSIONS.LEAVE_VIEW_OWN,
        PERMISSIONS.LEAVE_VIEW_TEAM,
        PERMISSIONS.LEAVE_CREATE,
        PERMISSIONS.LEAVE_APPROVE,
        PERMISSIONS.KPI_VIEW_OWN,
        PERMISSIONS.KPI_VIEW_TEAM,
        PERMISSIONS.KPI_REVIEW,
        PERMISSIONS.REPORTS_VIEW_OWN,
        PERMISSIONS.REPORTS_VIEW_TEAM,
        PERMISSIONS.DOCUMENTS_VIEW,
        PERMISSIONS.DOCUMENTS_UPLOAD,
        PERMISSIONS.APPROVALS_VIEW,
    ],

    member: [
        PERMISSIONS.USERS_VIEW,
        PERMISSIONS.DEPARTMENTS_VIEW,
        PERMISSIONS.PROJECTS_VIEW,
        PERMISSIONS.TASKS_VIEW,
        PERMISSIONS.TASKS_CREATE,
        PERMISSIONS.TASKS_EDIT,
        PERMISSIONS.TASKS_CHANGE_STATUS,
        PERMISSIONS.COMMENTS_CREATE,
        PERMISSIONS.COMMENTS_EDIT_OWN,
        PERMISSIONS.TIMESHEETS_VIEW_OWN,
        PERMISSIONS.TIMESHEETS_CREATE,
        PERMISSIONS.LEAVE_VIEW_OWN,
        PERMISSIONS.LEAVE_CREATE,
        PERMISSIONS.KPI_VIEW_OWN,
        PERMISSIONS.REPORTS_VIEW_OWN,
        PERMISSIONS.DOCUMENTS_VIEW,
        PERMISSIONS.DOCUMENTS_UPLOAD,
    ],

    viewer: [
        PERMISSIONS.DEPARTMENTS_VIEW,
        PERMISSIONS.PROJECTS_VIEW,
        PERMISSIONS.TASKS_VIEW,
        PERMISSIONS.COMMENTS_CREATE,
        PERMISSIONS.REPORTS_VIEW_OWN,
        PERMISSIONS.DOCUMENTS_VIEW,
    ],
};

// --- Role Hierarchy (higher number = more powerful) ---
export const ROLE_HIERARCHY: Record<UserRole, number> = {
    viewer: 0,
    member: 1,
    team_lead: 2,
    manager: 3,
    admin: 4,
    super_admin: 5,
};

// --- Helper Functions ---

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a role has ALL of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
    return permissions.every(p => hasPermission(role, p));
}

/**
 * Check if a role has ANY of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
    return permissions.some(p => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Check if roleA >= roleB in hierarchy
 */
export function isRoleAtLeast(roleA: UserRole, roleB: UserRole): boolean {
    return ROLE_HIERARCHY[roleA] >= ROLE_HIERARCHY[roleB];
}

/**
 * Check if user can manage another user based on role hierarchy
 */
export function canManageUser(managerRole: UserRole, targetRole: UserRole): boolean {
    return ROLE_HIERARCHY[managerRole] > ROLE_HIERARCHY[targetRole];
}

// --- Navigation Items per Role ---
export interface NavItem {
    label: string;
    href: string;
    icon: string; // lucide icon name
    permission?: Permission;
    minRole?: UserRole;
    badge?: string;
    children?: NavItem[];
}

export function getNavigationItems(role: UserRole): NavItem[] {
    const items: NavItem[] = [
        { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    ];

    // Projects - all roles except viewer can see
    if (hasPermission(role, PERMISSIONS.PROJECTS_VIEW)) {
        items.push({ label: 'Dự án', href: '/projects', icon: 'FolderKanban' });
    }

    // Tasks
    if (hasPermission(role, PERMISSIONS.TASKS_VIEW)) {
        items.push({ label: 'Công việc', href: '/tasks', icon: 'CheckSquare' });
    }

    // Departments - admin+
    if (hasPermission(role, PERMISSIONS.DEPARTMENTS_CREATE)) {
        items.push({ label: 'Phòng ban', href: '/departments', icon: 'Building2' });
    }

    // Timesheets
    if (hasPermission(role, PERMISSIONS.TIMESHEETS_VIEW_OWN)) {
        items.push({ label: 'Chấm công', href: '/timesheets', icon: 'Clock' });
    }

    // Leave
    if (hasPermission(role, PERMISSIONS.LEAVE_VIEW_OWN)) {
        items.push({ label: 'Nghỉ phép', href: '/leaves', icon: 'CalendarOff' });
    }

    // KPI
    if (hasPermission(role, PERMISSIONS.KPI_VIEW_OWN)) {
        items.push({ label: 'KPI', href: '/kpi', icon: 'Target' });
    }

    // Reports
    if (hasPermission(role, PERMISSIONS.REPORTS_VIEW_OWN)) {
        items.push({ label: 'Báo cáo', href: '/reports', icon: 'BarChart3' });
    }

    // Documents
    if (hasPermission(role, PERMISSIONS.DOCUMENTS_VIEW)) {
        items.push({ label: 'Tài liệu', href: '/documents', icon: 'FileText' });
    }

    // Notifications
    items.push({ label: 'Thông báo', href: '/notifications', icon: 'Bell' });

    // Chat
    items.push({ label: 'Tin nhắn', href: '/chat', icon: 'MessageSquare' });

    // Approvals - manager+
    if (hasPermission(role, PERMISSIONS.APPROVALS_VIEW)) {
        items.push({ label: 'Phê duyệt', href: '/approvals', icon: 'ClipboardCheck' });
    }

    // Users management - admin+
    if (hasPermission(role, PERMISSIONS.USERS_CREATE)) {
        items.push({ label: 'Nhân sự', href: '/users', icon: 'Users' });
    }

    // Settings - admin+
    if (hasPermission(role, PERMISSIONS.SYSTEM_SETTINGS)) {
        items.push({ label: 'Cài đặt', href: '/settings', icon: 'Settings' });
    }

    // Audit - admin+
    if (hasPermission(role, PERMISSIONS.SYSTEM_AUDIT_LOGS)) {
        items.push({ label: 'Audit Logs', href: '/audit', icon: 'Shield' });
        items.push({ label: 'Khôi phục dữ liệu', href: '/admin/seed', icon: 'Database', badge: 'Admin' });
    }

    return items;
}

// --- Role Display Info ---
export const ROLE_DISPLAY: Record<UserRole, { label: string; color: string; bgColor: string }> = {
    super_admin: { label: 'Super Admin', color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-900/30' },
    admin: { label: 'Admin', color: 'text-purple-700 dark:text-purple-300', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
    manager: { label: 'Manager', color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
    team_lead: { label: 'Team Lead', color: 'text-teal-700 dark:text-teal-300', bgColor: 'bg-teal-100 dark:bg-teal-900/30' },
    member: { label: 'Member', color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-800/30' },
    viewer: { label: 'Viewer', color: 'text-slate-500 dark:text-slate-400', bgColor: 'bg-slate-100 dark:bg-slate-800/30' },
};
