"use client";

import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, CalendarOff, Check, X, CalendarDays, Clock, Umbrella, Laptop } from "lucide-react";
import { LeaveRequest, Profile } from "@/lib/types/database";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type ViewTab = "my" | "approvals";

const LEAVE_TYPES: Record<string, { label: string; icon: any; color: string }> = {
    annual: { label: "Nghỉ phép", icon: Umbrella, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    sick: { label: "Nghỉ ốm", icon: CalendarOff, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
    personal: { label: "Việc riêng", icon: CalendarDays, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
    wfh: { label: "Làm từ xa", icon: Laptop, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
};

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
    pending: { label: "Chờ duyệt", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
    approved: { label: "Đã duyệt", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
    rejected: { label: "Từ chối", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
};

export default function LeavesPage() {
    const { user, profile } = useAuth();
    const { canApproveLeave } = usePermissions();
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ leave_type: "annual", start_date: "", end_date: "", reason: "" });
    const [tab, setTab] = useState<ViewTab>("my");
    const [leaveToDelete, setLeaveToDelete] = useState<string | null>(null);

    // Quota
    const totalQuota = profile?.annual_leave_quota || 12;
    const usedDays = useMemo(() => {
        const year = new Date().getFullYear();
        return leaves.filter(l =>
            l.user_id === user?.id &&
            l.leave_type === "annual" &&
            l.status !== "rejected" &&
            new Date(l.start_date).getFullYear() === year
        ).reduce((s, l) => s + (l.total_days || 0), 0);
    }, [leaves, user?.id]);
    const remainingDays = Math.max(0, totalQuota - usedDays);

    const fetchLeaves = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            let query = supabase.from("leave_requests")
                .select("*, user:profiles!leave_requests_user_id_fkey(*), approver:profiles!leave_requests_approved_by_fkey(*)")
                .order("created_at", { ascending: false });
            if (tab === "my") query = query.eq("user_id", user.id);
            else query = query.eq("status", "pending");
            const { data, error } = await query;
            if (error) throw error;
            setLeaves((data || []) as LeaveRequest[]);
        } catch { /* */ } finally { setLoading(false); }
    }, [user, tab]);

    useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

    const handleCreate = async () => {
        if (!user || !form.start_date || !form.end_date) return;
        const start = new Date(form.start_date);
        const end = new Date(form.end_date);
        if (end < start) { toast.error("Ngày kết thúc phải sau ngày bắt đầu"); return; }
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        if (form.leave_type === "annual" && days > remainingDays) {
            toast.error(`Không đủ ngày phép! Còn lại: ${remainingDays} ngày`); return;
        }
        try {
            const { error } = await supabase.from("leave_requests").insert({
                user_id: user.id, leave_type: form.leave_type, start_date: form.start_date,
                end_date: form.end_date, total_days: days, reason: form.reason || null, status: "pending",
            });
            if (error) throw error;
            toast.success("Đã gửi đơn nghỉ phép!");
            setShowCreate(false);
            setForm({ leave_type: "annual", start_date: "", end_date: "", reason: "" });
            fetchLeaves();
        } catch (err: any) { toast.error(err.message); }
    };

    const handleApproval = async (id: string, status: "approved" | "rejected", note?: string) => {
        if (!user) return;
        try {
            const updateData: any = { status, approved_by: user.id };
            if (note) updateData.reviewer_note = note;
            const { error } = await supabase.from("leave_requests").update(updateData).eq("id", id);
            if (error) throw error;
            toast.success(status === "approved" ? "Đã duyệt đơn" : "Đã từ chối đơn");
            fetchLeaves();
        } catch (err: any) { toast.error(err.message); }
    };

    const handleDelete = async () => {
        if (!leaveToDelete) return;
        try {
            await supabase.from("leave_requests").delete().eq("id", leaveToDelete);
            toast.success("Đã xóa đơn");
            setLeaveToDelete(null);
            fetchLeaves();
        } catch (err: any) { toast.error(err.message); }
    };

    const getInitials = (n: string | null) => n?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

    // Stats
    const myLeaves = tab === "my" ? leaves : [];
    const pendingCount = myLeaves.filter(l => l.status === "pending").length;
    const approvedCount = myLeaves.filter(l => l.status === "approved").length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nghỉ phép</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý đơn nghỉ phép & quota</p>
                </div>
                <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Tạo đơn
                </Button>
            </div>

            {/* Tab switcher */}
            {canApproveLeave && (
                <div className="flex gap-2">
                    <button onClick={() => setTab("my")} className={`px-3 py-2 rounded-lg text-xs font-medium ${tab === "my" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>Đơn của tôi</button>
                    <button onClick={() => setTab("approvals")} className={`px-3 py-2 rounded-lg text-xs font-medium ${tab === "approvals" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>Chờ duyệt</button>
                </div>
            )}

            {/* Quota Stats */}
            {tab === "my" && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-blue-600">
                        <CardContent className="p-4">
                            <p className="text-blue-100 text-xs">Quota hàng năm</p>
                            <p className="text-2xl font-bold text-white">{totalQuota}</p>
                            <p className="text-blue-200 text-[10px]">ngày</p>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md bg-gradient-to-br from-amber-500 to-amber-600">
                        <CardContent className="p-4">
                            <p className="text-amber-100 text-xs">Đã sử dụng</p>
                            <p className="text-2xl font-bold text-white">{usedDays}</p>
                            <div className="mt-1 h-1.5 bg-amber-400/30 rounded-full"><div className="h-full bg-white rounded-full transition-all" style={{ width: `${Math.min(100, (usedDays / totalQuota) * 100)}%` }} /></div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500 to-emerald-600">
                        <CardContent className="p-4">
                            <p className="text-emerald-100 text-xs">Còn lại</p>
                            <p className="text-2xl font-bold text-white">{remainingDays}</p>
                            <p className={`text-[10px] ${remainingDays <= 3 ? "text-red-200" : "text-emerald-200"}`}>{remainingDays <= 3 ? "⚠️ Sắp hết" : "ngày"}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md bg-gradient-to-br from-purple-500 to-purple-600">
                        <CardContent className="p-4">
                            <p className="text-purple-100 text-xs">Đơn chờ duyệt</p>
                            <p className="text-2xl font-bold text-white">{pendingCount}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Create Form */}
            {showCreate && (
                <Card className="border-2 border-indigo-200 dark:border-indigo-800">
                    <CardHeader className="pb-3"><CardTitle className="text-base">Tạo đơn nghỉ phép</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <div>
                                <label className="text-xs font-medium text-slate-500">Loại</label>
                                <select value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white">
                                    {Object.entries(LEAVE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500">Từ ngày</label>
                                <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500">Đến ngày</label>
                                <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" />
                            </div>
                            <div className="flex flex-col justify-end">
                                {form.start_date && form.end_date && new Date(form.end_date) >= new Date(form.start_date) && (
                                    <span className="text-xs text-indigo-600 font-medium">{Math.ceil((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1} ngày</span>
                                )}
                            </div>
                        </div>
                        {form.leave_type === "annual" && (
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                <CalendarDays className="w-3 h-3" /> Còn lại <span className={`font-bold ${remainingDays <= 3 ? "text-red-600" : "text-emerald-600"}`}>{remainingDays}</span> ngày phép
                            </p>
                        )}
                        <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Lý do nghỉ phép..." rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" />
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button>
                            <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white">Gửi đơn</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Leave List */}
            <div className="space-y-2">
                {loading ? [1, 2, 3].map(i => <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" /></CardContent></Card>) :
                    leaves.length === 0 ?
                        <Card><CardContent className="flex flex-col items-center py-12"><CalendarOff className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" /><h3 className="text-lg font-semibold text-slate-900 dark:text-white">{tab === "my" ? "Chưa có đơn nào" : "Không có đơn chờ duyệt"}</h3></CardContent></Card> :
                        leaves.map(l => {
                            const lt = LEAVE_TYPES[l.leave_type] || LEAVE_TYPES.annual;
                            const ss = STATUS_STYLES[l.status] || STATUS_STYLES.pending;
                            const Icon = lt.icon;
                            return (
                                <Card key={l.id} className="border border-slate-200 dark:border-slate-800 hover:shadow-sm transition-shadow">
                                    <CardContent className="p-4 flex items-start sm:items-center gap-3 flex-col sm:flex-row">
                                        <div className={`w-10 h-10 rounded-lg ${lt.color} flex items-center justify-center flex-shrink-0`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                {tab === "approvals" && l.user && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Avatar className="h-5 w-5"><AvatarFallback className="bg-indigo-500 text-white text-[8px]">{getInitials(l.user.full_name)}</AvatarFallback></Avatar>
                                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{l.user.full_name}</span>
                                                    </div>
                                                )}
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${lt.color}`}>{lt.label}</span>
                                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${ss.color}`}>{ss.label}</span>
                                            </div>
                                            <p className="text-sm text-slate-900 dark:text-white">
                                                {new Date(l.start_date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })} → {new Date(l.end_date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                                                <span className="text-xs text-slate-500 ml-2">({l.total_days} ngày)</span>
                                            </p>
                                            {l.reason && <p className="text-xs text-slate-400 mt-0.5 truncate">{l.reason}</p>}
                                            {l.reviewer_note && <p className="text-xs text-indigo-500 mt-0.5 italic">📝 {l.reviewer_note}</p>}
                                            {l.approver && <p className="text-[10px] text-slate-400 mt-0.5">Duyệt bởi: {l.approver.full_name}</p>}
                                        </div>
                                        <div className="flex gap-1.5 flex-shrink-0">
                                            {tab === "approvals" && l.status === "pending" && (
                                                <>
                                                    <button onClick={() => handleApproval(l.id, "approved")} className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300" title="Duyệt"><Check className="w-4 h-4" /></button>
                                                    <button onClick={() => {
                                                        const note = prompt("Lý do từ chối (tùy chọn):");
                                                        handleApproval(l.id, "rejected", note || undefined);
                                                    }} className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300" title="Từ chối"><X className="w-4 h-4" /></button>
                                                </>
                                            )}
                                            {tab === "my" && l.status === "pending" && (
                                                <button onClick={() => setLeaveToDelete(l.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="Xóa"><X className="w-3.5 h-3.5 text-red-500" /></button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                }
            </div>
            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                open={!!leaveToDelete}
                onOpenChange={(open) => !open && setLeaveToDelete(null)}
                title="Xóa đơn nghỉ phép"
                description="Bạn có chắc chắn muốn xóa đơn nghỉ phép này không? Hành động này không thể hoàn tác."
                confirmLabel="Xóa"
                variant="danger"
                onConfirm={handleDelete}
            />
        </div>
    );
}
