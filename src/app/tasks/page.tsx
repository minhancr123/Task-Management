"use client";

import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, CheckSquare, Search, Calendar } from "lucide-react";
import { Task, Profile, Project } from "@/lib/types/database";
import { toast } from "sonner";
import { useTasks } from "@/hooks/use-tasks";
import { useQueryClient } from "@tanstack/react-query";
import { createNotification } from "@/lib/notifications";

export default function TasksPage() {
    const { user } = useAuth();
    const { isManager } = usePermissions();
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showCreate, setShowCreate] = useState(false);
    const [allUsers, setAllUsers] = useState<Profile[]>([]);
    const [allProjects, setAllProjects] = useState<Project[]>([]);
    const [form, setForm] = useState({ title: "", description: "", priority: "medium", assigned_to: "", project_id: "", due_date: "" });
    const queryClient = useQueryClient();

    // Use React Query
    const { data: tasks = [], isLoading: loading } = useTasks(statusFilter);

    useEffect(() => {
        supabase.from("profiles").select("*").order("full_name").then(({ data }) => setAllUsers((data || []) as Profile[]));
        supabase.from("projects").select("*").order("name").then(({ data }) => setAllProjects((data || []) as Project[]));
    }, []);

    const handleCreate = async () => {
        if (!form.title.trim() || !user) return;
        try {
            const { data, error } = await supabase.from("tasks").insert({
                title: form.title, description: form.description || null,
                priority: form.priority, status: "todo", created_by: user.id,
                assigned_to: form.assigned_to || null, project_id: form.project_id || null,
                due_date: form.due_date || null, tags: [], order_index: 0,
            }).select().single();

            if (error) throw error;

            // Trigger Notification if assigned
            if (form.assigned_to && data) {
                await createNotification({
                    userId: form.assigned_to,
                    title: "Công việc mới",
                    message: `${user.user_metadata?.full_name || user.email} đã phân công công việc "${form.title}" cho bạn.`,
                    type: "task_assigned",
                    entityType: "tasks",
                    entityId: data.id,
                    senderId: user.id
                });
            }

            toast.success("Tạo công việc thành công!");
            setShowCreate(false);
            setForm({ title: "", description: "", priority: "medium", assigned_to: "", project_id: "", due_date: "" });
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        } catch (err: any) { toast.error(err.message); }
    };

    const filtered = tasks.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));
    const getStatusBadge = (status: string) => {
        const map: Record<string, { label: string; color: string }> = {
            todo: { label: "Chờ làm", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
            in_progress: { label: "Đang làm", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
            "in-progress": { label: "Đang làm", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
            active: { label: "Đang hoạt động", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" },
            in_review: { label: "Chờ duyệt", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
            completed: { label: "Hoàn thành", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
            cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
        };
        return map[status] || { label: status, color: "bg-slate-100 text-slate-700" };
    };
    const getInitials = (n: string | null) => n?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Công việc</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý tất cả công việc — {tasks.length} task</p>
                </div>
                <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Tạo công việc
                </Button>
            </div>

            {showCreate && (
                <Card className="border-2 border-indigo-200 dark:border-indigo-800">
                    <CardHeader className="pb-3"><CardTitle className="text-base">Tạo công việc mới</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Tên công việc *"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" />
                        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Mô tả..." rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white">
                                <option value="low">Thấp</option><option value="medium">Trung bình</option><option value="high">Cao</option><option value="critical">Khẩn cấp</option>
                            </select>
                            <select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white">
                                <option value="">Chưa gán</option>{allUsers.map((u) => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                            </select>
                            <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white">
                                <option value="">Không dự án</option>{allProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button>
                            <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white">Tạo</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Tìm kiếm..." value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                </div>
                <div className="flex gap-2 overflow-x-auto">
                    {[{ value: "all", label: "Tất cả" }, { value: "todo", label: "Chờ làm" }, { value: "in_progress", label: "Đang làm" }, { value: "in_review", label: "Chờ duyệt" }, { value: "completed", label: "Hoàn thành" }].map((s) => (
                        <button key={s.value} onClick={() => setStatusFilter(s.value)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${statusFilter === s.value ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Card key={i} className="animate-pulse"><CardContent className="p-4 flex items-center gap-4"><div className="w-1.5 h-10 rounded-full bg-slate-200 dark:bg-slate-700" /><div className="flex-1 space-y-2"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" /><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" /></div></CardContent></Card>)}</div>
            ) : filtered.length === 0 ? (
                <Card><CardContent className="flex flex-col items-center py-12"><CheckSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" /><h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Không có công việc</h3><p className="text-sm text-slate-500 dark:text-slate-400">Tạo công việc đầu tiên</p></CardContent></Card>
            ) : (
                <div className="space-y-2">
                    {filtered.map((task) => {
                        const sb = getStatusBadge(task.status);
                        return (
                            <Card key={task.id} className="hover:shadow-sm transition-shadow cursor-pointer group border border-slate-200 dark:border-slate-800"
                                onClick={() => router.push(`/tasks/${task.id}`)}>
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${task.priority === "critical" ? "bg-red-500" : task.priority === "high" ? "bg-orange-500" : task.priority === "medium" ? "bg-yellow-500" : "bg-green-500"}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{task.title}</p>
                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${sb.color}`}>{sb.label}</span>
                                            {task.due_date && <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><Calendar className="w-3 h-3" />{new Date(task.due_date).toLocaleDateString("vi-VN")}</span>}
                                        </div>
                                    </div>
                                    {task.assignee && (
                                        <Avatar className="h-7 w-7"><AvatarFallback className="bg-indigo-500 text-white text-[10px] font-bold">{getInitials(task.assignee.full_name)}</AvatarFallback></Avatar>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
