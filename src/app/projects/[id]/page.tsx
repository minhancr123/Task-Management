"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useState, useEffect, useCallback } from "react";
import {
    ChevronRight, Calendar, Clock, Users, Target, Plus, UserPlus,
    X, Edit2, Trash2, CheckCircle2, Circle, BarChart3, DollarSign
} from "lucide-react";
import { Project, ProjectMember, Task, Milestone, Profile } from "@/lib/types/database";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useProjectDetails } from "@/hooks/use-project-details";
import { useQueryClient } from "@tanstack/react-query";
import { createNotification } from "@/lib/notifications";
import { KanbanBoard } from "@/components/kanban-board";

type Tab = "overview" | "tasks" | "members" | "milestones";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    planning: { label: "Kế hoạch", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    active: { label: "Đang chạy", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
    on_hold: { label: "Tạm dừng", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
    completed: { label: "Hoàn thành", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
    cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
};

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
    low: { label: "Thấp", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
    medium: { label: "Trung bình", color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300" },
    high: { label: "Cao", color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300" },
    critical: { label: "Khẩn cấp", color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300" },
};

const TASK_STATUS_MAP: Record<string, { label: string; color: string }> = {
    todo: { label: "Chờ", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
    in_progress: { label: "Đang làm", color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300" },
    in_review: { label: "Review", color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300" },
    completed: { label: "Xong", color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300" },
    cancelled: { label: "Hủy", color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300" },
};

export default function ProjectDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const { canManageProjects, isAdmin } = usePermissions();

    const queryClient = useQueryClient();
    const { data: projectDetails, isLoading: loading, error } = useProjectDetails(id);

    // Derived state
    const project = projectDetails || null;
    const tasks = projectDetails?.tasks || [];
    const members = projectDetails?.members || [];
    const milestones = projectDetails?.milestones || [];

    const [allUsers, setAllUsers] = useState<Profile[]>([]);
    const [tab, setTab] = useState<Tab>("overview");

    // Dialogs
    const [showAddTask, setShowAddTask] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [showAddMilestone, setShowAddMilestone] = useState(false);
    const [showEditProject, setShowEditProject] = useState(false);
    const [showDeleteProjectConfirm, setShowDeleteProjectConfirm] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<ProjectMember | null>(null);

    // Forms
    const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium", assigned_to: "", due_date: "" });
    const [milestoneForm, setMilestoneForm] = useState({ title: "", description: "", due_date: "" });
    const [projectForm, setProjectForm] = useState({ name: "", description: "", status: "active", priority: "medium", start_date: "", end_date: "", budget: "" });

    // Sync form when project loads
    useEffect(() => {
        if (project) {
            setProjectForm({
                name: project.name, description: project.description || "", status: project.status,
                priority: project.priority, start_date: project.start_date || "", end_date: project.end_date || "",
                budget: project.budget?.toString() || "",
            });
        }
    }, [project]);

    // Fetch users only once
    const fetchUsers = useCallback(async () => {
        const { data } = await supabase.from("profiles").select("*").order("full_name");
        setAllUsers((data || []) as Profile[]);
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // === CRUD Handlers ===
    const handleUpdateProject = async () => {
        if (!projectForm.name.trim()) return;
        try {
            const { error } = await supabase.from("projects").update({
                name: projectForm.name, description: projectForm.description || null,
                status: projectForm.status, priority: projectForm.priority,
                start_date: projectForm.start_date || null, end_date: projectForm.end_date || null,
                budget: projectForm.budget ? parseFloat(projectForm.budget) : null,
            }).eq("id", id);
            if (error) throw error;
            toast.success("Cập nhật dự án thành công!");
            setShowEditProject(false);
            queryClient.invalidateQueries({ queryKey: ["project", id] });

        } catch (err: any) { toast.error(err.message); }
    };

    const handleDeleteProject = async () => {
        try {
            await supabase.from("tasks").delete().eq("project_id", id);
            await supabase.from("project_members").delete().eq("project_id", id);
            await supabase.from("milestones").delete().eq("project_id", id);
            const { error } = await supabase.from("projects").delete().eq("id", id);
            if (error) throw error;
            toast.success("Đã xóa dự án");
            router.push("/projects");
        } catch (err: any) { toast.error(err.message); }
    };

    const handleCreateTask = async () => {
        if (!taskForm.title.trim()) return;
        try {
            const { error } = await supabase.from("tasks").insert({
                title: taskForm.title, description: taskForm.description || null,
                project_id: id, priority: taskForm.priority, status: "todo",
                assigned_to: taskForm.assigned_to || null, created_by: user!.id,
                due_date: taskForm.due_date || null, tags: [], order_index: tasks.length,
            });
            if (error) throw error;
            toast.success("Tạo công việc thành công!");
            setShowAddTask(false);
            setTaskForm({ title: "", description: "", priority: "medium", assigned_to: "", due_date: "" });
            queryClient.invalidateQueries({ queryKey: ["project", id] });

        } catch (err: any) { toast.error(err.message); }
    };

    const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
        try {
            await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
            queryClient.invalidateQueries({ queryKey: ["project", id] });

        } catch (err: any) { toast.error(err.message); }
    };

    const handleAddMember = async (userId: string, role: string) => {
        try {
            const { error } = await supabase.from("project_members").insert({ project_id: id, user_id: userId, role });
            if (error) throw error;

            // Notify the new member
            await createNotification({
                userId: userId,
                title: "Thêm vào dự án",
                message: `${user?.user_metadata?.full_name || user?.email} đã thêm bạn vào dự án "${project?.name}".`,
                type: "system",
                entityType: "projects",
                entityId: id,
                senderId: user?.id
            });

            toast.success("Đã thêm thành viên!");
            setShowAddMember(false);
            queryClient.invalidateQueries({ queryKey: ["project", id] });
        } catch (err: any) { toast.error(err.message); }
    };

    const handleRemoveMember = async () => {
        if (!memberToDelete) return;
        try {
            await supabase.from("project_members").delete().eq("id", memberToDelete.id);
            toast.success("Đã xóa thành viên");
            setMemberToDelete(null);
            setMemberToDelete(null);
            queryClient.invalidateQueries({ queryKey: ["project", id] });
        } catch (err: any) { toast.error(err.message); }
    };

    const handleCreateMilestone = async () => {
        if (!milestoneForm.title.trim() || !milestoneForm.due_date) return;
        try {
            const { error } = await supabase.from("milestones").insert({
                project_id: id, title: milestoneForm.title,
                description: milestoneForm.description || null,
                due_date: milestoneForm.due_date, status: "pending",
            });
            if (error) throw error;
            toast.success("Tạo milestone thành công!");
            setShowAddMilestone(false);
            setMilestoneForm({ title: "", description: "", due_date: "" });
            queryClient.invalidateQueries({ queryKey: ["project", id] });
        } catch (err: any) { toast.error(err.message); }
    };

    const handleToggleMilestone = async (ms: Milestone) => {
        try {
            await supabase.from("milestones").update({ status: ms.status === "completed" ? "pending" : "completed" }).eq("id", ms.id);
            queryClient.invalidateQueries({ queryKey: ["project", id] });
        } catch (err: any) { toast.error(err.message); }
    };

    const getInitials = (name: string | null) =>
        name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

    if (loading || !project) {
        return (
            <div className="space-y-4">
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 animate-pulse" />
                <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
        );
    }

    const st = STATUS_MAP[project.status] || STATUS_MAP.active;
    const pr = PRIORITY_MAP[project.priority] || PRIORITY_MAP.medium;
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    const existingMemberIds = members.map((m) => m.user_id);
    const availableUsers = allUsers.filter((u) => !existingMemberIds.includes(u.id));

    const tabs: { key: Tab; label: string; count?: number }[] = [
        { key: "overview", label: "Tổng quan" },
        { key: "tasks", label: "Công việc", count: tasks.length },
        { key: "members", label: "Thành viên", count: members.length },
        { key: "milestones", label: "Milestones", count: milestones.length },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-3">
                <button onClick={() => router.push("/projects")} className="mt-1 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                    <ChevronRight className="w-5 h-5 text-slate-400 rotate-180" />
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white truncate">{project.name}</h1>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${pr.color}`}>{pr.label}</span>
                    </div>
                    {project.description && <p className="text-sm text-slate-500 dark:text-slate-400">{project.description}</p>}
                </div>
                {canManageProjects && (
                    <div className="flex gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" onClick={() => setShowEditProject(true)}>
                            <Edit2 className="w-3.5 h-3.5 mr-1.5" />Sửa
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setShowDeleteProjectConfirm(true)}>
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />Xóa
                        </Button>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-500 to-indigo-600">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-1"><Target className="w-4 h-4 text-indigo-200" /></div>
                        <p className="text-indigo-100 text-xs">Tiến độ</p>
                        <p className="text-2xl font-bold text-white">{progress}%</p>
                        <div className="mt-2 w-full h-1.5 bg-indigo-400/30 rounded-full">
                            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-blue-600">
                    <CardContent className="p-4"><p className="text-blue-100 text-xs">Công việc</p><p className="text-2xl font-bold text-white">{completedTasks}/{tasks.length}</p></CardContent>
                </Card>
                <Card className="border-0 shadow-md bg-gradient-to-br from-purple-500 to-purple-600">
                    <CardContent className="p-4"><p className="text-purple-100 text-xs">Thành viên</p><p className="text-2xl font-bold text-white">{members.length}</p></CardContent>
                </Card>
                <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500 to-emerald-600">
                    <CardContent className="p-4"><p className="text-emerald-100 text-xs">Budget</p><p className="text-2xl font-bold text-white">{project.budget ? `${(project.budget / 1e6).toFixed(0)}M` : "—"}</p></CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
                {tabs.map((t) => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
                        {t.label} {t.count !== undefined && <span className="ml-1 text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">{t.count}</span>}
                    </button>
                ))}
            </div>

            {/* Edit Project Dialog */}
            {showEditProject && (
                <Card className="border-2 border-indigo-200 dark:border-indigo-800">
                    <CardHeader className="pb-3"><CardTitle className="text-base">Sửa dự án</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tên dự án *</label>
                                <input type="text" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" /></div>
                            <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Trạng thái</label>
                                <select value={projectForm.status} onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white">
                                    <option value="planning">Kế hoạch</option><option value="active">Đang chạy</option><option value="on_hold">Tạm dừng</option><option value="completed">Hoàn thành</option><option value="cancelled">Đã hủy</option>
                                </select></div>
                            <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Bắt đầu</label>
                                <input type="date" value={projectForm.start_date} onChange={(e) => setProjectForm({ ...projectForm, start_date: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" /></div>
                            <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Kết thúc</label>
                                <input type="date" value={projectForm.end_date} onChange={(e) => setProjectForm({ ...projectForm, end_date: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" /></div>
                            <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ngân sách (VND)</label>
                                <input type="number" value={projectForm.budget} onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" /></div>
                            <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Độ ưu tiên</label>
                                <select value={projectForm.priority} onChange={(e) => setProjectForm({ ...projectForm, priority: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white">
                                    <option value="low">Thấp</option><option value="medium">Trung bình</option><option value="high">Cao</option><option value="critical">Khẩn cấp</option>
                                </select></div>
                        </div>
                        <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Mô tả</label>
                            <textarea value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" /></div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowEditProject(false)}>Hủy</Button>
                            <Button onClick={handleUpdateProject} className="bg-indigo-600 hover:bg-indigo-700 text-white">Cập nhật</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tab: Overview */}
            {tab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border border-slate-200 dark:border-slate-800">
                        <CardHeader><CardTitle className="text-base">Thông tin dự án</CardTitle></CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-slate-500">Trạng thái</span><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Độ ưu tiên</span><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pr.color}`}>{pr.label}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Ngày bắt đầu</span><span className="text-slate-900 dark:text-white">{project.start_date || "—"}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Ngày kết thúc</span><span className="text-slate-900 dark:text-white">{project.end_date || "—"}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Ngân sách</span><span className="text-slate-900 dark:text-white">{project.budget ? new Intl.NumberFormat("vi-VN").format(project.budget) + " VND" : "—"}</span></div>
                        </CardContent>
                    </Card>
                    <Card className="border border-slate-200 dark:border-slate-800">
                        <CardHeader><CardTitle className="text-base">Phân bổ công việc</CardTitle></CardHeader>
                        <CardContent>
                            {tasks.length === 0 ? <p className="text-sm text-slate-500 text-center py-4">Chưa có công việc</p> : (
                                <div className="space-y-2">
                                    {Object.entries(TASK_STATUS_MAP).map(([key, val]) => {
                                        const count = tasks.filter((t) => t.status === key).length;
                                        if (count === 0) return null;
                                        return (
                                            <div key={key} className="flex items-center gap-3">
                                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${val.color}`}>{val.label}</span>
                                                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(count / tasks.length) * 100}%` }} />
                                                </div>
                                                <span className="text-xs text-slate-500 w-8 text-right">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Tab: Tasks */}
            {tab === "tasks" && (
                <div className="space-y-4">
                    {canManageProjects && (
                        <div className="flex justify-end">
                            <Button size="sm" onClick={() => setShowAddTask(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                <Plus className="w-3.5 h-3.5 mr-1.5" /> Thêm công việc
                            </Button>
                        </div>
                    )}
                    {showAddTask && (
                        <Card className="border-2 border-indigo-200 dark:border-indigo-800">
                            <CardContent className="p-4 space-y-3">
                                <input type="text" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Tên công việc *" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" />
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white">
                                        <option value="low">Thấp</option><option value="medium">Trung bình</option><option value="high">Cao</option><option value="critical">Khẩn cấp</option>
                                    </select>
                                    <select value={taskForm.assigned_to} onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white">
                                        <option value="">Chưa gán</option>{allUsers.map((u) => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                                    </select>
                                    <input type="date" value={taskForm.due_date} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setShowAddTask(false)}>Hủy</Button>
                                    <Button size="sm" onClick={handleCreateTask} className="bg-indigo-600 hover:bg-indigo-700 text-white">Tạo</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {/* Kanban Board */}
                    <div className="flex-1 overflow-hidden min-h-[500px]">
                        <KanbanBoard
                            tasks={tasks as any[]}
                            onTaskMove={async (taskId: string, newStatus: string) => {
                                // Optimistic Update
                                const previousData = queryClient.getQueryData(["project", id]);
                                queryClient.setQueryData(["project", id], (old: any) => {
                                    if (!old) return old;
                                    return {
                                        ...old,
                                        tasks: old.tasks.map((t: any) =>
                                            t.id === taskId ? { ...t, status: newStatus } : t
                                        )
                                    };
                                });

                                try {
                                    await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
                                    // No need to invalidate immediately if optimistic update is correct,
                                    // but good practice to sync eventually.
                                    // queryClient.invalidateQueries({ queryKey: ["project", id] });
                                } catch (err: any) {
                                    toast.error(err.message);
                                    // Revert
                                    queryClient.setQueryData(["project", id], previousData);
                                }
                            }}
                            onEditTask={(task: any) => {
                                // Populate form and show dialog or handle edit differently if needed
                                // For now, maybe just log or simple message as the original code didn't have full edit
                                // Or better, reuse the existing Edit logic if adaptable.
                                // The original code only had status change.
                                // Let's keep it simple or implement edit dialog if the user asks.
                            }}
                            onDeleteTask={async (taskId: string) => {
                                try {
                                    await supabase.from("tasks").delete().eq("id", taskId);
                                    toast.success("Đã xóa công việc");
                                    queryClient.invalidateQueries({ queryKey: ["project", id] });
                                } catch (err: any) { toast.error(err.message); }
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Tab: Members */}
            {tab === "members" && (
                <div className="space-y-4">
                    {canManageProjects && (
                        <div className="flex justify-end">
                            <Button size="sm" onClick={() => setShowAddMember(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Thêm thành viên
                            </Button>
                        </div>
                    )}
                    {showAddMember && (
                        <Card className="border-2 border-indigo-200 dark:border-indigo-800">
                            <CardContent className="p-4">
                                <h4 className="text-sm font-medium mb-3 text-slate-900 dark:text-white">Thêm thành viên</h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {availableUsers.length === 0 ? <p className="text-center text-sm text-slate-500 py-4">Không còn ai để thêm</p> :
                                        availableUsers.map((u) => (
                                            <div key={u.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-7 w-7"><AvatarFallback className="bg-indigo-500 text-white text-[10px]">{getInitials(u.full_name)}</AvatarFallback></Avatar>
                                                    <span className="text-sm text-slate-900 dark:text-white">{u.full_name || u.email}</span>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleAddMember(u.id, "member")} className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200">Member</button>
                                                    <button onClick={() => handleAddMember(u.id, "manager")} className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200">Manager</button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                                <div className="mt-3 flex justify-end"><Button variant="outline" size="sm" onClick={() => setShowAddMember(false)}>Đóng</Button></div>
                            </CardContent>
                        </Card>
                    )}
                    {members.length === 0 ? (
                        <Card><CardContent className="flex flex-col items-center py-12"><Users className="w-10 h-10 text-slate-300 mb-3" /><p className="text-sm text-slate-500">Chưa có thành viên</p></CardContent></Card>
                    ) : (
                        <div className="space-y-2">
                            {members.map((m) => (
                                <Card key={m.id} className="border border-slate-200 dark:border-slate-800">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <Avatar className="h-9 w-9"><AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold">{getInitials(m.user?.full_name || null)}</AvatarFallback></Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{m.user?.full_name || "N/A"}</p>
                                            <p className="text-xs text-slate-400">{m.user?.email}</p>
                                        </div>
                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">{m.role}</span>
                                        {canManageProjects && (
                                            <button onClick={() => setMemberToDelete(m)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                                                <X className="w-3.5 h-3.5 text-red-500" />
                                            </button>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Milestones */}
            {tab === "milestones" && (
                <div className="space-y-4">
                    {canManageProjects && (
                        <div className="flex justify-end">
                            <Button size="sm" onClick={() => setShowAddMilestone(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                <Plus className="w-3.5 h-3.5 mr-1.5" /> Thêm milestone
                            </Button>
                        </div>
                    )}
                    {showAddMilestone && (
                        <Card className="border-2 border-indigo-200 dark:border-indigo-800">
                            <CardContent className="p-4 space-y-3">
                                <input type="text" value={milestoneForm.title} onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })} placeholder="Tên milestone *" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" />
                                <textarea value={milestoneForm.description} onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })} placeholder="Mô tả..." rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" />
                                <input type="date" value={milestoneForm.due_date} onChange={(e) => setMilestoneForm({ ...milestoneForm, due_date: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white" />
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setShowAddMilestone(false)}>Hủy</Button>
                                    <Button size="sm" onClick={handleCreateMilestone} className="bg-indigo-600 hover:bg-indigo-700 text-white">Tạo</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {milestones.length === 0 ? (
                        <Card><CardContent className="flex flex-col items-center py-12"><Target className="w-10 h-10 text-slate-300 mb-3" /><p className="text-sm text-slate-500">Chưa có milestone</p></CardContent></Card>
                    ) : (
                        <div className="space-y-2">
                            {milestones.map((ms) => (
                                <Card key={ms.id} className={`border ${ms.status === "completed" ? "border-green-200 dark:border-green-800" : "border-slate-200 dark:border-slate-800"}`}>
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <button onClick={() => handleToggleMilestone(ms)} className="flex-shrink-0">
                                            {ms.status === "completed" ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium ${ms.status === "completed" ? "line-through text-slate-400" : "text-slate-900 dark:text-white"}`}>{ms.title}</p>
                                            {ms.description && <p className="text-xs text-slate-400 truncate">{ms.description}</p>}
                                        </div>
                                        <span className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3" />{ms.due_date}</span>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}
            {/* Confirm Dialogs */}
            <ConfirmDialog
                open={showDeleteProjectConfirm}
                onOpenChange={setShowDeleteProjectConfirm}
                title="Xóa dự án"
                description="Bạn có chắc chắn muốn xóa dự án này? Tất cả công việc và milestones liên quan sẽ bị xóa vĩnh viễn."
                confirmLabel="Xóa dự án"
                variant="danger"
                onConfirm={handleDeleteProject}
            />
            <ConfirmDialog
                open={!!memberToDelete}
                onOpenChange={(open) => !open && setMemberToDelete(null)}
                title="Xóa thành viên"
                description={`Bạn có chắc chắn muốn xóa ${memberToDelete?.user?.full_name || "thành viên này"} khỏi dự án?`}
                confirmLabel="Xóa"
                variant="danger"
                onConfirm={handleRemoveMember}
            />
        </div>
    );
}
