"use client";

import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Shield, Search, Filter, User, Settings, FileText, FolderKanban,
    CheckSquare, Building2, Clock, Trash2, Edit2, Plus, UserPlus, Eye
} from "lucide-react";
import { toast } from "sonner";

type AuditLog = {
    id: string;
    user_id: string;
    action: string;
    entity_type: string;
    entity_id: string | null;
    old_data: any;
    new_data: any;
    ip_address: string | null;
    created_at: string;
    user?: { full_name: string | null; email: string | null; role: string } | null;
};

const ACTION_ICONS: Record<string, { icon: any; color: string }> = {
    create: { icon: Plus, color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" },
    update: { icon: Edit2, color: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" },
    delete: { icon: Trash2, color: "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" },
    login: { icon: User, color: "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400" },
    logout: { icon: User, color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
    assign: { icon: UserPlus, color: "bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" },
    approve: { icon: CheckSquare, color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" },
    reject: { icon: Trash2, color: "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" },
};

const ENTITY_ICONS: Record<string, any> = {
    task: CheckSquare, project: FolderKanban, department: Building2,
    user: User, document: FileText, timesheet: Clock, settings: Settings,
};

const getActionIcon = (action: string) => {
    const key = Object.keys(ACTION_ICONS).find(k => action.toLowerCase().includes(k));
    return ACTION_ICONS[key || ""] || ACTION_ICONS.update;
};

const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "vừa xong";
    if (mins < 60) return `${mins} phút trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} giờ trước`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} ngày trước`;
    return new Date(date).toLocaleDateString("vi-VN");
};

export default function AuditPage() {
    const { user } = useAuth();
    const { isAdmin } = usePermissions();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterAction, setFilterAction] = useState("");
    const [filterEntity, setFilterEntity] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [limit, setLimit] = useState(50);

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            let query = supabase.from("audit_logs")
                .select("*, user:profiles!audit_logs_user_id_fkey(*)")
                .order("created_at", { ascending: false })
                .limit(limit);

            if (filterAction) query = query.ilike("action", `%${filterAction}%`);
            if (filterEntity) query = query.eq("entity_type", filterEntity);

            const { data, error } = await query;
            if (error) throw error;
            setLogs((data || []) as AuditLog[]);
        } catch { /* */ } finally { setLoading(false); }
    }, [limit, filterAction, filterEntity]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const filtered = logs.filter(l =>
        !search ||
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.entity_type?.toLowerCase().includes(search.toLowerCase()) ||
        l.user?.full_name?.toLowerCase().includes(search.toLowerCase())
    );

    // Stats
    const todayLogs = logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length;
    const uniqueUsers = new Set(logs.map(l => l.user_id)).size;
    const entityTypes = [...new Set(logs.map(l => l.entity_type).filter(Boolean))];

    const getInitials = (n: string | null) => n?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

    const renderDiff = (old_data: any, new_data: any) => {
        if (!old_data && !new_data) return null;
        const changes: { key: string; old: any; new_val: any }[] = [];
        const allKeys = new Set([...Object.keys(old_data || {}), ...Object.keys(new_data || {})]);
        allKeys.forEach(key => {
            const o = old_data?.[key];
            const n = new_data?.[key];
            if (JSON.stringify(o) !== JSON.stringify(n)) {
                changes.push({ key, old: o, new_val: n });
            }
        });
        if (changes.length === 0) return <p className="text-xs text-slate-400">Không có thay đổi</p>;
        return (
            <div className="space-y-1">
                {changes.slice(0, 10).map(c => (
                    <div key={c.key} className="text-xs flex gap-2 items-start">
                        <span className="font-medium text-slate-500 min-w-[80px]">{c.key}:</span>
                        {c.old !== undefined && <span className="text-red-500 line-through">{String(c.old).slice(0, 60)}</span>}
                        {c.new_val !== undefined && <span className="text-emerald-600">{String(c.new_val).slice(0, 60)}</span>}
                    </div>
                ))}
                {changes.length > 10 && <p className="text-[10px] text-slate-400">+{changes.length - 10} thay đổi khác</p>}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><Shield className="w-6 h-6 text-indigo-500" />Audit Logs</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Theo dõi mọi hoạt động trong hệ thống</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-500 to-indigo-600"><CardContent className="p-4"><p className="text-indigo-100 text-xs">Tổng logs</p><p className="text-2xl font-bold text-white">{logs.length}</p></CardContent></Card>
                <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-blue-600"><CardContent className="p-4"><p className="text-blue-100 text-xs">Hôm nay</p><p className="text-2xl font-bold text-white">{todayLogs}</p></CardContent></Card>
                <Card className="border-0 shadow-md bg-gradient-to-br from-purple-500 to-purple-600"><CardContent className="p-4"><p className="text-purple-100 text-xs">Người dùng</p><p className="text-2xl font-bold text-white">{uniqueUsers}</p></CardContent></Card>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm logs..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" />
                </div>
                <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white">
                    <option value="">Tất cả hành động</option>
                    <option value="create">Tạo mới</option>
                    <option value="update">Cập nhật</option>
                    <option value="delete">Xóa</option>
                    <option value="login">Đăng nhập</option>
                    <option value="approve">Duyệt</option>
                </select>
                <select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white">
                    <option value="">Tất cả đối tượng</option>
                    {entityTypes.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
            </div>

            {/* Logs Timeline */}
            <div className="space-y-1">
                {loading ? [1, 2, 3, 4, 5].map(i => <Card key={i} className="animate-pulse"><CardContent className="p-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" /></CardContent></Card>) :
                    filtered.length === 0 ?
                        <Card><CardContent className="flex flex-col items-center py-12"><Shield className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" /><h3 className="text-lg font-semibold text-slate-900 dark:text-white">Không có audit logs</h3></CardContent></Card> :
                        filtered.map(log => {
                            const ai = getActionIcon(log.action);
                            const Icon = ai.icon;
                            const EntityIcon = ENTITY_ICONS[log.entity_type] || FileText;
                            const isExpanded = expandedId === log.id;
                            return (
                                <Card key={log.id} className="border border-slate-200 dark:border-slate-800 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : log.id)}>
                                    <CardContent className="p-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${ai.color}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {log.user && (
                                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{log.user.full_name}</span>
                                                    )}
                                                    <span className="text-xs text-slate-900 dark:text-white font-medium">{log.action}</span>
                                                    {log.entity_type && (
                                                        <span className="flex items-center gap-0.5 text-[10px] text-slate-400"><EntityIcon className="w-3 h-3" />{log.entity_type}</span>
                                                    )}
                                                </div>
                                                {log.ip_address && <span className="text-[10px] text-slate-400">IP: {log.ip_address}</span>}
                                            </div>
                                            <span className="text-[10px] text-slate-400 flex-shrink-0">{timeAgo(log.created_at)}</span>
                                            <Eye className={`w-3.5 h-3.5 ${isExpanded ? "text-indigo-500" : "text-slate-300"}`} />
                                        </div>
                                        {isExpanded && (log.old_data || log.new_data) && (
                                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                                {renderDiff(log.old_data, log.new_data)}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })
                }
            </div>

            {/* Load more */}
            {!loading && filtered.length >= limit && (
                <div className="text-center">
                    <Button variant="outline" onClick={() => setLimit(l => l + 50)} className="text-xs">Tải thêm</Button>
                </div>
            )}
        </div>
    );
}
