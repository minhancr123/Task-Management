# Enterprise Task Management System - RBAC Documentation

## Overview
The Role-Based Access Control (RBAC) system in the Task Management application is designed to provide granular security and feature access based on user roles. It ensures that users only see and interact with data relevant to their responsibilities.

## Core Concepts

### 1. User Roles
The system defines the following roles, ordered by hierarchy (power):

*   **Super Admin** (`super_admin`): Full system access. Can manage everything including system settings and audit logs.
*   **Admin** (`admin`): High-level access. Can manage users, departments, and projects, but may be restricted from critical system settings.
*   **Manager** (`manager`): Manages projects, tasks, and potentially departments. Can approve timesheets and leave requests.
*   **Team Lead** (`team_lead`): Leads specific teams. Can manage tasks within their scope and view team reports.
*   **Member** (`member`): Standard user. Can view assigned tasks, projects, and manage their own work (timesheets, comments).
*   **Viewer** (`viewer`): Read-only access to specific resources.

### 2. Permissions
Permissions are granular capability strings (e.g., `projects.create`, `tasks.edit`) defined in `src/lib/permissions.ts`.
Roles are mapped to a specific set of these permissions.

**Key Permissions Categories:**
*   **System**: `system.settings`, `system.audit_logs`
*   **Users**: Create, edit, delete, view users.
*   **Projects**: Create, edit, delete, view, manage members/budget.
*   **Tasks**: Create, edit, delete, assign, approve, change status.
*   **Approvals**: Timesheets, leave requests, KPI reviews.

## Implementation Details

### File Structure
*   **`src/lib/permissions.ts`**: The source of truth. Defines `PERMISSIONS` constants, `ROLE_PERMISSIONS` mapping, and helper functions (`hasPermission`, `isRoleAtLeast`).
*   **`src/hooks/use-permissions.ts`**: A React hook that provides an easy-to-use interface for components to check permissions.
*   **`src/lib/types/database.ts`**: Defines the `UserRole` type.

### Using Permissions in Components
The `usePermissions` hook is the primary way to check access control in the frontend.

```tsx
import { usePermissions } from "@/hooks/use-permissions";

export function MyComponent() {
    const { 
        canCreateProject, 
        isManager, 
        can 
    } = usePermissions();

    if (!canCreateProject) return null; // or generic access denied

    return (
        <div>
            {isManager && <AdminButton />}
            {can('users.edit') && <EditUserButton />}
        </div>
    );
}
```

### Route Protection
Pages should implement permission checks at the top level or wrap content in permission-checking containers. 
For example, `src/app/admin/page.tsx` checks if the user `isAdmin`.

### Navigation
The sidebar navigation is dynamically generated based on the user's role using `getNavigationItems(role)` in `src/lib/permissions.ts`. This ensures users only see links they can access.

## Extensibility
To add a new feature with permission control:
1.  Add a new permission string to `PERMISSIONS` in `src/lib/permissions.ts`.
2.  Add the permission to the appropriate roles in `ROLE_PERMISSIONS`.
3.  Use `usePermissions` in your component to check for this new permission.
4.  Optionally, add a new route or navigation item protected by this permission.

## Security Note
While frontend RBAC provides a good user experience, **all security checks must be replicated on the backend (Supabase RLS policies)** to prevent unauthorized data access via direct API calls.
