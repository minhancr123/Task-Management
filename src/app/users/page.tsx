"use client";

import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useState, useEffect, useCallback } from "react";
import { Users, Search, Shield } from "lucide-react";
import { ROLE_DISPLAY, UserRole } from "@/lib/permissions";
import { Profile } from "@/lib/types/database";
import { toast } from "sonner";

export default function UsersPage() {
    const { user } = useAuth();
    const { canManageUsers, isAdmin } = usePermissions();
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
            if (error) throw error;
            setUsers((data || []) as Profile[]);
        } catch { /* */ } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        if (!isAdmin) return;
        try {
            const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
            if (error) throw error;
            toast.success("Đã cập nhật vai trò");
            fetchUsers();
        } catch { toast.error("Lỗi"); }
    };

    const filtered = users.filter((u) =>
        (u.full_name || u.email || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nhân sự</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý người dùng và phân quyền</p>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Tìm kiếm người dùng..." value={search} onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white" />
            </div>

            {loading ? (
                <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <Card key={i} className="animate-pulse"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full" /><div className="flex-1 space-y-2"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" /><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" /></div></CardContent></Card>)}</div>
            ) : filtered.length === 0 ? (
                <Card><CardContent className="flex flex-col items-center py-12"><Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" /><h3 className="text-lg font-semibold text-slate-900 dark:text-white">Không tìm thấy</h3></CardContent></Card>
            ) : (
                <div className="space-y-2">
                    {filtered.map(u => {
                        const r = ROLE_DISPLAY[u.role as UserRole] || ROLE_DISPLAY.member;
                        return (
                            <Card key={u.id} className="border border-slate-200 dark:border-slate-800">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold">
                                            {u.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{u.full_name || "Chưa đặt tên"}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${r.color} ${r.bgColor}`}>{r.label}</span>
                                        {isAdmin && u.id !== user?.id && (
                                            <select
                                                value={u.role}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                                                className="text-xs px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white"
                                            >
                                                <option value="viewer">Viewer</option>
                                                <option value="member">Member</option>
                                                <option value="team_lead">Team Lead</option>
                                                <option value="manager">Manager</option>
                                                <option value="admin">Admin</option>
                                                <option value="super_admin">Super Admin</option>
                                            </select>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
