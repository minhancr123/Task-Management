"use client";

import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Clock, Calendar, Check, X, Send, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Timesheet, Profile, Project, Task } from "@/lib/types/database";
import { toast } from "sonner";

type ViewTab = "my" | "approvals";

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
    draft: { label: "Nháp", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
    submitted: { label: "Đã nộp", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    approved: { label: "Đã duyệt", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
    rejected: { label: "Từ chối", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
};

export default function TimesheetsPage() {
    const { user } = useAuth();
    const { canApproveTimesheets, isManager } = usePermissions();
    const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [tab, setTab] = useState<ViewTab>("my");

    // Form state
    const [form, setForm] = useState({ work_date: new Date().toISOString().slice(0, 10), hours: "8", description: "", project_id: "", task_id: "" });
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);

    // Week navigation
    const [weekOffset, setWeekOffset] = useState(0);

    const fetchTimesheets = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            let query = supabase.from("timesheets")
                .select("*, user:profiles(*), task:tasks(*), project:projects(*)")
                .order("work_date", { ascending: false });

            if (tab === "my") {
                query = query.eq("user_id", user.id);
            } else {
                // Manager sees all pending timesheets
                query = query.in("status", ["submitted"]);
            }

            const { data, error } = await query.limit(100);
            if (error) throw error;
            setTimesheets((data || []) as Timesheet[]);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, [user, tab]);

    useEffect(() => { fetchTimesheets(); }, [fetchTimesheets]);
    useEffect(() => {
        supabase.from("projects").select("*").order("name").then(({ data }) => setProjects((data || []) as Project[]));
    }, []);
    useEffect(() => {
        if (form.project_id) {
            supabase.from("tasks").select("*").eq("project_id", form.project_id).order("title").then(({ data }) => setTasks((data || []) as Task[]));
        } else { setTasks([]); }
    }, [form.project_id]);

    // Week calculation
    const weekDates = useMemo(() => {
        const today = new Date();
        today.setDate(today.getDate() + weekOffset * 7);
        const monday = new Date(today);
        monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d.toISOString().slice(0, 10);
        });
    }, [weekOffset]);

    const myTimesheets = tab === "my" ? timesheets : [];
    const weekLabel = weekDates.length > 0 ? `${new Date(weekDates[0]).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} - ${new Date(weekDates[6]).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}` : "";

    // Stats
    const weekHours = myTimesheets.filter(t => weekDates.includes(t.work_date)).reduce((s, t) => s + (t.hours || 0), 0);
    const monthStart = new Date(); monthStart.setDate(1);
    const monthHours = myTimesheets.filter(t => new Date(t.work_date) >= monthStart).reduce((s, t) => s + (t.hours || 0), 0);
    const pendingCount = myTimesheets.filter(t => t.status === "draft").length;
    const approvedCount = myTimesheets.filter(t => t.status === "approved").length;

    const handleCreate = async () => {
        if (!user || !form.hours) return;
        try {
            const { error } = await supabase.from("timesheets").insert({
                user_id: user.id, work_date: form.work_date,
                hours: parseFloat(form.hours), description: form.description || null,
                project_id: form.project_id || null, task_id: form.task_id || null,
                status: "draft",
            });
            if (error) throw error;
            toast.success("Đã ghi nhận giờ làm");
            setShowCreate(false);
            setForm({ work_date: new Date().toISOString().slice(0, 10), hours: "8", description: "", project_id: "", task_id: "" });
            fetchTimesheets();
        } catch (err: any) { toast.error(err.message); }
    };

    const handleSubmit = async (id: string) => {
        try {
            const { error } = await supabase.from("timesheets").update({ status: "submitted" }).eq("id", id);
            if (error) throw error;
            toast.success("Đã nộp timesheet!");
            fetchTimesheets();
        } catch (err: any) { toast.error(err.message); }
    };

    const handleSubmitAll = async () => {
        const drafts = myTimesheets.filter(t => t.status === "draft" && weekDates.includes(t.work_date));
        if (drafts.length === 0) return;
        try {
            for (const d of drafts) {
                await supabase.from("timesheets").update({ status: "submitted" }).eq("id", d.id);
            }
            toast.success(`Đã nộp ${drafts.length} timesheet!`);
            fetchTimesheets();
        } catch (err: any) { toast.error(err.message); }
    };

    const handleApproval = async (id: string, status: "approved" | "rejected") => {
        if (!user) return;
        try {
            const { error } = await supabase.from("timesheets").update({ status, approved_by: user.id }).eq("id", id);
            if (error) throw error;
            toast.success(status === "approved" ? "Đã duyệt" : "Đã từ chối");
            fetchTimesheets();
        } catch (err: any) { toast.error(err.message); }
    };

    const handleDelete = async (id: string) => {
        try {
            await supabase.from("timesheets").delete().eq("id", id);
            toast.success("Đã xóa");
            fetchTimesheets();
        } catch (err: any) { toast.error(err.message); }
    };

    const getInitials = (n: string | null) => n?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
    const dayLabel = (d: string) => new Date(d).toLocaleDateString("vi-VN", { weekday: "short", day: "numeric", month: "numeric" });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Chấm công</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Ghi nhận, nộp và duyệt giờ làm việc</p>
                </div>
                <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Ghi nhận giờ
                </Button>
            </div>

            {/* Tab switcher */}
            {canApproveTimesheets && (
                <div className="flex gap-2">
                    <button onClick={() => setTab("my")} className={`px-3 py-2 rounded-lg text-xs font-medium ${tab === "my" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>Của tôi</button>
                    <button onClick={() => setTab("approvals")} className={`px-3 py-2 rounded-lg text-xs font-medium ${tab === "approvals" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>Chờ duyệt</button>
                </div>
            )}

            {/* Stats (my tab only) */}
            {tab === "my" && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-blue-600">
                        <CardContent className="p-4"><p className="text-blue-100 text-xs">Giờ tuần này</p><p className="text-2xl font-bold text-white">{weekHours}h</p></CardContent>
                    </Card>
                    <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-500 to-indigo-600">
                        <CardContent className="p-4"><p className="text-indigo-100 text-xs">Giờ tháng này</p><p className="text-2xl font-bold text-white">{monthHours}h</p></CardContent>
                    </Card>
                    <Card className="border-0 shadow-md bg-gradient-to-br from-amber-500 to-amber-600">
                        <CardContent className="p-4"><p className="text-amber-100 text-xs">Chưa nộp</p><p className="text-2xl font-bold text-white">{pendingCount}</p></CardContent>
                    </Card>
                    <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500 to-emerald-600">
                        <CardContent className="p-4"><p className="text-emerald-100 text-xs">Đã duyệt</p><p className="text-2xl font-bold text-white">{approvedCount}</p></CardContent>
                    </Card>
                </div>
            )}

            {/* Create Form */}
            {showCreate && (
                <Card className="border-2 border-indigo-200 dark:border-indigo-800">
                    <CardHeader className="pb-3"><CardTitle className="text-base">Ghi nhận giờ làm</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div><label className="text-xs font-medium text-slate-500">Ngày</label>
                                <input type="date" value={form.work_date} onChange={(e) => setForm({ ...form, work_date: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" /></div>
                            <div><label className="text-xs font-medium text-slate-500">Số giờ</label>
                                <input type="number" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} min="0.5" max="24" step="0.5" className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" /></div>
                            <div><label className="text-xs font-medium text-slate-500">Dự án</label>
                                <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value, task_id: "" })} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white">
                                    <option value="">— Chọn —</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select></div>
                            <div><label className="text-xs font-medium text-slate-500">Task</label>
                                <select value={form.task_id} onChange={(e) => setForm({ ...form, task_id: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" disabled={!form.project_id}>
                                    <option value="">— Chọn —</option>{tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                                </select></div>
                        </div>
                        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Mô tả công việc..." rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" />
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button>
                            <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white">Lưu</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Week Navigation (my tab) */}
            {tab === "my" && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setWeekOffset(w => w - 1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronLeft className="w-4 h-4 text-slate-500" /></button>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{weekLabel}</span>
                        <button onClick={() => setWeekOffset(w => w + 1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronRight className="w-4 h-4 text-slate-500" /></button>
                        {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} className="text-xs text-indigo-600 hover:underline ml-2">Tuần này</button>}
                    </div>
                    {pendingCount > 0 && (
                        <Button size="sm" onClick={handleSubmitAll} className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                            <Send className="w-3 h-3 mr-1" /> Nộp tất cả nháp
                        </Button>
                    )}
                </div>
            )}

            {/* Calendar week view (my tab) */}
            {tab === "my" && !loading && (
                <div className="grid grid-cols-7 gap-2">
                    {weekDates.map(date => {
                        const entries = myTimesheets.filter(t => t.work_date === date);
                        const dayHours = entries.reduce((s, t) => s + (t.hours || 0), 0);
                        const isToday = date === new Date().toISOString().slice(0, 10);
                        return (
                            <div key={date} className={`rounded-xl border p-2 min-h-[80px] ${isToday ? "border-indigo-300 bg-indigo-50/50 dark:bg-indigo-900/10 dark:border-indigo-700" : "border-slate-200 dark:border-slate-800"}`}>
                                <p className={`text-[10px] font-medium mb-1 ${isToday ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`}>{dayLabel(date)}</p>
                                {entries.map(e => (
                                    <div key={e.id} className="flex items-center justify-between mb-0.5">
                                        <span className="text-[10px] text-slate-600 dark:text-slate-300 truncate flex-1">{e.hours}h</span>
                                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_STYLES[e.status]?.color.split(" ")[0] || "bg-slate-400"}`} />
                                    </div>
                                ))}
                                {dayHours > 0 && <p className="text-[10px] font-bold text-slate-900 dark:text-white mt-1">{dayHours}h</p>}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Timesheet List */}
            <div className="space-y-2">
                {loading ? [1, 2, 3, 4].map(i => <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" /></CardContent></Card>) :
                    (tab === "my" ? myTimesheets : timesheets).length === 0 ?
                        <Card><CardContent className="flex flex-col items-center py-12"><Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" /><h3 className="text-lg font-semibold text-slate-900 dark:text-white">{tab === "my" ? "Chưa có dữ liệu" : "Không có timesheet chờ duyệt"}</h3></CardContent></Card> :
                        (tab === "my" ? myTimesheets : timesheets).map(ts => {
                            const ss = STATUS_STYLES[ts.status] || STATUS_STYLES.draft;
                            return (
                                <Card key={ts.id} className="border border-slate-200 dark:border-slate-800">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                {tab === "approvals" && ts.user && (
                                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{ts.user.full_name}</span>
                                                )}
                                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                    {new Date(ts.work_date).toLocaleDateString("vi-VN", { weekday: "short", day: "numeric", month: "long" })}
                                                </span>
                                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${ss.color}`}>{ss.label}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                {ts.project && <span className="truncate max-w-[120px]">📁 {ts.project.name}</span>}
                                                {ts.task && <span className="truncate max-w-[120px]">📋 {ts.task.title}</span>}
                                                {ts.description && <span className="truncate max-w-[150px]">{ts.description}</span>}
                                            </div>
                                        </div>
                                        <p className="text-lg font-bold text-slate-900 dark:text-white">{ts.hours}h</p>
                                        <div className="flex gap-1.5 flex-shrink-0">
                                            {tab === "my" && ts.status === "draft" && (
                                                <>
                                                    <button onClick={() => handleSubmit(ts.id)} className="p-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300" title="Nộp"><Send className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => handleDelete(ts.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="Xóa"><X className="w-3.5 h-3.5 text-red-500" /></button>
                                                </>
                                            )}
                                            {tab === "approvals" && ts.status === "submitted" && (
                                                <>
                                                    <button onClick={() => handleApproval(ts.id, "approved")} className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300" title="Duyệt"><Check className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => handleApproval(ts.id, "rejected")} className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300" title="Từ chối"><X className="w-3.5 h-3.5" /></button>
                                                </>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                }
            </div>
        </div>
    );
}
