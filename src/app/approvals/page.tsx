"use client";

import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useState, useEffect, useCallback } from "react";
import {
    ClipboardCheck, Clock, CheckCircle2, XCircle, CalendarOff, FileText,
    Umbrella, Target, Check, X, Filter, Send
} from "lucide-react";
import { toast } from "sonner";

type ApprovalItem = {
    id: string;
    type: "timesheet" | "leave" | "kpi";
    title: string;
    description: string;
    user_name: string;
    user_id: string;
    status: string;
    created_at: string;
    details: any;
};

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
    timesheet: { label: "Chấm công", icon: Clock, color: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" },
    leave: { label: "Nghỉ phép", icon: Umbrella, color: "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400" },
    kpi: { label: "KPI Review", icon: Target, color: "bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" },
};

export default function ApprovalsPage() {
    const { user } = useAuth();
    const { canApproveTimesheets, canApproveLeave, isManager } = usePermissions();
    const [items, setItems] = useState<ApprovalItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState("");
    const [filterStatus, setFilterStatus] = useState("pending");

    const fetchApprovals = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            const allItems: ApprovalItem[] = [];

            // Timesheets pending approval
            if (canApproveTimesheets) {
                const statusFilter = filterStatus === "pending" ? "submitted" : filterStatus;
                let tsQ = supabase.from("timesheets")
                    .select("*, user:profiles!timesheets_user_id_fkey(*)")
                    .order("created_at", { ascending: false })
                    .limit(50);
                if (statusFilter) tsQ = tsQ.eq("status", statusFilter);
                const { data: tsData } = await tsQ;
                (tsData || []).forEach(t => {
                    if (!filterType || filterType === "timesheet") {
                        allItems.push({
                            id: t.id, type: "timesheet", title: `Chấm công ${t.work_date}`,
                            description: `${t.hours}h - ${t.description || "Không mô tả"}`,
                            user_name: t.user?.full_name || "Unknown", user_id: t.user_id,
                            status: t.status, created_at: t.created_at, details: t,
                        });
                    }
                });
            }

            // Leave requests pending approval
            if (canApproveLeave) {
                let lrQ = supabase.from("leave_requests")
                    .select("*, user:profiles!leave_requests_user_id_fkey(*)")
                    .order("created_at", { ascending: false })
                    .limit(50);
                if (filterStatus === "pending") lrQ = lrQ.eq("status", "pending");
                else if (filterStatus) lrQ = lrQ.eq("status", filterStatus);
                const { data: lrData } = await lrQ;
                (lrData || []).forEach(l => {
                    if (!filterType || filterType === "leave") {
                        allItems.push({
                            id: l.id, type: "leave", title: `Nghỉ phép ${l.leave_type}`,
                            description: `${l.start_date} → ${l.end_date} (${l.total_days} ngày)${l.reason ? ` - ${l.reason}` : ""}`,
                            user_name: l.user?.full_name || "Unknown", user_id: l.user_id,
                            status: l.status, created_at: l.created_at, details: l,
                        });
                    }
                });
            }

            // KPI reviews pending
            if (isManager) {
                let kQ = supabase.from("kpi_reviews")
                    .select("*, user:profiles!kpi_reviews_user_id_fkey(*)")
                    .order("created_at", { ascending: false })
                    .limit(50);
                if (filterStatus === "pending") kQ = kQ.eq("status", "submitted");
                else if (filterStatus) kQ = kQ.eq("status", filterStatus);
                const { data: kData } = await kQ;
                (kData || []).forEach(k => {
                    if (!filterType || filterType === "kpi") {
                        allItems.push({
                            id: k.id, type: "kpi", title: `KPI Review ${k.period}`,
                            description: k.goals?.slice(0, 100) || "Không có mục tiêu",
                            user_name: k.user?.full_name || "Unknown", user_id: k.user_id,
                            status: k.status === "submitted" ? "pending" : k.status, created_at: k.created_at, details: k,
                        });
                    }
                });
            }

            allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setItems(allItems);
        } catch { /* */ } finally { setLoading(false); }
    }, [user, filterType, filterStatus, canApproveTimesheets, canApproveLeave, isManager]);

    useEffect(() => { fetchApprovals(); }, [fetchApprovals]);

    const handleApprove = async (item: ApprovalItem) => {
        if (!user) return;
        try {
            if (item.type === "timesheet") {
                await supabase.from("timesheets").update({ status: "approved", approved_by: user.id }).eq("id", item.id);
            } else if (item.type === "leave") {
                await supabase.from("leave_requests").update({ status: "approved", approved_by: user.id }).eq("id", item.id);
            }
            toast.success("Đã duyệt!");
            fetchApprovals();
        } catch (err: any) { toast.error(err.message); }
    };

    const handleReject = async (item: ApprovalItem) => {
        const note = prompt("Lý do từ chối (tùy chọn):");
        if (!user) return;
        try {
            if (item.type === "timesheet") {
                await supabase.from("timesheets").update({ status: "rejected", approved_by: user.id }).eq("id", item.id);
            } else if (item.type === "leave") {
                const updateData: any = { status: "rejected", approved_by: user.id };
                if (note) updateData.reviewer_note = note;
                await supabase.from("leave_requests").update(updateData).eq("id", item.id);
            }
            toast.success("Đã từ chối!");
            fetchApprovals();
        } catch (err: any) { toast.error(err.message); }
    };

    const getInitials = (n: string | null) => n?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

    const pendingCount = items.filter(i => i.status === "pending" || i.status === "submitted").length;
    const approvedCount = items.filter(i => i.status === "approved" || i.status === "reviewed").length;
    const rejectedCount = items.filter(i => i.status === "rejected").length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><ClipboardCheck className="w-6 h-6 text-indigo-500" />Phê duyệt</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý tất cả yêu cầu phê duyệt tập trung</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="border-0 shadow-md bg-gradient-to-br from-amber-500 to-amber-600"><CardContent className="p-4"><p className="text-amber-100 text-xs">Chờ duyệt</p><p className="text-2xl font-bold text-white">{pendingCount}</p></CardContent></Card>
                <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500 to-emerald-600"><CardContent className="p-4"><p className="text-emerald-100 text-xs">Đã duyệt</p><p className="text-2xl font-bold text-white">{approvedCount}</p></CardContent></Card>
                <Card className="border-0 shadow-md bg-gradient-to-br from-red-500 to-red-600"><CardContent className="p-4"><p className="text-red-100 text-xs">Từ chối</p><p className="text-2xl font-bold text-white">{rejectedCount}</p></CardContent></Card>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white">
                    <option value="">Tất cả loại</option>
                    <option value="timesheet">Chấm công</option>
                    <option value="leave">Nghỉ phép</option>
                    <option value="kpi">KPI</option>
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white">
                    <option value="pending">Chờ duyệt</option>
                    <option value="approved">Đã duyệt</option>
                    <option value="rejected">Từ chối</option>
                    <option value="">Tất cả</option>
                </select>
            </div>

            {/* Items */}
            <div className="space-y-2">
                {loading ? [1, 2, 3].map(i => <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" /></CardContent></Card>) :
                    items.length === 0 ?
                        <Card><CardContent className="flex flex-col items-center py-12"><ClipboardCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" /><h3 className="text-lg font-semibold text-slate-900 dark:text-white">Không có yêu cầu</h3></CardContent></Card> :
                        items.map(item => {
                            const tc = TYPE_CONFIG[item.type];
                            const Icon = tc.icon;
                            const isPending = item.status === "pending" || item.status === "submitted";
                            return (
                                <Card key={`${item.type}-${item.id}`} className="border border-slate-200 dark:border-slate-800 hover:shadow-sm transition-shadow">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${tc.color}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <Avatar className="h-7 w-7 flex-shrink-0"><AvatarFallback className="bg-indigo-500 text-white text-[8px]">{getInitials(item.user_name)}</AvatarFallback></Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                <span className="text-sm font-medium text-slate-900 dark:text-white">{item.user_name}</span>
                                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${tc.color}`}>{tc.label}</span>
                                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${isPending ? "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300" : item.status === "approved" || item.status === "reviewed" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                                    {isPending ? "Chờ duyệt" : item.status === "approved" || item.status === "reviewed" ? "Đã duyệt" : "Từ chối"}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.title} · {item.description}</p>
                                            <p className="text-[10px] text-slate-400">{new Date(item.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                                        </div>
                                        {isPending && item.type !== "kpi" && (
                                            <div className="flex gap-1.5 flex-shrink-0">
                                                <button onClick={() => handleApprove(item)} className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300" title="Duyệt"><Check className="w-4 h-4" /></button>
                                                <button onClick={() => handleReject(item)} className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300" title="Từ chối"><X className="w-4 h-4" /></button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })
                }
            </div>
        </div>
    );
}
