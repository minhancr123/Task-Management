"use client";

import { useMemo } from "react";
import { useAuth } from "./use-auth";
import { UserRole } from "@/lib/types/database";
import {
    Permission,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    isRoleAtLeast,
    canManageUser,
    getNavigationItems,
    PERMISSIONS,
    NavItem,
} from "@/lib/permissions";

export function usePermissions() {
    const { profile } = useAuth();
    const role: UserRole = (profile?.role as UserRole) || "member";

    const permissions = useMemo(() => {
        return {
            /** Current user role */
            role,

            /** Check if user has a specific permission */
            can: (permission: Permission) => hasPermission(role, permission),

            /** Check if user has ALL specified permissions */
            canAll: (perms: Permission[]) => hasAllPermissions(role, perms),

            /** Check if user has ANY of the specified permissions */
            canAny: (perms: Permission[]) => hasAnyPermission(role, perms),

            /** Check if user's role is at least the specified role */
            isAtLeast: (minRole: UserRole) => isRoleAtLeast(role, minRole),

            /** Check if user can manage another user */
            canManage: (targetRole: UserRole) => canManageUser(role, targetRole),

            /** Get navigation items based on role */
            navItems: getNavigationItems(role) as NavItem[],

            // --- Shorthand checks ---
            isSuperAdmin: role === "super_admin",
            isAdmin: role === "admin" || role === "super_admin",
            isManager: isRoleAtLeast(role, "manager"),
            isTeamLead: isRoleAtLeast(role, "team_lead"),

            canManageUsers: hasPermission(role, PERMISSIONS.USERS_CREATE),
            canManageDepartments: hasPermission(role, PERMISSIONS.DEPARTMENTS_CREATE),
            canManageProjects: hasPermission(role, PERMISSIONS.PROJECTS_CREATE),
            canAssignTasks: hasPermission(role, PERMISSIONS.TASKS_ASSIGN),
            canApproveTasks: hasPermission(role, PERMISSIONS.TASKS_APPROVE),
            canApproveTimesheets: hasPermission(role, PERMISSIONS.TIMESHEETS_APPROVE),
            canApproveLeave: hasPermission(role, PERMISSIONS.LEAVE_APPROVE),
            canViewReportsAll: hasPermission(role, PERMISSIONS.REPORTS_VIEW_ALL),
            canAccessSettings: hasPermission(role, PERMISSIONS.SYSTEM_SETTINGS),
            canViewAuditLogs: hasPermission(role, PERMISSIONS.SYSTEM_AUDIT_LOGS),
        };
    }, [role]);

    return permissions;
}
