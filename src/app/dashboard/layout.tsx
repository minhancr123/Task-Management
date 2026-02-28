"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import EnterpriseSidebar from "@/components/layout/EnterpriseSidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute>
            <EnterpriseSidebar>{children}</EnterpriseSidebar>
        </ProtectedRoute>
    );
}
