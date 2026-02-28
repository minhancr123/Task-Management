"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import EnterpriseSidebar from "@/components/layout/EnterpriseSidebar";

export default function EnterpriseGroupLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute>
            <EnterpriseSidebar>{children}</EnterpriseSidebar>
        </ProtectedRoute>
    );
}
